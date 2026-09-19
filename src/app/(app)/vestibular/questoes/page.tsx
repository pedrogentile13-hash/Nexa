import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularResourceList } from '@/features/vestibular/components/vestibular-resource-list';
import { listVestibularResources } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Questões',
  description: 'Provas anteriores e simulados para a sua preparação.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularQuestoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const resources = await listVestibularResources();

  return (
    <>
      <AppHeader title="Questões" subtitle="Provas anteriores e simulados" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <VestibularResourceList resources={resources} />
        </div>
      </PageMain>
    </>
  );
}
