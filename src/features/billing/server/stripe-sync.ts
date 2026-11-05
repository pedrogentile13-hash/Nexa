import { createAdminClient } from '@/lib/supabase/admin';
import { subscriptionRowFrom, priceMapFromEnv } from '../lib/subscription';

/** Grava no banco o que o Stripe informou. Só o webhook chama (com a chave de serviço). */

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export type SyncResult = 'ok' | 'duplicate' | 'ignored' | 'unavailable';

export async function applyStripeEvent(event: StripeEvent): Promise<SyncResult> {
  const admin = createAdminClient();
  if (!admin) return 'unavailable';

  // Cada evento vale uma vez: o Stripe reenvia em caso de timeout.
  const seen = await admin.from('stripe_events').insert({ id: event.id, type: event.type });
  if (seen.error) return seen.error.code === '23505' ? 'duplicate' : 'unavailable';

  const object = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const userId = (object.client_reference_id as string | null) ?? (object.metadata as Record<string, string> | null)?.user_id;
    const customer = object.customer as string | null;
    if (userId && customer) await admin.from('billing_customers').upsert({ user_id: userId, stripe_customer_id: customer });
    return 'ok';
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const row = subscriptionRowFrom(object as Parameters<typeof subscriptionRowFrom>[0], priceMapFromEnv());
    if (!row) return 'ignored';
    // Uma pessoa de escola nunca fica com plano pago (defesa: o checkout já barra, mas o banco é a fronteira).
    const { data: profile } = await admin.from('profiles').select('school_id').eq('id', row.user_id).maybeSingle();
    if (profile?.school_id) return 'ignored';
    await admin.from('subscriptions').upsert({ ...row, status: event.type.endsWith('deleted') ? 'canceled' : row.status, updated_at: new Date().toISOString() });
    return 'ok';
  }

  return 'ignored';
}
