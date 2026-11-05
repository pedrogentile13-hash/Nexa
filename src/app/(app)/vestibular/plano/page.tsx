import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { StudyPlanView } from '@/features/vestibular/components/study-plan';
import { getVestibularStudyPlan } from '@/features/vestibular/server/plan-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Plano de estudo',
  description: 'Por onde começar: o que a sua prova mais cobra cruzado com o que você domina.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularPlanoPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const plan = await getVestibularStudyPlan(20);

  return (
    <>
      <AppHeader title="Plano de estudo" subtitle="Por onde começar" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <StudyPlanView plan={plan} />
        </div>
      </PageMain>
    </>
  );
}
