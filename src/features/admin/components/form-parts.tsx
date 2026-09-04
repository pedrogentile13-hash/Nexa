'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AdminState } from '../server/actions';

/**
 * Peças de formulário do painel.
 *
 * Existem para que cada tela de cadastro não reinvente rótulo, erro e estado
 * de envio — são oito telas, e oito versões da mesma coisa divergem na
 * primeira semana.
 */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {hint && <span className="text-subtle text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Select com a mesma altura e foco do Input, para a linha não desalinhar. */
export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'border-border bg-surface text-text h-12 w-full rounded-md border px-3 text-base',
        'focus-visible:border-brand focus-visible:ring-brand/25 transition-colors outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'border-border bg-surface text-text w-full rounded-md border px-3 py-2.5 text-base',
        'placeholder:text-subtle focus-visible:border-brand focus-visible:ring-brand/25',
        'transition-colors outline-none focus-visible:ring-2 sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}

/** Interruptor de publicação. Rótulo grande porque a área de toque é ele. */
export function Toggle({
  name,
  defaultChecked,
  label,
  description,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  description?: string;
}) {
  return (
    <label className="border-border bg-surface flex min-h-[52px] cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-brand size-5 shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="text-muted block text-xs">{description}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({ children = 'Salvar' }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function FormFeedback({ state }: { state: AdminState }) {
  if (state.status === 'idle') return null;
  return (
    <p
      role="status"
      className={cn(
        'text-sm',
        state.status === 'error' ? 'text-danger' : 'text-success font-medium',
      )}
    >
      {state.status === 'error' ? state.message : 'Salvo.'}
    </p>
  );
}
