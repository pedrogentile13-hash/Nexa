import { createAdminClient } from '@/lib/supabase/admin';
import { stripeRequest } from '@/lib/stripe/client';
import { priceMapFromEnv, subscriptionRowFrom } from '../lib/subscription';

type StripeSub = Parameters<typeof subscriptionRowFrom>[0];
const LIVE = new Set(['active', 'trialing', 'past_due']);

export type UserSync = 'synced' | 'none' | 'unavailable';

/**
 * Plano de uma pessoa a partir do Stripe, sem esperar o webhook (rede de segurança para quando o webhook atrasa ou falha).
 * Só aceita assinaturas que carregam o `user_id` DESTA pessoa no metadado — o e-mail só ajuda a achar o cliente,
 * nunca prova o dono.
 */
export async function syncUserFromStripe(userId: string, email: string | null): Promise<UserSync> {
  const admin = createAdminClient();
  if (!admin || !email) return 'unavailable';

  const customers = await stripeRequest<{ data?: { id: string }[] }>('GET', `customers?email=${encodeURIComponent(email)}&limit=10`);
  if (!customers) return 'unavailable';
  if (!customers.ok) return 'unavailable';

  const prices = priceMapFromEnv();
  let best: { customerId: string; row: NonNullable<ReturnType<typeof subscriptionRowFrom>> } | null = null;

  for (const c of customers.data.data ?? []) {
    const subs = await stripeRequest<{ data?: StripeSub[] }>('GET', `subscriptions?customer=${encodeURIComponent(c.id)}&status=all&limit=10`);
    if (!subs || !subs.ok) return 'unavailable';
    for (const sub of subs.data.data ?? []) {
      if (sub.metadata?.user_id !== userId || !sub.status || !LIVE.has(sub.status)) continue;
      const row = subscriptionRowFrom(sub, prices, userId);
      if (row && (!best || (row.current_period_end ?? '') > (best.row.current_period_end ?? ''))) best = { customerId: c.id, row };
    }
  }
  if (!best) return 'none';

  const { error: customerError } = await admin.from('billing_customers').upsert({ user_id: userId, stripe_customer_id: best.customerId });
  if (customerError) return 'unavailable';
  const { error } = await admin.from('subscriptions').upsert({ ...best.row, updated_at: new Date().toISOString() });
  return error ? 'unavailable' : 'synced';
}
