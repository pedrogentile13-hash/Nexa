'use client';

import { useEffect, useRef } from 'react';

const FLUSH_EVERY_ACTIVE_SECONDS = 60; // cadência do flush, medida em segundos ATIVOS, não relógio
const MIN_SECONDS_TO_PERSIST = 10; // abaixo disso, descarta — não vale uma linha
const IDLE_TIMEOUT_MS = 60_000; // 60s sem interação = pausado, a não ser que `isActive` diga o contrário
const TICK_MS = 5000;

/**
 * Mede tempo de consumo de conteúdo em `/estudar/[id]` e manda pro servidor
 * em lotes já fechados — nunca abre uma `study_sessions`, por isso nunca
 * disputa o índice único `study_sessions_one_running_uq` com o cronômetro
 * manual da tela Hoje.
 *
 * `isActive`, quando informado, é a fonte de verdade (ex.: `MediaPlayer`
 * passa `playing` — áudio tocando conta como atividade mesmo sem o ponteiro
 * se mexer). Sem ele, o hook cai no próprio detector de interação (scroll/
 * mouse/teclado/toque) + Page Visibility.
 */
export function useContentTimeTracking(resourceId: string, isActive?: boolean): void {
  const activeSecondsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const lastInteractionRef = useRef(Date.now());
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    function markInteraction() {
      lastInteractionRef.current = Date.now();
    }
    const events = ['scroll', 'mousemove', 'keydown', 'touchstart', 'pointerdown'] as const;
    events.forEach((event) => window.addEventListener(event, markInteraction, { passive: true }));
    return () =>
      events.forEach((event) => window.removeEventListener(event, markInteraction));
  }, []);

  useEffect(() => {
    activeSecondsRef.current = 0;
    lastTickRef.current = null;

    function flush(useBeacon: boolean) {
      const seconds = Math.floor(activeSecondsRef.current);
      if (seconds < MIN_SECONDS_TO_PERSIST) {
        activeSecondsRef.current -= seconds;
        return;
      }
      activeSecondsRef.current -= seconds;

      const payload = JSON.stringify({ resourceId, seconds });
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/study/content-time',
          new Blob([payload], { type: 'application/json' }),
        );
      } else {
        fetch('/api/study/content-time', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {});
      }
    }

    function tick() {
      const now = Date.now();
      const visible = document.visibilityState === 'visible';
      const recentlyInteracted = now - lastInteractionRef.current < IDLE_TIMEOUT_MS;
      const engaged = visible && (isActiveRef.current || recentlyInteracted);

      if (engaged && lastTickRef.current != null) {
        activeSecondsRef.current += (now - lastTickRef.current) / 1000;
      }
      lastTickRef.current = now;

      if (activeSecondsRef.current >= FLUSH_EVERY_ACTIVE_SECONDS) flush(false);
    }

    const interval = setInterval(tick, TICK_MS);

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        tick();
        flush(true);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onVisibilityChange);

    return () => {
      // Desmontagem = navegação para outra rota dentro do app (SPA) — a
      // única saída que NÃO passa por 'hidden'/'pagehide'. Sem isto, sair de
      // /estudar/[id] perderia o restante acumulado sem gravar.
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onVisibilityChange);
      tick();
      flush(true);
    };
  }, [resourceId]);
}
