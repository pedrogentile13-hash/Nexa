import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ComingSoon } from '@/components/layout/coming-soon';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Revisões',
  description: 'Fila de revisão inteligente do que você estudou.',
};

export const dynamic = 'force-dynamic';

export default async function RevisoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <AppHeader title="Revisões" subtitle="Fixe o que você já estudou" />
      <PageMain className="pt-4">
        <ComingSoon
          Icon={RotateCcw}
          title="Revisões inteligentes chegando"
          description="Em breve: uma fila que organiza o que revisar hoje, o que vem a seguir e o que está atrasado — juntando questões erradas e conteúdo estudado. Enquanto isso, a Central de Erros continua em /erros normalmente."
          items={[
            'Revisões de hoje, próximas, atrasadas e concluídas',
            'Repetição espaçada baseada no que você já estudou',
            'Sequência de dias revisando e contador de conteúdos revisados',
          ]}
        />
      </PageMain>
    </>
  );
}
