import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { PracticePlayer } from '@/features/vestibular/components/practice-player';
import { getPracticeQuestions } from '@/features/vestibular/server/practice-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Treino de questões',
  description: 'Responda questões avulsas de vestibular com correção na hora.',
};

export const dynamic = 'force-dynamic';

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { sessionId } = await params;
  const questions = await getPracticeQuestions(sessionId);
  // `practice_questions` devolve zero linhas para a sessão de outra pessoa —
  // o 404 aqui é, na prática, a resposta a "essa sessão não é sua".
  if (questions.length === 0) notFound();

  return (
    <>
      <AppHeader title="Treino" subtitle="Correção na hora" />
      <PageMain>
        <div className="mx-auto max-w-2xl py-4">
          <PracticePlayer sessionId={sessionId} questions={questions} />
        </div>
      </PageMain>
    </>
  );
}
