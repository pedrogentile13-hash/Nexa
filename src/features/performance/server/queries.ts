import { createClient } from '@/lib/supabase/server';
import { xpToNextLevel } from '../lib/level';

/**
 * Dados de desempenho — todos automáticos.
 *
 * Tudo sai de `subject_scores()`/`performance_evolution()`/`simulado_history()`
 * (migration `automatic_scoring.sql`) ou de tabelas já existentes
 * (`study_sessions`, `user_stats`, `topic_mastery()`). Nenhuma nota é digitada
 * — a mesma garantia que as views de cálculo davam antes, só que agora a
 * fonte é o que o aluno realmente fez dentro do Nexa.
 */

export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  /** `false` = matéria sem `catalog_id`, nunca vai ter nota (sem conteúdo pra ligar). */
  hasContent: boolean;
  assessmentScore: number | null;
  empenhoIndex: number;
  blendedScore: number | null;
  quizzesDone: number;
  simuladosDone: number;
  contentCompleted: number;
  targetGrade: number | null;
  passingGrade: number;
}

export interface ScoreEvolutionPoint {
  weekStart: string;
  label: string;
  assessmentScore: number | null;
  empenhoIndex: number;
  blendedScore: number | null;
}

export interface SimuladoAttempt {
  attemptId: string;
  resourceId: string;
  resourceTitle: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  correctCount: number;
  totalCount: number;
  percent: number;
  durationSeconds: number;
  finishedAt: string;
}

export interface StudyWeek {
  weekStart: string;
  label: string;
  minutes: number;
}

export interface TopicMastery {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId: string | null;
  topicName: string;
  correctCount: number;
  totalCount: number;
  masteryPercent: number;
  status: 'dominado' | 'desenvolvimento' | 'revisar';
}

export interface PerformanceData {
  subjectScores: SubjectScore[];
  /** Média igual entre as matérias que TÊM nota — `null` sem nenhuma. */
  overallScore: number | null;
  scoreEvolution: ScoreEvolutionPoint[];
  simuladoHistory: SimuladoAttempt[];
  studyWeeks: StudyWeek[];
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalStudySeconds: number;
  currentStreak: number;
  longestStreak: number;
  topicMastery: TopicMastery[];
}

function mapSubjectScore(row: {
  subject_id: string;
  subject_name: string;
  subject_color: string;
  has_content: boolean;
  assessment_score: number | null;
  empenho_index: number;
  blended_score: number | null;
  quizzes_done: number;
  simulados_done: number;
  content_completed: number;
  target_grade: number | null;
  passing_grade: number;
}): SubjectScore {
  return {
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    hasContent: row.has_content,
    assessmentScore: row.assessment_score,
    empenhoIndex: row.empenho_index,
    blendedScore: row.blended_score,
    quizzesDone: row.quizzes_done,
    simuladosDone: row.simulados_done,
    contentCompleted: row.content_completed,
    targetGrade: row.target_grade,
    passingGrade: row.passing_grade,
  };
}

/**
 * Notas por matéria, sozinhas — usado por Disciplinas, que não precisa do
 * resto (evolução, XP, sequência) que `getPerformance` carrega para
 * Desempenho.
 */
export async function getSubjectScores(userId: string): Promise<SubjectScore[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('subject_scores', { p_user_id: userId });
  // Pior primeiro; sem nota (ausência de dado, não nota ruim) vai para o fim.
  return (data ?? []).map(mapSubjectScore).sort((a, b) => {
    if (a.blendedScore === null) return b.blendedScore === null ? 0 : 1;
    if (b.blendedScore === null) return -1;
    return a.blendedScore - b.blendedScore;
  });
}

/**
 * Média igual entre as matérias que TÊM nota — usada em Desempenho e em Hoje.
 *
 * Recebe só `blendedScore` (não `SubjectScore[]` inteiro) para que Hoje possa
 * calcular a partir da resposta crua do RPC sem remontar o tipo completo.
 */
export function computeOverallScore(scores: { blendedScore: number | null }[]): number | null {
  const graded = scores.filter((s) => s.blendedScore !== null);
  if (graded.length === 0) return null;
  return graded.reduce((sum, s) => sum + (s.blendedScore ?? 0), 0) / graded.length;
}

function mapSimuladoAttempt(row: {
  attempt_id: string;
  resource_id: string;
  resource_title: string;
  subject_id: string | null;
  subject_name: string | null;
  subject_color: string | null;
  correct_count: number;
  total_count: number;
  percent: number;
  duration_seconds: number;
  finished_at: string;
}): SimuladoAttempt {
  return {
    attemptId: row.attempt_id,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    percent: row.percent,
    durationSeconds: row.duration_seconds,
    finishedAt: row.finished_at,
  };
}

/** Histórico de simulados, sozinho — usado pela página de uma matéria. */
export async function getSimuladoHistory(userId: string): Promise<SimuladoAttempt[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('simulado_history', { p_user_id: userId });
  return (data ?? []).map(mapSimuladoAttempt);
}

export async function getPerformance(userId: string): Promise<PerformanceData> {
  const supabase = await createClient();

  const [scoresRes, evolutionRes, simuladosRes, sessionsRes, statsRes, masteryRes] =
    await Promise.all([
      supabase.rpc('subject_scores', { p_user_id: userId }),
      supabase.rpc('performance_evolution', { p_user_id: userId }),
      supabase.rpc('simulado_history', { p_user_id: userId }),
      supabase
        .from('study_sessions')
        .select('local_date, duration_seconds')
        .not('ended_at', 'is', null)
        .order('local_date'),
      supabase
        .from('user_stats')
        .select('xp, level, total_study_seconds, current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.rpc('topic_mastery', { p_user_id: userId }),
    ]);

  const subjectScores = (scoresRes.data ?? []).map(mapSubjectScore).sort((a, b) => {
    if (a.blendedScore === null) return b.blendedScore === null ? 0 : 1;
    if (b.blendedScore === null) return -1;
    return a.blendedScore - b.blendedScore;
  });

  const overallScore = computeOverallScore(subjectScores);

  const scoreEvolution: ScoreEvolutionPoint[] = (evolutionRes.data ?? []).map((row) => ({
    weekStart: row.week_start,
    label: weekLabel(row.week_start),
    assessmentScore: row.assessment_score,
    empenhoIndex: row.empenho_index,
    blendedScore: row.blended_score,
  }));

  const simuladoHistory: SimuladoAttempt[] = (simuladosRes.data ?? []).map(mapSimuladoAttempt);

  const topicMastery: TopicMastery[] = (masteryRes.data ?? [])
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
    // Pior primeiro, mesma lógica das barras por matéria: onde olhar antes.
    .sort((a, b) => a.masteryPercent - b.masteryPercent);

  const studyWeeks = groupByWeek(sessionsRes.data ?? []);

  return {
    subjectScores,
    overallScore,
    scoreEvolution,
    simuladoHistory,
    studyWeeks,
    level: statsRes.data?.level ?? 1,
    xp: statsRes.data?.xp ?? 0,
    xpToNextLevel: xpToNextLevel(statsRes.data?.xp ?? 0),
    totalStudySeconds: Number(statsRes.data?.total_study_seconds ?? 0),
    currentStreak: statsRes.data?.current_streak ?? 0,
    longestStreak: statsRes.data?.longest_streak ?? 0,
    topicMastery,
  };
}

export { xpToNextLevel };

function weekLabel(weekStart: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${weekStart}T12:00:00Z`));
}

/** Agrupa sessões por semana ISO, mantendo as 12 últimas com algum estudo. */
function groupByWeek(rows: { local_date: string; duration_seconds: number }[]): StudyWeek[] {
  const byWeek = new Map<string, number>();

  for (const row of rows) {
    const monday = startOfWeek(row.local_date);
    byWeek.set(monday, (byWeek.get(monday) ?? 0) + Math.round((row.duration_seconds ?? 0) / 60));
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([weekStart, minutes]) => ({
      weekStart,
      label: weekLabel(weekStart),
      minutes,
    }));
}

function startOfWeek(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = date.getUTCDay();
  // Segunda como início: é como a semana escolar é lida no Brasil.
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
