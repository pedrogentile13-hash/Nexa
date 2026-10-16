'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Converte os tokens do fragmento em sessão e sai da frente.
 *
 * Fica visível por uma fração de segundo no caminho feliz. O estado de erro
 * existe porque o caminho infeliz — link já usado — precisa dizer isso, e não
 * girar para sempre.
 */
export function FinishSignIn({ next }: { next: string }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setFailed(true);
      return;
    }

    void (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setFailed(true);
        return;
      }

      // Limpa o fragmento antes de sair: token em histórico de navegador é
      // token que vaza no próximo compartilhamento de tela.
      window.history.replaceState(null, '', window.location.pathname);
      router.replace(next as Route);
      router.refresh();
    })();
  }, [next, router]);

  if (failed) {
    return (
      <div className="text-center">
        <p className="text-sm font-medium">Não consegui concluir esse acesso.</p>
        <p className="text-muted mt-1 text-sm">O link pode ter expirado ou já ter sido usado.</p>
        <a
          href="/login"
          className="text-brand mt-4 inline-flex h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          Voltar para o login
        </a>
      </div>
    );
  }

  return (
    <p className="text-muted flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Entrando…
    </p>
  );
}
