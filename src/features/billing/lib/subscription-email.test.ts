import { describe, expect, it } from 'vitest';
import { subscriptionEmail } from './subscription-email';

const base = { plan: 'plus' as const, interval: 'month' as const, amountCents: 1990, nextPaymentAt: '2026-12-09T12:00:00Z', manageUrl: 'https://nexastudy.com.br/pro' };

describe('subscriptionEmail', () => {
  it('traz plano, valor, periodicidade e próxima cobrança', () => {
    const m = subscriptionEmail(base);
    expect(m.subject).toBe('Assinatura confirmada: Nexa Plus');
    expect(m.text).toContain('Valor: R$');
    expect(m.text).toContain('19,90 por mês');
    expect(m.text).toContain('Próxima cobrança: 09 de dezembro de 2026');
    expect(m.html).toContain('Gerenciar assinatura');
    expect(m.html).toContain('https://nexastudy.com.br/pro');
  });

  it('anual usa "por ano" e omite o que não se sabe', () => {
    const m = subscriptionEmail({ ...base, plan: 'pro', interval: 'year', amountCents: null, nextPaymentAt: null });
    expect(m.text).toContain('Anual');
    expect(m.text).not.toContain('Valor:');
    expect(m.text).not.toContain('Próxima cobrança');
  });

  it('escapa HTML no endereço', () => {
    const m = subscriptionEmail({ ...base, manageUrl: 'https://x.com/"><script>' });
    expect(m.html).not.toContain('<script>');
  });
});
