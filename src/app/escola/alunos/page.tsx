import Link from 'next/link';
import type { Route } from 'next';
import { Search, Users } from 'lucide-react';
import { Chip, Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { StudentRow } from '@/features/escola/components/student-row';
import { isLeader } from '@/features/escola/lib/access';
import { setStudentClass } from '@/features/escola/server/actions';
import { requireStaff } from '@/features/escola/server/guard';
import { listClassCards, listRoster, listUnassigned } from '@/features/escola/server/queries';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Alunos' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'parados', label: 'Parados há 7+ dias' },
  { key: 'nunca', label: 'Nunca entraram' },
] as const;

export default async function AlunosPage({ searchParams }: { searchParams: Promise<{ q?: string; turma?: string; filtro?: string; 'sem-turma'?: string }> }) {
  const staff = await requireStaff('/escola/alunos');
  const params = await searchParams;
  const leader = isLeader(staff.role);
  const filtro = FILTERS.some((f) => f.key === params.filtro) ? params.filtro! : 'todos';

  const [classes, roster, unassigned] = await Promise.all([
    listClassCards(),
    listRoster(params.turma, params.q),
    leader ? listUnassigned() : Promise.resolve([]),
  ]);

  const today = Date.now();
  const students = roster.filter((s) => {
    if (filtro === 'nunca') return s.lastActive === null;
    if (filtro === 'parados') return s.lastActive === null || (today - Date.parse(`${s.lastActive}T00:00:00Z`)) / 86_400_000 >= 7;
    return true;
  });

  const link = (over: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { q: params.q, turma: params.turma, filtro: params.filtro, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return (s ? `/escola/alunos?${s}` : '/escola/alunos') as Route;
  };

  return (
    <>
      <PageTitle title="Alunos" subtitle={leader ? 'Todos os alunos da escola, com a atividade de cada um.' : 'Os alunos das suas turmas.'} />

      {leader && unassigned.length > 0 && (
        <Panel className="mb-6 border-amber-200 bg-amber-50/60" title={`${unassigned.length} ${unassigned.length === 1 ? 'aluno sem turma' : 'alunos sem turma'}`} hint="Escolha a turma de cada um.">
          <ul className="divide-border divide-y">
            {unassigned.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 text-sm font-medium">
                  {s.name} {s.login && <span className="text-muted font-mono text-xs">({s.login})</span>}
                </span>
                <form action={setStudentClass} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={s.id} />
                  <select name="classId" required defaultValue="" aria-label={`Turma de ${s.name}`} className="border-border bg-surface h-10 rounded-full border px-3 text-sm">
                    <option value="" disabled>Turma…</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="bg-brand text-brand-fg h-10 rounded-full px-4 text-sm font-semibold">Colocar</button>
                </form>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel>
        <form action="/escola/alunos" className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">Buscar aluno</span>
            <Search className="text-subtle pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" aria-hidden />
            <input name="q" defaultValue={params.q ?? ''} placeholder="Buscar pelo nome" className="border-border bg-surface-2 h-11 w-full rounded-full border pr-4 pl-10 text-sm outline-none focus:border-brand" />
          </label>
          {params.turma && <input type="hidden" name="turma" value={params.turma} />}
          {params.filtro && <input type="hidden" name="filtro" value={params.filtro} />}
          <button type="submit" className="bg-brand text-brand-fg h-11 rounded-full px-5 text-sm font-semibold">Buscar</button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link key={f.key} href={link({ filtro: f.key === 'todos' ? undefined : f.key })} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium', filtro === f.key ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted')}>
              {f.label}
            </Link>
          ))}
          <span className="bg-border mx-1 hidden w-px sm:block" aria-hidden />
          <Link href={link({ turma: undefined })} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium', !params.turma ? 'bg-brand-soft text-brand-text' : 'bg-surface-2 text-muted')}>
            Todas as turmas
          </Link>
          {classes.map((c) => (
            <Link key={c.id} href={link({ turma: c.id })} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium', params.turma === c.id ? 'bg-brand-soft text-brand-text' : 'bg-surface-2 text-muted')}>
              {c.name}
            </Link>
          ))}
        </div>

        {students.length === 0 ? (
          <Empty icon={<Users className="text-subtle size-8" aria-hidden />} title="Nenhum aluno encontrado" text="Mude a busca ou o filtro." />
        ) : (
          <>
            <p className="text-muted mb-1 text-xs"><Chip>{students.length}</Chip> {students.length === 1 ? 'aluno' : 'alunos'}</p>
            <ul className="divide-border divide-y">
              {students.map((s) => (
                <StudentRow key={s.id} s={s} showClass />
              ))}
            </ul>
          </>
        )}
      </Panel>
    </>
  );
}
