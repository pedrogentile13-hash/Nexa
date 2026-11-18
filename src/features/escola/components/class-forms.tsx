'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { createClass, deleteClass, setClassGrade, type EscolaState } from '../server/actions';

const INITIAL: EscolaState = { status: 'idle' };

export const GRADES = [['6', '6º ano'], ['7', '7º ano'], ['8', '8º ano'], ['9', '9º ano'], ['1em', '1º EM'], ['2em', '2º EM'], ['3em', '3º EM']] as const;

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
      <select name="grade" defaultValue="" aria-label="Ano da turma" className="border-border bg-surface h-11 rounded-full border px-3 text-sm outline-none">
        <option value="">Ano: pelo nome</option>
        {GRADES.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        Criar turma
      </button>
      {state.status === 'error' && <p role="alert" className="text-danger w-full text-sm">{state.message}</p>}
      {state.status === 'ok' && <p className="text-success w-full text-sm">{state.message}</p>}
    </form>
  );
}

/** Ano da turma (usado para avisar "o 7º ano inteiro") e o botão de apagar, com confirmação. */
export function ClassSettings({ id, name, grade, students }: { id: string; name: string; grade: string | null; students: number }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={setClassGrade} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <select name="grade" defaultValue={grade ?? ''} aria-label="Ano da turma" className="border-border bg-surface h-11 rounded-full border px-3 text-sm outline-none">
          <option value="">Ano não definido</option>
          {GRADES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" className="border-border hover:bg-surface-2 h-11 rounded-full border px-4 text-sm font-semibold">Salvar ano</button>
      </form>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="text-danger hover:bg-danger-soft inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold">
          <Trash2 className="size-4" aria-hidden /> Apagar turma
        </button>
      ) : (
        <form action={deleteClass} className="bg-danger-soft flex flex-wrap items-center gap-2 rounded-3xl px-4 py-2">
          <input type="hidden" name="id" value={id} />
          <p className="text-danger text-sm">
            Apagar a turma <strong>{name}</strong>? {students > 0 ? `Os ${students} alunos ficam sem turma. ` : ''}Avisos e professores atribuídos a ela saem junto.
          </p>
          <button type="submit" className="bg-danger h-10 rounded-full px-4 text-sm font-semibold text-white">Apagar</button>
          <button type="button" onClick={() => setConfirming(false)} className="text-muted h-10 px-3 text-sm">Cancelar</button>
        </form>
      )}
    </div>
  );
}
