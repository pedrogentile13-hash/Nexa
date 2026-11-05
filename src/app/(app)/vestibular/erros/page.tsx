import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ErrorCenter } from '@/features/vestibular/components/error-center';
import {
  getVestibularSubjectPerformance,
  listVestibularErrors,
} from '@/features/vestibular/server/performance-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Central de erros',
  description: 'As questões de vestibular que você ainda erra — e o botão para refazê-las.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularErrosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [errors, subjects] = await Promise.all([
    listVestibularErrors(),
    getVestibularSubjectPerformance(),
  ]);

  return (
    <>
      <AppHeader title="Central de erros" subtitle="O que você ainda erra" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <ErrorCenter errors={errors} subjects={subjects} />
        </div>
      </PageMain>
    </>
  );
}
