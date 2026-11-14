'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarClock, CreditCard, Crown, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_LABEL, formatBRL } from '../lib/plans';
import type { BillingOverview } from '../server/overview';

const when = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const short = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const INVOICE_STATUS: Record<string, string> = { paid: 'Paga', open: 'Em aberto', void: 'Cancelada', uncollectible: 'Não paga' };

/** Aba "Assinatura" do Perfil: plano, próxima cobrança, faturas, cancelar e trocar cartão. */
export function SubscriptionPanel({ plan }: { plan: 'free' | 'plus' | 'pro' }) {
  const router = useRouter();
  const [data, setData] = useState<BillingOverview | null | undefined>(plan === 'free' ? null : undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/billing/overview', { cache: 'no-store' });
      const j = (await r.json().catch(() => ({}))) as { overview?: BillingOverview | null };
      setData(j.overview ?? null);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    if (plan !== 'free') void load();
  }, [plan, load]);

  async function portal() {
    setBusy('portal');
    setError(null);
    const r = await fetch('/api/billing/portal', { method: 'POST' });
    const j = (await r.json().catch(() => ({}))) as { url?: string; message?: string };
    if (r.ok && j.url) {
      window.location.href = j.url;
      return;
    }
    setError(j.message ?? 'Não consegui abrir agora. Tente de novo.');
    setBusy(null);
  }

  async function change(action: 'cancel' | 'resume') {
    setBusy(action);
    setError(null);
    const r = await fetch('/api/billing/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const j = (await r.json().catch(() => ({}))) as { message?: string };
    setBusy(null);
    setConfirm(false);
    if (!r.ok) {
      setError(j.message ?? 'Não consegui alterar agora. Tente de novo.');
      return;
    }
    await load();
  }

  async function syncNow() {
    setBusy('sync');
    setError(null);
    const r = await fetch('/api/billing/sync', { method: 'POST' });
    const j = (await r.json().catch(() => ({}))) as { result?: string; message?: string };
    setBusy(null);
    if (!r.ok) return setError(j.message ?? 'Não consegui conferir agora. Tente de novo.');
    if (j.result === 'synced') return router.refresh();
    setError('Não encontrei nenhuma assinatura ativa para este e-mail. Se acabou de pagar, tente de novo em um minuto.');
  }

  if (plan === 'free') {
    return (
      <div className="space-y-3 text-sm">
        <p>
          Você está no plano <b>Grátis</b>. Com o Nexa Plus ou Pro você tem mais IA por dia, mais materiais na Biblioteca e nenhum anúncio.
        </p>
        <Link href="/pro" className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold">
          <Crown className="size-4" aria-hidden /> Ver planos
        </Link>
        <div className="border-border border-t pt-3">
          <p className="text-muted">Já pagou e o plano não apareceu?</p>
          <button type="button" onClick={syncNow} disabled={busy !== null} className="text-brand-text mt-1 inline-flex items-center gap-1 font-semibold underline">
            {busy === 'sync' && <Loader2 className="size-3.5 animate-spin" aria-hidden />} Conferir minha assinatura
          </button>
        </div>
        {error && <p role="alert" className="text-danger">{error}</p>}
      </div>
    );
  }

  if (data === undefined) {
    return (
      <p role="status" className="text-muted flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando sua assinatura…
      </p>
    );
  }

  if (data === null) {
    return <p className="text-muted text-sm">Não encontrei os dados da assinatura agora. Atualize a página em instantes.</p>;
  }

  const every = data.interval === 'year' ? 'ano' : 'mês';
  const pastDue = data.status === 'past_due' || data.status === 'unpaid';
  const canceled = data.status === 'canceled';

  return (
    <div className="space-y-5">
      <div className="bg-brand-soft text-brand-text flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <Crown className="size-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{PLAN_LABEL[data.plan]}</p>
          <p className="text-xs opacity-80">
            {data.amountCents != null ? `${formatBRL(data.amountCents)} por ${every}` : data.interval === 'year' ? 'Cobrança anual' : 'Cobrança mensal'}
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', pastDue ? 'bg-danger-soft text-danger' : 'bg-surface text-text')}>
          {canceled ? 'Cancelada' : data.cancelAtPeriodEnd ? 'Cancelamento agendado' : pastDue ? 'Pagamento pendente' : 'Ativa'}
        </span>
      </div>

      {pastDue && (
        <p role="alert" className="bg-danger-soft text-danger flex items-start gap-2 rounded-2xl px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Não conseguimos cobrar seu cartão. Atualize a forma de pagamento para manter o plano.
        </p>
      )}

      <dl className="divide-border divide-y text-sm">
        <div className="flex items-center gap-3 py-3">
          <CalendarClock className="text-muted size-4 shrink-0" aria-hidden />
          <dt className="text-muted flex-1">{data.cancelAtPeriodEnd || canceled ? 'O plano vai até' : 'Próxima cobrança'}</dt>
          <dd className="font-medium">{data.nextPaymentAt ? when.format(new Date(data.nextPaymentAt)) : '—'}</dd>
        </div>
        <div className="flex items-center gap-3 py-3">
          <CreditCard className="text-muted size-4 shrink-0" aria-hidden />
          <dt className="text-muted flex-1">Forma de pagamento</dt>
          <dd>
            <button type="button" onClick={portal} disabled={busy !== null} className="text-brand-text inline-flex items-center gap-1 font-semibold underline">
              {busy === 'portal' && <Loader2 className="size-3.5 animate-spin" aria-hidden />} Atualizar cartão
            </button>
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">Faturas</h3>
        {data.invoices.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma fatura ainda.</p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {data.invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <FileText className="text-muted size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  {short.format(new Date(i.createdAt))}
                  <span className="text-muted"> · {INVOICE_STATUS[i.status] ?? i.status}</span>
                </span>
                <span className="font-medium tabular-nums">{formatBRL(i.amountCents)}</span>
                {i.hostedUrl && (
                  <a href={i.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-brand-text inline-flex items-center gap-1 font-semibold">
                    Ver <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
                {i.pdfUrl && (
                  <a href={i.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-text font-medium underline">
                    PDF
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!canceled && (
        <div className="border-border border-t pt-4">
          {data.cancelAtPeriodEnd ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted">Seu cancelamento está agendado. Você mantém o plano até o fim do período já pago.</p>
              <button type="button" onClick={() => change('resume')} disabled={busy !== null} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold">
                {busy === 'resume' && <Loader2 className="size-4 animate-spin" aria-hidden />} Manter minha assinatura
              </button>
            </div>
          ) : confirm ? (
            <div role="alertdialog" aria-label="Confirmar cancelamento" className="bg-surface-2 space-y-3 rounded-2xl p-4 text-sm">
              <p>
                Cancelar a assinatura? Você continua com o {PLAN_LABEL[data.plan]} até {data.nextPaymentAt ? when.format(new Date(data.nextPaymentAt)) : 'o fim do período pago'} e não será cobrado de novo.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => change('cancel')} disabled={busy !== null} className="bg-danger inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold text-white">
                  {busy === 'cancel' && <Loader2 className="size-4 animate-spin" aria-hidden />} Sim, cancelar
                </button>
                <button type="button" onClick={() => setConfirm(false)} disabled={busy !== null} className="bg-surface h-11 rounded-full px-5 font-semibold">
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="text-danger text-sm font-semibold underline">
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
    </div>
  );
}
