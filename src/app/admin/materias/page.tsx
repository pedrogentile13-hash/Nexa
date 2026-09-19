import { AdminHeader } from '@/features/admin/components/admin-shell';
import { SubjectManager } from '@/features/admin/components/subject-manager';
import { listSchools, listSubjectsWithTopics } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Matérias' };

export default async function SubjectsPage() {
  const identity = await requireAdmin();
  const [subjects, schools] = await Promise.all([
    listSubjectsWithTopics(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader
        title="Matérias e assuntos"
        description="A matéria é o catálogo que o aluno escolhe no onboarding. O assunto é o que liga o erro do simulado ao resumo certo."
      />
      <div className="p-5">
        <SubjectManager
          subjects={subjects}
          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          canEditCatalog={identity.isGlobal}
        />
      </div>
    </>
  );
}
