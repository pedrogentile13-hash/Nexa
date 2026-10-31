'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_DAILY_LIMITS } from '@/lib/ai/quota';
import { PLAN_LABEL, PLAN_LIMITS, PLAN_PRICES, formatBRL, yearlyFreeMonths, type BillingInterval, type PaidPlan, type Plan } from '../lib/plans';

interface Props {
  plan: Plan;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentsReady: boolean;
  banner: 'ok' | 'cancelado' | null;
}

const when = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

function features(plan: 'free' | PaidPlan): { text: string; on: boolean }[] {
  const l = PLAN_LIMITS[plan];
  return [
    { text: `${l.libraryDocs} materiais na Biblioteca (PDF, imagem, texto)`, on: true },
    { text: `${AI_DAILY_LIMITS.nexa_ia * l.aiMultiplier} perguntas por dia à NexaAI`, on: true },
    { text: `${AI_DAILY_LIMITS.material * l.aiMultiplier} leituras de material por dia`, on: true },
    { text: `${AI_DAILY_LIMITS.creator * l.aiMultiplier} resumos e simulados com IA por dia`, on: true },
    { text: 'Sem anúncios', on: plan !== 'free' },
  ];
}

async function go(path: string, body?: unknown): Promise<string | null> {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = (await r.json().catch(() => ({}))) as { url?: string; message?: string };
  if (r.ok && j.url) {
    window.location.href = j.url;
    return null;
  }
  return j.message ?? 'Não consegui agora. Tente de novo.';
}

export function ProView({ plan, periodEnd, cancelAtPeriodEnd, paymentsReady, banner }: Props) {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paid = plan === 'plus' || plan === 'pro';
  // Dentro do app da Google Play (TWA) não se vende assinatura por fora: a política da loja proíbe. Lá, só se mostra o plano.
  const [inStoreApp, setInStoreApp] = useState(false);
  useEffect(() => {
    try {
      if (document.referrer.startsWith('android-app://')) sessionStorage.setItem('nx_store_app', '1');
      setInStoreApp(sessionStorage.getItem('nx_store_app') === '1');
    } catch {
      // sem sessionStorage: segue como navegador
    }
  }, []);

  async function run(key: string, path: string, body?: unknown) {
    setBusy(key);
    setError(null);
    const message = await go(path, body);
    if (message) {
      setError(message);
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <header className="relative overflow-hidden rounded-[32px] p-6 text-white md:p-9" style={{ background: 'var(--gradient-header)' }}>
        <div aria-hidden className="absolute -top-14 -right-10 size-56 rounded-full bg-white/10" />
        <p className="relative flex items-center gap-2 text-sm opacity-90"><Sparkles className="size-4" aria-hidden /> Nexa Pro</p>
        <h1 className="relative mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Estude sem limites.</h1>
        <p className="relative mt-2 max-w-xl text-sm opacity-90 md:text-base">Mais materiais na Biblioteca, mais perguntas à NexaAI por dia e nenhum anúncio. Cancele quando quiser.</p>
      </header>

      {banner === 'ok' && <p role="status" className="bg-success-soft text-success mt-4 rounded-2xl px-4 py-3 text-sm font-medium">Pagamento recebido! Seu plano é liberado em instantes — se não aparecer, atualize a página.</p>}
      {banner === 'cancelado' && <p role="status" className="bg-surface-2 text-muted mt-4 rounded-2xl px-4 py-3 text-sm">Pagamento cancelado. Nada foi cobrado.</p>}
      {paid && !inStoreApp && (
        <div className="bg-brand-soft text-brand-text mt-4 flex flex-wrap items-center gap-3 rounded-3xl px-5 py-4 text-sm">
          <span className="min-w-0 flex-1">
            Você está no <b>{PLAN_LABEL[plan]}</b>.
            {periodEnd && (cancelAtPeriodEnd ? ` Termina em ${when.format(new Date(periodEnd))}.` : ` Renova em ${when.format(new Date(periodEnd))}.`)}
          </span>
          <button type="button" onClick={() => run('portal', '/api/billing/portal')} disabled={busy !== null} className="bg-surface text-text inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
            {busy === 'portal' && <Loader2 className="size-4 animate-spin" aria-hidden />} Gerenciar assinatura
          </button>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <div role="group" aria-label="Cobrança" className="bg-surface-2 inline-flex rounded-full p-1">
          {(['month', 'year'] as const).map((i) => (
            <button key={i} type="button" aria-pressed={interval === i} onClick={() => setInterval(i)} className={cn('h-10 rounded-full px-5 text-sm font-semibold', interval === i ? 'bg-surface shadow-sm' : 'text-muted')}>
              {i === 'month' ? 'Mensal' : 'Anual'}
              {i === 'year' && <span className="text-success ml-1.5 text-xs">{yearlyFreeMonths('plus')} meses grátis</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(['free', 'plus', 'pro'] as const).map((p) => {
          const current = plan === p;
          const price = p === 'free' ? null : PLAN_PRICES[p][interval];
          return (
            <section key={p} className={cn('bg-surface flex flex-col rounded-3xl border p-6 shadow-sm', p === 'plus' ? 'border-brand ring-brand/20 ring-4' : 'border-border')}>
              <h2 className="text-lg font-semibold">{PLAN_LABEL[p]}</h2>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {price === null ? 'R$ 0' : formatBRL(price)}
                {price !== null && <span className="text-muted text-sm font-normal">/{interval === 'month' ? 'mês' : 'ano'}</span>}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {features(p).map((f) => (
                  <li key={f.text} className={cn('flex items-start gap-2', !f.on && 'text-subtle line-through')}>
                    {f.on ? <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> : <X className="mt-0.5 size-4 shrink-0" aria-hidden />}
                    {f.text}
                  </li>
                ))}
              </ul>
              {p === 'free' ? (
                <p className="text-muted mt-5 text-center text-sm">{current ? 'Seu plano atual' : 'Sempre disponível'}</p>
              ) : current ? (
                <p className="text-brand-text mt-5 text-center text-sm font-semibold">Seu plano atual</p>
              ) : inStoreApp ? null : (
                <button
                  type="button"
                  disabled={busy !== null || !paymentsReady || paid}
                  onClick={() => run(p, '/api/billing/checkout', { plan: p, interval })}
                  className="bg-brand text-brand-fg mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:opacity-50"
                >
                  {busy === p && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {paymentsReady ? `Assinar ${PLAN_LABEL[p]}` : 'Em breve'}
                </button>
              )}
            </section>
          );
        })}
      </div>

      {error && <p role="alert" className="text-danger mt-4 text-center text-sm">{error}</p>}
      {!inStoreApp && <p className="text-subtle mt-6 text-center text-xs">Pagamento seguro pelo Stripe. A assinatura renova sozinha até você cancelar; cancelar mantém o plano até o fim do período já pago.</p>}
    </div>
  );
}
