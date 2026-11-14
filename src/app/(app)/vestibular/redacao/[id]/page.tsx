import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { EssayLaudo } from '@/features/essay/components/essay-laudo';
import { getEssay } from '@/features/essay/server/queries';
import { isVestibularEnabled } from '@/lib/vestibular-access';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Laudo da redação' };

export const dynamic = 'force-dynamic';

export default async function LaudoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isVestibularEnabled())) redirect('/hoje');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const essay = await getEssay(id);
  if (!essay) notFound();

  return (
    <>
      <AppHeader title="Laudo da redação" subtitle="Folha de correção" />
      <PageMain className="pt-4 md:pt-6">
        <EssayLaudo essay={essay} />
      </PageMain>
    </>
  );
}
