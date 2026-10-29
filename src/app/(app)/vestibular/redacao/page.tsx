import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { EssayCorrector } from '@/features/essay/components/essay-corrector';
import { listEssays } from '@/features/essay/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Redação',
  description: 'Correção estimada nas 5 competências do ENEM, com a sua evolução.',
};

export const dynamic = 'force-dynamic';

export default async function EssayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const history = await listEssays();

  return (
    <>
      <AppHeader title="Redação" subtitle="Correção nas 5 competências do ENEM" />
      <PageMain>
        <EssayCorrector history={history} />
      </PageMain>
    </>
  );
}
