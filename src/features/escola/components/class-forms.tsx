'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { createClass, type EscolaState } from '../server/actions';

const INITIAL: EscolaState = { status: 'idle' };

export function NewClassForm() {
  const [state, action, pending] = useActionState(createClass, INITIAL);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'ok') ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-center gap-2">
      <input
        name="name"
        required
        maxLength={40}
        placeholder="Nova turma (ex.: 9º C)"
        aria-label="Nome da nova turma"
        className="border-border bg-surface h-11 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none focus:border-brand sm:w-56 sm:flex-none"
      />
      <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        Criar turma
      </button>
      {state.status === 'error' && <p role="alert" className="text-danger w-full text-sm">{state.message}</p>}
      {state.status === 'ok' && <p className="text-success w-full text-sm">{state.message}</p>}
    </form>
  );
}
