import { notFound } from 'next/navigation';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { TeacherResourceForm } from '@/features/teacher/components/teacher-resource-form';
import { kindLabel } from '@/features/admin/lib/labels';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { getTeacherResource, teacherSubjectOptions } from '@/features/teacher/server/queries';

export default async function EditTeacherResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireTeacher();
  const { id } = await params;

  const [resource, assignments] = await Promise.all([
    getTeacherResource(id),
    getTeacherAssignments(identity.userId),
  ]);
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
      <div className="p-5">
        <TeacherResourceForm subjects={teacherSubjectOptions(assignments)} resource={resource} />
      </div>
    </>
  );
}
