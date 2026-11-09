import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { AnswerSheet } from '@/features/vestibular/components/answer-sheet';
import { getSheetLayout } from '@/features/vestibular/server/answer-sheet';
import { getExamEdition } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Cartão-resposta' };
export const dynamic = 'force-dynamic';

export default async function FazerProvaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const edition = await getExamEdition(id);
  if (!edition) notFound();
  const layout = await getSheetLayout(id);

  return (
    <>
      <AppHeader title={`${edition.examName} ${edition.year}`} subtitle="Cartão-resposta" />
      <PageMain className="pt-4 md:pt-6">
        <div className="mx-auto w-full max-w-3xl">
          {layout.length === 0 ? (
            <div className="border-border bg-surface rounded-2xl border p-5 text-sm">
              <p className="font-semibold">O gabarito digital desta prova ainda não está disponível.</p>
              <p className="text-muted mt-1">Assim que ele for cadastrado, você poderá marcar suas respostas aqui e ver a correção na hora.</p>
              <Link href={`/vestibular/provas/${id}` as Route} className="text-brand-text mt-3 inline-block font-semibold underline">
                Voltar à prova
              </Link>
            </div>
          ) : (
            <>
              <p className="text-muted mb-4 text-sm">
                Faça a prova no caderno oficial e marque aqui. Toque na letra para marcar e toque de novo para apagar. O Nexa corrige com o gabarito oficial.
              </p>
              <AnswerSheet editionId={id} layout={layout} />
            </>
          )}
        </div>
      </PageMain>
    </>
  );
}
