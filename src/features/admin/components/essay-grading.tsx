'use client';

import { useActionState, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Field, FormFeedback, SubmitButton } from './form-parts';
import { gradeEssay, type AdminState } from '../server/actions';
import type { EssayForGrading } from '../server/queries';

const INITIAL: AdminState = { status: 'idle' };

/**
 * Correção de redação.
 *
 * Nunca automática (pedido explícito — seção 16/20): o professor lê o texto
 * inteiro, atribui nota por critério e uma nota final. `grade_essay` no
 * banco é quem de fato barra qualquer um fora da matéria do recurso; este
 * componente só apresenta o formulário.
 */
export function EssayGrading({ resourceId, essays }: { resourceId: string; essays: EssayForGrading[] }) {
  if (essays.length === 0) {
    return (
      <div className="border-border bg-surface rounded-lg border p-8 text-center">
        <p className="text-sm font-medium">Nenhuma redação entregue ainda</p>
        <p className="text-muted mt-1 text-sm">
          Assim que um aluno entregar, ela aparece aqui para correção.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {essays.map((essay) => (
        <EssayCard key={essay.essayId} resourceId={resourceId} essay={essay} />
      ))}
    </ul>
  );
}

function EssayCard({ resourceId, essay }: { resourceId: string; essay: EssayForGrading }) {
  const [state, formAction] = useActionState(gradeEssay, INITIAL);
  const graded = essay.totalScore !== null;
  const [open, setOpen] = useState(!graded);

  return (
    <li className="border-border bg-surface rounded-lg border p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full min-h-11 items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{essay.studentName ?? 'Aluno'}</p>
          <p className="text-subtle truncate text-xs">
            {essay.writingTaskTitle} · {essay.wordCount} palavra{essay.wordCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              graded ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
            )}
          >
            {graded ? `Nota ${essay.totalScore}` : 'Pendente'}
          </span>
          <ChevronDown className={cn('text-subtle size-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="border-border bg-surface-2/60 text-muted max-h-72 overflow-y-auto rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {essay.content || '(sem texto)'}
          </div>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="essayId" value={essay.essayId} />
            <input type="hidden" name="resourceId" value={resourceId} />

            {essay.evaluationCriteria.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {essay.evaluationCriteria.map((c) => (
                  <Field key={c.id} label={c.name} hint={`0 a ${c.maxScore}`}>
                    <Input
                      type="number"
                      name={`score.${c.id}`}
                      min={0}
                      max={c.maxScore}
                      step={0.5}
                      defaultValue={essay.scores?.[c.id] ?? ''}
                    />
                  </Field>
                ))}
              </div>
            )}

            <Field label="Nota final">
              <Input type="number" name="totalScore" min={0} step={0.5} defaultValue={essay.totalScore ?? ''} required />
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton>{graded ? 'Atualizar nota' : 'Salvar nota'}</SubmitButton>
              <FormFeedback state={state} />
            </div>
          </form>
        </div>
      )}
    </li>
  );
}
