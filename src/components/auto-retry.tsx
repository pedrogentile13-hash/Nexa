'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SECONDS = 10;
const MAX_TRIES = 12; // 2 minutos; depois disso, só o botão manual

/**
 * Tenta de novo sozinho a cada 10 segundos enquanto a tela de erro está aberta.
 * Serve para a falha passageira (servidor reiniciando, conexão instável): quando o servidor volta,
 * a tela volta sozinha, sem o aluno precisar tocar em nada. Pausa com a aba escondida.
 */
export function AutoRetry({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [left, setLeft] = useState(SECONDS);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setLeft((s) => {
        if (s > 1) return s - 1;
        // Hora de tentar: renova os dados do servidor e redesenha a tela.
        startTransition(() => {
          router.refresh();
          reset();
        });
        setTries((t) => t + 1);
        return SECONDS;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [reset, router, tries]);

  if (tries >= MAX_TRIES) {
    return <p className="text-subtle text-xs">Não voltou sozinho. Toque em tentar de novo ou volte daqui a pouco.</p>;
  }
  return (
    <p role="status" className="text-subtle text-xs">
      Tentando de novo sozinho em {left}s…
    </p>
  );
}
