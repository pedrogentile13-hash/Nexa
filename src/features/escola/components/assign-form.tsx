'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { assignTeacher, type EscolaState } from '../server/actions';

const INITIAL: EscolaState = { status: 'idle' };
const select = 'border-border bg-surface-2 h-11 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none focus:border-brand';

export function AssignForm({
  teachers,
  subjects,
  classes,
}: {
  teachers: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(assignTeacher, INITIAL);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'ok') ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="teacherId" required defaultValue="" aria-label="Professor" className={select}>
          <option value="" disabled>Professor…</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select name="subjectCatalogId" required defaultValue="" aria-label="Matéria" className={select}>
          <option value="" disabled>Matéria…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="classId" required defaultValue="" aria-label="Turma" className={select}>
          <option value="" disabled>Turma…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
        Atribuir
      </button>
      {state.status === 'error' && <p role="alert" className="text-danger text-sm">{state.message}</p>}
      {state.status === 'ok' && <p className="text-success text-sm">{state.message}</p>}
    </form>
  );
}
