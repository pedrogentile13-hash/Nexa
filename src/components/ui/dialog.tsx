'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal genérico — o primeiro do projeto (antes só existia o bottom-sheet
 * ad-hoc de "Mais" em `bottom-nav.tsx`, especializado pro menu). Mesma
 * fórmula (`fixed inset-0 bg-black/40` + painel), mas centralizado no
 * desktop e folha inferior no celular — não uma folha em toda largura, que
 * em telas grandes ficaria esparramada sem propósito.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:grid md:place-items-center md:p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'border-border bg-surface pb-safe absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[24px] border-t p-5 shadow-lg',
          'md:static md:inset-auto md:max-h-[85vh] md:w-full md:max-w-md md:rounded-2xl md:border',
          className,
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="text-subtle hover:bg-surface-2 grid size-9 shrink-0 place-items-center rounded-full"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
