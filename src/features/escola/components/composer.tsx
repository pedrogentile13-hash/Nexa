'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CalendarDays, Loader2, Pin, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const GRADES = [
  { value: '6', label: '6º' },
  { value: '7', label: '7º' },
  { value: '8', label: '8º' },
  { value: '9', label: '9º' },
  { value: '1em', label: '1º EM' },
  { value: '2em', label: '2º EM' },
  { value: '3em', label: '3º EM' },
] as const;
const EFAF = ['6', '7', '8', '9'];
const EM = ['1em', '2em', '3em'];

type Mode = 'school' | 'efaf' | 'em' | 'years' | 'class' | 'students';
const MODES: { value: Mode; label: string; leaderOnly?: boolean }[] = [
  { value: 'school', label: 'Toda a escola', leaderOnly: true },
  { value: 'efaf', label: 'EFAF (6º ao 9º)', leaderOnly: true },
  { value: 'em', label: 'Ensino Médio (1º ao 3º)', leaderOnly: true },
  { value: 'years', label: 'Um ou mais anos', leaderOnly: true },
  { value: 'class', label: 'Uma turma' },
  { value: 'students', label: 'Alunos específicos' },
];

export interface ComposerStudent {
  id: string;
  name: string;
  className: string;
}

/** Novo recado: chega no sino de cada aluno; com data vira evento na agenda dele. */
export function Composer({
  classes,
  schoolWide,
  students = [],
}: {
  classes: { id: string; name: string }[];
  schoolWide: boolean;
  students?: ComposerStudent[];
}) {
  const [state, action] = useActionState(publishAnnouncement, INITIAL);
  const ref = useRef<HTMLFormElement>(null);
  const modes = MODES.filter((m) => schoolWide || !m.leaderOnly);
  const [mode, setMode] = useState<Mode>(modes[0]!.value);
  const [years, setYears] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    if (state.status === 'published') {
      ref.current?.reset();
      setPicked(new Set());
      setYears([]);
    }
  }, [state]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => (!classFilter || s.className === classFilter) && (!q || s.name.toLowerCase().includes(q)));
  }, [students, search, classFilter]);
  const classNames = useMemo(() => [...new Set(students.map((s) => s.className))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })), [students]);

  const audience = mode === 'efaf' || mode === 'em' || mode === 'years' ? 'grades' : mode;
  const grades = mode === 'efaf' ? EFAF : mode === 'em' ? EM : mode === 'years' ? years : [];

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="audience" value={audience} />
      {grades.map((g) => (
        <input key={g} type="hidden" name="grades" value={g} />
      ))}
      {mode === 'students' && [...picked].map((id) => <input key={id} type="hidden" name="studentIds" value={id} />)}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-muted mb-1 block text-xs font-semibold">Para quem</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className={field}>
            {modes.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-muted mb-1 flex items-center gap-1 text-xs font-semibold"><CalendarDays className="size-3" aria-hidden /> Data do evento (opcional)</span>
          <input name="eventDate" type="date" className={field} />
        </label>
      </div>

      {mode === 'class' && (
        <select name="classId" required defaultValue={classes[0]?.id ?? ''} aria-label="Turma" className={field}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>Turma {c.name}</option>
          ))}
        </select>
      )}

      {mode === 'years' && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Anos">
          {GRADES.map((g) => {
            const on = years.includes(g.value);
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={on}
                onClick={() => setYears((prev) => (on ? prev.filter((x) => x !== g.value) : [...prev, g.value]))}
                className={cn('h-10 rounded-full border px-4 text-sm font-semibold', on ? 'bg-brand text-brand-fg border-transparent' : 'border-border bg-surface-2 text-muted')}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      )}

      {(mode === 'efaf' || mode === 'em') && (
        <p className="text-muted text-xs">
          Vai para os alunos das turmas cujo ano está definido como {mode === 'efaf' ? '6º, 7º, 8º ou 9º' : '1º, 2º ou 3º EM'}. Turmas sem ano definido ficam de fora — ajuste na página da turma.
        </p>
      )}

      {mode === 'students' && (
        <div className="border-border rounded-2xl border p-3">
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno" aria-label="Buscar aluno" className="border-border bg-surface-2 h-10 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none" />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filtrar por turma" className="border-border bg-surface-2 h-10 rounded-full border px-3 text-sm outline-none">
              <option value="">Todas as turmas</option>
              {classNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="text-muted mt-2 flex items-center justify-between text-xs">
            <span>{picked.size} {picked.size === 1 ? 'selecionado' : 'selecionados'}</span>
            <span className="flex gap-3">
              <button type="button" className="font-semibold" onClick={() => setPicked((p) => new Set([...p, ...shown.map((s) => s.id)]))}>Marcar os {shown.length} da lista</button>
              <button type="button" className="font-semibold" onClick={() => setPicked(new Set())}>Limpar</button>
            </span>
          </div>
          <ul className="mt-2 max-h-56 overflow-y-auto">
            {shown.length === 0 && <li className="text-muted py-3 text-center text-sm">Nenhum aluno encontrado.</li>}
            {shown.map((s) => (
              <li key={s.id}>
                <label className="hover:bg-surface-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm">
                  <input type="checkbox" className="size-4" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  <span className="text-muted text-xs">{s.className}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

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
