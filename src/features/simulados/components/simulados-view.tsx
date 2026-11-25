'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClipboardList, Clock, RotateCcw, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { PopEmptyState } from '@/components/ui/empty-state';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { humanDuration } from '@/features/study/lib/format';
import type { SimuladoCatalogItem } from '../server/queries';
import type { SimuladoAttempt } from '@/features/performance/server/queries';

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

type StatusFilter = 'todos' | 'feitos' | 'pendentes';

interface AttemptSummary {
  count: number;
  bestPercent: number;
  lastAttemptId: string;
}

/**
 * Junta num só lugar o que antes ficava espalhado: os simulados disponíveis
 * (antes só dentro de Biblioteca, misturados com todo o resto do acervo) e o
 * histórico de tentativas (antes um cartão dentro de Desempenho).
 */
export function SimuladosView({
  catalog,
  history,
}: {
  catalog: SimuladoCatalogItem[];
  history: SimuladoAttempt[];
}) {
  const [status, setStatus] = useState<StatusFilter>('todos');

  const attemptsByResource = useMemo(() => {
    const map = new Map<string, AttemptSummary>();
    for (const attempt of history) {
      const existing = map.get(attempt.resourceId);
      if (!existing) {
        map.set(attempt.resourceId, {
          count: 1,
          bestPercent: attempt.percent,
          lastAttemptId: attempt.attemptId,
        });
      } else {
        existing.count += 1;
        existing.bestPercent = Math.max(existing.bestPercent, attempt.percent);
      }
    }
    return map;
  }, [history]);

  const filtered = catalog.filter((item) => {
    if (status === 'todos') return true;
    const done = attemptsByResource.has(item.id);
    return status === 'feitos' ? done : !done;
  });

  const averagePercent =
    history.length === 0
      ? null
      : Math.round(history.reduce((sum, a) => sum + a.percent, 0) / history.length);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat icon={ClipboardList} value={String(catalog.length)} label="Simulados disponíveis" />
        <MiniStat icon={Trophy} value={String(attemptsByResource.size)} label="Já feitos" />
        <MiniStat
          icon={Trophy}
          value={averagePercent === null ? '—' : `${averagePercent}%`}
          label="Média de acertos"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2 overflow-x-auto">
          <Chip active={status === 'todos'} onClick={() => setStatus('todos')}>
            Todos
          </Chip>
          <Chip active={status === 'feitos'} onClick={() => setStatus('feitos')}>
            Feitos
          </Chip>
          <Chip active={status === 'pendentes'} onClick={() => setStatus('pendentes')}>
            Pendentes
          </Chip>
        </div>

        {filtered.length === 0 ? (
          <PopEmptyState
            size="sm"
            icon={<ClipboardList className="size-5 text-white" />}
            title={
              status === 'feitos'
                ? 'Nenhum simulado feito ainda'
                : status === 'pendentes'
                  ? 'Nenhum simulado pendente'
                  : 'Nenhum simulado disponível'
            }
            description={
              status === 'feitos'
                ? 'Comece um simulado da lista para ele aparecer aqui.'
                : 'Volte mais tarde — a biblioteca de simulados cresce com o tempo.'
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const attempt = attemptsByResource.get(item.id);
              return (
                <li key={item.id}>
                  <Link
                    href={`/estudar/${item.id}`}
                    className="border-border bg-surface hover:bg-surface-2 flex h-full flex-col gap-3 rounded-2xl border p-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="grid size-10 shrink-0 place-items-center rounded-xl"
                        style={{
                          ...subjectColorVars(item.subjectColor),
                          background: 'var(--subject-soft)',
                          color: 'var(--subject-on-soft)',
                        }}
                      >
                        <ClipboardList className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="text-muted truncate text-xs">
                          {item.subjectName}
                          {item.topicName ? ` · ${item.topicName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>
                        {item.questionCount} {item.questionCount === 1 ? 'questão' : 'questões'}
                      </span>
                      {item.durationSeconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {humanDuration(item.durationSeconds)}
                        </span>
                      )}
                      <span>{DIFFICULTY_LABEL[item.difficulty] ?? item.difficulty}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2">
                      {attempt ? (
                        <Badge variant="success">Melhor: {Math.round(attempt.bestPercent)}%</Badge>
                      ) : (
                        <Badge variant="neutral">Ainda não feito</Badge>
                      )}
                      <span className="text-brand-text flex items-center gap-1 text-xs font-semibold">
                        {attempt ? (
                          <>
                            <RotateCcw className="size-3.5" aria-hidden />
                            Refazer
                          </>
                        ) : (
                          'Começar'
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Histórico de tentativas</h2>
        {history.length === 0 ? (
          <PopEmptyState
            size="sm"
            icon={<Trophy className="size-5 text-white" />}
            title="Seu histórico aparece aqui"
            description="Cada simulado que você terminar entra nesta lista, com nota e tempo."
          />
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {history.map((attempt) => (
              <li key={attempt.attemptId}>
                <Link
                  href={`/estudar/${attempt.resourceId}/resultado?tentativa=${attempt.attemptId}`}
                  className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{attempt.resourceTitle}</p>
                    <p className="text-subtle text-xs">
                      {attempt.subjectName ?? 'Sem matéria'} ·{' '}
                      {new Date(attempt.finishedAt).toLocaleDateString('pt-BR')} ·{' '}
                      {attempt.correctCount}/{attempt.totalCount} acertos
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-sm font-semibold">
                    {Math.round(attempt.percent)}%
                  </span>
                  <RotateCcw className="text-subtle size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof ClipboardList;
  value: string;
  label: string;
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-3">
      <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="tabular text-lg leading-none font-semibold">{value}</p>
        <p className="text-muted mt-1 text-xs leading-tight">{label}</p>
      </div>
    </div>
  );
}
