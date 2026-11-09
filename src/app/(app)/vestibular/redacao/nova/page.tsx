import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { EssayCorrector } from '@/features/essay/components/essay-corrector';
import { listEssayThemes } from '@/features/essay/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Nova redação',
  description: 'Escolha um tema, escreva e receba o laudo nas 5 competências do ENEM.',
};

export const dynamic = 'force-dynamic';

export default async function NovaRedacaoPage({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { tema } = await searchParams;
  const themes = await listEssayThemes();

  return (
    <>
      <AppHeader title="Nova redação" subtitle="Escolha o tema e corrija" />
      <PageMain className="pt-4 md:pt-6">
        <EssayCorrector themes={themes} initialThemeId={tema ?? null} />
      </PageMain>
    </>
  );
}
