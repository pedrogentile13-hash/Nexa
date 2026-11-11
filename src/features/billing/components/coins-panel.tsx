import Link from 'next/link';
import { Coins } from 'lucide-react';
import { COIN_COSTS, COIN_LABEL, type CoinFeature } from '@/lib/ai/coins';
import type { CoinBalance } from '../server/coins';

const ORDER: CoinFeature[] = [
  'nexa_ia',
  'explain',
  'hint',
  'material',
  'summary',
  'quiz',
  'exam_ai',
  'discursive',
  'answer_sheet',
  'essay',
  'essay_pro',
];

/** Saldo de Nexa Coins do mês, quanto cada ação custa e em que a pessoa já gastou. */
export function CoinsPanel({
  balance,
  canUpgrade,
}: {
  balance: CoinBalance | null;
  canUpgrade: boolean;
}) {
  const pct = balance ? Math.min(100, Math.round((balance.spent / balance.allowance) * 100)) : 0;
  return (
    <section
      className="border-border bg-surface rounded-2xl border p-4"
      aria-labelledby="coins-title"
    >
      <div className="flex items-center gap-2">
        <span className="bg-warning-soft text-warning grid size-9 place-items-center rounded-full">
          <Coins className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="coins-title" className="text-base font-semibold">
            Nexa Coins
          </h2>
          <p className="text-muted text-xs">A moeda da IA. O saldo renova todo mês.</p>
        </div>
        {balance && (
          <p className="text-xl font-semibold tabular-nums">
            {balance.remaining.toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      {balance && (
        <>
          <div
            className="bg-surface-2 mt-3 h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Moedas usadas no mês"
          >
            <div className="bg-warning h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-muted mt-1.5 text-xs">
            Você usou {balance.spent.toLocaleString('pt-BR')} de{' '}
            {balance.allowance.toLocaleString('pt-BR')} neste mês.
          </p>
        </>
      )}

      <h3 className="mt-4 text-sm font-semibold">Quanto cada coisa custa</h3>
      <ul className="mt-1.5 divide-y divide-[var(--color-border)] text-sm">
        {ORDER.map((f) => {
          const used = balance?.byFeature.find((r) => r.feature === f);
          return (
            <li key={f} className="flex items-center justify-between gap-3 py-1.5">
              <span className="min-w-0 flex-1 truncate">{COIN_LABEL[f]}</span>
              {used && <span className="text-muted text-xs tabular-nums">{used.uses}× usado</span>}
              <span className="font-semibold tabular-nums">{COIN_COSTS[f]} 🪙</span>
            </li>
          );
        })}
      </ul>

      {canUpgrade && (
        <Link
          href="/pro"
          className="text-primary mt-3 inline-block text-sm font-semibold underline-offset-2 hover:underline"
        >
          Quero mais moedas (Nexa Plus e Pro)
        </Link>
      )}
    </section>
  );
}
