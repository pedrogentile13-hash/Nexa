import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ThemeBank } from '@/features/essay/components/theme-bank';
import { listEssayThemes } from '@/features/essay/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Banco de temas',
  description: 'Temas reais e inspirados para treinar a redação do ENEM.',
};

export const dynamic = 'force-dynamic';

export default async function BancoDeTemasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const themes = await listEssayThemes();

  return (
    <>
      <AppHeader title="Banco de temas" subtitle="Escolha um tema para a sua redação" />
      <PageMain className="pt-4 md:pt-6">
        <ThemeBank themes={themes} />
      </PageMain>
    </>
  );
}
