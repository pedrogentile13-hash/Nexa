import Link from 'next/link';
import type { Route } from 'next';
import { Archive, CalendarDays } from 'lucide-react';
import { Chip, Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { PrepareYearForm } from '@/features/escola/components/year-forms';
import { requireStaff } from '@/features/escola/server/guard';
import { listYears } from '@/features/escola/server/years';

export const metadata = { title: 'Ano letivo' };
export const dynamic = 'force-dynamic';

const STATUS = {
  current: { label: 'em andamento', tone: 'good' as const },
  planning: { label: 'em preparação', tone: 'warn' as const },
  closed: { label: 'encerrado', tone: 'neutral' as const },
};

export default async function AnosPage() {
  await requireStaff('/escola/anos');
  const years = await listYears();
  const current = years.find((y) => y.status === 'current');
  const planning = years.find((y) => y.status === 'planning');

  return (
    <>
      <PageTitle title="Ano letivo" subtitle="No começo de cada ano, prepare as turmas novas: os alunos sobem de série, as salas e os professores se ajustam, e tudo do ano anterior fica guardado." />

      {!planning && (
        <Panel title="Preparar o próximo ano" hint="Cria as turmas já promovidas (9º → 1º EM) para você ajustar. Nada muda no ano atual até você confirmar.">
          <PrepareYearForm suggested={(current?.year ?? new Date().getFullYear()) + 1} />
        </Panel>
      )}

      <div className="mt-6">
        <Panel title="Anos">
          {years.length === 0 ? (
            <Empty icon={<CalendarDays className="text-subtle size-8" aria-hidden />} title="Nenhum ano ainda" text="Aplique o SQL do ano letivo no Supabase." />
          ) : (
            <ul className="space-y-3">
              {years.map((y) => (
                <li key={y.id}>
                  <Link href={`/escola/anos/${y.id}` as Route} className="bg-surface-2 hover:bg-brand-soft flex items-center gap-4 rounded-3xl p-4 transition-colors">
                    <span className="bg-surface grid size-12 place-items-center rounded-2xl text-lg font-semibold tabular-nums">{String(y.year).slice(2)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{y.year}</span>
                      <span className="text-muted text-xs">
                        {y.classes} turmas · {y.students} alunos{y.results > 0 ? ` · ${y.results} notas guardadas` : ''}
                      </span>
                    </span>
                    {y.status === 'closed' && <Archive className="text-subtle size-4" aria-hidden />}
                    <Chip tone={STATUS[y.status].tone}>{STATUS[y.status].label}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
