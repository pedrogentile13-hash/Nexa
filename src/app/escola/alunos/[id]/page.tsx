import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { getAdminStudentReport } from '@/features/admin/server/queries';
import { Avatar, Chip, Empty, Metric, Panel, sinceLabel } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { listRoster } from '@/features/escola/server/queries';
import { formatGrade } from '@/lib/format/grade';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Aluno' };
export const dynamic = 'force-dynamic';

export default async function AlunoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('/escola/alunos');
  const { id } = await params;

  // Só abre quem está na lista que ESTA pessoa pode ver (professor: as turmas dele).
  const visible = (await listRoster()).find((s) => s.id === id);
  if (!visible) notFound();
  const report = await getAdminStudentReport(id);
  if (!report) notFound();

  const hours = report.stats ? Math.round((report.stats.totalStudySeconds / 3600) * 10) / 10 : 0;
  const graded = report.subjectScores.filter((s) => s.blendedScore !== null);

  return (
    <>
      <Link href="/escola/alunos" className="text-muted hover:text-text mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
        <ArrowLeft className="size-4" aria-hidden /> Alunos
      </Link>

      <section className="bg-surface border-border mb-6 flex flex-wrap items-center gap-4 rounded-3xl border p-5 shadow-sm md:p-6">
        <Avatar name={visible.name} url={visible.avatarUrl} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{visible.name}</h1>
          <p className="text-muted mt-0.5 flex flex-wrap items-center gap-2 text-sm">
            <Chip tone="brand">{visible.className}</Chip>
            <span>Última atividade: {sinceLabel(visible.lastActive)}</span>
            {visible.login && <span className="font-mono text-xs">login: {visible.login}</span>}
          </p>
        </div>
        <Link href={`/escola/visao-aluno?aluno=${id}`} className="bg-brand-soft text-brand-text inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
          <Eye className="size-4" aria-hidden /> Ver como o aluno vê
        </Link>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="XP" value={report.stats?.xp ?? 0} hint={`nível ${report.stats?.level ?? 1}`} />
        <Metric label="Sequência" value={`${report.stats?.currentStreak ?? 0} d`} hint={`recorde ${report.stats?.longestStreak ?? 0}`} />
        <Metric label="Horas de estudo" value={hours.toLocaleString('pt-BR')} hint="no total" />
        <Metric label="Simulados feitos" value={report.simuladoHistory.length} />
      </div>

      <Panel title="Notas por matéria" hint="Calculadas pelos quizzes e simulados — ninguém digita nota.">
        {graded.length === 0 ? (
          <Empty title="Ainda sem notas" text="A nota aparece depois que o aluno faz um quiz ou simulado." />
        ) : (
          <ul className="space-y-3">
            {[...graded]
              .sort((a, b) => (a.blendedScore ?? 0) - (b.blendedScore ?? 0))
              .map((s) => {
                const grade = s.blendedScore ?? 0;
                const low = grade < s.passingGrade;
                return (
                  <li key={s.subjectId}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{s.subjectName}</span>
                      <span className={cn('tabular font-semibold', low ? 'text-danger' : 'text-text')}>{formatGrade(grade, 1)}</span>
                    </div>
                    <div className="bg-surface-2 h-2.5 overflow-hidden rounded-full">
                      <div className={cn('h-full rounded-full', low ? 'bg-danger' : 'bg-brand')} style={{ width: `${Math.min(100, grade * 10)}%` }} />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </Panel>
    </>
  );
}
