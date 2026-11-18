'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatGrade } from '@/lib/format/grade';
import { findSerie } from '@/lib/design/serie';
import type { GradeCard } from '../lib/report-card';

const PASSING_GRADE = 6;

/** Boletim separado por série: o aluno escolhe a série e vê a nota de cada matéria dela. */
export function ReportCardByGrade({ cards, mySerie }: { cards: GradeCard[]; mySerie: string | null }) {
  const initial = cards.find((c) => c.grade === mySerie)?.grade ?? cards[cards.length - 1]?.grade ?? '';
  const [grade, setGrade] = useState(initial);
  const card = cards.find((c) => c.grade === grade) ?? cards[0];
  if (!card) return null;

  return (
    <Card className="min-w-0 overflow-hidden lg:col-span-2">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Boletim por série</CardTitle>
        <span className="text-muted text-xs">Média da série {formatGrade(card.average, 1)}</span>
      </CardHeader>

      <div role="tablist" aria-label="Série" className="flex gap-1.5 overflow-x-auto px-4 pb-3">
        {cards.map((c) => (
          <button
            key={c.grade}
            type="button"
            role="tab"
            aria-selected={c.grade === card.grade}
            onClick={() => setGrade(c.grade)}
            className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors', c.grade === card.grade ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted')}
          >
            {findSerie(c.grade)?.label ?? c.grade}
          </button>
        ))}
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Nota por matéria na série selecionada</caption>
        <thead>
          <tr className="text-muted border-border border-y text-xs">
            <th scope="col" className="px-4 py-2.5 text-left font-semibold">Disciplinas</th>
            <th scope="col" className="px-2 py-2.5 text-center font-semibold">Provas</th>
            <th scope="col" className="px-2 py-2.5 text-center font-semibold">Conteúdos</th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">Nota</th>
          </tr>
        </thead>
        <tbody>
          {card.rows.map((r) => {
            const failing = r.assessment_score !== null && r.assessment_score < PASSING_GRADE;
            return (
              <tr key={r.subject_catalog_id} className="even:bg-surface-2/60">
                <th scope="row" className="px-4 py-3 text-left font-medium">{r.subject_name}</th>
                <td className="tabular text-muted px-2 py-3 text-center">{r.quizzes_done + r.simulados_done}</td>
                <td className="tabular text-muted px-2 py-3 text-center">{r.content_completed}</td>
                <td className={cn('tabular px-4 py-3 text-right text-base font-semibold', r.assessment_score === null ? 'text-subtle' : failing ? 'text-danger' : 'text-brand-text')}>
                  {formatGrade(r.assessment_score, 1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-subtle px-4 py-3 text-xs">A nota vem dos quizzes e simulados feitos com conteúdo desta série. Conteúdo de vestibular não entra.</p>
    </Card>
  );
}
