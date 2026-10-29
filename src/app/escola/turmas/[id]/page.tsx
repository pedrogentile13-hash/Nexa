import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Users } from 'lucide-react';
import { Empty, Metric, PageTitle, Panel } from '@/features/escola/components/ui';
import { StudentRow } from '@/features/escola/components/student-row';
import { requireStaff } from '@/features/escola/server/guard';
import { listClassCards, listRoster } from '@/features/escola/server/queries';

export const metadata = { title: 'Turma' };
export const dynamic = 'force-dynamic';

export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('/escola/turmas');
  const { id } = await params;
  const [classes, roster] = await Promise.all([listClassCards(), listRoster(id)]);
  const klass = classes.find((c) => c.id === id);
  if (!klass) notFound();

  const minutes = roster.reduce((sum, s) => sum + s.weekMinutes, 0);

  return (
    <>
      <Link href="/escola/turmas" className="text-muted hover:text-text mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
        <ArrowLeft className="size-4" aria-hidden /> Turmas
      </Link>
      <PageTitle
        title={klass.name}
        subtitle={klass.teachers ? `Professores: ${klass.teachers}` : 'Nenhum professor atribuído a esta turma.'}
        action={
          <Link href={`/escola/visao-aluno?turma=${id}`} className="bg-brand-soft text-brand-text inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
            <Eye className="size-4" aria-hidden /> Ver como o aluno vê
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Alunos" value={klass.students} />
        <Metric label="Ativos na semana" value={klass.active7d} tone={klass.active7d === 0 && klass.students > 0 ? 'bad' : 'good'} />
        <Metric label="Nunca entraram" value={klass.neverActive} tone={klass.neverActive > 0 ? 'warn' : undefined} />
        <Metric label="Minutos de estudo" value={minutes} hint="somando a turma, 7 dias" />
      </div>

      <Panel title="Alunos" hint="Do mais antigo sem entrar ao mais ativo">
        {roster.length === 0 ? (
          <Empty icon={<Users className="text-subtle size-8" aria-hidden />} title="Nenhum aluno nesta turma" text="Coloque alunos nela em Alunos." />
        ) : (
          <ul className="divide-border divide-y">
            {[...roster]
              .sort((a, b) => (a.lastActive ?? '').localeCompare(b.lastActive ?? '') || a.name.localeCompare(b.name, 'pt-BR'))
              .map((s) => (
                <StudentRow key={s.id} s={s} />
              ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
