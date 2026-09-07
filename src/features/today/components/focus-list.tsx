'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  ListTodo,
  Play,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { toggleTask } from '../server/actions';
import type { RankedFocus } from '../lib/ranking';

/**
 * O foco do dia.
 *
 * Cada item mostra o MOTIVO de estar aqui. Um ranking que o aluno não entende é
 * um ranking em que ele não confia — e nesse caso ele volta a decidir sozinho,
 * que é exatamente o problema que o Nexa existe para resolver.
 *
 * A numeração é explícita, como no kit: sem ela a lista lê como três coisas
 * quaisquer, e a ordem — que é todo o trabalho do ranking — fica invisível.
 *
 * O primeiro item ganha fundo âmbar quando está atrasado ou vence hoje. É o
 * único destaque de cor da tela, e por isso ele significa alguma coisa; se
 * todos os três fossem coloridos, nenhum seria.
 */
export function FocusList({ items }: { items: RankedFocus[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(items, (state, doneId: string) =>
    state.filter((item) => item.id !== doneId),
  );

  // Um cartãozinho com "nada urgente" e nada mais, numa tela larga e vazia,
  // lê como quebrado — o conteúdo gruda no topo e sobra uma página inteira de
  // cinza embaixo. Em vez de esticar o cartão à força, dá pra ele conteúdo de
  // verdade: um selo simpático e dois atalhos para o aluno decidir o que fazer
  // com o tempo livre, do jeito que a coluna da direita também faz.
  if (optimistic.length === 0) {
    return (
      <PopEmptyState
        tone="success"
        icon={<Check className="text-white" strokeWidth={3} />}
        badge={<Sparkles className="text-warning fill-warning size-4" />}
        title="Nada urgente por agora."
        description="Bom momento para adiantar alguma coisa."
        action={
          <>
            <Link href="/estudar" className={popEmptyStateActionClass}>
              <GraduationCap className="text-brand size-4" aria-hidden />
              Ir estudar
            </Link>
            <Link href="/agenda" className={popEmptyStateActionClass}>
              <CalendarDays className="text-brand size-4" aria-hidden />
              Ver agenda
            </Link>
          </>
        }
      />
    );
  }

  return (
    <ul className="space-y-2">
      {optimistic.map((item, index) => {
        // O destaque vai para o primeiro item quando ele é de fato aflitivo:
        // atrasado, para hoje ou amanhã, ou de uma disciplina abaixo da média.
        // "Primeiro da lista" sozinho não justifica cor — sempre existe um
        // primeiro, e um destaque que nunca sai de cena deixa de significar.
        const atRisk =
          item.subjectAverage !== null &&
          item.subjectAverage !== undefined &&
          item.subjectAverage < (item.passingGrade ?? 6);
        const urgent =
          index === 0 &&
          (item.isOverdue || (item.daysUntilDue !== null && item.daysUntilDue <= 1) || atRisk);

        return (
          <li
            key={item.id}
            style={subjectColorVars(item.subjectColor)}
            className={cn(
              'relative overflow-hidden rounded-[20px] border',
              // No celular o destaque é o fundo âmbar; no desktop ele vira o
              // botão "Começar", como o guia mostra. Um cartão inteiro tingido
              // ocupa área demais numa tela larga e passa de ênfase a alarme.
              urgent
                ? 'border-warning/30 bg-warning-soft lg:border-border lg:bg-surface'
                : 'border-border bg-surface',
            )}
          >
            {/* Faixa da cor da disciplina — identifica sem ocupar espaço. */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ backgroundColor: 'var(--subject-base)' }}
            />

            <div className="flex items-start gap-3 py-3.5 pr-3 pl-5">
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums',
                  urgent ? 'bg-warning/15 text-warning' : 'bg-surface-2 text-muted',
                )}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm leading-snug font-semibold">
                  {item.title}
                  {item.subjectName && (
                    <span className="text-muted font-normal"> · {item.subjectName}</span>
                  )}
                </h3>

                <p
                  className={cn(
                    'mt-1 flex items-start gap-1 text-xs leading-relaxed',
                    item.isOverdue ? 'text-danger' : urgent ? 'text-warning' : 'text-muted',
                  )}
                >
                  {item.isOverdue && (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  )}
                  {item.reason}
                </p>
              </div>

              {item.kind === 'task' ? (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      setOptimistic(item.id);
                      await toggleTask(item.id, true);
                    })
                  }
                  aria-label={`Concluir ${item.title}`}
                  className="group grid size-11 shrink-0 place-items-center rounded-full"
                >
                  {/* 36px de círculo dentro de 44px de área tocável — é o que a
                      prancha de componentes do kit especifica, e o que evita
                      que um alvo pequeno no polegar erre. */}
                  <span
                    aria-hidden
                    className={cn(
                      'border-border-strong group-hover:border-success group-hover:bg-success grid size-9',
                      'text-subtle place-items-center rounded-full border-2 transition-colors group-hover:text-white',
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                </button>
              ) : item.subjectId ? (
                <Link
                  href={`/disciplinas/${item.subjectId}`}
                  aria-label={`Abrir ${item.subjectName ?? 'a disciplina'}`}
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-full',
                    // Em tela larga o item urgente ganha um botão com texto: há
                    // espaço para dizer o que a seta só sugere.
                    urgent && 'lg:bg-brand lg:text-brand-fg lg:h-11 lg:w-auto lg:gap-2 lg:px-4',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-9 place-items-center rounded-full transition-colors',
                      urgent
                        ? 'bg-warning text-white hover:brightness-110 lg:size-auto lg:bg-transparent'
                        : 'bg-surface-2 text-muted hover:text-text',
                    )}
                  >
                    {urgent ? (
                      <>
                        <Play className="size-4 fill-current lg:hidden" />
                        <span className="hidden items-center gap-2 text-sm font-semibold lg:flex">
                          <Play className="size-4 fill-current" />
                          Começar
                        </span>
                      </>
                    ) : (
                      <ChevronRight className="size-4" strokeWidth={2.5} />
                    )}
                  </span>
                </Link>
              ) : (
                <span
                  aria-hidden
                  className="bg-surface-2 text-subtle grid size-9 shrink-0 place-items-center rounded-full"
                >
                  {item.kind === 'assessment' ? (
                    <FileText className="size-4" />
                  ) : (
                    <ListTodo className="size-4" />
                  )}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
