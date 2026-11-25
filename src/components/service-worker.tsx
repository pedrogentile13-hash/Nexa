'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker (`public/sw.js`) para todo mundo, não só para quem ativou notificações.
 * É ele que tenta de novo quando a Hostinger devolve a página dela de "500 Internal Server Error",
 * em vez de deixar o aluno parado nessa tela. Se o navegador não suporta, não faz nada.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
