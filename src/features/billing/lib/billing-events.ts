/**
 * Eventos do Stripe que pedem atenção humana (não mudam o plano sozinhos):
 * falha de pagamento, disputa, reembolso e alerta de fraude. Puro, para testar.
 *
 * Disputa e alerta de fraude vêm ligados a uma COBRANÇA (`charge`), não ao
 * cliente: quem chama resolve o cliente buscando a cobrança no Stripe.
 */

export type AlertKind = 'payment_failed' | 'dispute' | 'refund' | 'fraud_warning';

export interface AlertDraft {
  kind: AlertKind;
  /** Cliente do Stripe, se o evento já traz. */
  customer: string | null;
  /** Cobrança a consultar para achar o cliente, se o evento não traz. */
  chargeId: string | null;
  objectId: string;
  amountCents: number | null;
  currency: string | null;
  detail: string | null;
}

type Obj = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);

export function alertFromEvent(type: string, object: Obj): AlertDraft | null {
  const objectId = str(object.id);
  if (!objectId) return null;

  switch (type) {
    case 'invoice.payment_failed':
      return {
        kind: 'payment_failed',
        customer: str(object.customer),
        chargeId: null,
        objectId,
        amountCents: num(object.amount_due),
        currency: str(object.currency),
        detail: num(object.attempt_count) ? `Tentativa ${num(object.attempt_count)}` : null,
      };
    case 'charge.dispute.created':
      return {
        kind: 'dispute',
        customer: null,
        chargeId: str(object.charge),
        objectId,
        amountCents: num(object.amount),
        currency: str(object.currency),
        detail: str(object.reason) ? `Motivo: ${str(object.reason)}` : null,
      };
    case 'charge.refunded':
      return {
        kind: 'refund',
        customer: str(object.customer),
        chargeId: objectId,
        objectId,
        amountCents: num(object.amount_refunded),
        currency: str(object.currency),
        detail: null,
      };
    case 'radar.early_fraud_warning.created':
      return {
        kind: 'fraud_warning',
        customer: null,
        chargeId: str(object.charge),
        objectId,
        amountCents: null,
        currency: null,
        detail: str(object.fraud_type) ? `Tipo: ${str(object.fraud_type)}` : null,
      };
    default:
      return null;
  }
}

/** Eventos que o webhook do Nexa precisa receber (o resto é ignorado). */
export const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.dispute.created',
  'charge.refunded',
  'radar.early_fraud_warning.created',
] as const;
