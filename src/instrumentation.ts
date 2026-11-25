/**
 * Registra erros do SERVIDOR (os que viram "500") nos logs e no painel de erros do Nexa.
 * Sem isto, um 500 de primeira abertura não deixa pista: a página de erro do app só cobre falhas dentro das telas.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routeType: string; routePath?: string },
): Promise<void> {
  const err = error as { message?: string; digest?: string; stack?: string };
  console.error('[request-error]', request.method, request.path, context.routeType, context.routePath ?? '', err?.digest ?? '', err?.message ?? error);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const ua = request.headers['user-agent'];
    await fetch(`${url}/rest/v1/rpc/report_error`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_message: `500 em ${request.method} ${request.path}: ${err?.message ?? 'erro desconhecido'}`.slice(0, 500),
        p_origin: 'server',
        p_stack: err?.stack?.slice(0, 3000) ?? null,
        p_pathname: request.path.slice(0, 300),
        p_digest: err?.digest ?? null,
        p_user_agent: (Array.isArray(ua) ? ua[0] : ua)?.slice(0, 400) ?? null,
      }),
    });
  } catch {
    // registrar o erro nunca pode causar outro erro
  }
}
