'use client';

import { useTransition } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startStudySession, stopStudySession } from '../server/actions';
import { formatClock, formatSpoken, useElapsedSeconds } from '../lib/use-elapsed-seconds';

/**
 * Cronômetro de estudo.
 *
 * A duração gravada é sempre recalculada no servidor. Aqui é só exibição.
 */
export function StudyTimer({
  runningSessionId,
  startedAt,
  compact = false,
}: {
  runningSessionId: string | null;
  startedAt: string | null;
  /** No cartão "Estudo hoje" o número já está no anel; aqui sobra só a ação. */
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const elapsed = useElapsedSeconds(runningSessionId ? startedAt : null);

  const running = Boolean(runningSessionId);

  if (compact) {
    return (
      <Button
        type="button"
        variant={running ? 'secondary' : 'soft'}
        size="md"
        className="w-full"
        disabled={isPending}
        aria-label={running ? `Parar. Estudando há ${formatSpoken(elapsed)}` : 'Começar a estudar'}
        onClick={() =>
          startTransition(async () => {
            if (running && runningSessionId) await stopStudySession(runningSessionId);
            else await startStudySession(null);
          })
        }
      >
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : running ? (
          <Pause aria-hidden />
        ) : (
          <Play aria-hidden />
        )}
        {running ? formatClock(elapsed) : 'Retomar'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="tabular text-2xl font-semibold"
        aria-live={running ? 'off' : undefined}
        aria-label={running ? `Estudando há ${formatSpoken(elapsed)}` : undefined}
      >
        {formatClock(elapsed)}
      </span>

      <Button
        type="button"
        variant={running ? 'secondary' : 'primary'}
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            if (running && runningSessionId) await stopStudySession(runningSessionId);
            else await startStudySession(null);
          })
        }
      >
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : running ? (
          <Pause aria-hidden />
        ) : (
          <Play aria-hidden />
        )}
        {running ? 'Parar' : 'Estudar'}
      </Button>
    </div>
  );
}
