import { describe, expect, it } from 'vitest';
import { toStripeForm } from './client';

describe('toStripeForm', () => {
  it('achata objetos e listas no formato do Stripe', () => {
    const f = toStripeForm({ mode: 'subscription', line_items: [{ price: 'price_1', quantity: 1 }], metadata: { user_id: 'u1' }, skip: undefined });
    expect(f.get('mode')).toBe('subscription');
    expect(f.get('line_items[0][price]')).toBe('price_1');
    expect(f.get('line_items[0][quantity]')).toBe('1');
    expect(f.get('metadata[user_id]')).toBe('u1');
    expect(f.has('skip')).toBe(false);
  });
});
