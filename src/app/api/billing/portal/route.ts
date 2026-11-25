import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripeRequest } from '@/lib/stripe/client';
import { getPlanInfo } from '@/features/billing/server/entitlements';

export const dynamic = 'force-dynamic';
const json = (obj: unknown, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

/** Abre o portal do Stripe, onde a pessoa troca o cartão, vê as faturas e cancela. */
export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return json({ message: 'Proibido.' }, 403);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ message: 'Entre para continuar.' }, 401);
  if (!(await getPlanInfo()).billingVisible) return json({ message: 'Sua conta é de uma escola.' }, 403);

  const admin = createAdminClient();
  const customer = admin ? (await admin.from('billing_customers').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()).data : null;
  if (!customer) return json({ message: 'Você ainda não tem assinatura.' }, 404);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const session = await stripeRequest<{ url?: string }>('POST', 'billing_portal/sessions', { customer: customer.stripe_customer_id, return_url: `${origin}/pro`, locale: 'pt-BR' });
  if (!session) return json({ message: 'O pagamento ainda não está ligado.' }, 503);
  if (!session.ok || !session.data.url) return json({ message: 'Não consegui abrir o portal agora.' }, 502);
  return json({ url: session.data.url });
}
