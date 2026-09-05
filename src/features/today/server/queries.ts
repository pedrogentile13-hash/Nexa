import { createClient } from '@/lib/supabase/server';
import type { FocusCandidate } from '../lib/ranking';

/**
 * Tudo que a tela Hoje precisa, no menor número de idas ao banco.
 *
 * As consultas são disparadas em paralelo porque nenhuma depende da outra — em
 * série, a tela mais aberta do produto pagaria a soma das latências em vez do
 * máximo.
 */

export interface TodaySnapshot {
  today: string;
  greetingName: string;
  streak: number;
  avatarUrl: string | null;
  dailyGoalMinutes: number;
  studiedTodayMinutes: number;
  routines: TodayRoutine[];
  candidates: FocusCandidate[];
  upcoming: UpcomingItem[];
  classesToday: ClassSlot[];
  runningSessionId: string | null;
  runningSessionStartedAt: string | null;
}

export interface TodayRoutine {
  id: string;
  title: string;
  icon: string;
  targetCount: number;
  doneCount: number;
  subjectName: string | null;
  subjectColor: string | null;
}

export interface UpcomingItem {
  id: string;
  title: string;
  dueDate: string;
  subjectName: string | null;
  subjectColor: string | null;
  categoryCode: string | null;
  kind: 'assessment' | 'task';
}

export interface ClassSlot {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  startsAt: string;
  endsAt: string;
  room: string | null;
}

/** Janela do "o que vem por aí": duas semanas cobre o horizonte de planejamento. */
const UPCOMING_DAYS = 14;

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function getTodaySnapshot(userId: string): Promise<TodaySnapshot> {
  const supabase = await createClient();

  // O dia vem do banco, no fuso do aluno — nunca de `new Date()` no servidor,
  // que roda em UTC e viraria o dia às 21h de Brasília.
  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: userId });
  const today = (todayValue as string | null) ?? new Date().toISOString().slice(0, 10);
  const horizon = addDays(today, UPCOMING_DAYS);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();

  const [
    profileRes,
    statsRes,
    routinesRes,
    completionsRes,
    tasksRes,
    activitiesRes,
    sessionsRes,
    slotsRes,
    averagesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, daily_study_goal_minutes')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('user_stats').select('current_streak').eq('user_id', userId).maybeSingle(),
    supabase
      .from('routines')
      .select(
        'id, title, icon, target_count, sort_order, days_of_week, subject_id, subjects(name, color)',
      )
      .eq('is_active', true)
      .order('sort_order'),
    supabase.from('routine_completions').select('routine_id, count').eq('local_date', today),
    supabase
      .from('tasks')
      .select('id, title, due_date, priority, subject_id, subjects(name, color)')
      .is('completed_at', null)
      .lte('due_date', horizon)
      .order('due_date', { nullsFirst: false }),
    supabase
      .from('v_activities_effective')
      .select(
        'id, title, due_date, weight, weight_percent, category_code, subject_id, subject_name, subject_color, score',
      )
      .is('score', null)
      .not('due_date', 'is', null)
      .lte('due_date', horizon),
    supabase
      .from('study_sessions')
      .select('id, duration_seconds, ended_at, started_at')
      .eq('local_date', today),
    supabase
      .from('timetable_slots')
      .select('subject_id, starts_at, ends_at, room, subjects(name, color)')
      .eq('day_of_week', weekday)
      .order('starts_at'),
    supabase
      .from('v_subject_term_averages')
      .select('subject_id, final_grade, target_grade, passing_grade'),
  ]);

  const profile = profileRes.data;
  const streak = statsRes.data?.current_streak ?? 0;

  // Médias por disciplina, para o fator de risco do ranking. Um aluno pode ter
  // vários bimestres carregados; o que importa é o mais recente com nota.
  const averageBySubject = new Map<
    string,
    { average: number | null; target: number | null; passing: number }
  >();
  for (const row of averagesRes.data ?? []) {
    if (row.final_grade === null) continue;
    averageBySubject.set(row.subject_id, {
      average: row.final_grade,
      target: row.target_grade,
      passing: row.passing_grade ?? 6,
    });
  }

  const classesToday: ClassSlot[] = (slotsRes.data ?? []).map((slot) => {
    const subject = slot.subjects as unknown as { name: string; color: string } | null;
    return {
      subjectId: slot.subject_id,
      subjectName: subject?.name ?? 'Aula',
      subjectColor: subject?.color ?? 'blue',
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      room: slot.room,
    };
  });
  const subjectsWithClassToday = new Set(classesToday.map((c) => c.subjectId));

  const completionByRoutine = new Map<string, number>();
  for (const row of completionsRes.data ?? []) {
    completionByRoutine.set(row.routine_id, row.count);
  }

  const routines: TodayRoutine[] = (routinesRes.data ?? [])
    .filter((routine) => routine.days_of_week.includes(weekday))
    .map((routine) => {
      const subject = routine.subjects as unknown as { name: string; color: string } | null;
      return {
        id: routine.id,
        title: routine.title,
        icon: routine.icon,
        targetCount: routine.target_count,
        doneCount: completionByRoutine.get(routine.id) ?? 0,
        subjectName: subject?.name ?? null,
        subjectColor: subject?.color ?? null,
      };
    });

  const candidates: FocusCandidate[] = [];

  for (const task of tasksRes.data ?? []) {
    const subject = task.subjects as unknown as { name: string; color: string } | null;
    const risk = task.subject_id ? averageBySubject.get(task.subject_id) : undefined;
    candidates.push({
      id: task.id,
      kind: 'task',
      title: task.title,
      subjectId: task.subject_id,
      subjectName: subject?.name ?? null,
      subjectColor: subject?.color ?? null,
      dueDate: task.due_date,
      priority: task.priority,
      subjectAverage: risk?.average ?? null,
      subjectTarget: risk?.target ?? null,
      passingGrade: risk?.passing ?? 6,
      hasClassToday: task.subject_id ? subjectsWithClassToday.has(task.subject_id) : false,
    });
  }

  for (const activity of activitiesRes.data ?? []) {
    const risk = averageBySubject.get(activity.subject_id);
    candidates.push({
      id: activity.id,
      kind: 'assessment',
      title: activity.title,
      subjectId: activity.subject_id,
      subjectName: activity.subject_name,
      subjectColor: activity.subject_color,
      dueDate: activity.due_date,
      categoryWeightPercent: activity.weight_percent,
      categoryCode: activity.category_code,
      itemWeight: activity.weight,
      subjectAverage: risk?.average ?? null,
      subjectTarget: risk?.target ?? null,
      passingGrade: risk?.passing ?? 6,
      hasClassToday: subjectsWithClassToday.has(activity.subject_id),
    });
  }

  const upcoming: UpcomingItem[] = candidates
    .filter((c): c is FocusCandidate & { dueDate: string } => Boolean(c.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      title: c.title,
      dueDate: c.dueDate,
      subjectName: c.subjectName,
      subjectColor: c.subjectColor,
      categoryCode: c.categoryCode ?? null,
      kind: c.kind === 'assessment' ? 'assessment' : 'task',
    }));

  const sessions = sessionsRes.data ?? [];
  const studiedTodaySeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const running = sessions.find((s) => s.ended_at === null);

  return {
    today,
    greetingName: profile?.full_name?.trim().split(/\s+/)[0] ?? '',
    streak,
    avatarUrl: profile?.avatar_url ?? null,
    dailyGoalMinutes: profile?.daily_study_goal_minutes ?? 45,
    studiedTodayMinutes: Math.round(studiedTodaySeconds / 60),
    routines,
    candidates,
    upcoming,
    classesToday,
    runningSessionId: running?.id ?? null,
    runningSessionStartedAt: running?.started_at ?? null,
  };
}
