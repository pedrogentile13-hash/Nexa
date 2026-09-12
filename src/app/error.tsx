'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Rede de segurança para qualquer exceção não tratada num Server/Client
 * Component sob o layout raiz.
 *
 * Sem este arquivo, uma falha transitória (rede instável até o Supabase,
 * cold start de função no Netlify) derruba a tela inteira na página de erro
 * genérica do Next — cinza, sem marca, sem saída. Isso é o que o usuário
 * descreve como "trava, dá erro" no login: a cadeia de chamadas logo após
 * entrar (middleware → layout → página) é toda rede, e qualquer hiccup nela
 * lançava direto pra cá. Agora cai numa tela que pertence ao app e que se
 * recupera com um toque — "voltar" deixa de ser um acaso de navegador.
 */
export default function RootError({
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
        <Button onClick={reset}>
          <RotateCw aria-hidden />
          Tentar de novo
        </Button>
      </div>
    </main>
  );
}
