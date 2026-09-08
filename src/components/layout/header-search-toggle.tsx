'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { SearchBar } from '@/features/search/components/search-bar';
import { searchContent } from '@/features/search/server/actions';

/**
 * Ícone de busca do cabeçalho do app.
 *
 * Vira uma barra de busca por cima do cabeçalho inteiro ao tocar, em vez de
 * dividir espaço com título/sequência/avatar o tempo todo — no celular não
 * sobra largura pros quatro juntos. `absolute inset-0` cobre o `<header>`
 * (que é `sticky`, então já é o bloco de posicionamento certo) sem precisar
 * que o AppHeader vire client component só por causa deste toggle.
 */
export function HeaderSearchToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar conteúdo"
        className="text-muted hover:bg-surface-2 hover:text-text grid size-10 shrink-0 place-items-center rounded-full"
      >
        <Search className="size-5" aria-hidden />
      </button>
    );
  }

  return (
    <div className="bg-bg absolute inset-0 z-10 flex items-center gap-2 px-4 md:px-6 lg:px-8">
      <div className="min-w-0 flex-1">
        <SearchBar placeholder="Buscar conteúdo…" search={searchContent} />
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Fechar busca"
        className="text-muted hover:bg-surface-2 hover:text-text grid size-10 shrink-0 place-items-center rounded-full"
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}
