import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { EssayList } from '@/features/essay/components/essay-list';
import { listEssays } from '@/features/essay/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Minhas redações',
  description: 'Suas redações corrigidas, cada uma com o próprio laudo.',
};

export const dynamic = 'force-dynamic';

export default async function MinhasRedacoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const history = await listEssays(60);

  return (
    <>
      <AppHeader title="Minhas redações" subtitle="Um laudo para cada redação" />
      <PageMain className="pt-4 md:pt-6">
        <EssayList history={history} />
      </PageMain>
    </>
  );
}
