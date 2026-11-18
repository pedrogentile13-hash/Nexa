import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { AnnouncementsManager } from '@/features/announcements/components/announcements-manager';
import { listAnnouncements } from '@/features/announcements/server/queries';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { teacherClassOptions } from '@/features/teacher/server/queries';

export const metadata = { title: 'Mural' };

export const dynamic = 'force-dynamic';

export default async function TeacherMuralPage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const announcements = await listAnnouncements();

  return (
    <>
      <TeacherHeader
        title="Mural da turma"
        description="Avisos oficiais para as suas turmas. Ficam guardados e você vê quem confirmou a leitura."
      />
      <div className="p-5">
        <AnnouncementsManager announcements={announcements} classes={teacherClassOptions(assignments)} canSchoolWide={false} />
      </div>
    </>
  );
}
