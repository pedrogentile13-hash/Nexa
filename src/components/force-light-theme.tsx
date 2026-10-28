'use client';

import { useEffect } from 'react';

/**
 * Mantém a tela em modo CLARO enquanto está montada — e devolve a preferência
 * da pessoa quando ela sai (por exemplo, ao entrar no app depois do login).
 *
 * O script do layout já deixa de aplicar o escuro nesta tela, então não há
 * "piscada" no carregamento. Este componente cobre a navegação suave: ir de
 * uma tela com escuro para o login sem recarregar a página.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');

    return () => {
      try {
        const stored = localStorage.getItem('nexa-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', stored === 'dark' || (stored !== 'light' && prefersDark));
      } catch {
        // Sem acesso ao armazenamento: fica no claro, que é o padrão seguro.
      }
    };
  }, []);

  return null;
}
