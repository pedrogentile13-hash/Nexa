'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, NotebookPen, PenLine, RotateCcw, X } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import { humanDuration } from '../lib/format';
import type { EssayResult, ResourceDetail, StudyWritingTask } from '../server/queries';

/**
 * Resultado e gabarito.
 *
 * O número de acertos é a parte menos útil desta tela. O que muda o próximo
 * estudo é o desempenho POR ASSUNTO — "queda livre 2/6" diz o que revisar;
 * "13 de 20" não diz nada além de como a pessoa se sente.
 *
 * Por isso a ordem: assunto mais fraco primeiro (o banco já devolve assim),
 * depois o gabarito questão a questão.
 */

interface ReviewRow {
  question_id: string;
  question_position: number;
  statement: string;
  explanation: string | null;
  topic_name: string | null;
  chosen_option_id: string | null;
  correct_option_id: string | null;
  is_correct: boolean;
  // ---- simulados v2 (metadados pedagógicos, para análise posterior) ----
  subject_name?: string;
  subtopic?: string | null;
  skills?: string[];
  time_spent_seconds?: number;
}

interface TopicRow {
  topic_id: string | null;
  topic_name: string;
  correct_count: number;
  total_count: number;
}

export function AttemptResult({
  resource,
  result,
  writingTasks = [],
  essays = [],
}: {
  resource: ResourceDetail;
  result: {
    attempt: { correct_count: number; total_count: number; duration_seconds: number } | null;
    review: ReviewRow[];
    topics: TopicRow[];
  };
  writingTasks?: StudyWritingTask[];
  essays?: EssayResult[];
}) {
  const [filter, setFilter] = useState<'todas' | 'acertos' | 'erros'>('todas');

  const attempt = result.attempt;
  if (!attempt) return null;

  const percent = attempt.total_count > 0 ? (attempt.correct_count / attempt.total_count) * 100 : 0;
  const wrong = result.review.filter((row) => !row.is_correct);
  const filteredReview = result.review.filter((row) =>
    filter === 'todas' ? true : filter === 'acertos' ? row.is_correct : !row.is_correct,
  );

  return (
    <div style={subjectColorVars(resource.subjectColor)} className="pb-8">
      <StudyTopBar title={resource.title} subtitle={resource.subjectName} />

      <div className="mx-auto max-w-2xl space-y-6 px-5">
        <section className="border-border bg-surface rounded-2xl border p-5 text-center">
          <p className="text-4xl leading-none font-semibold tabular-nums">
            {attempt.correct_count}
            <span className="text-muted text-xl">/{attempt.total_count}</span>
          </p>
          <p className="text-muted mt-1.5 text-sm">
            {Math.round(percent)}% de acerto
            {attempt.duration_seconds > 0 && ` · ${humanDuration(attempt.duration_seconds)}`}
          </p>
        </section>

        {result.topics.length > 0 && (
          <section>
            <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Desempenho por assunto
            </h2>
            <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
              {result.topics.map((topic) => {
                const ratio =
                  Number(topic.total_count) > 0
                    ? Number(topic.correct_count) / Number(topic.total_count)
                    : 0;
                return (
                  <li key={topic.topic_id ?? topic.topic_name} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {topic.topic_name}
                      </span>
                      <span className="text-muted shrink-0 text-sm tabular-nums">
                        {topic.correct_count}/{topic.total_count}
                      </span>
                    </div>
                    <div className="bg-surface-2 mt-2 h-1.5 rounded-full">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          ratio >= 0.7 ? 'bg-success' : 'bg-danger',
                        )}
                        style={{ width: `${Math.max(4, ratio * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* O caminho de volta ao material. É o que fecha o ciclo: errar, saber
            onde errou, e ter para onde ir a partir disso. */}
        {wrong.length > 0 && (
          <section>
            <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Próximos passos
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={{ pathname: '/estudar', query: { materia: resource.id } }}
                className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
              >
                <span
                  aria-hidden
                  className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-lg"
                >
                  <NotebookPen className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    Material de {resource.subjectName}
                  </span>
                  <span className="text-muted text-xs">
                    {wrong.length === 1
                      ? 'liga à questão que você errou'
                      : `liga às ${wrong.length} questões que você errou`}
                  </span>
                </span>
                <ChevronRight className="text-muted size-4 shrink-0" aria-hidden />
              </Link>
              {/* Revisões junta os erros de TODOS os simulados e quizzes, não
                  só deste — vale como próximo passo mesmo quando o material
                  acima já foi revisado. */}
              <Link
                href="/revisoes"
                className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
              >
                <span
                  aria-hidden
                  className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-lg"
                >
                  <RotateCcw className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Revisar todos os meus erros</span>
                  <span className="text-muted text-xs">questões de todos os simulados e quizzes</span>
                </span>
                <ChevronRight className="text-muted size-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </section>
        )}

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
              Detalhamento das questões
            </h2>
            <div className="flex gap-1.5">
              <Chip active={filter === 'todas'} onClick={() => setFilter('todas')}>
                Todas ({result.review.length})
              </Chip>
              <Chip active={filter === 'acertos'} onClick={() => setFilter('acertos')}>
                Acertos ({result.review.length - wrong.length})
              </Chip>
              <Chip active={filter === 'erros'} onClick={() => setFilter('erros')}>
                Erros ({wrong.length})
              </Chip>
            </div>
          </div>
          <ol className="space-y-2">
            {filteredReview.map((row) => (
              <li key={row.question_id} className="border-border bg-surface rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full',
                      row.is_correct ? 'bg-success text-white' : 'bg-danger text-white',
                    )}
                  >
                    {row.is_correct ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      <X className="size-3.5" strokeWidth={3} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-medium">
                      <span className="text-subtle mr-1.5 tabular-nums">
                        {row.question_position}.
                      </span>
                      {row.statement}
                    </p>
                    {(row.topic_name || row.subject_name || (row.skills && row.skills.length > 0)) && (
                      <p className="text-subtle mt-1 flex flex-wrap items-center gap-x-1.5 text-xs">
                        {row.subject_name && row.subject_name !== resource.subjectName && (
                          <span className="bg-surface-2 rounded-full px-1.5 py-0.5">{row.subject_name}</span>
                        )}
                        {row.topic_name}
                        {row.subtopic && ` · ${row.subtopic}`}
                        {typeof row.time_spent_seconds === 'number' && row.time_spent_seconds > 0 && (
                          <span> · {humanDuration(row.time_spent_seconds)}</span>
                        )}
                      </p>
                    )}
                    {row.explanation && (
                      <p className="text-muted mt-2 border-l-2 border-current/20 pl-3 text-sm leading-relaxed">
                        {row.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {writingTasks.length > 0 && (
          <section>
            <h2 className="text-muted mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <PenLine className="size-3.5" aria-hidden />
              Redação
            </h2>
            <div className="space-y-3">
              {writingTasks.map((task) => {
                const essay = essays.find((e) => e.writingTaskId === task.id);
                const graded = essay?.totalScore !== null && essay?.totalScore !== undefined;
                return (
                  <div key={task.id} className="border-border bg-surface rounded-lg border p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{task.title}</p>
                      {essay && (
                        <span className="text-subtle text-xs">
                          {essay.wordCount} palavra{essay.wordCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    {!essay || !essay.isSubmitted ? (
                      <p className="text-muted mt-2 text-sm">Não entregue.</p>
                    ) : graded ? (
                      <>
                        <p className="text-success mt-2 text-2xl font-semibold tabular-nums">
                          {essay.totalScore}
                        </p>
                        {task.evaluationCriteria.length > 0 && essay.scores && (
                          <ul className="mt-2 space-y-1">
                            {task.evaluationCriteria.map((c) => (
                              <li key={c.id} className="text-muted flex items-center justify-between text-xs">
                                <span>{c.name}</span>
                                <span className="tabular-nums">
                                  {essay.scores?.[c.id] ?? 0}/{c.maxScore}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <p className="text-warning mt-2 text-sm">Aguardando correção do professor.</p>
                    )}

                    {essay?.content && (
                      <p className="text-muted mt-3 line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {essay.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
