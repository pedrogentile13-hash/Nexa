import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { PopEmptyState } from '@/components/ui/empty-state';
import { SubjectTabs, type SubjectContentItem, type SubjectTrackItem } from '@/features/subjects/components/subject-tabs';
import { formatGrade } from '@/lib/format/grade';
import { getSimuladoHistory, getSubjectScores } from '@/features/performance/server/queries';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { subjectIcon } from '@/lib/design/subject-icon';
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
      .select('id, name, color, icon, teacher_name, catalog_id')
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
  const Icon = subjectIcon(subject.icon);

  const status = !score.hasContent
    ? 'Sem conteúdo do Nexa'
    : grade === null
      ? 'Sem nenhuma tentativa ainda'
      : grade < PASSING_GRADE
        ? 'Abaixo da aprovação'
        : score.targetGrade !== null && grade < score.targetGrade
          ? 'Abaixo da meta'
          : 'Meta batida';

  let content: SubjectContentItem[] = [];
  let tracks: SubjectTrackItem[] = [];
  let topics: Awaited<ReturnType<typeof loadTopics>> = [];

  if (subject.catalog_id) {
    const [libraryRes, progressRes, tracksRes, lessonsRes, masteryRes] = await Promise.all([
      supabase
        .from('v_resource_library')
        .select('id, kind, title, duration_seconds')
        .eq('subject_catalog_id', subject.catalog_id)
        .order('sort_order'),
      supabase.from('resource_progress').select('resource_id, completed_at'),
      supabase
        .from('tracks')
        .select('id, title')
        .eq('subject_catalog_id', subject.catalog_id)
        .eq('is_published', true),
      supabase.from('v_track_lessons_resolved').select('track_id, raw_state'),
      loadTopics(user.id, subject.catalog_id),
    ]);

    const completedResourceIds = new Set(
      (progressRes.data ?? []).filter((p) => p.completed_at).map((p) => p.resource_id),
    );
    content = (libraryRes.data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      durationSeconds: r.duration_seconds,
      completed: completedResourceIds.has(r.id),
    }));

    const lessonsByTrack = new Map<string, { done: number; total: number }>();
    for (const lesson of lessonsRes.data ?? []) {
      const entry = lessonsByTrack.get(lesson.track_id) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (lesson.raw_state === 'done' || lesson.raw_state === 'mastered') entry.done += 1;
      lessonsByTrack.set(lesson.track_id, entry);
    }
    tracks = (tracksRes.data ?? []).map((t) => {
      const counts = lessonsByTrack.get(t.id) ?? { done: 0, total: 0 };
      return { id: t.id, title: t.title, done: counts.done, total: counts.total };
    });

    topics = masteryRes;
  }

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
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm"
              >
                <Icon className="size-5" />
              </span>
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

      <PageMain className="space-y-4 pt-4">
        {!score.hasContent ? (
          <PopEmptyState
            icon={<BookOpen className="text-white" />}
            title="Sem conteúdo do Nexa vinculado"
            description="Essa matéria não tem quiz, simulado ou resumo no acervo ainda — por isso não dá pra calcular uma nota automática. Assim que a escola publicar conteúdo pra ela, a nota aparece aqui."
          />
        ) : (
          <SubjectTabs
            subjectId={subject.id}
            score={score}
            content={content}
            tracks={tracks}
            topics={topics}
            simulados={subjectSimulados}
          />
        )}
      </PageMain>
    </div>
  );
}

async function loadTopics(userId: string, catalogId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('topic_mastery', { p_user_id: userId });
  return (data ?? [])
    .filter((row) => row.subject_id === catalogId)
    .map((row) => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectColor: row.subject_color,
      topicId: row.topic_id,
      topicName: row.topic_name,
      correctCount: row.correct_count,
      totalCount: row.total_count,
      masteryPercent: row.mastery_percent,
      status: row.status,
    }))
    .sort((a, b) => a.masteryPercent - b.masteryPercent);
}
