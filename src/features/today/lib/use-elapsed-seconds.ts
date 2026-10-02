'use client';

import { useEffect, useState } from 'react';

/**
 * Segundos decorridos desde `startedAt`, derivado do relógio a cada tick —
 * não acumulado num contador. Um contador incrementado a cada segundo atrasa
 * quando a aba vai para segundo plano, e no iOS ela vai o tempo todo.
 * Derivando do relógio, voltar para o app mostra o tempo certo mesmo depois
 * de meia hora fora.
 */
export function useElapsedSeconds(startedAt: string | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    const start = Date.parse(startedAt);
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)));

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

export function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatSpoken(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return 'menos de um minuto';
  if (minutes === 1) return 'um minuto';
  return `${minutes} minutos`;
}
