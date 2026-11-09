import { createAdminClient } from '@/lib/supabase/admin';
import { stripeRequest } from '@/lib/stripe/client';

export interface InvoiceItem {
  id: string;
  number: string | null;
  createdAt: string;
  amountCents: number;
  currency: string;
  status: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export interface BillingOverview {
  plan: 'plus' | 'pro';
  interval: 'month' | 'year' | null;
  status: string;
  nextPaymentAt: string | null;
  cancelAtPeriodEnd: boolean;
  amountCents: number | null;
  currency: string;
  invoices: InvoiceItem[];
}

type StripeInvoice = {
  id: string;
  number?: string | null;
  created: number;
  amount_paid?: number;
  amount_due?: number;
  total?: number;
  currency?: string;
  status?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
};

/** Linha da assinatura DESTE usuário (o id nunca vem do navegador). */
export async function ownSubscription(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, plan, billing_interval, status, current_period_end, cancel_at_period_end')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

/** Plano, próxima cobrança e faturas, direto do Stripe (fonte da verdade). Sem Stripe, usa o espelho do banco. */
export async function loadOverview(userId: string): Promise<BillingOverview | null> {
  const row = await ownSubscription(userId);
  if (!row) return null;
  const admin = createAdminClient();

  const base: BillingOverview = {
    plan: row.plan as 'plus' | 'pro',
    interval: (row.billing_interval as 'month' | 'year' | null) ?? null,
    status: row.status,
    nextPaymentAt: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    amountCents: null,
    currency: 'brl',
    invoices: [],
  };

  const customer = admin ? (await admin.from('billing_customers').select('stripe_customer_id').eq('user_id', userId).maybeSingle()).data : null;
  const [sub, invoices] = await Promise.all([
    stripeRequest<{ items?: { data?: { price?: { unit_amount?: number | null; currency?: string } }[] } }>('GET', `subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`),
    customer ? stripeRequest<{ data?: StripeInvoice[] }>('GET', `invoices?customer=${encodeURIComponent(customer.stripe_customer_id)}&limit=12`) : Promise.resolve(null),
  ]);

  if (sub && sub.ok) {
    const price = sub.data.items?.data?.[0]?.price;
    base.amountCents = price?.unit_amount ?? null;
    base.currency = price?.currency ?? 'brl';
  }
  if (invoices && invoices.ok) {
    base.invoices = (invoices.data.data ?? [])
      .filter((i) => i.status && i.status !== 'draft')
      .map((i) => ({
        id: i.id,
        number: i.number ?? null,
        createdAt: new Date(i.created * 1000).toISOString(),
        amountCents: i.amount_paid || i.amount_due || i.total || 0,
        currency: i.currency ?? 'brl',
        status: i.status ?? 'open',
        hostedUrl: i.hosted_invoice_url ?? null,
        pdfUrl: i.invoice_pdf ?? null,
      }));
  }
  return base;
}
