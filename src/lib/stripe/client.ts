/**
 * Chamadas à API do Stripe por `fetch` (formulário codificado), sem a biblioteca oficial.
 * `STRIPE_SECRET_KEY` só existe no servidor. Sem ela, quem chamar recebe `null` e a tela explica que o pagamento ainda não está ligado.
 */

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Achata objetos aninhados no formato do Stripe: `{ a: { b: 1 } }` → `a[b]=1`. */
export function toStripeForm(params: Record<string, unknown>, prefix = ''): URLSearchParams {
  const out = new URLSearchParams();
  const walk = (value: unknown, key: string) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${key}[${i}]`));
    else if (typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([k, v]) => walk(v, `${key}[${k}]`));
    else out.append(key, String(value));
  };
  Object.entries(params).forEach(([k, v]) => walk(v, prefix ? `${prefix}[${k}]` : k));
  return out;
}

export type StripeResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

export async function stripeRequest<T = Record<string, unknown>>(method: 'GET' | 'POST', path: string, params: Record<string, unknown> = {}, idempotencyKey?: string): Promise<StripeResult<T> | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        // Fixa a versão da API (ex.: 2026-10-28.endive) para o Stripe não mudar o formato sem avisar.
        ...(process.env.STRIPE_API_VERSION ? { 'Stripe-Version': process.env.STRIPE_API_VERSION } : {}),
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: method === 'POST' ? toStripeForm(params).toString() : undefined,
    });
    const json = (await response.json().catch(() => ({}))) as { error?: { message?: string } } & T;
    if (!response.ok) return { ok: false, status: response.status, message: json.error?.message ?? 'Erro no Stripe.' };
    return { ok: true, data: json };
  } catch {
    return { ok: false, status: 0, message: 'Sem conexão com o Stripe.' };
  }
}
