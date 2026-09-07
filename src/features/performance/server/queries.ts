import { createClient } from '@/lib/supabase/server';
import { xpToNextLevel } from '../lib/level';

/**
 * Dados de desempenho.
 *
 * Tudo sai das views de cálculo — nenhuma média é recalculada aqui. É o que
 * garante que o número no gráfico seja o mesmo que aparece em Disciplinas e em
 * Hoje.
 */

export interface TermPoint {
  termId: string;
  termName: string;
  shortName: string;
  sequence: number;
  average: number | null;
  subjectsGraded: number;
  subjectsBelowPassing: number;
}

export interface SubjectBar {
  subjectId: string;
  subjectName: string;
  average: number;
  passingGrade: number;
  targetGrade: number | null;
  isBelowPassing: boolean;
  isBelowTarget: boolean;
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
  currentTermId: string | null;
  currentTermName: string | null;
  termPoints: TermPoint[];
  subjectBars: SubjectBar[];
  studyWeeks: StudyWeek[];
  overallAverage: number | null;
  subjectsTotal: number;
  subjectsGraded: number;
  subjectsBelowPassing: number;
  pendingActivities: number;
  /** Diferença para o período anterior com nota. `null` no primeiro período. */
  averageDelta: number | null;
  level: number;
  xp: number;
  /** Quanto falta para o próximo nível, já calculado pela mesma curva do banco. */
  xpToNextLevel: number;
  totalStudySeconds: number;
  /** Domínio por assunto, a partir da resposta mais recente de cada questão
   * de quiz/simulado — alimenta o mapa de domínio e a recomendação de revisão. */
  topicMastery: TopicMastery[];
}

export async function getPerformance(userId: string): Promise<PerformanceData> {
  const supabase = await createClient();

  const { data: currentTermId } = await supabase.rpc('current_term_id', { p_user_id: userId });
  const termId = (currentTermId as string | null) ?? null;

  const [termsRes, subjectsRes, sessionsRes, statsRes, masteryRes] = await Promise.all([
    supabase.from('v_term_summary').select('*').order('term_sequence'),
    supabase
      .from('v_subject_term_averages')
      .select('*')
      .eq('term_id', termId ?? '')
      .order('subject_name'),
    supabase
      .from('study_sessions')
      .select('local_date, duration_seconds')
      .not('ended_at', 'is', null)
      .order('local_date'),
    supabase
      .from('user_stats')
      .select('xp, level, total_study_seconds')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('topic_mastery', { p_user_id: userId }),
  ]);

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

  const termPoints: TermPoint[] = (termsRes.data ?? []).map((row) => ({
    termId: row.term_id,
    termName: row.term_name,
    // "1º Bimestre" não cabe num eixo de celular; "1º" cabe e não perde nada.
    shortName: row.term_name.split(' ')[0] ?? String(row.term_sequence),
    sequence: row.term_sequence,
    average: row.average_overall,
    subjectsGraded: row.subjects_graded,
    subjectsBelowPassing: row.subjects_below_passing,
  }));

  const subjectBars: SubjectBar[] = (subjectsRes.data ?? [])
    .filter((row) => row.final_grade !== null)
    .map((row) => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      average: row.final_grade as number,
      passingGrade: row.passing_grade,
      targetGrade: row.target_grade,
      isBelowPassing: row.is_below_passing,
      isBelowTarget: row.is_below_target,
    }))
    // Pior primeiro: o gráfico responde "onde eu preciso olhar", não "ordem
    // alfabética das minhas disciplinas".
    .sort((a, b) => a.average - b.average);

  const studyWeeks = groupByWeek(sessionsRes.data ?? []);

  const currentSummary = termPoints.find((point) => point.termId === termId);
  const currentRow = (termsRes.data ?? []).find((row) => row.term_id === termId);

  return {
    currentTermId: termId,
    currentTermName: currentSummary?.termName ?? null,
    termPoints,
    subjectBars,
    studyWeeks,
    overallAverage: currentRow?.average_overall ?? null,
    subjectsTotal: currentRow?.subjects_total ?? 0,
    subjectsGraded: currentRow?.subjects_graded ?? 0,
    subjectsBelowPassing: currentRow?.subjects_below_passing ?? 0,
    pendingActivities: currentRow?.pending_activities ?? 0,
    averageDelta: computeDelta(termPoints, termId),
    level: statsRes.data?.level ?? 1,
    xp: statsRes.data?.xp ?? 0,
    xpToNextLevel: xpToNextLevel(statsRes.data?.xp ?? 0),
    totalStudySeconds: Number(statsRes.data?.total_study_seconds ?? 0),
    topicMastery,
  };
}

/**
 * Quanto a média mudou desde o período anterior COM NOTA.
 *
 * "Anterior" não é o período de número imediatamente menor: um bimestre sem
 * nenhuma nota lançada não é uma queda, é ausência de dado. Comparar com ele
 * produziria uma seta vermelha que não corresponde a nada que o aluno fez.
 */
function computeDelta(points: TermPoint[], currentTermId: string | null): number | null {
  const graded = points.filter((p) => p.average !== null);
  const index = graded.findIndex((p) => p.termId === currentTermId);
  const current = index >= 0 ? graded[index] : graded[graded.length - 1];
  const previous = index > 0 ? graded[index - 1] : graded[graded.length - 2];

  if (!current?.average || !previous?.average) return null;
  return Number((current.average - previous.average).toFixed(2));
}

export { xpToNextLevel };

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
      label: new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'UTC',
      }).format(new Date(`${weekStart}T12:00:00Z`)),
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
