import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { GradeSheet } from '@/features/grades/components/grade-sheet';
import { TargetSolver } from '@/features/grades/components/target-solver';
import { getCurrentSubjectTermId, getSubjectTermDetail } from '@/features/grades/server/queries';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { getCurrentUser } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ subjectId: string }>; searchParams: Promise<{ st?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: subjectId ? 'Disciplina' : 'Disciplinas' };
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

  return (
    <div style={subjectColorVars(detail.subjectColor)}>
      <AppHeader title={detail.subjectName} subtitle={detail.termName} />

      <PageMain className="space-y-4">
        <Link
          href="/disciplinas"
          className="text-muted hover:text-text -mt-1 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Todas as disciplinas
        </Link>

        {/* Seletor de período — o histórico está a um toque de distância. */}
        {detail.siblingTerms.length > 1 && (
          <nav aria-label="Períodos" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {detail.siblingTerms.map((term) => {
              const active = term.subjectTermId === detail.subjectTermId;
              return (
                <Link
                  key={term.subjectTermId}
                  href={`/disciplinas/${subjectId}?st=${term.subjectTermId}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
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

        <GradeSheet
          subjectTermId={detail.subjectTermId}
          scheme={detail.scheme}
          initialActivities={detail.activities}
          finalGradeOverride={detail.finalGradeOverride}
          targetGrade={detail.targetGrade}
        />

        <TargetSolver
          scheme={detail.scheme}
          activities={detail.activities}
          initialTarget={detail.targetGrade}
        />
      </PageMain>
    </div>
  );
}
