import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularHomeView } from '@/features/vestibular/components/vestibular-home';
import { VestibularSetup } from '@/features/vestibular/components/vestibular-setup';
import {
  getVestibularHome,
  getVestibularProfile,
  listExams,
} from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Vestibular',
  description: 'Sua preparação: contagem regressiva, o próximo passo e o seu desempenho.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [profile, exams] = await Promise.all([getVestibularProfile(), listExams()]);

  // Quem chega aqui vindo do onboarding do vestibular já tem objetivo. Esta
  // tela é pra quem veio da jornada escolar e está entrando na plataforma
  // pela primeira vez — sem prova escolhida, o painel inteiro seria vazio.
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

  const home = await getVestibularHome();

  return (
    <>
      <AppHeader
        title="Minha preparação"
        subtitle={profile.mainExamName ? `Foco: ${profile.mainExamName}` : undefined}
      />
      <PageMain>
        <div className="mx-auto max-w-2xl space-y-6 py-4">
          {home && <VestibularHomeView home={home} />}

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
