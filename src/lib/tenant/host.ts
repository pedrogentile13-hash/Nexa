/**
 * Descobre por qual ENDEREÇO a pessoa chegou — base de "uma escola por
 * subdomínio".
 *
 * Atrás do Cloudflare a hospedagem recebe `Host: nexastudy.com.br` (é o único
 * nome que ela conhece) e o endereço de verdade vem num cabeçalho que o
 * Cloudflare acrescenta. Cabeçalho qualquer pessoa consegue forjar, então ele
 * só vale junto de um segredo compartilhado; sem o segredo, é ignorado e vale
 * o `Host` — forjar não leva ninguém a "ser" outra escola.
 *
 * Tudo isto é DESLIGADO quando `TENANT_ROOT_DOMAIN` não está definida: o app
 * se comporta exatamente como antes.
 */

/** Nomes que nunca viram escola, mesmo que alguém os registre por engano. */
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'mail', 'smtp', 'imap', 'ftp', 'cpanel', 'webmail',
  'static', 'cdn', 'assets', 'status', 'staging', 'dev', 'test', 'beta', 'docs',
]);

export function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return '';
  // O cabeçalho pode vir como lista ("a, b") quando passa por mais de um proxy.
  const first = raw.split(',')[0]!.trim().toLowerCase();
  return first.replace(/:\d+$/, '').replace(/\.$/, '');
}

/**
 * Comparação sem curto-circuito. Roda no middleware (runtime de borda), onde
 * `node:crypto` não existe — então é feita na mão, acumulando as diferenças.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface RequestHostInput {
  host: string | null | undefined;
  forwardedHost: string | null | undefined;
  secretHeader: string | null | undefined;
  /** `TENANT_PROXY_SECRET` — sem ele, o cabeçalho encaminhado nunca é aceito. */
  expectedSecret: string | undefined;
}

/** Endereço efetivo da requisição, já normalizado. */
export function effectiveHost({ host, forwardedHost, secretHeader, expectedSecret }: RequestHostInput): string {
  const forwarded = normalizeHost(forwardedHost);
  if (forwarded && expectedSecret && secretHeader && safeEqual(secretHeader, expectedSecret)) {
    return forwarded;
  }
  return normalizeHost(host);
}

export type TenantLookup =
  | { kind: 'none' } // domínio raiz, localhost, ou recurso desligado
  | { kind: 'reserved' } // www, app, admin… → comportamento normal
  | { kind: 'candidate'; host: string }; // subdomínio que pode ser uma escola

/**
 * Este endereço PODE ser de uma escola? (Quem responde se ele existe é o
 * banco.) Só aceita um nível de subdomínio sob a raiz: `a.b.nexastudy.com.br`
 * não é escola.
 */
export function classifyHost(host: string, rootDomain: string | undefined): TenantLookup {
  const root = normalizeHost(rootDomain);
  if (!root || !host || host === root) return { kind: 'none' };
  if (!host.endsWith(`.${root}`)) return { kind: 'none' };

  const label = host.slice(0, -(root.length + 1));
  if (label.includes('.') || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) return { kind: 'none' };
  if (RESERVED_SUBDOMAINS.has(label)) return { kind: 'reserved' };
  return { kind: 'candidate', host };
}
