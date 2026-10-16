'use client';

import { cn } from '@/lib/utils';

/**
 * Interruptor on/off — para preferências que ligam/desligam na hora, sem
 * botão de salvar (notificações, por exemplo). Um checkbox nativo por baixo
 * garante teclado e leitor de tela de graça; só o visual é customizado.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-surface-2',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'block size-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </label>
  );
}
