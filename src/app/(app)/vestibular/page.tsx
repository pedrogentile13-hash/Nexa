import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularDashboard } from '@/features/vestibular/components/vestibular-dashboard';
import { VestibularSetup } from '@/features/vestibular/components/vestibular-setup';
import {
  getVestibularOverview,
  getVestibularProfile,
  listExams,
} from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Vestibular',
  description: 'Sua preparação para o vestibular: contagem regressiva, questões e desempenho.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [profile, exams] = await Promise.all([getVestibularProfile(), listExams()]);

  // Sem objetivo definido, a tela inteira é a pergunta — não faz sentido
  // mostrar painel vazio de quem ainda não disse qual prova vai fazer.
  if (!profile?.mainExamId) {
    return (
      <>
        <AppHeader title="Vestibular" subtitle="Comece definindo seu objetivo" />
        <PageMain>
          <div className="mx-auto max-w-xl py-4">
            <VestibularSetup exams={exams} />
          </div>
        </PageMain>
      </>
    );
  }

  const overview = await getVestibularOverview();

  return (
    <>
      <AppHeader
        title="Vestibular"
        subtitle={profile.mainExamName ? `Foco: ${profile.mainExamName}` : 'Sua preparação'}
      />
      <PageMain>
        <div className="mx-auto max-w-2xl space-y-6 py-4">
          <VestibularDashboard overview={overview} />
          <details className="border-border bg-surface rounded-2xl border p-4">
            <summary className="cursor-pointer text-sm font-semibold">Mudar meu objetivo</summary>
            <div className="mt-4">
              <VestibularSetup
                exams={exams}
                current={{
                  mainExamId: profile.mainExamId,
                  targetYear: profile.targetYear,
                  dailyStudyMinutes: profile.dailyStudyMinutes,
                }}
              />
            </div>
          </details>
        </div>
      </PageMain>
    </>
  );
}
