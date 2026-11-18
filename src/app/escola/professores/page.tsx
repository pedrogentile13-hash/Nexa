import { GraduationCap, X } from 'lucide-react';
import { AssignForm } from '@/features/escola/components/assign-form';
import { Avatar, Chip, Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { removeAssignment } from '@/features/escola/server/actions';
import { requireStaff } from '@/features/escola/server/guard';
import { listClassCards, listSubjects, listTeacherCards } from '@/features/escola/server/queries';

export const metadata = { title: 'Professores' };
export const dynamic = 'force-dynamic';

export default async function ProfessoresPage() {
  const staff = await requireStaff('/escola/professores');
  const [teachers, subjects, classes] = await Promise.all([
    staff.schoolId ? listTeacherCards(staff.schoolId) : Promise.resolve([]),
    listSubjects(),
    listClassCards(),
  ]);

  return (
    <>
      <PageTitle title="Professores" subtitle="Quem leciona o quê, em qual turma, e como está o chat de dúvidas de cada um." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Equipe">
          {teachers.length === 0 ? (
            <Empty icon={<GraduationCap className="text-subtle size-8" aria-hidden />} title="Nenhum professor cadastrado" text="Crie as contas dos professores em Contas." />
          ) : (
            <ul className="space-y-3">
              {teachers.map((t) => (
                <li key={t.id} className="bg-surface-2 rounded-3xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="text-muted text-xs">{t.faqCount} respostas prontas no chat</p>
                    </div>
                    {t.pending > 0 && <Chip tone="bad">{t.pending} {t.pending === 1 ? 'dúvida esperando' : 'dúvidas esperando'}</Chip>}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {t.assignments.length === 0 && <li className="text-muted text-xs">Ainda não atribuído a nenhuma turma.</li>}
                    {t.assignments.map((a) => (
                      <li key={a.id} className="bg-surface flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs font-medium">
                        {a.subject} · {a.className}
                        <form action={removeAssignment}>
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" aria-label={`Tirar ${a.subject} da turma ${a.className}`} className="text-subtle hover:text-danger grid size-5 place-items-center rounded-full">
                            <X className="size-3" aria-hidden />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Atribuir professor" hint="Escolha o professor, a matéria e a turma.">
          <AssignForm teachers={teachers.map((t) => ({ id: t.id, name: t.name }))} subjects={subjects} classes={classes.map((c) => ({ id: c.id, name: c.name }))} />
        </Panel>
      </div>
    </>
  );
}
