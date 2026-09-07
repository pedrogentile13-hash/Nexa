'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { Check, GraduationCap, RotateCcw } from 'lucide-react';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { dismissError } from '../server/actions';
import type { RecentError } from '../server/queries';

/**
 * Central de Erros.
 *
 * Reúne as seções 21 ("Meus erros") e 22 ("Revisões de hoje") do pedido numa
 * tela só — as duas descrevem a mesma coisa por ângulos diferentes (questões
 * erradas pra revisar), e duas telas quase iguais confundem mais do que
 * ajudam. "Refazer" manda pro material de origem; "Marcar como dominado"
 * dispensa sem refazer, para quando o aluno já sabe que só errou por
 * distração.
 */
export function ErrorsView({ errors }: { errors: RecentError[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, dismiss] = useOptimistic(errors, (state, questionId: string) =>
    state.filter((e) => e.questionId !== questionId),
  );

  if (optimistic.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-8">
        <PopEmptyState
          tone="success"
          icon={<Check className="text-white" strokeWidth={3} />}
          title="Nenhum erro por aqui"
          description="Quando você errar uma questão de quiz ou simulado, ela aparece aqui — com o gabarito e um caminho de volta pro material."
          action={
            <Link href="/estudar" className={popEmptyStateActionClass}>
              <GraduationCap className="text-brand size-4" aria-hidden />
              Ir estudar
            </Link>
          }
        />
      </div>
    );
  }

  const bySubject = groupBySubject(optimistic);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4 pb-8">
      {bySubject.map(([subjectName, items]) => (
        <section key={subjectName}>
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            {subjectName} · {items.length} {items.length === 1 ? 'questão' : 'questões'}
          </h2>
          <ul className="space-y-2">
            {items.map((error) => (
              <li
                key={error.questionId}
                style={subjectColorVars(error.subjectColor)}
                className="border-border bg-surface relative overflow-hidden rounded-[20px] border"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: 'var(--subject-base)' }}
                />
                <div className="space-y-3 py-3.5 pr-4 pl-5">
                  <div>
                    <p className="text-sm leading-snug font-semibold">{error.statement}</p>
                    {error.topicName && <p className="text-subtle mt-1 text-xs">{error.topicName}</p>}
                  </div>

                  <div className="space-y-1 text-sm">
                    {error.chosenBody && (
                      <p className="text-danger">
                        Você respondeu: <span className="font-medium">{error.chosenBody}</span>
                      </p>
                    )}
                    {error.correctBody && (
                      <p className="text-success">
                        Resposta certa: <span className="font-medium">{error.correctBody}</span>
                      </p>
                    )}
                  </div>

                  {error.explanation && (
                    <p className="text-muted border-current/20 border-l-2 pl-3 text-sm leading-relaxed">
                      {error.explanation}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href={`/estudar/${error.resourceId}`} className={popEmptyStateActionClass}>
                      <RotateCcw className="text-brand size-4" aria-hidden />
                      Refazer
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          dismiss(error.questionId);
                          await dismissError(error.questionId);
                        })
                      }
                      className={cn(popEmptyStateActionClass, 'text-muted hover:text-success')}
                    >
                      <Check className="size-4" aria-hidden />
                      Marcar como dominado
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupBySubject(errors: RecentError[]): [string, RecentError[]][] {
  const map = new Map<string, RecentError[]>();
  for (const error of errors) {
    const list = map.get(error.subjectName);
    if (list) list.push(error);
    else map.set(error.subjectName, [error]);
  }
  return [...map.entries()];
}
