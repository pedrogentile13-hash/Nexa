import { createClient } from '@/lib/supabase/server';
import type { Difficulty, ResourceKind } from '@/types/database.types';

/**
 * Leituras da aba Estudar.
 *
 * Nenhuma consulta filtra por escola no TypeScript: `v_resource_library` já sai
 * do banco com a RLS aplicada, então o que chega aqui é exatamente o acervo
 * deste aluno — o global mais o da escola dele. Refiltrar no app criaria uma
 * segunda regra para divergir da primeira.
 */

export interface LibraryItem {
  id: string;
  kind: ResourceKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  difficulty: Difficulty;
  xpReward: number;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  questionCount: number;
  /** 0–100. Vem de `resource_progress`; 0 quando o aluno nunca abriu. */
  progressPercent: number;
}

export interface StudyHubData {
  items: LibraryItem[];
  countsByKind: Record<ResourceKind, number>;
  subjects: { id: string; name: string; color: string }[];
  continueItem: (LibraryItem & { positionSeconds: number }) | null;
  tracks: { id: string; title: string; subjectName: string; done: number; total: number }[];
}

const EMPTY_COUNTS: Record<ResourceKind, number> = {
  resumo: 0,
  simulado: 0,
  quiz: 0,
  podcast: 0,
  video: 0,
  imagem: 0,
  musica: 0,
};

export async function getStudyHub(subjectFilter?: string): Promise<StudyHubData> {
  const supabase = await createClient();

  const [libraryRes, progressRes, lessonsRes, tracksRes, mySubjectsRes] = await Promise.all([
    supabase
      .from('v_resource_library')
      .select('*')
      .order('sort_order')
      .order('published_at', { ascending: false })
      .limit(400),
    supabase
      .from('resource_progress')
      .select('resource_id, progress_percent, position_seconds, last_seen_at, completed_at')
      .order('last_seen_at', { ascending: false }),
    supabase.from('v_track_lessons_resolved').select('track_id, raw_state, lesson_id'),
    supabase.from('tracks').select('id, title, subject_catalog(name)').eq('is_published', true),
    // As matérias do aluno decidem a ORDEM do acervo: o que ele cursa vem antes.
    supabase.from('subjects').select('catalog_id').is('archived_at', null),
  ]);

  const progressByResource = new Map((progressRes.data ?? []).map((p) => [p.resource_id, p]));

  const mine = new Set(
    (mySubjectsRes.data ?? []).map((s) => s.catalog_id).filter((id): id is string => Boolean(id)),
  );

  const all: LibraryItem[] = (libraryRes.data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    thumbnailUrl: r.thumbnail_url,
    durationSeconds: r.duration_seconds,
    difficulty: r.difficulty,
    xpReward: r.xp_reward,
    subjectId: r.subject_catalog_id,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    topicName: r.topic_name,
    questionCount: Number(r.question_count ?? 0),
    progressPercent: Number(progressByResource.get(r.id)?.progress_percent ?? 0),
  }));

  // Matéria que o aluno cursa primeiro; dentro disso, a ordem do catálogo.
  all.sort((a, b) => Number(mine.has(b.subjectId)) - Number(mine.has(a.subjectId)));

  const countsByKind = { ...EMPTY_COUNTS };
  const subjectMap = new Map<string, { id: string; name: string; color: string }>();
  for (const item of all) {
    countsByKind[item.kind] += 1;
    if (!subjectMap.has(item.subjectId)) {
      subjectMap.set(item.subjectId, {
        id: item.subjectId,
        name: item.subjectName,
        color: item.subjectColor,
      });
    }
  }

  const items = subjectFilter ? all.filter((i) => i.subjectId === subjectFilter) : all;

  // "Continuar de onde parou": o mais recente que começou e não terminou.
  // Um item concluído não é uma pendência, e oferecê-lo de novo no topo faz a
  // seção parecer quebrada.
  let continueItem: StudyHubData['continueItem'] = null;
  for (const progress of progressRes.data ?? []) {
    if (progress.completed_at) continue;
    if (Number(progress.progress_percent) <= 0) continue;
    const item = all.find((i) => i.id === progress.resource_id);
    if (item) {
      continueItem = { ...item, positionSeconds: progress.position_seconds };
      break;
    }
  }

  const lessonsByTrack = new Map<string, { done: number; total: number }>();
  for (const lesson of lessonsRes.data ?? []) {
    const entry = lessonsByTrack.get(lesson.track_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (lesson.raw_state === 'done' || lesson.raw_state === 'mastered') entry.done += 1;
    lessonsByTrack.set(lesson.track_id, entry);
  }

  const tracks = (tracksRes.data ?? []).map((t) => {
    const subject = t.subject_catalog as unknown as { name: string } | null;
    const counts = lessonsByTrack.get(t.id) ?? { done: 0, total: 0 };
    return {
      id: t.id,
      title: t.title,
      subjectName: subject?.name ?? '',
      done: counts.done,
      total: counts.total,
    };
  });

  return {
    items,
    countsByKind,
    subjects: [...subjectMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    continueItem,
    tracks,
  };
}

export interface ResourceDetail {
  id: string;
  kind: ResourceKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  body: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  timeLimitSeconds: number | null;
  xpReward: number;
  questionCount: number;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  progressPercent: number;
  positionSeconds: number;
  chapters: { id: string; label: string; startsAtSeconds: number }[];
  highlights: { id: string; quote: string }[];
}

/**
 * O caminho no bucket vira URL pública só na leitura.
 *
 * Guardar a URL montada no banco amarraria cada linha ao domínio do projeto
 * Supabase atual — migrar de projeto, ou trocar de ambiente, quebraria todo o
 * acervo de uma vez e sem aviso.
 */
function publicUrl(storagePath: string | null, external: string | null): string | null {
  if (external) return external;
  if (!storagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/nexa-content/${storagePath}`;
}

export async function getResourceDetail(id: string): Promise<ResourceDetail | null> {
  const supabase = await createClient();

  const [resourceRes, chaptersRes, progressRes, highlightsRes, countRes] = await Promise.all([
    supabase
      .from('resources')
      .select(
        'id, kind, title, subtitle, description, body, storage_path, external_url, thumbnail_url, duration_seconds, time_limit_seconds, xp_reward, subject_catalog(name, default_color), content_topics(name)',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('resource_chapters')
      .select('id, label, starts_at_seconds')
      .eq('resource_id', id)
      .order('position'),
    supabase
      .from('resource_progress')
      .select('progress_percent, position_seconds')
      .eq('resource_id', id)
      .maybeSingle(),
    supabase.from('highlights').select('id, quote').eq('resource_id', id).order('created_at'),
    supabase.from('questions').select('id', { count: 'exact', head: true }).eq('resource_id', id),
  ]);

  const r = resourceRes.data;
  if (!r) return null;

  const subject = r.subject_catalog as unknown as { name: string; default_color: string } | null;
  const topic = r.content_topics as unknown as { name: string } | null;

  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    body: r.body,
    mediaUrl: publicUrl(r.storage_path, r.external_url),
    thumbnailUrl: r.thumbnail_url,
    durationSeconds: r.duration_seconds,
    timeLimitSeconds: r.time_limit_seconds,
    xpReward: r.xp_reward,
    questionCount: countRes.count ?? 0,
    subjectName: subject?.name ?? '',
    subjectColor: subject?.default_color ?? 'blue',
    topicName: topic?.name ?? null,
    progressPercent: Number(progressRes.data?.progress_percent ?? 0),
    positionSeconds: progressRes.data?.position_seconds ?? 0,
    chapters: (chaptersRes.data ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      startsAtSeconds: c.starts_at_seconds,
    })),
    highlights: highlightsRes.data ?? [],
  };
}

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

export async function getLessonResources(lessonId: string) {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from('track_lesson_resources')
    .select('resource_id, position')
    .eq('lesson_id', lessonId)
    .order('position');

  const ids = (links ?? []).map((l) => l.resource_id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from('v_resource_library')
    .select('id, kind, title, subtitle, duration_seconds, question_count')
    .in('id', ids);

  const order = new Map(ids.map((id, index) => [id, index]));
  return (data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/** Questões sem gabarito — a única porta de leitura do aluno. */
export async function getQuizQuestions(resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('quiz_questions', { p_resource_id: resourceId });
  return data ?? [];
}

export async function getAttemptResult(attemptId: string) {
  const supabase = await createClient();

  const [attemptRes, reviewRes, topicsRes] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('id, resource_id, correct_count, total_count, duration_seconds, finished_at')
      .eq('id', attemptId)
      .maybeSingle(),
    supabase.rpc('quiz_attempt_review', { p_attempt_id: attemptId }),
    supabase.rpc('quiz_attempt_topics', { p_attempt_id: attemptId }),
  ]);

  return {
    attempt: attemptRes.data,
    review: reviewRes.data ?? [],
    topics: topicsRes.data ?? [],
  };
}
