import { classifyHost, effectiveHost } from './host';
import { safeBrandVars } from './brand';

/**
 * Resolução da escola pelo endereço, usada pelo middleware e lida depois pelo
 * layout e pelas telas de entrada.
 *
 * Princípio: FALHAR ABERTO. Se o recurso estiver desligado (sem
 * `TENANT_ROOT_DOMAIN`), se o SQL ainda não rodou, se o Supabase não
 * responder — o app abre normalmente, como o Nexa de sempre. Só um endereço
 * que o banco CONFIRMA que não existe vira "escola não encontrada".
 */

export const TENANT_HEADER = 'x-nexa-tenant';

export interface Tenant {
  id: string;
  /** Endereço da escola (ex.: anglomorumbi.nexastudy.com.br) — base do e-mail fabricado do login. */
  host: string;
  name: string;
  logoUrl: string | null;
  /** Variáveis de cor que passaram na trava de contraste, ou null. */
  vars: Record<string, string> | null;
}

export type TenantResolution =
  | { kind: 'none' } // sem escola: comportamento de sempre
  | { kind: 'found'; tenant: Tenant }
  | { kind: 'unknown' }; // endereço de escola que o banco desconhece

interface SchoolRow {
  school_id: string;
  display_name: string;
  logo_url: string | null;
  brand: string | null;
  brand_text: string | null;
  brand_soft: string | null;
}

/** O mínimo do cliente Supabase que a resolução usa (para teste e para o edge). */
export interface TenantRpcClient {
  rpc: (fn: 'resolve_school_host', args: { p_host: string }) => PromiseLike<{ data: unknown; error: unknown }>;
}

const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: TenantResolution }>();

export function clearTenantCache() {
  cache.clear();
}

export async function resolveTenant(
  headers: { get(name: string): string | null },
  client: TenantRpcClient,
  env: { rootDomain?: string; proxySecret?: string },
  now: () => number = Date.now,
): Promise<TenantResolution> {
  try {
    const host = effectiveHost({
      host: headers.get('host'),
      forwardedHost: headers.get('x-nexa-forwarded-host'),
      secretHeader: headers.get('x-nexa-proxy-secret'),
      expectedSecret: env.proxySecret,
    });

    const kind = classifyHost(host, env.rootDomain);
    if (kind.kind !== 'candidate') return { kind: 'none' };

    const hit = cache.get(host);
    if (hit && now() - hit.at < CACHE_MS) return hit.value;

    const { data, error } = await client.rpc('resolve_school_host', { p_host: host });
    // Erro (função ainda não existe, rede, projeto pausado) → como se o
    // recurso não existisse. Nunca derruba o app por isso.
    if (error) return { kind: 'none' };

    const row = (data as SchoolRow[] | null)?.[0];
    const value: TenantResolution = row
      ? {
          kind: 'found',
          tenant: {
            id: row.school_id,
            host,
            name: row.display_name,
            logoUrl: row.logo_url,
            vars: safeBrandVars({ brand: row.brand, brand_text: row.brand_text, brand_soft: row.brand_soft }),
          },
        }
      : { kind: 'unknown' };

    cache.set(host, { at: now(), value });
    return value;
  } catch {
    return { kind: 'none' };
  }
}

/** Serializa a escola num cabeçalho ASCII, para a requisição interna. */
export function encodeTenant(tenant: Tenant): string {
  return encodeURIComponent(JSON.stringify(tenant));
}

export function decodeTenant(raw: string | null | undefined): Tenant | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(decodeURIComponent(raw)) as Tenant;
    return typeof t?.id === 'string' && typeof t?.name === 'string' && typeof t?.host === 'string' ? t : null;
  } catch {
    return null;
  }
}

/** CSS do tema da escola — só o modo claro; o escuro mantém o tema do Nexa. */
export function tenantCss(tenant: Tenant | null): string | null {
  if (!tenant?.vars) return null;
  const body = Object.entries(tenant.vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return `:root:not(.dark){${body}}`;
}
