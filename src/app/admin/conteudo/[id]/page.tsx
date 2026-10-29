import { notFound } from 'next/navigation';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ResourceForm } from '@/features/admin/components/resource-form';
import { getResource, getResourceFormOptions } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { kindLabel } from '@/features/admin/lib/labels';

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await requireAdmin();
  const { id } = await params;

  const [resource, options] = await Promise.all([
    getResource(id),
    getResourceFormOptions(identity),
  ]);
  if (!resource) notFound();

  return (
    <>
      <AdminHeader
        title={resource.title}
        description={`${kindLabel(resource.kind)} · ${resource.is_published ? 'publicado' : 'rascunho'}`}
      />
      <div className="max-w-3xl p-5">
        <ResourceForm options={options} resource={resource} canChooseSchool={identity.isGlobal} />
      </div>
    </>
  );
}
