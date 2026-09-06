import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { GradeSheet } from '@/features/grades/components/grade-sheet';
import { TargetSolver } from '@/features/grades/components/target-solver';
import { computeSubjectTerm, formatGrade } from '@/features/grades';
import { getCurrentSubjectTermId, getSubjectTermDetail } from '@/features/grades/server/queries';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { getCurrentUser } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ subjectId: string }>; searchParams: Promise<{ st?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: subjectId ? 'Matéria' : 'Matérias' };
}

export default async function SubjectDetailPage({ params, searchParams }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [{ subjectId }, { st }] = await Promise.all([params, searchParams]);

  // `?st=` permite abrir um período específico; sem ele, cai no período atual.
  const subjectTermId = st ?? (await getCurrentSubjectTermId(subjectId, user.id));
  if (!subjectTermId) notFound();

  const detail = await getSubjectTermDetail(subjectTermId);
  if (!detail) notFound();

  // A média do cabeçalho vem do mesmo motor que a planilha usa — não de uma
  // segunda conta que poderia divergir dela na mesma tela.
  const result = computeSubjectTerm({
    scheme: detail.scheme,
    activities: detail.activities,
    targetGrade: detail.targetGrade,
    finalGradeOverride: detail.finalGradeOverride,
  });
  const grade = result.finalGrade;

  const status =
    grade === null
      ? 'Sem notas lançadas'
      : grade < detail.passingGrade
        ? 'Abaixo da aprovação'
        : detail.targetGrade !== null && grade < detail.targetGrade
          ? 'Abaixo da meta'
          : 'Meta batida';

  return (
    <div style={subjectColorVars(detail.subjectColor)}>
      {/* Cabeçalho na cor da matéria, como o guia de desktop mostra. O fundo é
          o degrau `deep` da paleta, o único validado para texto branco: o
          `base` reprova em contraste no laranja, e no tema escuro reprova em
          todas as dezoito cores. */}
      <header
        className="pt-safe rounded-b-[20px] px-4 pt-3 pb-5 text-white md:px-6 md:pb-6 lg:px-8"
        style={{ backgroundColor: 'var(--subject-deep)' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <Link
            href="/disciplinas"
            className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium opacity-90 hover:opacity-100"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Matérias
          </Link>

          <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h1 className="truncate text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
                {detail.subjectName}
              </h1>
              <p className="mt-0.5 truncate text-sm opacity-90">
                {[detail.teacherName, detail.termName].filter(Boolean).join(' · ')}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                {status}
              </span>
            </div>

            <div className="shrink-0 text-right">
              <span className="tabular block text-4xl leading-none font-semibold">
                {grade === null ? '—' : formatGrade(grade, detail.scheme.decimals)}
              </span>
              <span className="mt-1 block text-xs opacity-90">
                {detail.targetGrade !== null && `meta ${formatGrade(detail.targetGrade, 1)} · `}
                aprovação {formatGrade(detail.passingGrade, 1)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <PageMain className="space-y-4 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6 lg:space-y-0">
        {/* Seletor de período — o histórico está a um toque de distância. */}
        {detail.siblingTerms.length > 1 && (
          <nav
            aria-label="Períodos"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:col-span-2 lg:mx-0 lg:px-0"
          >
            {detail.siblingTerms.map((term) => {
              const active = term.subjectTermId === detail.subjectTermId;
              return (
                <Link
                  key={term.subjectTermId}
                  href={`/disciplinas/${subjectId}?st=${term.subjectTermId}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors',
                    active
                      ? 'border-brand bg-brand-soft text-brand-text'
                      : 'border-border bg-surface text-muted hover:bg-surface-2',
                  )}
                >
                  {term.termName}
                </Link>
              );
            })}
          </nav>
        )}

        {/* No desktop a planilha e o simulador ficam lado a lado: mexer numa
            nota e ver na mesma tela quanto ainda falta é o ciclo que a tela
            existe para fechar. Empilhados, ele exige rolagem a cada tecla. */}
        <div className="min-w-0">
          <GradeSheet
            subjectTermId={detail.subjectTermId}
            scheme={detail.scheme}
            initialActivities={detail.activities}
            finalGradeOverride={detail.finalGradeOverride}
            targetGrade={detail.targetGrade}
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-4">
          <TargetSolver
            scheme={detail.scheme}
            activities={detail.activities}
            initialTarget={detail.targetGrade}
          />
        </div>
      </PageMain>
    </div>
  );
}
