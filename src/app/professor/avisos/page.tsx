import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { TeacherNoticeForm } from '@/features/teacher/components/teacher-notice-form';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { teacherClassOptions, teacherSubjectOptions } from '@/features/teacher/server/queries';

export const metadata = { title: 'Avisos' };

export default async function TeacherNoticesPage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);

  return (
    <>
      <TeacherHeader
        title="Avisos"
        description="Manda uma notificação pra todo aluno de uma turma+matéria sua."
      />
      <div className="p-5">
        <TeacherNoticeForm
          subjects={teacherSubjectOptions(assignments)}
          classes={teacherClassOptions(assignments)}
        />
      </div>
    </>
  );
}
