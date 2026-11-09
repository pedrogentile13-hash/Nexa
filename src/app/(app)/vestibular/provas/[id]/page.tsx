import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { listEssayThemes } from '@/features/essay/server/queries';
import { EditionFiles } from '@/features/vestibular/components/edition-files';
import { getExamEdition, listExamFiles, listVestibularResources } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Prova' };

export const dynamic = 'force-dynamic';

export default async function EdicaoDaProvaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const edition = await getExamEdition(id);
  if (!edition) notFound();

  const [files, resources, themes] = await Promise.all([listExamFiles(id), listVestibularResources(), listEssayThemes()]);

  return (
    <>
      <AppHeader title={`${edition.examName} ${edition.year}`} subtitle="Caderno, gabarito e redação" />
      <PageMain className="pt-4 md:pt-6">
        <EditionFiles
          examName={edition.examName}
          year={edition.year}
          coverUrl={edition.coverUrl}
          files={files}
          resources={resources.filter((r) => r.examName === edition.examName && r.editionYear === edition.year)}
          themes={themes.filter((t) => t.kind === 'real' && t.examName === edition.examName && t.year === edition.year)}
        />
      </PageMain>
    </>
  );
}
