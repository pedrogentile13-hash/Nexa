import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ResourceForm } from '@/features/admin/components/resource-form';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Novo conteúdo' };

export default async function NewResourcePage() {
  const identity = await requireAdmin();
  const options = await getResourceFormOptions(identity);

  return (
    <>
      <AdminHeader
        title="Novo conteúdo"
        description="O formato decide os campos. Nada é publicado enquanto você não ligar o interruptor."
      />
      <div className="max-w-3xl p-5">
        <ResourceForm options={options} canChooseSchool={identity.isGlobal} />
      </div>
    </>
  );
}
