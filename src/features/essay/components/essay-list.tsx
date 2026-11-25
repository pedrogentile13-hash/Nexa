import Link from 'next/link';
import { BookMarked, PenLine, Trash2, TrendingUp } from 'lucide-react';
import { PopEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { deleteEssay } from '../server/actions';
import { weakestCompetency } from '../lib/essay';
import type { EssayHistoryItem } from '../server/queries';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

/** Minhas redações: um cartão por redação corrigida, cada um abre o próprio laudo. */
export function EssayList({ history }: { history: EssayHistoryItem[] }) {
  const weakest = weakestCompetency(history.map((h) => ({ scores: h.scores })));
  const best = history.reduce((m, h) => Math.max(m, h.total), 0);
  const avg = history.length ? Math.round(history.reduce((s, h) => s + h.total, 0) / history.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vestibular/redacao/nova"
          className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
        >
          <PenLine className="size-4" aria-hidden />
          Corrigir uma redação
        </Link>
        <Link
          href="/vestibular/redacao/temas"
          className="border-border bg-surface hover:bg-surface-2 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
        >
          <BookMarked className="size-4" aria-hidden />
          Banco de temas
        </Link>
      </div>

      {history.length === 0 ? (
        <PopEmptyState
          icon={<PenLine className="size-6 text-white" aria-hidden />}
          title="Você ainda não corrigiu nenhuma redação"
          description="Escolha um tema, escreva (ou envie uma foto da folha) e receba um laudo com a nota nas 5 competências."
        />
      ) : (
        <>
          <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Redações corrigidas" value={String(history.length)} />
            <Stat label="Melhor nota" value={String(best)} suffix="/1000" />
            <Stat label="Média" value={String(avg)} suffix="/1000" />
            <Stat label="Ponto fraco" value={weakest && history.length >= 2 ? `C${weakest.id}` : '—'} hint={weakest && history.length >= 2 ? weakest.name : 'Precisa de 2 redações'} />
          </section>

          {history.length >= 2 && (
            <section aria-label="Evolução" className="border-border bg-surface rounded-2xl border p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4" aria-hidden />
                Sua evolução
              </h2>
              <Sparkline totals={[...history].reverse().map((h) => h.total)} />
            </section>
          )}

          <section aria-label="Suas redações">
            <h2 className="mb-3 text-base font-semibold">Suas redações</h2>
            <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {history.map((h) => (
                <li key={h.id}>
                  <EssayCard item={h} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, suffix, hint }: { label: string; value: string; suffix?: string; hint?: string }) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value}
        {suffix && <span className="text-muted text-sm font-medium">{suffix}</span>}
      </p>
      {hint && <p className="text-subtle mt-0.5 truncate text-xs">{hint}</p>}
    </div>
  );
}

function EssayCard({ item: h }: { item: EssayHistoryItem }) {
  const tone = h.total >= 700 ? 'bg-success' : h.total >= 500 ? 'bg-brand' : 'bg-warning';
  return (
    <article className="border-border bg-surface flex h-full flex-col overflow-hidden rounded-2xl border">
      <div className={cn('h-1.5', tone)} aria-hidden />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-subtle text-xs">{dateFmt.format(new Date(h.createdAt))} · Modelo ENEM</p>
            <h3 className="mt-1 line-clamp-3 text-[0.95rem] leading-snug font-semibold">{h.theme}</h3>
          </div>
          <p className="shrink-0 text-right text-2xl leading-none font-extrabold tabular-nums">
            {h.total}
            <span className="text-muted block text-[0.65rem] font-medium">de 1000</span>
          </p>
        </div>

        <ul className="mt-4 grid grid-cols-5 gap-1.5" aria-label="Nota por competência">
          {h.scores.map((s, i) => (
            <li key={i} className="text-center">
              <div className="bg-surface-2 mx-auto flex h-10 w-full items-end overflow-hidden rounded-md">
                <div className={cn('w-full', s >= 160 ? 'bg-success' : s >= 120 ? 'bg-brand' : 'bg-warning')} style={{ height: `${(s / 200) * 100}%` }} />
              </div>
              <p className="text-muted mt-1 text-[0.65rem] font-semibold">C{i + 1}</p>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            href={`/vestibular/redacao/${h.id}`}
            className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-10 flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
          >
            Ver laudo
          </Link>
          <form action={deleteEssay}>
            <input type="hidden" name="id" value={h.id} />
            <button
              type="submit"
              aria-label={`Apagar a redação sobre ${h.theme}`}
              className="text-muted hover:bg-danger-soft hover:text-danger grid size-10 place-items-center rounded-full"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

/** Evolução das notas totais, da mais antiga para a mais nova. */
function Sparkline({ totals }: { totals: number[] }) {
  const w = 300;
  const h = 56;
  const pts = totals.map((t, i) => [(i / (totals.length - 1)) * (w - 12) + 6, h - 6 - (t / 1000) * (h - 12)] as const);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="text-brand w-full max-w-xl" role="img" aria-label={`Notas: ${totals.join(', ')}`}>
      <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts.map((p) => p.join(',')).join(' ')} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="currentColor" />
      ))}
    </svg>
  );
}
