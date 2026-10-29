'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { CalendarDays, Loader2, Pin, Send } from 'lucide-react';
import { publishAnnouncement, type PublishState } from '@/features/announcements/server/actions';

const INITIAL: PublishState = { status: 'idle' };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
      Publicar
    </button>
  );
}

const field = 'border-border bg-surface-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-brand';

/** Novo recado: chega no sino de cada aluno; com data vira evento na agenda dele. */
export function Composer({ classes, schoolWide }: { classes: { id: string; name: string }[]; schoolWide: boolean }) {
  const [state, action] = useActionState(publishAnnouncement, INITIAL);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'published') ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-muted mb-1 block text-xs font-semibold">Para quem</span>
          <select name="classId" required={!schoolWide} defaultValue={schoolWide ? '' : (classes[0]?.id ?? '')} className={field}>
            {schoolWide && <option value="">Toda a escola</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Turma {c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-muted mb-1 flex items-center gap-1 text-xs font-semibold"><CalendarDays className="size-3" aria-hidden /> Data do evento (opcional)</span>
          <input name="eventDate" type="date" className={field} />
        </label>
      </div>
      <input name="title" required maxLength={160} placeholder="Título — ex.: Reunião de pais, sexta, 19h" className={field} />
      <textarea name="body" required rows={4} maxLength={4000} placeholder="Escreva com clareza: o quê, quando e onde." className={field} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <label className="text-muted flex items-center gap-2"><input type="checkbox" name="pinned" className="size-4" /><Pin className="size-3.5" aria-hidden /> Fixar no topo</label>
          <label className="text-muted flex items-center gap-2">
            Some em
            <input name="days" type="number" min={1} max={365} inputMode="numeric" placeholder="dias" className="border-border bg-surface-2 h-9 w-20 rounded-full border px-3 text-sm outline-none" />
          </label>
        </div>
        <Submit />
      </div>
      {state.status === 'error' && <p role="alert" className="text-danger text-sm">{state.message}</p>}
      {state.status === 'published' && <p className="text-success text-sm">Publicado. {state.notified} {state.notified === 1 ? 'pessoa foi avisada' : 'pessoas foram avisadas'}.</p>}
    </form>
  );
}
