import Link from 'next/link';
import type { Route } from 'next';
import { Layers } from 'lucide-react';
import { Chip, Empty, PageTitle, Panel, Ring } from '@/features/escola/components/ui';
import { NewClassForm } from '@/features/escola/components/class-forms';
import { isLeader } from '@/features/escola/lib/access';
import { requireStaff } from '@/features/escola/server/guard';
import { listClassCards } from '@/features/escola/server/queries';
import { currentYearNumber } from '@/features/escola/server/years';

export const metadata = { title: 'Turmas' };
export const dynamic = 'force-dynamic';

export default async function TurmasPage() {
  const staff = await requireStaff('/escola/turmas');
  const classes = await listClassCards();
  const leader = isLeader(staff.role);
  const year = leader ? await currentYearNumber() : null;

  return (
    <>
      <PageTitle
        title={leader ? `Turmas${year ? ` · ${year}` : ''}` : 'Minhas turmas'}
        subtitle={leader ? 'Cada turma com quem estudou na semana e quem leciona. Nova virada de ano? Veja Ano letivo.' : 'As turmas em que você leciona.'}
        action={leader && staff.schoolId ? <NewClassForm /> : undefined}
      />

      {classes.length === 0 ? (
        <Panel>
          <Empty icon={<Layers className="text-subtle size-8" aria-hidden />} title={leader ? 'Nenhuma turma ainda' : 'Nenhuma turma vinculada a você'} text={leader ? 'Crie a primeira turma acima e depois coloque os alunos nela.' : 'A coordenação precisa atribuir você a uma matéria e turma.'} />
        </Panel>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const pct = c.students > 0 ? Math.round((c.active7d / c.students) * 100) : 0;
            return (
              <li key={c.id}>
                <Link href={`/escola/turmas/${c.id}` as Route} className="bg-surface border-border hover:border-brand/40 block h-full rounded-3xl border p-5 shadow-sm transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold tracking-tight">{c.name}</h2>
                      <p className="text-muted mt-0.5 truncate text-sm">{c.teachers || 'Sem professor atribuído'}</p>
                    </div>
                    <Ring value={pct} size={64} stroke={7} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Chip>{c.students} {c.students === 1 ? 'aluno' : 'alunos'}</Chip>
                    <Chip tone={pct >= 60 ? 'good' : pct > 0 ? 'warn' : 'bad'}>{c.active7d} ativos</Chip>
                    {c.neverActive > 0 && <Chip tone="warn">{c.neverActive} nunca entraram</Chip>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
