import Link from 'next/link';
import type { Route } from 'next';
import { ClipboardCheck } from 'lucide-react';
import type { ExamAttemptRow } from '@/types/database.types';

const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Chamada para fazer a prova com o cartão-resposta digital e histórico das tentativas. */
export function AnswerSheetCta({ editionId, total, attempts }: { editionId: string; total: number; attempts: ExamAttemptRow[] }) {
  if (total === 0) {
    return (
      <section className="border-border bg-surface text-muted mb-4 rounded-2xl border p-4 text-sm">
        <p className="text-text flex items-center gap-2 font-semibold">
          <ClipboardCheck className="size-4" aria-hidden /> Cartão-resposta digital
        </p>
        <p className="mt-1">O gabarito desta prova ainda será cadastrado. Em breve você poderá marcar suas respostas aqui e ver a correção na hora.</p>
      </section>
    );
  }
  return (
    <section className="border-border bg-surface mb-4 rounded-2xl border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <ClipboardCheck className="text-brand size-4" aria-hidden /> Fazer a prova e corrigir ({total} questões)
      </p>
      <ol className="text-muted mt-2 list-decimal space-y-1 pl-5 text-sm">
        <li>Abra o <b>caderno</b> abaixo (ou use o PDF impresso) e resolva a prova.</li>
        <li>Toque em <b>Abrir cartão-resposta</b> e marque as letras (ou envie a foto do cartão de papel).</li>
        <li>Toque em <b>Corrigir</b>: o Nexa mostra sua pontuação e o desempenho por área.</li>
      </ol>
      <Link href={`/vestibular/provas/${editionId}/fazer` as Route} className="bg-brand text-brand-fg mt-3 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold">
        Abrir cartão-resposta
      </Link>
      {attempts.length > 0 && (
        <div className="mt-4">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">Seus resultados</p>
          <ul className="divide-border mt-1 divide-y text-sm">
            {attempts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link href={`/vestibular/provas/${editionId}/resultado/${a.id}` as Route} className="hover:bg-surface-2 flex items-center gap-3 rounded-lg px-1 py-2">
                  <span className="text-muted flex-1">{date.format(new Date(a.created_at))}</span>
                  <span className="tabular-nums">{a.correct}/{a.total}</span>
                  <span className="text-brand-text w-12 text-right font-semibold tabular-nums">{Math.round(a.score_pct)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
