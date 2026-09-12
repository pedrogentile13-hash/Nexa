import Link from 'next/link';
import { BarChart3, Flame, Users } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { getTeacherRoster } from '@/features/teacher/server/queries';

export const metadata = { title: 'Turmas' };

export default async function TeacherClassesPage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const roster = await getTeacherRoster(assignments, identity.schoolId);

  return (
    <>
      <TeacherHeader
        title="Turmas"
        description={
          roster.length === 0
            ? 'Nenhum aluno nas suas turmas ainda.'
            : `${roster.length} ${roster.length === 1 ? 'aluno' : 'alunos'} nas suas turmas.`
        }
      />
      <div className="p-5">
        {roster.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <Users className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Ninguém por aqui ainda</p>
            <p className="text-muted mt-1 text-sm">
              Alunos aparecem aqui assim que o perfil deles estiver na mesma escola e turma
              atribuída a você.
            </p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {roster.map((s) => {
              const initial = s.fullName?.trim()[0]?.toUpperCase() ?? '?';
              return (
                <li key={s.id}>
                  <Link
                    href={`/professor/turmas/${s.id}`}
                    className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3"
                  >
                    <span className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-semibold">
                      {s.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        initial
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {s.fullName ?? 'Sem nome'}
                      </span>
                      <span className="text-muted text-xs">Turma {s.className}</span>
                    </span>
                    <span className="text-muted flex shrink-0 items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Flame className="size-3.5" aria-hidden />
                        {s.currentStreak}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="size-3.5" aria-hidden />
                        Nível {s.level}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
