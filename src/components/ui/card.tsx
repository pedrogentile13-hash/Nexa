import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The workhorse container. Borders rather than shadows by default: README
 * Parte 3 asks for calm and whitespace, and a screen of drop shadows reads as
 * busy on a phone.
 */
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('border-border bg-surface rounded-lg border', className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 p-4 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3 className={cn('text-[0.9375rem] leading-tight font-semibold', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-muted text-sm leading-snug', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2 p-4 pt-0', className)} {...props} />;
}
