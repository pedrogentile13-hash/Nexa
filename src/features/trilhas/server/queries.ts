import { createClient } from '@/lib/supabase/server';
import type { TrackCategory } from '@/types/database.types';

/**
 * Leituras da seção Trilhas.
 *
 * `getTrack` e `TrackView` moraram em `features/study` enquanto a trilha era
 * só uma tela alcançada de dentro da matéria — agora que Trilhas tem nav
 * própria, a leitura da trilha individual mora aqui, junto da listagem que
 * também precisa dela.
 */

export interface TrackView {
  id: string;
  title: string;
  description: string | null;
  subjectName: string;
  subjectColor: string;
  sections: {
    id: string;
    title: string;
    position: number;
    done: number;
    total: number;
    lessons: {
      id: string;
      title: string;
      description: string | null;
      estimatedMinutes: number | null;
      xpReward: number;
      /** Os cinco estados do nó no design. */
      state: 'locked' | 'available' | 'in_progress' | 'done' | 'mastered';
      resourceCount: number;
    }[];
  }[];
}

export async function getTrack(trackId: string): Promise<TrackView | null> {
  const supabase = await createClient();

  const [trackRes, lessonsRes] = await Promise.all([
    supabase
      .from('tracks')
      .select('id, title, description, subject_catalog(name, default_color)')
      .eq('id', trackId)
      .maybeSingle(),
    supabase
      .from('v_track_lessons_resolved')
      .select('*')
      .eq('track_id', trackId)
      .order('section_position')
      .order('lesson_position'),
  ]);

  const track = trackRes.data;
  if (!track) return null;

  const subject = track.subject_catalog as unknown as {
    name: string;
    default_color: string;
  } | null;

  const sections = new Map<string, TrackView['sections'][number]>();
  for (const lesson of lessonsRes.data ?? []) {
    const section = sections.get(lesson.section_id) ?? {
      id: lesson.section_id,
      title: lesson.section_title,
      position: lesson.section_position,
      done: 0,
      total: 0,
      lessons: [],
    };

    const state = lesson.is_locked ? ('locked' as const) : lesson.raw_state;

    section.total += 1;
    if (state === 'done' || state === 'mastered') section.done += 1;
    section.lessons.push({
      id: lesson.lesson_id,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimated_minutes,
      xpReward: lesson.xp_reward,
      state,
      resourceCount: Number(lesson.resource_count ?? 0),
    });

    sections.set(lesson.section_id, section);
  }

  return {
    id: track.id,
    title: track.title,
    description: track.description,
    subjectName: subject?.name ?? '',
    subjectColor: subject?.default_color ?? 'blue',
    sections: [...sections.values()].sort((a, b) => a.position - b.position),
  };
}

/**
 * Tempo de estudo por trilha não existe: `study_sessions` mede por matéria, e
 * `resource_progress.position_seconds` é posição de reprodução, não cronômetro
 * — somar isso como "tempo" prometeria uma precisão que o dado não tem. Por
 * isso os dois números aqui são os que dão pra contar sem aproximar: questões
 * respondidas (soma de `quiz_attempts.total_count` dos recursos da trilha) e
 * materiais concluídos (`resource_progress.completed_at`).
 */
export interface TrackStats {
  questionsAnswered: number;
  materialsDone: number;
  materialsTotal: number;
}

export async function getTrackStats(trackId: string, userId: string): Promise<TrackStats> {
  const supabase = await createClient();

  const { data: lessonRows } = await supabase
    .from('v_track_lessons_resolved')
    .select('lesson_id')
    .eq('track_id', trackId);
  const lessonIds = (lessonRows ?? []).map((l) => l.lesson_id);
  if (lessonIds.length === 0) return { questionsAnswered: 0, materialsDone: 0, materialsTotal: 0 };

  const { data: linkRows } = await supabase
    .from('track_lesson_resources')
    .select('resource_id')
    .in('lesson_id', lessonIds);
  const resourceIds = [...new Set((linkRows ?? []).map((l) => l.resource_id))];
  if (resourceIds.length === 0) return { questionsAnswered: 0, materialsDone: 0, materialsTotal: 0 };

  const [attemptsRes, progressRes] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('total_count')
      .eq('user_id', userId)
      .in('resource_id', resourceIds)
      .not('finished_at', 'is', null),
    supabase
      .from('resource_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .in('resource_id', resourceIds),
  ]);

  const questionsAnswered = (attemptsRes.data ?? []).reduce((sum, a) => sum + a.total_count, 0);
  const materialsDone = (progressRes.data ?? []).filter((p) => p.completed_at).length;

  return { questionsAnswered, materialsDone, materialsTotal: resourceIds.length };
}

export interface TrilhaListItem {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  category: TrackCategory;
  done: number;
  total: number;
}

export interface TrilhasOverview {
  tracks: TrilhaListItem[];
  continueTrackId: string | null;
  recommendedTrackIds: string[];
  totalDone: number;
  totalLessons: number;
}

export async function getTrilhasOverview(userId: string): Promise<TrilhasOverview> {
  const supabase = await createClient();

  const [tracksRes, lessonsRes, recentProgressRes, masteryRes] = await Promise.all([
    supabase
      .from('tracks')
      .select('id, title, description, category, subject_catalog(id, name, default_color)')
      .eq('is_published', true)
      .order('sort_order'),
    supabase.from('v_track_lessons_resolved').select('track_id, raw_state'),
    // "Continue de onde parou": a lição em andamento tocada mais recentemente
    // — via `lesson_progress` direto (tem `updated_at` real), não a view, que
    // não carrega essa coluna.
    supabase
      .from('lesson_progress')
      .select('track_lessons(section_id, track_sections(track_id))')
      .eq('state', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc('topic_mastery', { p_user_id: userId }),
  ]);

  const lessonsByTrack = new Map<string, { done: number; total: number }>();
  for (const lesson of lessonsRes.data ?? []) {
    const entry = lessonsByTrack.get(lesson.track_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (lesson.raw_state === 'done' || lesson.raw_state === 'mastered') entry.done += 1;
    lessonsByTrack.set(lesson.track_id, entry);
  }

  const tracks: TrilhaListItem[] = (tracksRes.data ?? []).map((t) => {
    const subject = t.subject_catalog as unknown as {
      id: string;
      name: string;
      default_color: string;
    } | null;
    const counts = lessonsByTrack.get(t.id) ?? { done: 0, total: 0 };
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      subjectId: subject?.id ?? '',
      subjectName: subject?.name ?? '',
      subjectColor: subject?.default_color ?? 'blue',
      category: t.category,
      done: counts.done,
      total: counts.total,
    };
  });

  const recentLesson = recentProgressRes.data?.track_lessons as unknown as {
    section_id: string;
    track_sections: { track_id: string } | null;
  } | null;
  const continueTrackId = recentLesson?.track_sections?.track_id ?? null;

  // "Recomendadas": trilhas das matérias com pior domínio (mesma lógica do
  // quiz recomendado de Hoje), que o aluno ainda não terminou.
  const worstSubjectOrder = [
    ...new Set(
      [...(masteryRes.data ?? [])]
        .filter((m) => m.status === 'revisar')
        .sort((a, b) => a.mastery_percent - b.mastery_percent)
        .map((m) => m.subject_id as string),
    ),
  ];
  const recommendedTrackIds = tracks
    .filter(
      (t) => worstSubjectOrder.includes(t.subjectId) && !(t.total > 0 && t.done === t.total),
    )
    .sort(
      (a, b) => worstSubjectOrder.indexOf(a.subjectId) - worstSubjectOrder.indexOf(b.subjectId),
    )
    .slice(0, 3)
    .map((t) => t.id);

  const totalDone = tracks.reduce((sum, t) => sum + t.done, 0);
  const totalLessons = tracks.reduce((sum, t) => sum + t.total, 0);

  return { tracks, continueTrackId, recommendedTrackIds, totalDone, totalLessons };
}
