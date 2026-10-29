import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Chip, Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { PlanEditor } from '@/features/escola/components/year-forms';
import { requireStaff } from '@/features/escola/server/guard';
import { getHistory, getPlan } from '@/features/escola/server/years';

export const metadata = { title: 'Ano letivo' };
export const dynamic = 'force-dynamic';

export default async function AnoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('/escola/anos');
  const { id } = await params;

  const history = await getHistory(id);
  if (!history) notFound();

  const back = (
    <Link href="/escola/anos" className="text-muted hover:text-text mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
      <ArrowLeft className="size-4" aria-hidden /> Anos letivos
    </Link>
  );

  if (history.status === 'planning') {
    const plan = await getPlan(id);
    if (!plan) notFound();
    return (
      <>
        {back}
        <PageTitle title={`Preparando ${plan.year}`} subtitle="Monte as turmas e os alunos do ano novo. O ano atual segue normal até você virar." />
        <PlanEditor yearId={id} plan={plan} />
      </>
    );
  }

  return (
    <>
      {back}
      <PageTitle
        title={`Ano ${history.year}`}
        subtitle={history.status === 'closed' ? 'Ano encerrado — turmas, alunos e notas finais guardados.' : 'Ano em andamento.'}
      />
      {history.classes.length === 0 ? (
        <Empty title="Sem turmas neste ano" text="Nada foi registrado." />
      ) : (
        <div className="space-y-4">
          {history.classes.map((c) => (
            <Panel key={c.id} title={c.name} hint={c.teachers ? `Professores: ${c.teachers}` : undefined}>
              {c.students.length === 0 ? (
                <p className="text-muted text-sm">Nenhum aluno.</p>
              ) : (
                <ul className="divide-border divide-y">
                  {c.students.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      {history.status === 'closed' && (s.average !== null ? <Chip tone={s.average >= 6 ? 'good' : 'warn'}>média {s.average.toFixed(1).replace('.', ',')}</Chip> : <span className="text-subtle text-xs">sem nota</span>)}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
