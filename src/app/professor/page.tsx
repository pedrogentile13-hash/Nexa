import Link from 'next/link';
import { BookOpen, Layers, Library } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { StatTile } from '@/components/ui/stat-tile';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { teacherClassOptions, teacherSubjectOptions } from '@/features/teacher/server/queries';

export const metadata = { title: 'Painel' };

export default async function TeacherDashboardPage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const subjects = teacherSubjectOptions(assignments);
  const classNames = teacherClassOptions(assignments);

  if (assignments.length === 0) {
    return (
      <>
        <TeacherHeader title={`Olá, ${identity.fullName ?? 'professor'}`} />
        <div className="p-5">
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <Layers className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhuma matéria/turma atribuída ainda</p>
            <p className="text-muted mt-1 text-sm">
              Peça para a administração da escola atribuir suas matérias e turmas em
              Admin → Professores.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TeacherHeader
        title={`Olá, ${identity.fullName ?? 'professor'}`}
        description={identity.schoolName ?? undefined}
      />
      <div className="space-y-6 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile icon={Layers} value={String(classNames.length)} label="turmas" />
          <StatTile icon={BookOpen} value={String(subjects.length)} label="matérias" />
        </div>

        <div className="border-border bg-surface rounded-2xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">Suas atribuições</h2>
          <ul className="divide-border divide-y">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{a.subjectName}</span>
                <span className="text-muted">Turma {a.className}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/professor/turmas"
            className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-2xl border p-4"
          >
            <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
              <Layers className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Ver turmas</p>
              <p className="text-muted text-xs">Desempenho dos seus alunos</p>
            </div>
          </Link>
          <Link
            href="/professor/conteudo"
            className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-2xl border p-4"
          >
            <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
              <Library className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Gerenciar conteúdo</p>
              <p className="text-muted text-xs">Publique resumos, vídeos e simulados</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
