import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripeRequest } from '@/lib/stripe/client';
import { getPlanInfo } from '@/features/billing/server/entitlements';
import { priceIdFor } from '@/features/billing/lib/subscription';

export const dynamic = 'force-dynamic';

const body = z.object({ plan: z.enum(['plus', 'pro']), interval: z.enum(['month', 'year']) });
const json = (obj: unknown, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

/** Cria a sessão de pagamento do Stripe e devolve o endereço para onde mandar a pessoa. */
export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return json({ message: 'Proibido.' }, 403);

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ message: 'Pedido inválido.' }, 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ message: 'Entre para assinar.' }, 401);

  // Nexa Escolas não tem cobrança: o contrato é da escola.
  const info = await getPlanInfo();
  if (!info.billingVisible) return json({ message: 'Sua conta é de uma escola e já inclui tudo.' }, 403);
  if (info.plan !== 'free') return json({ message: 'Você já tem uma assinatura. Use "Gerenciar assinatura".' }, 409);

  const price = priceIdFor(parsed.data.plan, parsed.data.interval);
  if (!price || !process.env.STRIPE_SECRET_KEY) return json({ message: 'O pagamento ainda não está ligado.' }, 503);

  const admin = createAdminClient();
  const existing = admin ? (await admin.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()).data : null;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const session = await stripeRequest<{ url?: string }>(
    'POST',
    'checkout/sessions',
    {
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      ...(existing?.stripe_customer_id ? { customer: existing.stripe_customer_id } : user.email ? { customer_email: user.email } : {}),
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
      locale: 'pt-BR',
      success_url: `${origin}/pro?status=ok`,
      cancel_url: `${origin}/pro?status=cancelado`,
    },
    `checkout-${user.id}-${parsed.data.plan}-${parsed.data.interval}-${Math.floor(Date.now() / 60_000)}`,
  );
  if (!session) return json({ message: 'O pagamento ainda não está ligado.' }, 503);
  if (!session.ok || !session.data.url) {
    const reason = session.ok ? 'sem endereço de pagamento' : `${session.status}: ${session.message}`;
    console.error('[stripe] checkout falhou', reason);
    // Em modo teste (chave de teste) mostra o motivo do Stripe, para acertar a configuração; em produção, só a mensagem simples.
    const test = /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? '');
    return json({ message: 'Não consegui abrir o pagamento agora. Tente de novo.', ...(test ? { detail: reason } : {}) }, 502);
  }
  return json({ url: session.data.url });
}
