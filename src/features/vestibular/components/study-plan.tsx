'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CalendarClock, Flame, Loader2, Play, Route as RouteIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PopEmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { cn } from '@/lib/utils';
import type { StudyPlanReason } from '@/types/database.types';
import { createPracticeSession } from '../server/practice-actions';
import type { StudyPlan, StudyPlanItem } from '../server/plan-queries';

/**
 * O plano de estudo: assuntos ordenados por "quanto cai × quanto você erra".
 *
 * Cada linha traz o MOTIVO em texto, não só um número. Um score de 42,7 não
 * convence ninguém a estudar Termodinâmica hoje; "cai muito e você erra"
 * convence — e é auditável pelo aluno, que pode discordar e pular.
 *
 * E cada linha tem botão. Um plano que só informa é uma lista de culpa; o
 * que faz ele valer é o caminho de um clique entre "este é seu ponto fraco"
 * e "então vamos treinar isto agora".
 */

const REASON_LABEL: Record<StudyPlanReason, string> = {
  cai_muito_e_voce_erra: 'Cai muito e você erra',
  cai_muito: 'Cai muito na sua prova',
  voce_erra: 'Você tem errado aqui',
  reforco: 'Reforço',
};

const REASON_VARIANT: Record<StudyPlanReason, 'danger' | 'warning' | 'neutral'> = {
  cai_muito_e_voce_erra: 'danger',
  cai_muito: 'warning',
  voce_erra: 'warning',
  reforco: 'neutral',
};

export function StudyPlanView({ plan }: { plan: StudyPlan }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyTopic, setBusyTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function train(item: StudyPlanItem) {
    setError(null);
    setBusyTopic(item.topicId);
    startTransition(async () => {
      const result = await createPracticeSession({ topicId: item.topicId, questionCount: 10 });
      setBusyTopic(null);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      router.push(`/vestibular/questoes/sessao/${result.sessionId}`);
    });
  }

  if (plan.items.length === 0) {
    return (
      <PopEmptyState
        icon={<RouteIcon className="size-6 text-white" aria-hidden />}
        title="Ainda não dá pra montar seu plano"
        description="O plano cruza o que a sua prova cobra com o que você domina. Escolha o seu vestibular no painel e responda algumas questões — aí ele aparece."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PhaseBanner phase={plan.phase} daysUntil={plan.daysUntil} />

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <ol className="space-y-3">
        {plan.items.map((item, i) => (
          <li
            key={item.topicId}
            style={subjectColorVars(item.subjectColor)}
            className="border-border bg-surface rounded-[20px] border p-4"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--subject-soft)] text-sm font-bold text-[var(--subject-on-soft)]"
              >
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.topicName}</p>
                <p className="text-subtle text-xs">{item.subjectName}</p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={REASON_VARIANT[item.reason]}>{REASON_LABEL[item.reason]}</Badge>
                  <Badge variant="outline">{item.frequencyPercent}% da prova</Badge>
                  {item.masteryPercent === null ? (
                    <Badge variant="neutral">Você ainda não respondeu</Badge>
                  ) : (
                    <Badge variant="neutral">
                      {item.masteryPercent}% de acerto em {item.answeredCount}
                    </Badge>
                  )}
                </div>

                {item.masteryPercent !== null && (
                  <div className="mt-2">
                    <Progress
                      label={`Seu domínio em ${item.topicName}`}
                      value={item.masteryPercent}
                      size="sm"
                      tone={
                        item.masteryPercent >= 80
                          ? 'success'
                          : item.masteryPercent >= 60
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => train(item)}
              disabled={pending}
            >
              {busyTopic === item.topicId ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              Treinar este assunto
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PhaseBanner({
  phase,
  daysUntil,
}: {
  phase: StudyPlan['phase'];
  daysUntil: number | null;
}) {
  const finalStretch = phase === 'reta_final';

  return (
    <div
      className={cn(
        'rounded-[20px] border p-4',
        finalStretch ? 'border-danger/30 bg-danger-soft' : 'border-border bg-surface',
      )}
    >
      <div className="flex items-center gap-2">
        {finalStretch ? (
          <Flame className="text-danger size-4" aria-hidden />
        ) : (
          <CalendarClock className="text-muted size-4" aria-hidden />
        )}
        <p className={cn('text-sm font-semibold', finalStretch && 'text-danger')}>
          {finalStretch ? 'Reta final' : 'Construção de base'}
        </p>
      </div>
      <p className="text-muted mt-1 text-sm leading-snug">
        {finalStretch
          ? `Faltam ${daysUntil} dias. O plano está mostrando só o que cai com peso de verdade — o que aparece uma vez a cada cinco anos ficou de fora.`
          : daysUntil !== null
            ? `Faltam ${daysUntil} dias. Ainda dá tempo de cobrir tudo, então o plano mostra a lista inteira, do mais urgente ao menos.`
            : 'Sem data de prova cadastrada ainda. O plano ordena pelo que a sua prova mais cobra cruzado com o seu domínio.'}
      </p>
    </div>
  );
}
