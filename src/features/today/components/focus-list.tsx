'use client';

import { useOptimistic, useTransition } from 'react';
import { AlertTriangle, Check, FileText, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { toggleTask } from '../server/actions';
import type { RankedFocus } from '../lib/ranking';

/**
 * O foco do dia.
 *
 * Cada item mostra o MOTIVO de estar aqui. Um ranking que o aluno não entende é
 * um ranking em que ele não confia — e nesse caso ele volta a decidir sozinho,
 * que é exatamente o problema que o Nexa existe para resolver.
 */
export function FocusList({ items }: { items: RankedFocus[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(items, (state, doneId: string) =>
    state.filter((item) => item.id !== doneId),
  );

  if (optimistic.length === 0) {
    return (
      <div className="border-border bg-surface rounded-lg border px-4 py-8 text-center">
        <div className="bg-success-soft text-success mx-auto mb-3 grid size-12 place-items-center rounded-full">
          <Check className="size-6" aria-hidden />
        </div>
        <p className="text-sm font-medium">Nada urgente por agora.</p>
        <p className="text-muted mt-1 text-sm">Bom momento para adiantar alguma coisa.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {optimistic.map((item, index) => (
        <li
          key={item.id}
          style={subjectColorVars(item.subjectColor)}
          className={cn(
            'border-border bg-surface relative overflow-hidden rounded-lg border p-3.5',
            item.isOverdue && 'border-danger/40',
          )}
        >
          {/* Faixa da cor da disciplina — identifica sem ocupar espaço. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: 'var(--subject-base)' }}
          />

          <div className="flex items-start gap-3 pl-2">
            <span
              aria-hidden
              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md"
              style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
            >
              {item.kind === 'assessment' ? (
                <FileText className="size-4" />
              ) : (
                <ListTodo className="size-4" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-subtle tabular text-xs font-semibold">{index + 1}</span>
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</h3>
              </div>

              {item.subjectName && (
                <p className="mt-0.5 text-xs" style={{ color: 'var(--subject-base)' }}>
                  {item.subjectName}
                </p>
              )}

              <p
                className={cn(
                  'mt-1.5 flex items-center gap-1 text-xs leading-relaxed',
                  item.isOverdue ? 'text-danger' : 'text-muted',
                )}
              >
                {item.isOverdue && <AlertTriangle className="size-3.5 shrink-0" aria-hidden />}
                {item.reason}
              </p>
            </div>

            {item.kind === 'task' && (
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    setOptimistic(item.id);
                    await toggleTask(item.id, true);
                  })
                }
                aria-label={`Concluir ${item.title}`}
                className={cn(
                  'border-border-strong hover:border-success hover:bg-success grid size-9 shrink-0',
                  'text-subtle place-items-center rounded-full border-2 transition-colors hover:text-white',
                )}
              >
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
