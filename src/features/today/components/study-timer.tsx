'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const elapsed = useElapsedSeconds(runningSessionId ? startedAt : null);

  const running = Boolean(runningSessionId);

  function toggle() {
    startTransition(async () => {
      if (running && runningSessionId) {
        await stopStudySession(runningSessionId);
        return;
      }
      const result = await startStudySession(null);
      // `runningSessionId` pode estar desatualizado (ex.: começou em outra
      // aba/tela depois do último carregamento) — sem isto, um segundo clique
      // aqui falhava calado no índice único do banco e o botão ficava preso
      // mostrando "Estudar" pra uma sessão que já existe.
      if (!result.ok) router.refresh();
    });
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant={running ? 'secondary' : 'soft'}
        size="md"
        className="w-full"
        disabled={isPending}
        aria-label={running ? `Parar. Estudando há ${formatSpoken(elapsed)}` : 'Começar a estudar'}
        onClick={toggle}
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
        onClick={toggle}
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
