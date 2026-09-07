import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, Brain, NotebookPen, RotateCcw } from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import { TargetGradeForm } from '@/features/subjects/components/target-grade-form';
import { formatGrade } from '@/lib/format/grade';
import { getSimuladoHistory, getSubjectScores } from '@/features/performance/server/queries';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PASSING_GRADE = 6;

type Params = { params: Promise<{ subjectId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { subjectId } = await params;
  return { title: subjectId ? 'Matéria' : 'Matérias' };
}

export default async function SubjectDetailPage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { subjectId } = await params;

  const supabase = await createClient();
  const [subjectRes, scores, simulados] = await Promise.all([
    supabase
      .from('subjects')
      .select('id, name, color, teacher_name')
      .eq('id', subjectId)
      .is('archived_at', null)
      .maybeSingle(),
    getSubjectScores(user.id),
    getSimuladoHistory(user.id),
  ]);

  if (!subjectRes.data) notFound();
  const subject = subjectRes.data;
  const score = scores.find((s) => s.subjectId === subjectId);
  if (!score) notFound();

  const subjectSimulados = simulados.filter((s) => s.subjectId === subjectId);
  const grade = score.blendedScore;

  const status = !score.hasContent
    ? 'Sem conteúdo do Nexa'
    : grade === null
      ? 'Sem nenhuma tentativa ainda'
      : grade < PASSING_GRADE
        ? 'Abaixo da aprovação'
        : score.targetGrade !== null && grade < score.targetGrade
          ? 'Abaixo da meta'
          : 'Meta batida';

  return (
    <div style={subjectColorVars(subject.color)}>
      {/* Cabeçalho na cor da matéria, como o guia de desktop mostra. */}
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
                {subject.name}
              </h1>
              {subject.teacher_name && (
                <p className="mt-0.5 truncate text-sm opacity-90">{subject.teacher_name}</p>
              )}
              <span className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                {status}
              </span>
            </div>

            <div className="shrink-0 text-right">
              <span className="tabular block text-4xl leading-none font-semibold">
                {formatGrade(grade, 1)}
              </span>
              <span className="mt-1 block text-xs opacity-90">
                {score.targetGrade !== null && `meta ${formatGrade(score.targetGrade, 1)} · `}
                aprovação {formatGrade(PASSING_GRADE, 1)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <PageMain className="space-y-4 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:space-y-0">
        {!score.hasContent ? (
          <div className="lg:col-span-2">
            <PopEmptyState
              icon={<BookOpen className="text-white" />}
              title="Sem conteúdo do Nexa vinculado"
              description="Essa matéria não tem quiz, simulado ou resumo no acervo ainda — por isso não dá pra calcular uma nota automática. Assim que a escola publicar conteúdo pra ela, a nota aparece aqui."
            />
          </div>
        ) : (
          <>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="text-brand size-4" aria-hidden />
                  Como a nota é composta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">Avaliativo (70%)</span>
                    <span className="tabular text-sm font-semibold">
                      {formatGrade(score.assessmentScore, 1)}
                    </span>
                  </div>
                  <p className="text-muted mt-1 text-xs leading-relaxed">
                    {score.quizzesDone} {score.quizzesDone === 1 ? 'quiz' : 'quizzes'} ·{' '}
                    {score.simuladosDone} {score.simuladosDone === 1 ? 'simulado' : 'simulados'}
                  </p>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">Empenho (30%)</span>
                    <span className="tabular text-sm font-semibold">
                      {Math.round(score.empenhoIndex)}%
                    </span>
                  </div>
                  <p className="text-muted mt-1 text-xs leading-relaxed">
                    {score.contentCompleted}{' '}
                    {score.contentCompleted === 1 ? 'conteúdo concluído' : 'conteúdos concluídos'}, e
                    quanto mais regular o estudo, maior esse número.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meta</CardTitle>
                </CardHeader>
                <CardContent>
                  <TargetGradeForm subjectId={subject.id} initialTarget={score.targetGrade} />
                </CardContent>
              </Card>
            </div>

            {subjectSimulados.length > 0 && (
              <Card className="min-w-0 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NotebookPen className="text-brand size-4" aria-hidden />
                    Simulados desta matéria
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-border divide-y">
                    {subjectSimulados.map((attempt) => (
                      <li key={attempt.attemptId}>
                        <Link
                          href={`/estudar/${attempt.resourceId}/resultado?tentativa=${attempt.attemptId}`}
                          className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{attempt.resourceTitle}</p>
                            <p className="text-subtle text-xs">
                              {new Date(attempt.finishedAt).toLocaleDateString('pt-BR')} ·{' '}
                              {attempt.correctCount}/{attempt.totalCount} acertos
                            </p>
                          </div>
                          <span className="tabular text-sm font-semibold">
                            {Math.round(attempt.percent)}%
                          </span>
                          <RotateCcw className="text-subtle size-4 shrink-0" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </PageMain>
    </div>
  );
}
