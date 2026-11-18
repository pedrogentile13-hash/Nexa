import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { SimuladosView } from '@/features/simulados/components/simulados-view';
import { getSimuladoCatalog } from '@/features/simulados/server/queries';
import { getSimuladoHistory } from '@/features/performance/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Simulados',
  description: 'Todos os simulados disponíveis e seu histórico de tentativas.',
};

export const dynamic = 'force-dynamic';

export default async function SimuladosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [catalog, history] = await Promise.all([
    getSimuladoCatalog(),
    getSimuladoHistory(user.id),
  ]);

  return (
    <>
      <AppHeader title="Simulados" subtitle="Disponíveis e seu histórico de tentativas" />
      <PageMain className="pt-4 md:pt-6">
        <SimuladosView catalog={catalog} history={history} />
      </PageMain>
    </>
  );
}
