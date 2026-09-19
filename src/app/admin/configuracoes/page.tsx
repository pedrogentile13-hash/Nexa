import { Settings } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ComingSoon } from '@/components/layout/coming-soon';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Configurações' };

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <>
      <AdminHeader title="Configurações" description="Preferências da plataforma" />
      <div className="p-5">
        <ComingSoon
          Icon={Settings}
          title="Configurações em construção"
          description="Em breve: preferências gerais da plataforma e integrações."
          items={[
            'Preferências de marca e identidade visual',
            'Integrações externas',
            'Permissões avançadas por papel',
          ]}
        />
      </div>
    </>
  );
}
