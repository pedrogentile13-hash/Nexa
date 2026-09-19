import { createClient } from '@/lib/supabase/server';
import type { Difficulty, ExamKind, ResourceKind } from '@/types/database.types';

/**
 * Leituras do Nexa Vestibular.
 *
 * Tudo passa por RPC `security definer` (mesmo padrão da Community): a
 * listagem de conteúdo reaproveita `can_view_resource` — a MESMA função que
 * decide visibilidade de qualquer conteúdo do Nexa — em vez de reimplementar
 * regra de acesso aqui.
 */

export interface VestibularProfile {
  mainExamId: string | null;
  mainExamName: string | null;
  mainExamSlug: string | null;
  targetYear: number | null;
  graduationYear: number | null;
  dailyStudyMinutes: number | null;
}

export async function getVestibularProfile(): Promise<VestibularProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_vestibular_profile');
  const row = data?.[0];
  if (error || !row) return null;

  return {
    mainExamId: row.main_exam_id,
    mainExamName: row.main_exam_name,
    mainExamSlug: row.main_exam_slug,
    targetYear: row.target_year,
    graduationYear: row.graduation_year,
    dailyStudyMinutes: row.daily_study_minutes,
  };
}

export interface ExamOption {
  id: string;
  slug: string;
  name: string;
  organization: string | null;
  kind: ExamKind;
  nextEditionYear: number | null;
  nextApplicationDate: string | null;
}

export async function listExams(): Promise<ExamOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_exams');
  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    organization: e.organization,
    kind: e.kind,
    nextEditionYear: e.next_edition_year,
    nextApplicationDate: e.next_application_date,
  }));
}

export interface VestibularOverview {
  examName: string | null;
  editionYear: number | null;
  applicationDate: string | null;
  daysUntil: number | null;
  questionsAnswered: number;
  correctAnswers: number;
  accuracyPercent: number | null;
  quizzesDone: number;
  simuladosDone: number;
  /** Sessões de treino avulso já encerradas (Fase 1) — não são "simulados". */
  practicesDone: number;
  essaysSubmitted: number;
}

export async function getVestibularOverview(): Promise<VestibularOverview> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('vestibular_overview');
  const row = data?.[0];

  return {
    examName: row?.exam_name ?? null,
    editionYear: row?.edition_year ?? null,
    applicationDate: row?.application_date ?? null,
    daysUntil: row?.days_until ?? null,
    questionsAnswered: row?.questions_answered ?? 0,
    correctAnswers: row?.correct_answers ?? 0,
    accuracyPercent: row?.accuracy_percent ?? null,
    quizzesDone: row?.quizzes_done ?? 0,
    simuladosDone: row?.simulados_done ?? 0,
    practicesDone: row?.practices_done ?? 0,
    essaysSubmitted: row?.essays_submitted ?? 0,
  };
}

export interface VestibularResource {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  subjectName: string;
  subjectColor: string;
  examName: string | null;
  editionYear: number | null;
  difficulty: Difficulty;
  questionCount: number;
  timeLimitSeconds: number | null;
  myBestPercent: number | null;
}

export interface VestibularResourceFilters {
  examId?: string | null;
  year?: number | null;
  subjectCatalogId?: string | null;
  kind?: string | null;
}

export async function listVestibularResources(
  filters: VestibularResourceFilters = {},
): Promise<VestibularResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_vestibular_resources', {
    p_exam_id: filters.examId ?? null,
    p_year: filters.year ?? null,
    p_subject_catalog_id: filters.subjectCatalogId ?? null,
    p_kind: filters.kind ?? null,
  });
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    description: r.description,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    examName: r.exam_name,
    editionYear: r.edition_year,
    difficulty: r.difficulty,
    questionCount: r.question_count,
    timeLimitSeconds: r.time_limit_seconds,
    myBestPercent: r.my_best_percent,
  }));
}

/** Matérias que realmente têm conteúdo de vestibular — evita filtro que não filtra nada. */
export async function listVestibularSubjects(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('resources')
    .select('subject_catalog_id, subject_catalog(name)')
    .eq('context', 'vestibular')
    .eq('is_published', true);

  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const subject = row.subject_catalog as unknown as { name: string } | null;
    if (subject && !seen.has(row.subject_catalog_id)) seen.set(row.subject_catalog_id, subject.name);
  }
  return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}
