import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { ResourceForm } from '@/features/admin/components/resource-form';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { requireContentManager } from '@/features/admin/server/guard';

export const metadata = { title: 'Novo conteúdo' };

export default async function NewTeacherResourcePage() {
  const identity = await requireContentManager();
  const options = await getResourceFormOptions(identity);

  return (
    <>
      <TeacherHeader
        title="Novo conteúdo"
        description="Sempre publicado na sua escola, numa das suas matérias."
      />
      <div className="max-w-3xl p-5">
        <ResourceForm options={options} canChooseSchool={false} basePath="/professor/conteudo" />
      </div>
    </>
  );
}
