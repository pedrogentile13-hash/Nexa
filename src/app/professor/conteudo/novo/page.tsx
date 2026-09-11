import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { TeacherResourceForm } from '@/features/teacher/components/teacher-resource-form';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { teacherSubjectOptions } from '@/features/teacher/server/queries';

export const metadata = { title: 'Novo conteúdo' };

export default async function NewTeacherResourcePage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const subjects = teacherSubjectOptions(assignments);

  return (
    <>
      <TeacherHeader
        title="Novo conteúdo"
        description="Sempre publicado na sua escola, numa das suas matérias."
      />
      <div className="p-5">
        <TeacherResourceForm subjects={subjects} />
      </div>
    </>
  );
}
