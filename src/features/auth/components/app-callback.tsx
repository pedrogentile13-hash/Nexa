'use client';

import { useEffect, useState } from 'react';

const APP_LINK = 'br.com.nexastudy.app://auth';

/** Lê os tokens que o Supabase põe depois do `#` e abre o app com eles. O navegador nunca guarda a sessão. */
export function AppCallback() {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    if (!access || !refresh) {
      setError(params.get('error_description') ?? 'Não consegui concluir o login. Volte ao app e tente de novo.');
      return;
    }
    const url = `${APP_LINK}#access_token=${encodeURIComponent(access)}&refresh_token=${encodeURIComponent(refresh)}`;
    setLink(url);
    // Limpa o endereço para os tokens não ficarem no histórico do navegador.
    history.replaceState(null, '', window.location.pathname);
    window.location.href = url;
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      {error ? (
        <p role="alert" className="text-danger max-w-xs text-sm">{error}</p>
      ) : (
        <>
          <p className="text-lg font-semibold">Entrando no Nexa…</p>
          <p className="text-muted max-w-xs text-sm">Se o app não abrir sozinho, toque no botão.</p>
          {link && (
            <a href={link} className="bg-brand text-brand-fg inline-flex h-12 items-center rounded-full px-8 text-sm font-semibold">
              Abrir o Nexa
            </a>
          )}
        </>
      )}
    </main>
  );
}
