import { createClient } from '@/lib/supabase/server';

/**
 * Leituras de Metas.
 *
 * Os quatro indicadores do topo são sempre dado real (study_sessions,
 * subjects, quiz_attempts, resource_progress, user_stats) — a META de cada
 * um é a única escolha do aluno (profiles.weekly_study_goal_minutes já
 * existia; monthly_activities_goal/monthly_subjects_goal são novos).
 */

export interface WeeklyMinutes {
  weekStart: string;
  label: string;
  minutes: number;
}

export interface SubjectMinutes {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  minutes: number;
}

export interface MetasOverview {
  monthHours: number;
  monthHoursGoal: number;
  monthSubjectsActive: number;
  monthSubjectsGoal: number;
  monthActivities: number;
  monthActivitiesGoal: number;
  currentStreak: number;
  weeklyMinutes: WeeklyMinutes[];
  bySubject: SubjectMinutes[];
}

function startOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function startOfWeek(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

function weekLabel(weekStart: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${weekStart}T12:00:00Z`));
}

export async function getMetasOverview(userId: string): Promise<MetasOverview> {
  const supabase = await createClient();
  const monthStart = startOfMonth();

  const [profileRes, statsRes, sessionsRes, monthSessionsRes, attemptsRes, progressRes, subjectsRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('weekly_study_goal_minutes, monthly_activities_goal, monthly_subjects_goal')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('user_stats').select('current_streak').eq('user_id', userId).maybeSingle(),
      supabase
        .from('study_sessions')
        .select('local_date, duration_seconds')
        .not('ended_at', 'is', null)
        .order('local_date'),
      supabase
        .from('study_sessions')
        .select('subject_id, duration_seconds')
        .not('ended_at', 'is', null)
        .gte('local_date', monthStart),
      supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .gte('finished_at', monthStart),
      supabase
        .from('resource_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', monthStart),
      supabase.from('subjects').select('id, name, color').is('archived_at', null),
    ]);

  const weeklyMinutes = groupByWeek(sessionsRes.data ?? []);

  const monthMinutesBySubject = new Map<string, number>();
  for (const row of monthSessionsRes.data ?? []) {
    if (!row.subject_id) continue;
    monthMinutesBySubject.set(
      row.subject_id,
      (monthMinutesBySubject.get(row.subject_id) ?? 0) + Math.round((row.duration_seconds ?? 0) / 60),
    );
  }

  const subjectById = new Map((subjectsRes.data ?? []).map((s) => [s.id, s]));
  const bySubject: SubjectMinutes[] = [...monthMinutesBySubject.entries()]
    .map(([subjectId, minutes]) => {
      const subject = subjectById.get(subjectId);
      return {
        subjectId,
        subjectName: subject?.name ?? 'Matéria removida',
        subjectColor: subject?.color ?? 'blue',
        minutes,
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  const monthMinutesTotal = [...monthMinutesBySubject.values()].reduce((sum, m) => sum + m, 0);
  const weeklyGoalMinutes = profileRes.data?.weekly_study_goal_minutes ?? 300;

  return {
    monthHours: Math.round((monthMinutesTotal / 60) * 10) / 10,
    monthHoursGoal: Math.round(((weeklyGoalMinutes * 4) / 60) * 10) / 10,
    monthSubjectsActive: monthMinutesBySubject.size,
    monthSubjectsGoal: profileRes.data?.monthly_subjects_goal ?? 4,
    monthActivities: (attemptsRes.count ?? 0) + (progressRes.count ?? 0),
    monthActivitiesGoal: profileRes.data?.monthly_activities_goal ?? 20,
    currentStreak: statsRes.data?.current_streak ?? 0,
    weeklyMinutes,
    bySubject,
  };
}

function groupByWeek(rows: { local_date: string; duration_seconds: number }[]): WeeklyMinutes[] {
  const byWeek = new Map<string, number>();
  for (const row of rows) {
    const monday = startOfWeek(row.local_date);
    byWeek.set(monday, (byWeek.get(monday) ?? 0) + Math.round((row.duration_seconds ?? 0) / 60));
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([weekStart, minutes]) => ({ weekStart, label: weekLabel(weekStart), minutes }));
}

export interface LongTermGoal {
  id: string;
  title: string;
  icon: string;
  progressPercent: number;
  createdAt: string;
}

export async function getLongTermGoals(userId: string): Promise<LongTermGoal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('long_term_goals')
    .select('id, title, icon, progress_percent, created_at')
    .eq('user_id', userId)
    .order('created_at');

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    icon: row.icon,
    progressPercent: row.progress_percent,
    createdAt: row.created_at,
  }));
}
