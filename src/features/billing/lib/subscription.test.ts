import { describe, expect, it } from 'vitest';
import { priceIdFor, priceMapFromEnv, subscriptionRowFrom } from './subscription';

const env = { STRIPE_PRICE_PLUS_MONTHLY: 'price_pm', STRIPE_PRICE_PRO_YEARLY: 'price_py' };
const prices = priceMapFromEnv(env);

describe('priceMapFromEnv / priceIdFor', () => {
  it('mapeia só o que está configurado', () => {
    expect(Object.keys(prices).sort()).toEqual(['price_pm', 'price_py']);
    expect(priceIdFor('plus', 'month', env)).toBe('price_pm');
    expect(priceIdFor('plus', 'year', env)).toBeNull();
  });
});

describe('subscriptionRowFrom', () => {
  const base = { id: 'sub_1', status: 'active', metadata: { user_id: 'u1' }, items: { data: [{ price: { id: 'price_pm' }, current_period_end: 1_800_000_000 }] } };
  it('monta a linha com plano e período do item', () => {
    const row = subscriptionRowFrom(base, prices)!;
    expect(row).toMatchObject({ user_id: 'u1', plan: 'plus', billing_interval: 'month', status: 'active', cancel_at_period_end: false });
    expect(row.current_period_end).toBe(new Date(1_800_000_000 * 1000).toISOString());
  });
  it('lê o período da assinatura nas versões antigas da API', () => {
    const row = subscriptionRowFrom({ ...base, items: { data: [{ price: { id: 'price_py' } }] }, current_period_end: 1_700_000_000 }, prices)!;
    expect(row.plan).toBe('pro');
    expect(row.current_period_end).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });
  it('o dono vindo do cliente do Stripe vale mais que o metadado', () => {
    expect(subscriptionRowFrom(base, prices, 'u-do-cliente')!.user_id).toBe('u-do-cliente');
    expect(subscriptionRowFrom({ ...base, metadata: {} }, prices, 'u-do-cliente')!.user_id).toBe('u-do-cliente');
  });
  it('ignora preço desconhecido e assinatura sem usuário', () => {
    expect(subscriptionRowFrom({ ...base, items: { data: [{ price: { id: 'price_x' } }] } }, prices)).toBeNull();
    expect(subscriptionRowFrom({ ...base, metadata: {} }, prices)).toBeNull();
  });
});
