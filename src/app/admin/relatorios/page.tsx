import { BarChart3 } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ComingSoon } from '@/components/layout/coming-soon';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Relatórios' };

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <>
      <AdminHeader title="Relatórios" description="Análises da plataforma" />
      <div className="p-5">
        <ComingSoon
          Icon={BarChart3}
          title="Relatórios em construção"
          description="Em breve: relatórios de uso, engajamento e desempenho agregado da plataforma."
          items={[
            'Exportação de dados por período',
            'Comparativos entre escolas e turmas',
            'Indicadores de engajamento com conteúdo',
          ]}
        />
      </div>
    </>
  );
}
