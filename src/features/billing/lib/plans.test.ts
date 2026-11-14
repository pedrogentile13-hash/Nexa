import { describe, expect, it } from 'vitest';
import { PLAN_PRICES, entitlementsFor, formatBRL, isPaidPlan, parsePlan, yearlyFreeMonths } from './plans';

describe('entitlementsFor', () => {
  it('escola: sem anúncio e sem cobrança', () => {
    const e = entitlementsFor('school');
    expect(e.adsEnabled).toBe(false);
    expect(e.billingVisible).toBe(false);
  });
  it('grátis: com anúncio e com a tela de planos', () => {
    const e = entitlementsFor('free');
    expect(e.adsEnabled).toBe(true);
    expect(e.billingVisible).toBe(true);
  });
  it.each(['plus', 'pro'] as const)('%s: sem anúncio e com limites maiores', (p) => {
    const e = entitlementsFor(p);
    expect(e.adsEnabled).toBe(false);
    expect(e.limits.libraryDocs).toBeGreaterThan(entitlementsFor('free').limits.libraryDocs);
    expect(e.limits.coins).toBeGreaterThan(1);
  });
});

describe('parsePlan', () => {
  it('valor desconhecido vira grátis, nunca escola nem pago', () => {
    expect(parsePlan('admin')).toBe('free');
    expect(parsePlan(null)).toBe('free');
    expect(parsePlan('pro')).toBe('pro');
  });
  it('isPaidPlan', () => {
    expect(isPaidPlan('plus')).toBe(true);
    expect(isPaidPlan('school')).toBe(false);
  });
});

describe('preços', () => {
  it('o anual é mais barato que 12 meses', () => {
    expect(PLAN_PRICES.plus.year).toBeLessThan(PLAN_PRICES.plus.month * 12);
    expect(yearlyFreeMonths('plus')).toBe(2);
  });
  it('formata em reais', () => {
    expect(formatBRL(1490).replace(/\s/g, ' ')).toBe('R$ 14,90');
  });
});
