import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ReportsOverview } from '@/features/admin/components/reports-overview';
import { getAdminReportsOverview } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Relatórios' };
export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const identity = await requireAdmin();
  const data = await getAdminReportsOverview(identity);

  return (
    <>
      <AdminHeader
        title="Relatórios"
        description="Engajamento e desempenho agregado, sempre a partir do que os alunos fizeram de verdade."
      />
      <ReportsOverview data={data} />
    </>
  );
}
