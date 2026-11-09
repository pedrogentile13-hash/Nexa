import { cn } from '@/lib/utils';
import type { ExamAttemptRow } from '@/types/database.types';
import type { ReviewRow } from '../server/answer-sheet';
import { formatElapsed } from '../lib/answer-sheet';

const STATUS: Record<ReviewRow['status'], { label: string; className: string }> = {
  certa: { label: 'Certa', className: 'text-success' },
  errada: { label: 'Errada', className: 'text-danger' },
  branca: { label: 'Em branco', className: 'text-muted' },
  anulada: { label: 'Anulada', className: 'text-subtle' },
};

/** Resultado de uma tentativa: pontuação, desempenho por área e a revisão questão a questão (com a letra certa). */
export function AttemptResult({ attempt, review }: { attempt: ExamAttemptRow; review: ReviewRow[] }) {
  const toReview = review.filter((r) => r.status === 'errada' || r.status === 'branca');
  return (
    <div className="space-y-4">
      <section className="rounded-3xl p-6 text-white" style={{ background: 'var(--gradient-header)' }}>
        <p className="text-sm opacity-90">Sua pontuação</p>
        <p className="mt-1 text-5xl font-semibold tabular-nums">{Math.round(attempt.score_pct)}%</p>
        <p className="mt-2 text-sm opacity-90">
          {attempt.correct} de {attempt.total} questões certas
          {attempt.duration_seconds != null && ` · ${formatElapsed(attempt.duration_seconds)}`}
          {attempt.mode === 'foto' && ' · lido da foto'}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-white/15 p-2"><dt className="opacity-80">Certas</dt><dd className="text-lg font-semibold">{attempt.correct}</dd></div>
          <div className="rounded-2xl bg-white/15 p-2"><dt className="opacity-80">Erradas</dt><dd className="text-lg font-semibold">{attempt.wrong}</dd></div>
          <div className="rounded-2xl bg-white/15 p-2"><dt className="opacity-80">Em branco</dt><dd className="text-lg font-semibold">{attempt.blank}</dd></div>
        </dl>
      </section>

      {attempt.by_area.length > 0 && (
        <section className="border-border bg-surface rounded-2xl border p-4">
          <h2 className="text-sm font-semibold">Por área</h2>
          <ul className="mt-3 space-y-3">
            {attempt.by_area.map((a) => (
              <li key={a.area}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{a.area}</span>
                  <span className="text-muted tabular-nums">{a.correct}/{a.total} · {Math.round(a.pct)}%</span>
                </div>
                <div className="bg-surface-2 mt-1 h-2 overflow-hidden rounded-full" role="presentation">
                  <div className={cn('h-full rounded-full', a.pct >= 60 ? 'bg-success' : a.pct >= 40 ? 'bg-warning' : 'bg-danger')} style={{ width: `${Math.min(100, Math.max(2, a.pct))}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-subtle mt-3 text-xs">É o percentual de acertos. O ENEM calcula a nota pela TRI, então este número não é a nota oficial.</p>
        </section>
      )}

      <section className="border-border bg-surface rounded-2xl border p-4">
        <h2 className="text-sm font-semibold">Para revisar ({toReview.length})</h2>
        {toReview.length === 0 ? (
          <p className="text-muted mt-2 text-sm">Nenhuma questão errada ou em branco. Parabéns!</p>
        ) : (
          <ul className="divide-border mt-2 divide-y text-sm">
            {toReview.map((r) => (
              <li key={r.number} className="flex items-center gap-3 py-2">
                <span className="w-9 text-right font-semibold tabular-nums">{r.number}</span>
                <span className="text-muted min-w-0 flex-1 truncate">{r.area}</span>
                <span className={cn('text-xs font-semibold', STATUS[r.status].className)}>{STATUS[r.status].label}</span>
                <span className="w-24 text-right tabular-nums">você: {r.chosen ?? '—'} · certa: <b>{r.correct ?? '—'}</b></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="border-border bg-surface rounded-2xl border p-4">
        <summary className="cursor-pointer text-sm font-semibold">Ver todas as questões</summary>
        <ul className="divide-border mt-2 divide-y text-sm">
          {review.map((r) => (
            <li key={r.number} className="flex items-center gap-3 py-1.5">
              <span className="w-9 text-right tabular-nums">{r.number}</span>
              <span className={cn('flex-1 text-xs font-semibold', STATUS[r.status].className)}>{STATUS[r.status].label}</span>
              <span className="tabular-nums">{r.chosen ?? '—'} / {r.correct ?? '—'}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
