import Link from 'next/link';
import { Plus } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { TeacherResourceList } from '@/features/teacher/components/teacher-resource-list';
import { Button } from '@/components/ui/button';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { getTeacherContent } from '@/features/teacher/server/queries';

export const metadata = { title: 'Conteúdo' };

export default async function TeacherContentPage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const resources = await getTeacherContent(assignments);

  return (
    <>
      <TeacherHeader
        title="Conteúdo"
        description="Resumos, vídeos e simulados das suas matérias."
        action={
          <Button asChild>
            <Link href="/professor/conteudo/novo">
              <Plus aria-hidden />
              Novo conteúdo
            </Link>
          </Button>
        }
      />
      <div className="p-5">
        <TeacherResourceList resources={resources} />
      </div>
    </>
  );
}
