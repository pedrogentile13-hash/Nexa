'use client';

import { cn } from '@/lib/utils';

/**
 * Controle segmentado do kit: Mês/Semana/Lista, Entrar/Criar conta,
 * Claro/Escuro/Sistema.
 *
 * Três telas usavam três versões desenhadas à mão antes disto, e elas já
 * divergiam na altura. Aqui a regra é uma só: trilho em `surface-2`, pastilha
 * ativa em `surface` com texto da marca, e cada segmento com 44px de altura —
 * a barra é um alvo de toque, não um rótulo.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('bg-surface-2 flex rounded-xl p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors',
              active
                ? 'bg-surface text-brand-text font-semibold shadow-sm'
                : 'text-muted hover:text-text font-medium',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
