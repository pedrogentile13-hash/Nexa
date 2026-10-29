import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { QuestionsHub } from '@/features/vestibular/components/questions-hub';
import {
  getPracticeFilters,
  listPracticeSessions,
} from '@/features/vestibular/server/practice-queries';
import { listVestibularResources } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Questões',
  description: 'Treine questões avulsas ou resolva provas anteriores inteiras.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularQuestoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [resources, filters, sessions] = await Promise.all([
    listVestibularResources(),
    getPracticeFilters(),
    listPracticeSessions(),
  ]);

  return (
    <>
      <AppHeader title="Questões" subtitle="Treino avulso e provas anteriores" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <QuestionsHub resources={resources} filters={filters} sessions={sessions} />
        </div>
      </PageMain>
    </>
  );
}
