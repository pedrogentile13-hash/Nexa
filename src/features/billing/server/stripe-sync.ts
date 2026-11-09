import { createAdminClient } from '@/lib/supabase/admin';
import { stripeRequest } from '@/lib/stripe/client';
import { alertFromEvent } from '../lib/billing-events';
import { subscriptionRowFrom, priceMapFromEnv } from '../lib/subscription';

/** Grava no banco o que o Stripe informou. Só o webhook chama (com a chave de serviço). */

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export type SyncResult = 'ok' | 'duplicate' | 'ignored' | 'unavailable';

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

async function userOfCustomer(admin: Admin, customer: string | null): Promise<string | null> {
  if (!customer) return null;
  const { data } = await admin.from('billing_customers').select('user_id').eq('stripe_customer_id', customer).maybeSingle();
  return data?.user_id ?? null;
}

/** Disputa e alerta de fraude trazem a cobrança, não o cliente: busca a cobrança no Stripe. */
async function customerOfCharge(chargeId: string | null): Promise<string | null> {
  if (!chargeId) return null;
  const charge = await stripeRequest<{ customer?: string | null }>('GET', `charges/${encodeURIComponent(chargeId)}`);
  if (!charge) return null; // sem chave do Stripe neste servidor
  if (!charge.ok) throw new Error(charge.message); // falha momentânea: o Stripe reenvia o evento
  return charge.data.customer ?? null;
}

export async function applyStripeEvent(event: StripeEvent): Promise<SyncResult> {
  const admin = createAdminClient();
  if (!admin) return 'unavailable';

  // Cada evento vale uma vez: o Stripe reenvia em caso de timeout.
  const seen = await admin.from('stripe_events').insert({ id: event.id, type: event.type });
  if (seen.error) return seen.error.code === '23505' ? 'duplicate' : 'unavailable';

  try {
    const result = await handle(admin, event);
    return result;
  } catch {
    // Falhou no meio: libera o evento para o Stripe poder reenviar (senão ele seria dado como feito e perdido).
    await admin.from('stripe_events').delete().eq('id', event.id);
    return 'unavailable';
  }
}

async function handle(admin: Admin, event: StripeEvent): Promise<SyncResult> {
  const object = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const userId = (object.client_reference_id as string | null) ?? (object.metadata as Record<string, string> | null)?.user_id;
    const customer = object.customer as string | null;
    if (userId && customer) {
      const { error } = await admin.from('billing_customers').upsert({ user_id: userId, stripe_customer_id: customer });
      if (error) throw error;
    }
    return 'ok';
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    // O dono vem do cliente do Stripe; o metadado só entra se o checkout ainda não gravou o cliente.
    const owner = await userOfCustomer(admin, (object.customer as string | null) ?? null);
    const row = subscriptionRowFrom(object as Parameters<typeof subscriptionRowFrom>[0], priceMapFromEnv(), owner);
    if (!row) return 'ignored';
    // Uma pessoa de escola nunca fica com plano pago (defesa: o checkout já barra, mas o banco é a fronteira).
    const { data: profile } = await admin.from('profiles').select('school_id').eq('id', row.user_id).maybeSingle();
    if (profile?.school_id) return 'ignored';
    const { error } = await admin
      .from('subscriptions')
      .upsert({ ...row, status: event.type.endsWith('deleted') ? 'canceled' : row.status, updated_at: new Date().toISOString() });
    if (error) throw error;
    return 'ok';
  }

  // Pagamento da fatura confirmado: fecha os avisos de falha em aberto desse cliente.
  if (event.type === 'invoice.paid') {
    const customer = (object.customer as string | null) ?? null;
    if (customer) {
      const { error } = await admin
        .from('billing_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('stripe_customer_id', customer)
        .eq('kind', 'payment_failed')
        .is('resolved_at', null);
      if (error) throw error;
    }
    return 'ok';
  }

  // Falha de pagamento, disputa, reembolso e alerta de fraude: registra para o administrador ver.
  const draft = alertFromEvent(event.type, object);
  if (draft) {
    const customer = draft.customer ?? (await customerOfCharge(draft.chargeId));
    const { error } = await admin.from('billing_alerts').insert({
      user_id: await userOfCustomer(admin, customer),
      stripe_customer_id: customer,
      kind: draft.kind,
      stripe_object_id: draft.objectId,
      amount_cents: draft.amountCents,
      currency: draft.currency,
      detail: draft.detail,
    });
    if (error) throw error;
    return 'ok';
  }

  return 'ignored';
}
