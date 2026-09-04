import Link from 'next/link';
import { Check, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import { humanDuration } from '../lib/format';
import type { ResourceDetail } from '../server/queries';

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
}: {
  resource: ResourceDetail;
  result: {
    attempt: { correct_count: number; total_count: number; duration_seconds: number } | null;
    review: ReviewRow[];
    topics: TopicRow[];
  };
}) {
  const attempt = result.attempt;
  if (!attempt) return null;

  const percent = attempt.total_count > 0 ? (attempt.correct_count / attempt.total_count) * 100 : 0;
  const wrong = result.review.filter((row) => !row.is_correct);

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
              O que revisar
            </h2>
            <Link
              href={{ pathname: '/estudar', query: { materia: resource.id } }}
              className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
            >
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
          </section>
        )}

        <section>
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Gabarito
          </h2>
          <ol className="space-y-2">
            {result.review.map((row) => (
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
                    {row.topic_name && <p className="text-subtle mt-1 text-xs">{row.topic_name}</p>}
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
      </div>
    </div>
  );
}
