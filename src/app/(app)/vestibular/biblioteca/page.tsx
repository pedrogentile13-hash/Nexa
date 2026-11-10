import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularLibrary } from '@/features/vestibular/components/vestibular-library';
import { buildLibrary } from '@/features/vestibular/lib/library';
import { listExamEditions, listExamFiles, listVestibularResources } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Biblioteca do Vestibular',
  description: 'Simulados, cadernos oficiais, quizzes e resumos, organizados por banca.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularLibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [resources, editions, files] = await Promise.all([listVestibularResources({}, 200), listExamEditions(), listExamFiles()]);
  const fileCounts: Record<string, number> = {};
  for (const f of files) fileCounts[f.editionId] = (fileCounts[f.editionId] ?? 0) + 1;

  const items = buildLibrary(resources, editions, fileCounts);
  const coverByBanca: Record<string, string | null> = {};
  for (const e of editions) coverByBanca[e.examName.toUpperCase()] ??= e.coverUrl;

  return (
    <>
      <AppHeader title="Biblioteca" subtitle="Vestibular" />
      <PageMain className="pt-4 md:pt-6">
        <VestibularLibrary items={items} coverByBanca={coverByBanca} />
      </PageMain>
    </>
  );
}
