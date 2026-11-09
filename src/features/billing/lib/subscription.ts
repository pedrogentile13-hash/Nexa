import type { BillingInterval, PaidPlan } from './plans';

/**
 * Do evento do Stripe para a linha de `subscriptions`. Em módulo puro para ser testado: é aqui que
 * "qual plano a pessoa tem" é decidido a partir do que o Stripe manda.
 */

export interface PriceMap {
  [priceId: string]: { plan: PaidPlan; interval: BillingInterval };
}

/** Os preços vêm do ambiente (criados no painel do Stripe): STRIPE_PRICE_PLUS_MONTHLY etc. */
export function priceMapFromEnv(env: Record<string, string | undefined> = process.env): PriceMap {
  const map: PriceMap = {};
  const add = (id: string | undefined, plan: PaidPlan, interval: BillingInterval) => {
    if (id) map[id] = { plan, interval };
  };
  add(env.STRIPE_PRICE_PLUS_MONTHLY, 'plus', 'month');
  add(env.STRIPE_PRICE_PLUS_YEARLY, 'plus', 'year');
  add(env.STRIPE_PRICE_PRO_MONTHLY, 'pro', 'month');
  add(env.STRIPE_PRICE_PRO_YEARLY, 'pro', 'year');
  return map;
}

export function priceIdFor(plan: PaidPlan, interval: BillingInterval, env: Record<string, string | undefined> = process.env): string | null {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${interval === 'month' ? 'MONTHLY' : 'YEARLY'}`;
  return env[key] || null;
}

interface StripeSubscriptionLike {
  id?: string;
  status?: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: Record<string, string> | null;
  items?: { data?: { price?: { id?: string }; current_period_end?: number }[] };
}

export interface SubscriptionRow {
  user_id: string;
  stripe_subscription_id: string;
  plan: PaidPlan;
  billing_interval: BillingInterval;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** `null` quando faltam o usuário ou o preço conhecido: nesse caso não se mexe em nada. */
/**
 * `userId` vem do cliente do Stripe (tabela `billing_customers`), que é a fonte confiável do dono da assinatura;
 * o metadado `user_id` só entra como reserva (o evento da assinatura pode chegar antes do checkout concluído).
 */
export function subscriptionRowFrom(sub: StripeSubscriptionLike, prices: PriceMap, userId: string | null = null): SubscriptionRow | null {
  userId = userId ?? sub.metadata?.user_id ?? null;
  const priceId = sub.items?.data?.[0]?.price?.id;
  if (!userId || !sub.id || !sub.status || !priceId) return null;
  const known = prices[priceId];
  if (!known) return null;
  // Nas versões novas da API o fim do período fica no item; nas antigas, na assinatura.
  const end = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
  return {
    user_id: userId,
    stripe_subscription_id: sub.id,
    plan: known.plan,
    billing_interval: known.interval,
    status: sub.status,
    current_period_end: typeof end === 'number' ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
  };
}
