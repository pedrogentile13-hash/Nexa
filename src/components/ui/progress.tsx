import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.ComponentProps<'div'> {
  /** 0–100. Values outside the range are clamped rather than overflowing. */
  value: number;
  /** Accessible name — required, because a bare bar tells a screen reader nothing. */
  label: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const TONES = {
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

/**
 * Progress bar with a real ARIA role, so "progresso diário" is available to
 * assistive tech instead of being a decorative rectangle.
 */
export function Progress({
  value,
  label,
  tone = 'brand',
  size = 'md',
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'bg-surface-2 w-full overflow-hidden rounded-full',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', TONES[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
