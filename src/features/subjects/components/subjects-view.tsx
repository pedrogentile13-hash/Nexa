'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownAZ,
  BookOpen,
  LayoutGrid,
  List,
  Plus,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PopEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { subjectIcon } from '@/lib/design/subject-icon';

/**
 * A lista de matérias.
 *
 * A pergunta da tela é "como estou em cada matéria?", e a resposta é a NOTA —
 * por isso ela é o maior número do cartão, colorida, e tudo o mais gira em
 * torno dela. O kit é explícito: a nota é sempre maior que o XP.
 *
 * A ordenação padrão é por risco, não alfabética. Uma lista alfabética faz o
 * aluno procurar; esta responde "onde eu preciso olhar" antes de ele perguntar.
 */

export interface SubjectCard {
  id: string;
  name: string;
  color: string;
  icon: string;
  teacher: string | null;
  grade: string;
  gradeValue: number | null;
  target: string | null;
  tone: 'danger' | 'warning' | 'neutral' | 'success';
  hint: { label: string; tone: 'danger' | 'warning' | 'neutral' | 'success' } | null;
  nextAssessment: string | null;
  riskOrder: number;
  /** Deriva de ter (ou não) atividade real registrada — nunca um "concluída"
   * fabricado, já que a plataforma não tem um conceito de matéria terminada. */
  started: boolean;
}

const GRADE_TONE = {
  danger: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-text',
  success: 'text-success',
} as const;

const HINT_TONE = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-success-soft text-success',
} as const;

type SortMode = 'risco' | 'az';
type StatusFilter = 'todas' | 'andamento' | 'nao-iniciadas';
type Density = 'grid' | 'list';

export function SubjectsView({
  subjects,
  alert,
  title,
  addButton,
}: {
  subjects: SubjectCard[];
  alert: string | null;
  /** No desktop o título vive aqui dentro, para dividir a linha com os filtros. */
  title?: string;
  addButton?: React.ReactNode;
}) {
  const [sort, setSort] = useState<SortMode>('risco');
  const [status, setStatus] = useState<StatusFilter>('todas');
  const [density, setDensity] = useState<Density>('grid');

  const byStatus = subjects.filter((s) => {
    if (status === 'andamento') return s.started;
    if (status === 'nao-iniciadas') return !s.started;
    return true;
  });

  const ordered = [...byStatus].sort((a, b) =>
    sort === 'az'
      ? a.name.localeCompare(b.name, 'pt-BR')
      : a.riskOrder - b.riskOrder || a.name.localeCompare(b.name, 'pt-BR'),
  );

  return (
    <div className="space-y-4">
      {/* Em tela larga, título e filtros dividem a mesma linha — é o que o guia
          de desktop mostra e o que evita duas faixas quase vazias empilhadas. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {title && (
          <h1 className="hidden text-2xl font-semibold tracking-tight md:block">{title}</h1>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <Chip active={status === 'todas'} onClick={() => setStatus('todas')}>
              Todas
            </Chip>
            <Chip active={status === 'andamento'} onClick={() => setStatus('andamento')}>
              Em andamento
            </Chip>
            <Chip active={status === 'nao-iniciadas'} onClick={() => setStatus('nao-iniciadas')}>
              Não iniciadas
            </Chip>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <Chip active={sort === 'risco'} onClick={() => setSort('risco')}>
              <Zap className="size-4" aria-hidden />
              Risco
            </Chip>
            <Chip active={sort === 'az'} onClick={() => setSort('az')}>
              <ArrowDownAZ className="size-4" aria-hidden />
              A–Z
            </Chip>
          </div>

          <div className="border-border ml-auto hidden shrink-0 gap-0.5 rounded-full border p-0.5 md:flex">
            <button
              type="button"
              aria-label="Ver em grade"
              aria-pressed={density === 'grid'}
              onClick={() => setDensity('grid')}
              className={cn(
                'grid size-8 place-items-center rounded-full',
                density === 'grid' ? 'bg-brand text-brand-fg' : 'text-muted',
              )}
            >
              <LayoutGrid className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Ver em lista"
              aria-pressed={density === 'list'}
              onClick={() => setDensity('list')}
              className={cn(
                'grid size-8 place-items-center rounded-full',
                density === 'list' ? 'bg-brand text-brand-fg' : 'text-muted',
              )}
            >
              <List className="size-4" aria-hidden />
            </button>
          </div>

          {addButton}
        </div>
      </div>

      {/* O alerta vem antes da lista porque é a única linha da tela que pede
          uma ação. O resto é retrato, e retrato não é tarefa. */}
      {alert && (
        <div className="border-warning/30 bg-warning-soft text-warning flex items-start gap-2.5 rounded-[20px] border px-4 py-3 lg:max-w-2xl">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">{alert}</p>
        </div>
      )}

      {subjects.length === 0 ? (
        <PopEmptyState
          icon={<BookOpen className="text-white" />}
          title="Nenhuma matéria ainda."
          description="Escolha do catálogo — leva menos de um minuto e libera nota automática, meta e trilhas."
          action={
            <Button asChild variant="pop">
              <Link href="/perfil">
                <Plus aria-hidden />
                Adicionar matéria
              </Link>
            </Button>
          }
        />
      ) : ordered.length === 0 ? (
        <p className="text-muted px-1 text-sm">Nenhuma matéria neste filtro.</p>
      ) : (
        <ul
          className={cn(
            'grid gap-2 md:gap-3',
            density === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-1',
          )}
        >
          {ordered.map((subject) => {
            const Icon = subjectIcon(subject.icon);
            return (
              <li key={subject.id} className="min-w-0">
                <Link
                  href={`/disciplinas/${subject.id}`}
                  style={subjectColorVars(subject.color)}
                  className="border-border bg-surface hover:border-border-strong relative block overflow-hidden rounded-[20px] border transition-colors"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ backgroundColor: 'var(--subject-base)' }}
                  />

                  <div className="flex items-start gap-3 py-3.5 pr-4 pl-5">
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold">{subject.name}</h2>
                    {subject.teacher && (
                      <p className="text-muted truncate text-xs">{subject.teacher}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {subject.hint && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            HINT_TONE[subject.hint.tone],
                          )}
                        >
                          {subject.hint.label}
                        </span>
                      )}
                      {/* No celular a próxima avaliação é uma etiqueta; no
                          desktop ela desce para a linha do rodapé, junto da
                          meta, porque ali há largura para as duas em texto. */}
                      {subject.nextAssessment && (
                        <span className="bg-surface-2 text-muted rounded-full px-2 py-0.5 text-[11px] font-medium md:hidden">
                          {subject.nextAssessment}
                        </span>
                      )}
                    </div>

                    <p className="text-subtle mt-2 hidden text-xs md:block">
                      {[subject.target ? `meta ${subject.target}` : null, subject.nextAssessment]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        'tabular block text-3xl leading-none font-semibold',
                        GRADE_TONE[subject.tone],
                      )}
                    >
                      {subject.grade}
                    </span>
                    {subject.target && (
                      <span className="text-subtle mt-1 block text-[11px] md:hidden">
                        meta {subject.target}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * "Adicionar matéria".
 *
 * Só ícone no celular, onde a barra é apertada; com rótulo no desktop, onde
 * cabe — um "+" solitário numa tela de 1400px é adivinhação desnecessária.
 */
export function AddSubjectButton() {
  return (
    <Button asChild variant="soft" className="rounded-full px-3 md:px-4">
      <Link href="/perfil" aria-label="Adicionar matéria">
        <Plus className="size-5 md:size-4" aria-hidden />
        <span className="hidden md:inline">Adicionar</span>
      </Link>
    </Button>
  );
}
