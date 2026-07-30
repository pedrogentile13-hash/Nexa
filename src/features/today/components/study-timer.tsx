'use client';

import { useEffect, useState, useTransition } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startStudySession, stopStudySession } from '../server/actions';

/**
 * Cronômetro de estudo.
 *
 * O tempo exibido é derivado de `startedAt`, não acumulado num `setInterval`:
 * um contador incrementado a cada segundo atrasa quando a aba vai para segundo
 * plano — e no iOS ela vai o tempo todo. Derivando do relógio, voltar para o
 * app mostra o tempo certo mesmo depois de meia hora fora.
 *
 * A duração gravada é sempre recalculada no servidor. Aqui é só exibição.
 */
export function StudyTimer({
  runningSessionId,
  startedAt,
}: {
  runningSessionId: string | null;
  startedAt: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!runningSessionId || !startedAt) {
      setElapsed(0);
      return;
    }

    const start = Date.parse(startedAt);
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)));

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [runningSessionId, startedAt]);

  const running = Boolean(runningSessionId);

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

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function formatSpoken(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return 'menos de um minuto';
  if (minutes === 1) return 'um minuto';
  return `${minutes} minutos`;
}
