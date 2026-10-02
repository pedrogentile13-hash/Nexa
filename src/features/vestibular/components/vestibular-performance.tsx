import { Progress } from '@/components/ui/progress';
import { PopEmptyState } from '@/components/ui/empty-state';
import { TrendingUp } from 'lucide-react';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { cn } from '@/lib/utils';
import type { MasteryStatus } from '@/types/database.types';
import type { SubjectPerformance, TopicPerformance } from '../server/performance-queries';

/**
 * Desempenho da preparação, do mais fraco pro mais forte — que é a ordem em
 * que a informação é útil. Um painel que abre pelo que o aluno já domina é
 * bonito e inútil.
 *
 * Server component: é leitura pura, e o dado já vem ordenado do banco.
 */

const STATUS_LABEL: Record<MasteryStatus, string> = {
  dominado: 'Dominado',
  desenvolvimento: 'Em desenvolvimento',
  revisar: 'Precisa revisar',
};

const STATUS_TONE: Record<MasteryStatus, 'success' | 'warning' | 'danger'> = {
  dominado: 'success',
  desenvolvimento: 'warning',
  revisar: 'danger',
};

export function VestibularPerformance({
  subjects,
  topics,
}: {
  subjects: SubjectPerformance[];
  topics: TopicPerformance[];
}) {
  if (subjects.length === 0) {
    return (
      <PopEmptyState
        icon={<TrendingUp className="size-6 text-white" aria-hidden />}
        title="Sem dados de desempenho ainda"
        description="Responda questões de vestibular — em prova ou em treino avulso — e o seu mapa de domínio aparece aqui."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h2 className="text-subtle text-xs font-semibold tracking-wide uppercase">Por matéria</h2>
        <ul className="space-y-2">
          {subjects.map((s) => (
            <li
              key={s.subjectId}
              style={subjectColorVars(s.subjectColor)}
              className="border-border bg-surface rounded-[20px] border p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold">{s.subjectName}</span>
                <span className="text-subtle shrink-0 text-xs">
                  {s.correctCount}/{s.totalCount}
                </span>
              </div>
              <Progress
                label={`Acerto em ${s.subjectName}`}
                value={s.accuracyPercent}
                tone={STATUS_TONE[s.status]}
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={cn('font-medium', toneText(s.status))}>
                  {STATUS_LABEL[s.status]}
                </span>
                <span className="text-subtle">{s.accuracyPercent}% de acerto</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {topics.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-subtle text-xs font-semibold tracking-wide uppercase">
            Assuntos mais frágeis
          </h2>
          <ul className="border-border bg-surface divide-border divide-y rounded-[20px] border">
            {topics.slice(0, 12).map((t) => (
              <li
                key={`${t.subjectId}-${t.topicId ?? t.topicName}`}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.topicName}</p>
                  <p className="text-subtle text-xs">{t.subjectName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn('text-sm font-semibold', toneText(t.status))}>
                    {t.accuracyPercent}%
                  </p>
                  <p className="text-subtle text-xs">
                    {t.correctCount}/{t.totalCount}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function toneText(status: MasteryStatus) {
  return status === 'dominado'
    ? 'text-success'
    : status === 'desenvolvimento'
      ? 'text-warning'
      : 'text-danger';
}
