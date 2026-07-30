import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Loading placeholder.
 *
 * Paired with route-level `loading.tsx` and `<Suspense>`, this is what keeps a
 * slow query from showing a blank screen — README Parte 3 lists skeleton
 * loading as a requirement, not a nicety. The pulse is suppressed under
 * `prefers-reduced-motion` by the global rule in globals.css.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('bg-surface-2 animate-pulse rounded-sm', className)}
      {...props}
    />
  );
}
