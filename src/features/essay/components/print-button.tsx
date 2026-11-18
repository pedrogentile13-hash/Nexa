'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-brand text-brand-text hover:bg-brand-soft inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-bold tracking-wide uppercase transition-colors print:hidden"
    >
      <Printer className="size-3.5" aria-hidden />
      Imprimir
    </button>
  );
}
