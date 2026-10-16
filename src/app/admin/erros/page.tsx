import { AdminHeader } from '@/features/admin/components/admin-shell';
import { requireAdmin } from '@/features/admin/server/guard';
import { ErrorList } from '@/features/observability/components/error-list';
import { listRecentErrors } from '@/features/observability/server/queries';

export const metadata = { title: 'Erros' };
export const dynamic = 'force-dynamic';

export default async function AdminErrorsPage() {
  await requireAdmin();
  const errors = await listRecentErrors(100);

  return (
    <>
      <AdminHeader
        title="Erros"
        description="O que quebrou para quem está usando o Nexa, do mais recente para o mais antigo."
      />
      <ErrorList errors={errors} />
    </>
  );
}
