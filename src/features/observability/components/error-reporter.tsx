'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { reportError } from '../server/actions';

/**
 * Manda para o servidor o erro que caiu num boundary.
 *
 * Montado dentro dos `error.tsx`, que é o único lugar onde o React entrega
 * uma exceção já capturada com o `digest` que casa com a linha do log do
 * servidor.
 *
 * O `useRef` evita o registro duplicado: em desenvolvimento o StrictMode monta
 * cada componente duas vezes, e sem a trava cada erro viraria duas linhas —
 * o suficiente pra fazer a lista parecer o dobro do problema que é.
 */
export function ErrorReporter({ error }: { error: Error & { digest?: string } }) {
  const pathname = usePathname();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    void reportError({
      message: error.message || 'Erro sem mensagem',
      stack: error.stack ?? null,
      pathname,
      digest: error.digest ?? null,
      userAgent: typeof navigator === 'undefined' ? null : navigator.userAgent,
      origin: 'client',
    });
  }, [error, pathname]);

  return null;
}
