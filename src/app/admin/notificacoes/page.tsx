import { Bell } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ComingSoon } from '@/components/layout/coming-soon';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Notificações' };

export default async function AdminNotificationsPage() {
  await requireAdmin();

  return (
    <>
      <AdminHeader title="Notificações" description="Comunicados para os alunos" />
      <div className="p-5">
        <ComingSoon
          Icon={Bell}
          title="Notificações em construção"
          description="Em breve: envio de avisos e novidades para os alunos da plataforma."
          items={[
            'Aviso de novo conteúdo publicado',
            'Comunicados por escola ou turma',
            'Histórico de notificações enviadas',
          ]}
        />
      </div>
    </>
  );
}
