import { describe, expect, it } from 'vitest';
import { alertFromEvent, HANDLED_EVENTS } from './billing-events';

describe('alertFromEvent', () => {
  it('falha de pagamento traz o cliente e a tentativa', () => {
    expect(alertFromEvent('invoice.payment_failed', { id: 'in_1', customer: 'cus_1', amount_due: 1490, currency: 'brl', attempt_count: 2 })).toEqual({
      kind: 'payment_failed', customer: 'cus_1', chargeId: null, objectId: 'in_1', amountCents: 1490, currency: 'brl', detail: 'Tentativa 2',
    });
  });

  it('disputa e alerta de fraude vêm pela cobrança (o cliente é buscado depois)', () => {
    const d = alertFromEvent('charge.dispute.created', { id: 'dp_1', charge: 'ch_1', amount: 2990, currency: 'brl', reason: 'fraudulent' })!;
    expect(d).toMatchObject({ kind: 'dispute', customer: null, chargeId: 'ch_1', amountCents: 2990, detail: 'Motivo: fraudulent' });
    const f = alertFromEvent('radar.early_fraud_warning.created', { id: 'issfr_1', charge: 'ch_2', fraud_type: 'card_never_received' })!;
    expect(f).toMatchObject({ kind: 'fraud_warning', chargeId: 'ch_2', detail: 'Tipo: card_never_received' });
  });

  it('reembolso usa o valor reembolsado e a própria cobrança', () => {
    expect(alertFromEvent('charge.refunded', { id: 'ch_3', customer: 'cus_3', amount_refunded: 1490, currency: 'brl' })).toMatchObject({
      kind: 'refund', customer: 'cus_3', chargeId: 'ch_3', amountCents: 1490,
    });
  });

  it('evento sem id ou de outro tipo não vira alerta', () => {
    expect(alertFromEvent('invoice.payment_failed', {})).toBeNull();
    expect(alertFromEvent('customer.created', { id: 'cus_9' })).toBeNull();
  });

  it('a lista de eventos do webhook cobre ciclo da assinatura e risco', () => {
    for (const e of ['customer.subscription.updated', 'invoice.payment_failed', 'charge.dispute.created', 'charge.refunded', 'radar.early_fraud_warning.created']) {
      expect(HANDLED_EVENTS).toContain(e);
    }
  });
});
