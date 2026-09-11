import { AdminHeader } from '@/features/admin/components/admin-shell';
import { TeacherAssignmentsManager } from '@/features/admin/components/teacher-assignments-manager';
import {
  getResourceFormOptions,
  listTeacherAssignments,
  listTeachers,
} from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Professores' };

export default async function TeacherAssignmentsPage() {
  const identity = await requireAdmin();
  const [assignments, teachers, options] = await Promise.all([
    listTeacherAssignments(),
    listTeachers(identity.isGlobal ? undefined : (identity.schoolId ?? undefined)),
    getResourceFormOptions(identity),
  ]);

  return (
    <>
      <AdminHeader
        title="Professores"
        description="Atribua matéria+turma a cada professor — é esse vínculo que abre a área dele em /professor."
      />
      <div className="p-5">
        <TeacherAssignmentsManager
          assignments={assignments}
          teachers={teachers}
          subjects={options.subjects}
          schools={options.schools}
          isGlobal={identity.isGlobal}
        />
      </div>
    </>
  );
}
