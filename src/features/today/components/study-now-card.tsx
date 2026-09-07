'use client';

import { useEffect, useState, useTransition } from 'react';
import { Loader2, Play, Square, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { startStudySession, stopStudySession } from '../server/actions';
import { formatClock, useElapsedSeconds } from '../lib/use-elapsed-seconds';

const DURATIONS = [15, 30, 60, 120];
const GOAL_KEY = 'nexa:study-goal-minutes';

/**
 * "Estudar agora" — o CTA da etapa 8.
 *
 * Escolher uma duração só define uma META visível (guardada no aparelho, não
 * no banco): o cronômetro em si é o mesmo `study_sessions` de sempre, sem
 * corte automático. Um corte automático exigiria a aba aberta o tempo todo ou
 * um job no servidor — nenhum dos dois existe hoje, e fingir que o tempo foi
 * imposto quando na verdade é só decorativo seria pior que não ter meta
 * nenhuma.
 */
export function StudyNowCard({
  runningSessionId,
  startedAt,
}: {
  runningSessionId: string | null;
  startedAt: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const [goalMinutes, setGoalMinutes] = useState<number | null>(null);
  const elapsed = useElapsedSeconds(runningSessionId ? startedAt : null);
  const running = Boolean(runningSessionId);

  useEffect(() => {
    if (!running) return;
    try {
      const saved = localStorage.getItem(GOAL_KEY);
      if (saved) setGoalMinutes(Number(saved));
    } catch {
      // Sem localStorage (modo privado, etc.): a meta simplesmente não aparece.
    }
  }, [running]);

  function pick(minutes: number) {
    try {
      localStorage.setItem(GOAL_KEY, String(minutes));
    } catch {
      // Idem — a sessão começa normalmente, só sem meta visível.
    }
    setGoalMinutes(minutes);
    setShowPicker(false);
    startTransition(async () => {
      await startStudySession(null);
    });
  }

  function stop() {
    try {
      localStorage.removeItem(GOAL_KEY);
    } catch {
      /* nada a limpar */
    }
    setGoalMinutes(null);
    if (runningSessionId) {
      startTransition(async () => {
        await stopStudySession(runningSessionId);
      });
    }
  }

  if (running) {
    const goalSeconds = (goalMinutes ?? 0) * 60;
    const percent = goalSeconds > 0 ? Math.min(100, (elapsed / goalSeconds) * 100) : null;

    return (
      <div className="border-brand/30 bg-brand-soft space-y-3 rounded-[20px] border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
              Estudando agora
            </p>
            <p className="tabular text-2xl leading-tight font-semibold">{formatClock(elapsed)}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={stop}>
            {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Square aria-hidden />}
            Parar
          </Button>
        </div>
        {percent !== null && (
          <Progress value={percent} size="sm" label={`Meta de ${goalMinutes} minutos`} />
        )}
      </div>
    );
  }

  return (
    <div className="border-brand/30 bg-brand-soft space-y-3 rounded-[20px] border p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden className="bg-brand grid size-10 shrink-0 place-items-center rounded-full">
          <Zap className="size-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Estudar agora</p>
          <p className="text-muted text-xs leading-relaxed">Escolha um tempo e comece na hora.</p>
        </div>
        {!showPicker && (
          <Button type="button" variant="pop" size="sm" onClick={() => setShowPicker(true)}>
            <Play aria-hidden />
            Começar
          </Button>
        )}
      </div>

      {showPicker && (
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((minutes) => (
            <Button
              key={minutes}
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => pick(minutes)}
            >
              {minutes} min
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
