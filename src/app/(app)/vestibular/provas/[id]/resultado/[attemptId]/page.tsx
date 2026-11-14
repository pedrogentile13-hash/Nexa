import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { AttemptResult } from '@/features/vestibular/components/attempt-result';
import { getAttemptReview, getMyAttempt } from '@/features/vestibular/server/answer-sheet';
import { getExamEdition } from '@/features/vestibular/server/queries';
import { isVestibularEnabled } from '@/lib/vestibular-access';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Resultado' };
export const dynamic = 'force-dynamic';

export default async function ResultadoPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isVestibularEnabled())) redirect('/hoje');

  const { id, attemptId } = await params;
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(attemptId).success) notFound();
  const [edition, attempt, review] = await Promise.all([getExamEdition(id), getMyAttempt(attemptId), getAttemptReview(attemptId)]);
  if (!edition || !attempt || attempt.exam_edition_id !== id) notFound();

  return (
    <>
      <AppHeader title={`${edition.examName} ${edition.year}`} subtitle={attempt.variant ? `Resultado · Caderno ${attempt.variant}` : 'Resultado'} />
      <PageMain className="pt-4 md:pt-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <AttemptResult attempt={attempt} review={review} />
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/vestibular/provas/${id}/fazer` as Route} className="bg-brand text-brand-fg inline-flex h-11 items-center rounded-full px-5">
              Fazer de novo
            </Link>
            <Link href={`/vestibular/provas/${id}` as Route} className="text-brand-text inline-flex h-11 items-center px-2 underline">
              Voltar à prova
            </Link>
          </div>
        </div>
      </PageMain>
    </>
  );
}
