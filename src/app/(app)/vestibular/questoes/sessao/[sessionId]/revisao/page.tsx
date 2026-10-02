import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { PracticeReview } from '@/features/vestibular/components/practice-review';
import { getPracticeReview } from '@/features/vestibular/server/practice-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Revisão do treino',
  description: 'O que você acertou, o que errou e por quê.',
};

export const dynamic = 'force-dynamic';

export default async function PracticeReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { sessionId } = await params;
  const items = await getPracticeReview(sessionId);
  // Zero linhas = sessão de outra pessoa OU sessão ainda em andamento
  // (`practice_session_review` exige `finished_at`). Nos dois casos, não há
  // revisão a mostrar.
  if (items.length === 0) notFound();

  return (
    <>
      <AppHeader title="Revisão" subtitle="Correção do treino" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <PracticeReview items={items} />
        </div>
      </PageMain>
    </>
  );
}
