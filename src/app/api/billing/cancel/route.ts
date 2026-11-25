import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripeRequest } from '@/lib/stripe/client';
import { getPlanInfo } from '@/features/billing/server/entitlements';
import { ownSubscription } from '@/features/billing/server/overview';

export const dynamic = 'force-dynamic';
const json = (obj: unknown, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });
const body = z.object({ action: z.enum(['cancel', 'resume']) });

/**
 * Cancela ao fim do período já pago (o plano continua até lá) ou desfaz o cancelamento.
 * A assinatura é a DESTA pessoa, lida do banco: o navegador nunca manda o id.
 */
export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return json({ message: 'Proibido.' }, 403);

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ message: 'Pedido inválido.' }, 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ message: 'Entre para continuar.' }, 401);
  if (!(await getPlanInfo()).billingVisible) return json({ message: 'Sua conta é de uma escola.' }, 403);

  const row = await ownSubscription(user.id);
  if (!row) return json({ message: 'Você ainda não tem assinatura.' }, 404);

  const cancel = parsed.data.action === 'cancel';
  const result = await stripeRequest('POST', `subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`, { cancel_at_period_end: cancel });
  if (!result) return json({ message: 'O pagamento ainda não está ligado.' }, 503);
  if (!result.ok) return json({ message: 'Não consegui alterar a assinatura agora. Tente de novo.' }, 502);

  // Espelho imediato; o webhook (customer.subscription.updated) confirma depois.
  const admin = createAdminClient();
  await admin?.from('subscriptions').update({ cancel_at_period_end: cancel, updated_at: new Date().toISOString() }).eq('user_id', user.id);
  return json({ ok: true, cancelAtPeriodEnd: cancel });
}
