import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularPerformance } from '@/features/vestibular/components/vestibular-performance';
import {
  getVestibularSubjectPerformance,
  getVestibularTopicPerformance,
} from '@/features/vestibular/server/performance-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Desempenho da preparação',
  description: 'Seu domínio por matéria e por assunto nas questões de vestibular.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularDesempenhoPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [subjects, topics] = await Promise.all([
    getVestibularSubjectPerformance(),
    getVestibularTopicPerformance(),
  ]);

  return (
    <>
      <AppHeader title="Desempenho" subtitle="Seu mapa de domínio no vestibular" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <VestibularPerformance subjects={subjects} topics={topics} />
        </div>
      </PageMain>
    </>
  );
}
