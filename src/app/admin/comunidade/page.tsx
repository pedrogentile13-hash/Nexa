import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ReportsPanel } from '@/features/community/components/reports-panel';
import { getReports } from '@/features/community/server/moderation-actions';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Comunidade' };
export const dynamic = 'force-dynamic';

export default async function AdminComunidadePage() {
  await requireAdmin();
  const reports = await getReports('pending');

  return (
    <>
      <AdminHeader
        title="Comunidade"
        description="Denúncias de posts, comentários e mensagens do Nexa Community — resolva ou descarte."
      />
      <ReportsPanel initial={reports} />
    </>
  );
}
