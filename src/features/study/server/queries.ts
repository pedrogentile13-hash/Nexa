import { createClient } from '@/lib/supabase/server';
import type { Difficulty, ResourceKind } from '@/types/database.types';
import type { EvaluationCriterion, ExamAsset, ExamMode, ExamSection, ExamSettings } from '@/types/simulado';

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
  /** 1 a 4, ou `null` quando o recurso não é amarrado a um bimestre específico. */
  bimestre: number | null;
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

export async function getStudyHub(
  subjectFilter?: string,
  bimestreFilter?: number,
): Promise<StudyHubData> {
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
    bimestre: r.bimestre,
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

  let items = subjectFilter ? all.filter((i) => i.subjectId === subjectFilter) : all;
  if (bimestreFilter) items = items.filter((i) => i.bimestre === bimestreFilter);

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
  tags: string[];
  progressPercent: number;
  positionSeconds: number;
  completedAt: string | null;
  isFavorited: boolean;
  /** Só para kind='resumo': texto digitado ou PDF enviado. */
  contentFormat: 'markdown' | 'pdf' | 'html';
  pdfPageCount: number | null;
  chapters: { id: string; label: string; startsAtSeconds: number }[];
  highlights: { id: string; quote: string }[];
  // ---- simulados v2 ----
  assets: ExamAsset[];
  sections: ExamSection[];
  settings: ExamSettings;
  /** `null` = deriva de `kind` (quiz->practice, simulado->exam). */
  examMode: ExamMode | null;
}

export interface StudyWritingTask {
  id: string;
  title: string;
  genre: string | null;
  theme: string | null;
  prompt: string;
  instructions: string[];
  resourceRefs: string[];
  minWords: number | null;
  maxWords: number | null;
  evaluationCriteria: EvaluationCriterion[];
}

export interface EssayResult {
  writingTaskId: string;
  content: string;
  wordCount: number;
  isSubmitted: boolean;
  totalScore: number | null;
  scores: Record<string, number> | null;
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
        'id, kind, title, subtitle, description, body, storage_path, external_url, thumbnail_url, duration_seconds, time_limit_seconds, xp_reward, tags, content_format, pdf_page_count, assets, sections, settings, exam_mode, subject_catalog(name, default_color), content_topics(name)',
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
      .select('progress_percent, position_seconds, completed_at, is_favorited')
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
    tags: r.tags ?? [],
    progressPercent: Number(progressRes.data?.progress_percent ?? 0),
    positionSeconds: progressRes.data?.position_seconds ?? 0,
    completedAt: progressRes.data?.completed_at ?? null,
    isFavorited: progressRes.data?.is_favorited ?? false,
    contentFormat: r.content_format,
    pdfPageCount: r.pdf_page_count,
    chapters: (chaptersRes.data ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      startsAtSeconds: c.starts_at_seconds,
    })),
    highlights: highlightsRes.data ?? [],
    assets: r.assets ?? [],
    sections: r.sections ?? [],
    settings: r.settings ?? {},
    examMode: r.exam_mode,
  };
}

/** Redações de um simulado (sem gabarito — redação não tem um). */
export async function getWritingTasks(resourceId: string): Promise<StudyWritingTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('writing_tasks')
    .select(
      'id, title, genre, theme, prompt, instructions, resource_refs, min_words, max_words, evaluation_criteria',
    )
    .eq('resource_id', resourceId)
    .order('position');

  return (data ?? []).map((w) => ({
    id: w.id,
    title: w.title,
    genre: w.genre,
    theme: w.theme,
    prompt: w.prompt,
    instructions: w.instructions,
    resourceRefs: w.resource_refs,
    minWords: w.min_words,
    maxWords: w.max_words,
    evaluationCriteria: w.evaluation_criteria,
  }));
}

/** Redações entregues de uma tentativa — com nota quando já corrigida. */
export async function getEssayResults(attemptId: string): Promise<EssayResult[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('essay_submissions')
    .select('writing_task_id, content, word_count, is_submitted, total_score, scores')
    .eq('attempt_id', attemptId);

  return (data ?? []).map((e) => ({
    writingTaskId: e.writing_task_id,
    content: e.content,
    wordCount: e.word_count,
    isSubmitted: e.is_submitted,
    totalScore: e.total_score,
    scores: e.scores,
  }));
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
