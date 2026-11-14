import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyHost, effectiveHost, normalizeHost } from '@/lib/tenant/host';

export const dynamic = 'force-dynamic';

/**
 * Diagnóstico de "uma escola por endereço" — responde, sem adivinhar, por que
 * um endereço não está mostrando a marca da escola.
 *
 * Devolve só o que o próprio navegador já enviou (o endereço) e booleanos de
 * configuração. Nunca devolve chave, segredo nem dado de escola além do
 * nome/cores públicos que a tela de entrada já exibiria.
 */
export async function GET(request: Request) {
  // Diagnóstico de configuração: só o administrador geral vê (para os outros, a página "não existe").
  const gate = await createClient();
  const {
    data: { user },
  } = await gate.auth.getUser();
  const isAdmin = user ? (await gate.rpc('is_admin')).data === true : false;
  if (!isAdmin) return new NextResponse('Not found', { status: 404 });

  const host = request.headers.get('host');
  const forwarded = request.headers.get('x-forwarded-host');
  const rootDomain = process.env.TENANT_ROOT_DOMAIN;
  const effective = effectiveHost({
    host,
    forwardedHost: request.headers.get('x-nexa-forwarded-host'),
    secretHeader: request.headers.get('x-nexa-proxy-secret'),
    expectedSecret: process.env.TENANT_PROXY_SECRET,
  });
  const classification = classifyHost(effective, rootDomain);

  let rpc: { ok: boolean; rows?: number; errorCode?: string | null; errorMessage?: string | null } | null = null;
  if (classification.kind === 'candidate') {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('resolve_school_host', { p_host: effective });
    rpc = error
      ? { ok: false, errorCode: (error as { code?: string }).code ?? null, errorMessage: (error as { message?: string }).message ?? null }
      : { ok: true, rows: Array.isArray(data) ? data.length : 0 };
  }

  const verdict = (() => {
    if (!rootDomain) return 'A variável TENANT_ROOT_DOMAIN não está definida neste ambiente (ou o app não foi reiniciado depois de defini-la).';
    if (classification.kind === 'none')
      return `O app recebeu o endereço "${effective}", que NÃO é um subdomínio de ${normalizeHost(rootDomain)}. A hospedagem pode estar entregando o nome do domínio principal em vez do subdomínio.`;
    if (classification.kind === 'reserved') return 'Este subdomínio é reservado (www, admin, app…) e nunca vira escola.';
    if (!rpc?.ok) return `A consulta ao banco falhou (${rpc?.errorCode ?? 'sem código'}). Provavelmente o SQL da migração 10 ainda não foi aplicado.`;
    if (rpc.rows === 0) return 'O banco respondeu, mas nenhum endereço ativo bate com este. Rode o cadastro do Anglo (ou confira o host em school_domains).';
    return 'Tudo certo: a escola foi encontrada para este endereço.';
  })();

  return NextResponse.json({
    receivedHost: host,
    xForwardedHost: forwarded,
    effectiveHost: effective,
    tenantRootDomainConfigured: Boolean(rootDomain),
    tenantRootDomain: rootDomain ?? null,
    classification: classification.kind,
    database: rpc,
    verdict,
  });
}
