'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Mesma rede de segurança do `src/app/error.tsx`, mas para dentro da área
 * autenticada — cobre a falha de uma página sob `(app)` sem derrubar a tela
 * toda. O `AppLayout` (nav lateral/inferior) continua de pé: um `error.tsx`
 * só troca os FILHOS do layout do mesmo segmento, não o layout em si — por
 * isso o botão "Ir para Hoje" aqui é só um atalho a mais, não a única saída.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Único jeito de ver isto nos logs de função do Netlify.
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="border-border bg-surface flex max-w-sm flex-col items-center gap-4 rounded-[20px] border px-6 py-10 text-center">
        <div className="from-danger to-danger/80 grid size-14 place-items-center rounded-[32%] bg-gradient-to-br shadow-md">
          <AlertTriangle className="size-6 text-white" aria-hidden />
        </div>
        <div>
          <p className="text-base font-semibold">Algo travou por um instante</p>
          <p className="text-muted mt-1 text-sm leading-relaxed">
            Pode ter sido a conexão. Toque em tentar de novo — na maioria das vezes já volta ao
            normal.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RotateCw aria-hidden />
            Tentar de novo
          </Button>
          <Button variant="outline" asChild>
            <Link href="/hoje">Ir para Hoje</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
