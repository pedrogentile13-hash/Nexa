'use client';

import { Printer } from 'lucide-react';

/**
 * "Exportar PDF" sem nenhuma dependência de geração server-side.
 *
 * A tentativa anterior (`@react-pdf/renderer`) derrubou o site inteiro em
 * produção — uma de suas dependências internas não expunha corretamente os
 * arquivos que carrega em runtime, e o rastreador de arquivos do Netlify é
 * mais estrito que o do Next local. Mesma classe de problema que já havia
 * ocorrido com `pdf-parse`/`@napi-rs/canvas`. `window.print()` (com
 * `.no-print` escondendo a navegação em `@media print`, ver globals.css) usa
 * o "Salvar como PDF" já embutido em todo navegador — zero dependências
 * novas, zero risco de bundling.
 */
export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        'border-border bg-surface hover:bg-surface-2 inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium'
      }
    >
      <Printer className="size-4" aria-hidden />
      Exportar PDF
    </button>
  );
}
