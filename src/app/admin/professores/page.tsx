import { AdminHeader } from '@/features/admin/components/admin-shell';
import { TeacherAssignmentsManager } from '@/features/admin/components/teacher-assignments-manager';
import {
  getResourceFormOptions,
  listAllClasses,
  listTeacherAssignments,
  listTeachers,
} from '@/features/admin/server/queries';
import { listSchoolClasses } from '@/features/classes/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Professores' };

export default async function TeacherAssignmentsPage() {
  const identity = await requireAdmin();
  const [assignments, teachers, options, classes] = await Promise.all([
    listTeacherAssignments(),
    listTeachers(identity.isGlobal ? undefined : (identity.schoolId ?? undefined)),
    getResourceFormOptions(identity),
    identity.isGlobal
      ? listAllClasses()
      : identity.schoolId
        ? listSchoolClasses(identity.schoolId).then((cs) =>
            cs.map((c) => ({ ...c, schoolName: null })),
          )
        : Promise.resolve([]),
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
          classes={classes}
          isGlobal={identity.isGlobal}
        />
      </div>
    </>
  );
}
