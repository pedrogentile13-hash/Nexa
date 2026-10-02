import Link from 'next/link';
import { FlaskConical, Plus } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { ResourceTable } from '@/features/admin/components/resource-table';
import { listResources } from '@/features/admin/server/queries';
import { Button } from '@/components/ui/button';
import { requireContentManager } from '@/features/admin/server/guard';

export const metadata = { title: 'Conteúdo' };

export default async function TeacherContentPage() {
  const identity = await requireContentManager();
  const resources =
    identity.allowedSubjectCatalogIds === 'all'
      ? []
      : await listResources({ subjectId: identity.allowedSubjectCatalogIds });

  return (
    <>
      <TeacherHeader
        title="Conteúdo"
        description="Resumos, vídeos, quiz e simulados das suas matérias."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/professor/conteudo/importar-simulado">
                <FlaskConical aria-hidden />
                Importar por código
              </Link>
            </Button>
            <Button asChild>
              <Link href="/professor/conteudo/novo">
                <Plus aria-hidden />
                Novo conteúdo
              </Link>
            </Button>
          </div>
        }
      />
      <div className="p-5">
        <ResourceTable resources={resources} basePath="/professor/conteudo" />
      </div>
    </>
  );
}
