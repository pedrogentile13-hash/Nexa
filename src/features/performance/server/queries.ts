import { createClient } from '@/lib/supabase/server';

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
}

export async function getPerformance(userId: string): Promise<PerformanceData> {
  const supabase = await createClient();

  const { data: currentTermId } = await supabase.rpc('current_term_id', { p_user_id: userId });
  const termId = (currentTermId as string | null) ?? null;

  const [termsRes, subjectsRes, sessionsRes] = await Promise.all([
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
  ]);

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
  };
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
