import { notFound } from 'next/navigation';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { ResourceForm } from '@/features/admin/components/resource-form';
import { getResource, getResourceFormOptions } from '@/features/admin/server/queries';
import { requireContentManager } from '@/features/admin/server/guard';
import { kindLabel } from '@/features/admin/lib/labels';

export default async function EditTeacherResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireContentManager();
  const { id } = await params;

  const [resource, options] = await Promise.all([getResource(id), getResourceFormOptions(identity)]);
  // RLS (`is_teacher_of`) já barra a leitura de um recurso fora da própria
  // matéria+escola — chegar aqui com `resource === null` é "não existe" ou
  // "não autorizado", tratados igual.
  if (!resource) notFound();

  return (
    <>
      <TeacherHeader
        title={resource.title}
        description={`${kindLabel(resource.kind)} · ${resource.is_published ? 'publicado' : 'rascunho'}`}
      />
      <div className="max-w-3xl p-5">
        <ResourceForm
          options={options}
          resource={resource}
          canChooseSchool={false}
          basePath="/professor/conteudo"
        />
      </div>
    </>
  );
}
