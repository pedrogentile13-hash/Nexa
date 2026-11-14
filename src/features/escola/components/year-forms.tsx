'use client';

import { useActionState, useMemo, useState } from 'react';
import { CalendarPlus, GraduationCap, Loader2, Plus, Rocket, Trash2, X } from 'lucide-react';
import {
  activateYear,
  cancelPlan,
  deletePlanClass,
  movePlanStudent,
  prepareYear,
  removePlanAssignment,
  savePlanClass,
  type YearState,
} from '../server/year-actions';
import type { Plan, PlanClass } from '../server/years';
import { GRADES } from './class-forms';
import { Chip, Panel } from './ui';

const INITIAL: YearState = { status: 'idle' };
const field = 'border-border bg-surface h-11 rounded-full border px-4 text-sm outline-none focus:border-brand';

export function PrepareYearForm({ suggested }: { suggested: number }) {
  const [state, action, pending] = useActionState(prepareYear, INITIAL);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="year" type="number" min={2000} max={2100} defaultValue={suggested} aria-label="Ano" className={`${field} w-28`} />
      <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CalendarPlus className="size-4" aria-hidden />}
        Preparar {suggested}
      </button>
      {state.status === 'error' && <p role="alert" className="text-danger w-full text-sm">{state.message}</p>}
    </form>
  );
}

function ClassRow({ yearId, c }: { yearId: string; c: PlanClass }) {
  const [state, action, pending] = useActionState(savePlanClass, INITIAL);
  return (
    <li className="bg-surface-2 rounded-3xl p-4">
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="yearId" value={yearId} />
        <input type="hidden" name="classId" value={c.id} />
        <input name="name" defaultValue={c.name} required maxLength={40} aria-label="Nome da turma" className={`${field} w-44`} />
        <select name="grade" defaultValue={c.grade ?? ''} aria-label="Ano da turma" className={field}>
          <option value="">Sem ano</option>
          {GRADES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="border-border bg-surface hover:bg-surface h-11 rounded-full border px-4 text-sm font-semibold">
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
        <span className="text-muted text-xs">{c.students} {c.students === 1 ? 'aluno' : 'alunos'}{c.from ? ` · vem da ${c.from}` : ''}</span>
      </form>
      {state.status === 'error' && <p role="alert" className="text-danger mt-2 text-sm">{state.message}</p>}
      {c.teachers.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {c.teachers.map((t) => (
            <li key={t.id}>
              <form action={removePlanAssignment} className="bg-surface border-border inline-flex items-center gap-1.5 rounded-full border py-1 pr-1 pl-3 text-xs">
                <input type="hidden" name="yearId" value={yearId} />
                <input type="hidden" name="id" value={t.id} />
                <span>{t.teacher} · {t.subject}</span>
                <button type="submit" aria-label={`Tirar ${t.teacher} desta turma`} className="text-muted hover:text-danger grid size-6 place-items-center rounded-full">
                  <X className="size-3.5" aria-hidden />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={deletePlanClass} className="mt-3">
        <input type="hidden" name="yearId" value={yearId} />
        <input type="hidden" name="classId" value={c.id} />
        <button type="submit" className="text-danger inline-flex items-center gap-1.5 text-xs font-semibold">
          <Trash2 className="size-3.5" aria-hidden /> Remover turma (os alunos ficam sem turma)
        </button>
      </form>
    </li>
  );
}

function NewClassForm({ yearId }: { yearId: string }) {
  const [state, action, pending] = useActionState(savePlanClass, INITIAL);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="yearId" value={yearId} />
      <input name="name" required maxLength={40} placeholder="Nova turma (ex.: 1º EM C)" aria-label="Nome da nova turma" className={`${field} w-56`} />
      <select name="grade" defaultValue="" aria-label="Ano da nova turma" className={field}>
        <option value="">Ano: escolha</option>
        {GRADES.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Criar turma
      </button>
      {state.status === 'error' && <p role="alert" className="text-danger w-full text-sm">{state.message}</p>}
    </form>
  );
}

function ActivateBox({ yearId, year, plan }: { yearId: string; year: number; plan: Plan }) {
  const [state, action, pending] = useActionState(activateYear, INITIAL);
  const [sure, setSure] = useState(false);
  const placed = plan.students.filter((s) => s.planClassId).length;
  const graduating = plan.students.filter((s) => !s.planClassId && s.graduating).length;
  const loose = plan.students.filter((s) => !s.planClassId && !s.graduating).length;

  if (state.status === 'ok') {
    return <p className="bg-success-soft text-success rounded-2xl px-4 py-3 text-sm">{state.message}</p>;
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="yearId" value={yearId} />
      <ul className="text-muted space-y-1 text-sm">
        <li>• {plan.classes.length} turmas de {year} serão criadas e as de hoje serão encerradas (ficam guardadas).</li>
        <li>• {placed} alunos vão para as turmas novas; {graduating} formam; {loose > 0 ? `${loose} ficam sem turma para você encaixar depois` : 'ninguém fica sem turma'}.</li>
        <li>• As notas finais de cada aluno neste ano são guardadas antes da virada. Resumos, simulados e histórico não são apagados.</li>
      </ul>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4" checked={sure} onChange={(e) => setSure(e.target.checked)} />
        Conferi as turmas e os alunos.
      </label>
      {state.status === 'error' && <p role="alert" className="text-danger text-sm">{state.message}</p>}
      <button type="submit" disabled={!sure || pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-50">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Rocket className="size-4" aria-hidden />} Virar para {year}
      </button>
    </form>
  );
}

/** Montagem do ano em preparação: turmas, alunos e professores — nada vale até "Virar". */
export function PlanEditor({ yearId, plan }: { yearId: string; plan: Plan }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plan.students.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (filter === '__none') return !s.planClassId;
      return !filter || s.planClassId === filter;
    });
  }, [plan.students, search, filter]);

  return (
    <div className="space-y-6">
      <Panel title="1 · Turmas" hint="Já vêm promovidas (o 9º vira 1º EM). Renomeie, crie salas novas ou remova as que não existirão.">
        <ul className="space-y-3">
          {plan.classes.map((c) => (
            <ClassRow key={c.id} yearId={yearId} c={c} />
          ))}
        </ul>
        <div className="mt-4">
          <NewClassForm yearId={yearId} />
        </div>
      </Panel>

      <Panel title="2 · Alunos" hint="Cada aluno já está na turma que sucede a dele. Mude quem vai para outra sala.">
        <div className="mb-3 flex flex-wrap gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno" aria-label="Buscar aluno" className={`${field} min-w-0 flex-1`} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar" className={field}>
            <option value="">Todos</option>
            <option value="__none">Sem turma</option>
            {plan.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <p className="text-muted mb-2 text-xs">{shown.length} de {plan.students.length} alunos</p>
        <ul className="divide-border max-h-[32rem] divide-y overflow-y-auto">
          {shown.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-muted text-xs">hoje: {s.fromClass ?? '—'}</p>
              </div>
              {s.graduating && !s.planClassId && (
                <Chip tone="good"><GraduationCap className="size-3" aria-hidden /> forma</Chip>
              )}
              <form action={movePlanStudent}>
                <input type="hidden" name="yearId" value={yearId} />
                <input type="hidden" name="studentId" value={s.id} />
                <select
                  name="classId"
                  defaultValue={s.planClassId ?? ''}
                  aria-label={`Turma de ${s.name} no ano novo`}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  className="border-border bg-surface-2 h-10 rounded-full border px-3 text-sm outline-none"
                >
                  <option value="">Sem turma</option>
                  {plan.classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </form>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="3 · Virar o ano" hint="Só acontece quando você confirmar.">
        <ActivateBox yearId={yearId} year={plan.year} plan={plan} />
        <form action={cancelPlan} className="mt-4">
          <input type="hidden" name="yearId" value={yearId} />
          <button type="submit" className="text-muted hover:text-danger text-xs font-semibold underline">Descartar esta preparação</button>
        </form>
      </Panel>
    </div>
  );
}
