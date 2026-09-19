'use client';

import { cn } from '@/lib/utils';

/**
 * Abas com sublinhado — para quando são muitas (4+) e o controle segmentado
 * (`Segmented`, pastilha cheia) ficaria apertado demais lado a lado.
 *
 * Rola horizontalmente no celular em vez de quebrar linha: uma aba que
 * quebra linha parece um erro de layout, uma que rola é um padrão conhecido.
 */
export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('border-border flex gap-1 overflow-x-auto border-b', className)}
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
              'shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors',
              active
                ? 'border-brand text-brand-text font-semibold'
                : 'text-muted hover:text-text border-transparent font-medium',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
