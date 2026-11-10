import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { AnswerSheet } from '@/features/vestibular/components/answer-sheet';
import { getKeyVariants, getSheetLayout } from '@/features/vestibular/server/answer-sheet';
import { pairingKey } from '@/features/vestibular/lib/classify-file';
import { getExamEdition, listExamFiles } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Cartão-resposta' };
export const dynamic = 'force-dynamic';

export default async function FazerProvaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ caderno?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const edition = await getExamEdition(id);
  if (!edition) notFound();
  const { caderno } = await searchParams;
  const variants = await getKeyVariants(id);
  const named = variants.filter((v) => v.variant !== '');
  // Vários cadernos: o aluno escolhe a cor do dele antes de marcar (cada cor tem o seu gabarito).
  const chosen = named.some((v) => v.variant === caderno) ? (caderno ?? '') : named.length === 1 ? named[0]!.variant : '';
  const needsPick = named.length > 1 && !chosen;
  const layout = needsPick ? [] : await getSheetLayout(id, chosen);
  // O caderno de questões da mesma cor (dia + cor): o padrão que liga caderno e gabarito.
  const files = chosen ? await listExamFiles(id) : [];
  const notebook = chosen ? files.find((f) => f.kind === 'caderno' && pairingKey(f.label) === pairingKey(chosen)) ?? null : null;

  return (
    <>
      <AppHeader title={`${edition.examName} ${edition.year}`} subtitle="Cartão-resposta" />
      <PageMain className="pt-4 md:pt-6">
        <div className="mx-auto w-full max-w-3xl">
          {needsPick ? (
            <div className="border-border bg-surface rounded-2xl border p-5">
              <h2 className="text-base font-semibold">Qual é a cor do seu caderno?</h2>
              <p className="text-muted mt-1 text-sm">A cor está na capa do caderno. Cada cor tem as questões em outra ordem e, por isso, o seu próprio gabarito.</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {named.map((v) => (
                  <li key={v.variant}>
                    <Link
                      href={`/vestibular/provas/${id}/fazer?caderno=${encodeURIComponent(v.variant)}` as Route}
                      className="border-border hover:bg-surface-2 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold"
                    >
                      {v.variant}
                      <span className="text-muted text-xs font-normal">{v.total} questões</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : layout.length === 0 ? (
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
              {chosen && (
                <p className="bg-brand-soft text-brand-text mb-4 flex flex-wrap items-center gap-x-3 rounded-xl px-3 py-2 text-sm font-semibold">
                  <span>Caderno: {chosen}</span>
                  {notebook && (
                    <Link href={`/vestibular/provas/${id}/ler/${notebook.id}` as Route} className="underline underline-offset-2">
                      Abrir o caderno de questões
                    </Link>
                  )}
                </p>
              )}
              <AnswerSheet editionId={id} layout={layout} variant={chosen} />
            </>
          )}
        </div>
      </PageMain>
    </>
  );
}
