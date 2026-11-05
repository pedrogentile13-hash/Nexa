import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * `text-base` (16px) on mobile is not a style choice: iOS Safari zooms the
 * viewport when a focused input is smaller than 16px, and the page never zooms
 * back. `sm:text-sm` restores desktop density.
 */
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'border-border bg-surface text-text h-12 w-full rounded-md border px-3 text-base',
          'placeholder:text-subtle transition-colors outline-none',
          'focus-visible:border-brand focus-visible:ring-brand/25 focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'sm:h-11 sm:text-sm',
          className,
        )}
        {...props}
      />
    );
  },
);
