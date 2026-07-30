'use client';

import { useOptimistic, useTransition } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { toggleRoutine } from '../server/actions';
import type { TodayRoutine } from '../server/queries';

/**
 * Checklist diário.
 *
 * `useOptimistic` marca a linha no mesmo frame do toque; a Server Action
 * confirma depois. É a diferença entre "parece um app" e "parece um site" — e a
 * especificação pede feedback imediato explicitamente.
 *
 * Se a ação falhar, o React reverte o estado otimista sozinho e a linha volta,
 * que é o comportamento correto: nunca mostrar como feito o que não foi salvo.
 */
export function Checklist({ routines }: { routines: TodayRoutine[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    routines,
    (state, { id, done }: { id: string; done: boolean }) =>
      state.map((r) => (r.id === id ? { ...r, doneCount: done ? r.targetCount : 0 } : r)),
  );

  if (optimistic.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {optimistic.map((routine) => {
        const done = routine.doneCount >= routine.targetCount;
        return (
          <li key={routine.id}>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setOptimistic({ id: routine.id, done: !done });
                  await toggleRoutine(routine.id, !done);
                })
              }
              aria-pressed={done}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                done
                  ? 'bg-success-soft border-transparent'
                  : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  done ? 'border-success bg-success text-white' : 'border-border-strong',
                )}
              >
                {done && <Check className="size-3.5" strokeWidth={3} />}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-sm font-medium transition-colors',
                    done ? 'text-success line-through decoration-1' : 'text-text',
                  )}
                >
                  {routine.title}
                </span>
                {routine.subjectName && (
                  <span
                    style={subjectColorVars(routine.subjectColor)}
                    className="text-xs"
                    // A cor da disciplina identifica a linha sem precisar de rótulo.
                  >
                    <span style={{ color: 'var(--subject-base)' }}>{routine.subjectName}</span>
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
