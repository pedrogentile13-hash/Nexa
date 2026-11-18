'use client';

import { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

/**
 * A escola do endereço atual (ex.: Colégio Anglo Morumbi), disponível para
 * qualquer componente de cliente.
 *
 * Um provedor no layout raiz em vez de passar `school` por props por cada
 * cabeçalho, menu, carregamento e painel: a marca da escola aparece em
 * vários lugares ao lado da do Nexa, e cada lugar novo não deve exigir um
 * parâmetro novo em quatro componentes no meio do caminho.
 */

export interface SchoolBrand {
  name: string;
  logoUrl: string | null;
}

const SchoolBrandContext = createContext<SchoolBrand | null>(null);

export function SchoolBrandProvider({ value, children }: { value: SchoolBrand | null; children: React.ReactNode }) {
  return <SchoolBrandContext.Provider value={value}>{children}</SchoolBrandContext.Provider>;
}

export function useSchoolBrand(): SchoolBrand | null {
  return useContext(SchoolBrandContext);
}

/** O logo da escola, ou nada se ela não tem um. */
export function SchoolLogo({ className }: { className?: string }) {
  const school = useSchoolBrand();
  if (!school?.logoUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo pequeno e fixo da escola
    <img src={school.logoUrl} alt={school.name} className={cn('shrink-0 object-contain', className)} />
  );
}

/**
 * A marca do Nexa e, quando há escola com logo, o logo dela ao lado, separados
 * por um filete. Sem escola, é só o Nexa — exatamente como era.
 */
export function CoMark({ className }: { className?: string }) {
  const school = useSchoolBrand();
  return (
    <span className="flex shrink-0 items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve, não precisa de otimização do next/image */}
      <img src="/brand/logo-mark.webp" alt="" aria-hidden className={cn('shrink-0', className ?? 'size-9')} />
      {school?.logoUrl && (
        <>
          <span aria-hidden className="bg-border-strong h-6 w-px shrink-0" />
          <SchoolLogo className={className ?? 'size-9'} />
        </>
      )}
    </span>
  );
}
