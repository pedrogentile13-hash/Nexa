'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Crown, Loader2, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNativeApp } from '@/lib/native';
import { track } from '@/features/analytics/lib/track';
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
    { text: `${l.libraryDocs} materiais na Biblioteca`, on: true },
    { text: `${AI_DAILY_LIMITS.nexa_ia * l.aiMultiplier} perguntas por dia à NexaAI`, on: true },
    { text: `${AI_DAILY_LIMITS.material * l.aiMultiplier} leituras de material por dia`, on: true },
    { text: `${AI_DAILY_LIMITS.creator * l.aiMultiplier} resumos e simulados com IA por dia`, on: true },
    { text: `${Math.round(AI_DAILY_LIMITS.essay * Math.min(l.aiMultiplier, 3))} correções de redação por dia`, on: true },
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
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('year');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paid = plan === 'plus' || plan === 'pro';
  // Dentro do app da Google Play (TWA) não se vende assinatura por fora: a política da loja proíbe. Lá, só se mostra o plano.
  const [inStoreApp, setInStoreApp] = useState(false);
  useEffect(() => {
    try {
      if (document.referrer.startsWith('android-app://') || isNativeApp()) sessionStorage.setItem('nx_store_app', '1');
      setInStoreApp(sessionStorage.getItem('nx_store_app') === '1');
    } catch {
      // sem sessionStorage: segue como navegador
    }
  }, []);

  useEffect(() => {
    track({ name: 'pro_view', plan });
    if (banner === 'ok') track({ name: 'pro_checkout_success' });
  }, [plan, banner]);

  // Voltou do pagamento e o plano ainda não chegou (webhook atrasado): confere direto no Stripe.
  useEffect(() => {
    if (banner !== 'ok' || paid) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/billing/sync', { method: 'POST' });
        const j = (await r.json().catch(() => ({}))) as { result?: string };
        if (alive && r.ok && j.result === 'synced') router.refresh();
      } catch {
        // sem rede: a página segue e o webhook ainda pode atualizar
      }
    })();
    return () => {
      alive = false;
    };
  }, [banner, paid, router]);

  async function run(key: string, path: string, body?: unknown) {
    setBusy(key);
    setError(null);
    const message = await go(path, body);
    if (message) {
      setError(message);
      setBusy(null);
    }
  }

  const per = interval === 'month' ? 'mês' : 'ano';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      {/* Cabeçalho */}
      <header className="relative overflow-hidden rounded-[32px] p-6 text-white md:p-10" style={{ background: 'var(--gradient-header)' }}>
        <div aria-hidden className="absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-sm" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="size-3.5" aria-hidden /> Planos Nexa
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-5xl">Estude mais. Sem limites no seu caminho.</h1>
            <p className="mt-3 max-w-xl text-sm opacity-90 md:text-base">Mais IA todos os dias, mais materiais na Biblioteca e nenhum anúncio. Cancele quando quiser.</p>
          </div>
          <Image src="/brand/logo-mark.webp" alt="" width={140} height={140} priority className="hidden size-32 shrink-0 drop-shadow-2xl md:block" />
        </div>
      </header>

      {banner === 'ok' && (
        <p role="status" className="bg-success-soft text-success mt-4 rounded-2xl px-4 py-3 text-sm font-medium">
          Pagamento recebido! Seu plano é liberado em instantes — se não aparecer, atualize a página.
        </p>
      )}
      {banner === 'cancelado' && <p role="status" className="bg-surface-2 text-muted mt-4 rounded-2xl px-4 py-3 text-sm">Pagamento cancelado. Nada foi cobrado.</p>}

      {paid && (
        <div className="bg-brand-soft text-brand-text mt-4 flex flex-wrap items-center gap-3 rounded-3xl px-5 py-4 text-sm">
          <Crown className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            Você está no <b>{PLAN_LABEL[plan]}</b>.
            {periodEnd && (cancelAtPeriodEnd ? ` Termina em ${when.format(new Date(periodEnd))}.` : ` Renova em ${when.format(new Date(periodEnd))}.`)}
          </span>
          {!inStoreApp && (
            <button type="button" onClick={() => run('portal', '/api/billing/portal')} disabled={busy !== null} className="bg-surface text-text inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
              {busy === 'portal' && <Loader2 className="size-4 animate-spin" aria-hidden />} Gerenciar assinatura
            </button>
          )}
        </div>
      )}

      {/* Mensal / anual */}
      <div className="mt-8 flex justify-center">
        <div role="group" aria-label="Cobrança" className="bg-surface-2 inline-flex rounded-full p-1">
          {(['month', 'year'] as const).map((i) => (
            <button key={i} type="button" aria-pressed={interval === i} onClick={() => setInterval(i)} className={cn('h-11 rounded-full px-6 text-sm font-semibold transition-colors', interval === i ? 'bg-surface shadow-sm' : 'text-muted')}>
              {i === 'month' ? 'Mensal' : 'Anual'}
              {i === 'year' && <span className="text-success ml-2 rounded-full bg-[color-mix(in_srgb,var(--color-success,#16a34a)_14%,transparent)] px-2 py-0.5 text-xs">{yearlyFreeMonths('plus')} meses grátis</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plus e Pro */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {(['plus', 'pro'] as const).map((p) => {
          const current = plan === p;
          const price = PLAN_PRICES[p][interval];
          const monthlyEquivalent = interval === 'year' ? PLAN_PRICES[p].year / 12 : null;
          const pro = p === 'pro';
          return (
            <section
              key={p}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-[28px] border p-6 md:p-7',
                pro ? 'border-transparent text-white shadow-xl' : 'border-brand bg-surface ring-brand/15 shadow-sm ring-4',
              )}
              style={pro ? { background: 'linear-gradient(160deg, #1a1033 0%, #2a1a5e 55%, #4b3410 120%)' } : undefined}
            >
              {pro && <div aria-hidden className="absolute -top-16 -right-16 size-52 rounded-full bg-[#f5b82e]/20 blur-2xl" />}
              <div className="relative flex items-center gap-2">
                <span className={cn('grid size-9 place-items-center rounded-xl', pro ? 'bg-[#f5b82e] text-[#2a1a05]' : 'bg-brand text-brand-fg')}>
                  {pro ? <Crown className="size-5" aria-hidden /> : <Zap className="size-5" aria-hidden />}
                </span>
                <h2 className="text-xl font-semibold">{PLAN_LABEL[p]}</h2>
                <span className={cn('ml-auto rounded-full px-2.5 py-1 text-xs font-semibold', pro ? 'bg-[#f5b82e]/20 text-[#ffd36b]' : 'bg-brand-soft text-brand-text')}>
                  {pro ? 'Para quem mira alto' : 'Mais popular'}
                </span>
              </div>

              <p className="relative mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">{formatBRL(price)}</span>
                <span className={cn('text-sm', pro ? 'text-white/70' : 'text-muted')}>/{per}</span>
              </p>
              <p className={cn('relative mt-1 h-5 text-xs', pro ? 'text-white/70' : 'text-muted')}>
                {monthlyEquivalent ? `Equivale a ${formatBRL(Math.round(monthlyEquivalent))} por mês` : 'Cobrança todo mês'}
              </p>

              <ul className="relative mt-5 flex-1 space-y-2.5 text-sm">
                {features(p).map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <Check className={cn('mt-0.5 size-4 shrink-0', pro ? 'text-[#ffd36b]' : 'text-success')} aria-hidden />
                    {f.text}
                  </li>
                ))}
              </ul>

              {current ? (
                <p className={cn('relative mt-6 text-center text-sm font-semibold', pro ? 'text-[#ffd36b]' : 'text-brand-text')}>Seu plano atual</p>
              ) : inStoreApp ? null : (
                <button
                  type="button"
                  disabled={busy !== null || !paymentsReady || paid}
                  onClick={() => {
                    track({ name: 'pro_checkout_start', plan: p, interval });
                    void run(p, '/api/billing/checkout', { plan: p, interval });
                  }}
                  className={cn(
                    'relative mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50',
                    pro ? 'bg-[#f5b82e] text-[#2a1a05]' : 'bg-brand text-brand-fg',
                  )}
                >
                  {busy === p && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {paymentsReady ? `Assinar ${PLAN_LABEL[p]}` : 'Em breve'}
                </button>
              )}
            </section>
          );
        })}
      </div>

      {/* Grátis, em faixa */}
      <section className="bg-surface border-border mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border px-5 py-4 text-sm">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{PLAN_LABEL.free}{plan === 'free' && <span className="text-brand-text ml-2 text-xs">Seu plano atual</span>}</h2>
          <p className="text-muted mt-0.5">
            {features('free').filter((f) => f.on).slice(0, 3).map((f) => f.text).join(' · ')}
          </p>
        </div>
        <ul className="text-subtle flex flex-wrap gap-x-4 text-xs">
          {features('free').filter((f) => !f.on).map((f) => (
            <li key={f.text} className="flex items-center gap-1 line-through"><X className="size-3.5" aria-hidden />{f.text}</li>
          ))}
          <li>Com anúncios</li>
        </ul>
      </section>

      {error && <p role="alert" className="text-danger mt-4 text-center text-sm">{error}</p>}

      {!inStoreApp && (
        <div className="text-subtle mt-8 grid gap-3 text-xs sm:grid-cols-3">
          <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Pagamento seguro pelo Stripe. Seus dados de cartão não passam pelo Nexa.</p>
          <p className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0" aria-hidden /> Cancele quando quiser. O plano continua até o fim do período já pago.</p>
          <p className="flex items-start gap-2"><Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden /> Pode trocar de Plus para Pro (e de mensal para anual) pelo portal da assinatura.</p>
        </div>
      )}
    </div>
  );
}
