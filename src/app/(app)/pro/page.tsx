import { redirect } from 'next/navigation';
import { ProView } from '@/features/billing/components/pro-view';
import { getPlanInfo } from '@/features/billing/server/entitlements';
import { stripeConfigured } from '@/lib/stripe/client';

export const metadata = { title: 'Nexa Pro' };
export const dynamic = 'force-dynamic';

export default async function ProPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const info = await getPlanInfo();
  // Nexa Escolas não tem plano pago: a tela simplesmente não existe lá.
  if (!info.billingVisible) redirect('/hoje');
  const { status } = await searchParams;

  return (
    <ProView
      plan={info.plan}
      periodEnd={info.periodEnd}
      cancelAtPeriodEnd={info.cancelAtPeriodEnd}
      paymentsReady={stripeConfigured()}
      banner={status === 'ok' ? 'ok' : status === 'cancelado' ? 'cancelado' : null}
    />
  );
}
