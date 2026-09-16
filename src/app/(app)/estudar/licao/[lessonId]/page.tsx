import { notFound } from 'next/navigation';
import { LessonView } from '@/features/study/components/lesson-view';
import { getLessonResources } from '@/features/study/server/queries';
import { createClient } from '@/lib/supabase/server';

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const [lessonRes, resources] = await Promise.all([
    supabase
      .from('v_track_lessons_resolved')
      .select(
        'lesson_id, track_id, title, description, estimated_minutes, xp_reward, raw_state, is_locked',
      )
      .eq('lesson_id', lessonId)
      .maybeSingle(),
    getLessonResources(lessonId),
  ]);

  const lesson = lessonRes.data;
  if (!lesson) notFound();

  return (
    <LessonView
      lesson={{
        id: lesson.lesson_id,
        trackId: lesson.track_id,
        title: lesson.title,
        description: lesson.description,
        estimatedMinutes: lesson.estimated_minutes,
        xpReward: lesson.xp_reward,
        state: lesson.is_locked ? 'locked' : lesson.raw_state,
      }}
      resources={resources.map((r) => ({
        id: r.id,
        kind: r.kind,
        title: r.title,
        subtitle: r.subtitle,
        durationSeconds: r.duration_seconds,
        questionCount: Number(r.question_count ?? 0),
      }))}
    />
  );
}
