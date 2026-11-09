import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { EditionReader } from '@/features/vestibular/components/edition-reader';
import { isReadable } from '@/features/vestibular/lib/reader';
import { getExamEdition, listExamFiles } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Ler a prova' };

export const dynamic = 'force-dynamic';

export default async function LerArquivoPage({ params }: { params: Promise<{ id: string; fileId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { id, fileId } = await params;
  const uuid = z.string().uuid();
  if (!uuid.safeParse(id).success || !uuid.safeParse(fileId).success) notFound();

  const [edition, files] = await Promise.all([getExamEdition(id), listExamFiles(id)]);
  if (!edition) notFound();
  const current = files.find((f) => f.id === fileId);
  if (!current || !isReadable(current)) notFound();

  return (
    <>
      <AppHeader title={`${edition.examName} ${edition.year}`} subtitle={current.label} />
      <PageMain className="pt-4 md:pt-6">
        <EditionReader
          editionId={edition.id}
          examName={edition.examName}
          year={edition.year}
          coverUrl={edition.coverUrl}
          files={files}
          current={current}
        />
      </PageMain>
    </>
  );
}
