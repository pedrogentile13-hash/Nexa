'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Adia a execução até o usuário parar de digitar.
 *
 * É o que sustenta o "salvamento automático" que a especificação pede sem
 * disparar uma escrita por tecla — digitar "8,5" numa nota são três eventos, e
 * três chamadas ao banco para um valor só.
 *
 * A callback mais recente é guardada numa ref, então o timer nunca executa uma
 * versão obsoleta com estado velho fechado dentro dela.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void | Promise<void>,
  delayMs = 600,
): [(...args: Args) => void, () => void] {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Um timer pendente quando o componente sai da tela executaria contra algo
  // que não existe mais.
  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    (...args: Args) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void callbackRef.current(...args);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  return [run, cancel];
}
