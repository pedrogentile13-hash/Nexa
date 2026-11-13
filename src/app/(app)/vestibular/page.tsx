import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularHomeView } from '@/features/vestibular/components/vestibular-home';
import { buildExamBank } from '@/features/vestibular/lib/exam-bank';
import { VestibularSetup } from '@/features/vestibular/components/vestibular-setup';
import {
  getVestibularHome,
  getVestibularProfile,
  listExamEditions,
  listExamFiles,
  listExams,
  listVestibularResources,
} from '@/features/vestibular/server/queries';
import { isVestibularEnabled } from '@/lib/vestibular-access';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Vestibular',
  description: 'Sua preparação: contagem regressiva, o próximo passo e o seu desempenho.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isVestibularEnabled())) redirect('/hoje');

  const [profile, exams] = await Promise.all([getVestibularProfile(), listExams()]);

  // Quem chega aqui vindo do onboarding do vestibular já tem objetivo. Esta
  // tela é pra quem veio da jornada escolar e está entrando na plataforma
  // pela primeira vez — sem prova escolhida, o painel inteiro seria vazio.
  if (!profile?.mainExamId) {
    return (
      <>
        <AppHeader title="Vestibular" subtitle="Comece definindo seu objetivo" />
        <PageMain>
          <div className="max-w-xl py-4">
            <VestibularSetup exams={exams} />
          </div>
        </PageMain>
      </>
    );
  }

  const [home, resources, editions, files] = await Promise.all([getVestibularHome(), listVestibularResources(), listExamEditions(), listExamFiles()]);
  const fileCounts: Record<string, number> = {};
  for (const f of files) fileCounts[f.editionId] = (fileCounts[f.editionId] ?? 0) + 1;
  // Provas recentes da home: só as que já têm questões, as mais novas primeiro.
  const recentExams = buildExamBank(resources, editions, fileCounts).filter((i) => i.resourceId !== null).slice(0, 8);

  return (
    <>
      <AppHeader
        title="Minha preparação"
        subtitle={profile.mainExamName ? `Foco: ${profile.mainExamName}` : undefined}
      />
      <PageMain className="pt-4 md:pt-6">
        <div className="space-y-8">
          {home && <VestibularHomeView home={home} recentExams={recentExams} />}

          <details className="border-border bg-surface max-w-2xl rounded-2xl border p-4">
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
