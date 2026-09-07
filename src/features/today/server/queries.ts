import { createClient } from '@/lib/supabase/server';
import { computeOverallScore } from '@/features/performance/server/queries';
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
  longestStreak: number;
  avatarUrl: string | null;
  dailyGoalMinutes: number;
  studiedTodayMinutes: number;
  weeklyGoalMinutes: number;
  weekStudiedMinutes: number;
  /** Minutos estudados na semana anterior — só para a tendência do cartão de estatística. */
  previousWeekStudiedMinutes: number;
  weekDays: WeekDay[];
  /** Nota geral automática (mesma conta de Desempenho) — `null` sem nenhuma matéria com nota. */
  overallScore: number | null;
  routines: TodayRoutine[];
  candidates: FocusCandidate[];
  upcoming: UpcomingItem[];
  classesToday: ClassSlot[];
  runningSessionId: string | null;
  runningSessionStartedAt: string | null;
  /** O material que o aluno começou e não terminou. `null` se não houver. */
  resume: ResumeItem | null;
  /** Igual a `resume`, mas restrito a um kind — para os cartões "continue ouvindo/assistindo". */
  resumeAudio: ResumeItem | null;
  resumeVideo: ResumeItem | null;
  recommendedQuiz: RecommendedQuiz | null;
}

export interface WeekDay {
  date: string;
  /** Teve pelo menos um `xp_events` no dia — sinal unificado de "fez algo na plataforma". */
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface RecommendedQuiz {
  id: string;
  title: string;
  kind: 'quiz' | 'simulado';
  subjectName: string;
}

export interface ResumeItem {
  id: string;
  title: string;
  kind: string;
  subjectName: string;
  progressPercent: number;
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

/** Segunda-feira da semana de `iso` — mesma convenção de início de semana usada em Desempenho. */
function mondayOf(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
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
  const weekStart = mondayOf(today);
  const weekEnd = addDays(weekStart, 6);

  const [
    profileRes,
    statsRes,
    routinesRes,
    completionsRes,
    tasksRes,
    sessionsRes,
    weekSessionsRes,
    previousWeekSessionsRes,
    slotsRes,
    scoresRes,
    resumeRes,
    xpWeekRes,
    masteryRes,
    attemptsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, daily_study_goal_minutes, weekly_study_goal_minutes')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_stats')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .maybeSingle(),
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
      .from('study_sessions')
      .select('id, duration_seconds, ended_at, started_at')
      .eq('local_date', today),
    supabase
      .from('study_sessions')
      .select('duration_seconds')
      .gte('local_date', weekStart)
      .lte('local_date', weekEnd),
    supabase
      .from('study_sessions')
      .select('duration_seconds')
      .gte('local_date', addDays(weekStart, -7))
      .lt('local_date', weekStart),
    supabase
      .from('timetable_slots')
      .select('subject_id, starts_at, ends_at, room, subjects(name, color)')
      .eq('day_of_week', weekday)
      .order('starts_at'),
    supabase.rpc('subject_scores', { p_user_id: userId }),
    // "Continuar de onde parou": os mais recentes que começaram e não
    // terminaram. Buscamos várias linhas (não só a última) para poder separar
    // "continue ouvindo" de "continue assistindo" por tipo de recurso.
    supabase
      .from('resource_progress')
      .select('resource_id, progress_percent, last_seen_at')
      .is('completed_at', null)
      .gt('progress_percent', 0)
      .order('last_seen_at', { ascending: false })
      .limit(15),
    // Dias com XP na semana: sinal único que já cobre quiz, lição, rotina,
    // tarefa e sessão de estudo — não precisa de tracking novo.
    supabase.from('xp_events').select('local_date').gte('local_date', weekStart).lte('local_date', weekEnd),
    supabase.rpc('topic_mastery', { p_user_id: userId }),
    supabase.from('quiz_attempts').select('resource_id'),
  ]);

  const profile = profileRes.data;
  const streak = statsRes.data?.current_streak ?? 0;
  const longestStreak = statsRes.data?.longest_streak ?? 0;

  // Nota automática por disciplina, para o fator de risco do ranking.
  const averageBySubject = new Map<
    string,
    { average: number | null; target: number | null; passing: number }
  >();
  for (const row of scoresRes.data ?? []) {
    averageBySubject.set(row.subject_id, {
      average: row.blended_score,
      target: row.target_grade,
      passing: row.passing_grade,
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
    }));

  // Os títulos/tipos dos materiais vêm numa segunda consulta em lote porque a
  // primeira só devolve ids — uma consulta por linha aqui viraria até 15 idas
  // ao banco para a tela mais aberta do produto.
  const resumeRows = resumeRes.data ?? [];
  let resume: ResumeItem | null = null;
  let resumeAudio: ResumeItem | null = null;
  let resumeVideo: ResumeItem | null = null;
  if (resumeRows.length > 0) {
    const { data: resources } = await supabase
      .from('v_resource_library')
      .select('id, title, kind, subject_name')
      .in(
        'id',
        resumeRows.map((r) => r.resource_id),
      );
    const resourceById = new Map((resources ?? []).map((r) => [r.id, r]));

    const toResumeItem = (row: (typeof resumeRows)[number] | undefined): ResumeItem | null => {
      const resource = row ? resourceById.get(row.resource_id) : undefined;
      if (!resource || !row) return null;
      return {
        id: resource.id,
        title: resource.title,
        kind: resource.kind,
        subjectName: resource.subject_name,
        progressPercent: Number(row.progress_percent),
      };
    };

    resume = toResumeItem(resumeRows[0]);
    const audioRow = resumeRows.find((r) => resourceById.get(r.resource_id)?.kind === 'podcast');
    const videoRow = resumeRows.find((r) => resourceById.get(r.resource_id)?.kind === 'video');
    resumeAudio = audioRow ? toResumeItem(audioRow) : null;
    resumeVideo = videoRow ? toResumeItem(videoRow) : null;
  }

  const sessions = sessionsRes.data ?? [];
  const studiedTodaySeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const running = sessions.find((s) => s.ended_at === null);

  const weekStudiedSeconds = (weekSessionsRes.data ?? []).reduce(
    (sum, s) => sum + (s.duration_seconds ?? 0),
    0,
  );
  const previousWeekStudiedSeconds = (previousWeekSessionsRes.data ?? []).reduce(
    (sum, s) => sum + (s.duration_seconds ?? 0),
    0,
  );

  const activeDaysThisWeek = new Set((xpWeekRes.data ?? []).map((r) => r.local_date));
  const weekDays: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      active: activeDaysThisWeek.has(date),
      isToday: date === today,
      isFuture: date > today,
    };
  });

  const overallScore = computeOverallScore(
    (scoresRes.data ?? []).map((row) => ({ blendedScore: row.blended_score })),
  );

  // Quiz/simulado recomendado: prioriza a matéria pior colocada no mapa de
  // domínio ("revisar"). `topic_mastery().subject_id` é na verdade o
  // `subject_catalog_id` do recurso (mesma convenção usada pela função SQL
  // desde a etapa 7) — é por isso que dá pra ligar direto em `resources`.
  const attemptedResourceIds = new Set((attemptsRes.data ?? []).map((a) => a.resource_id));
  const worstToReview = [...(masteryRes.data ?? [])]
    .filter((m) => m.status === 'revisar')
    .sort((a, b) => a.mastery_percent - b.mastery_percent)[0];

  let recommendedQuiz: RecommendedQuiz | null = null;
  if (worstToReview) {
    const { data } = await supabase
      .from('v_resource_library')
      .select('id, title, kind, subject_name')
      .in('kind', ['quiz', 'simulado'])
      .eq('subject_catalog_id', worstToReview.subject_id)
      .order('sort_order')
      .limit(30);
    const pick = (data ?? []).find((r) => !attemptedResourceIds.has(r.id));
    if (pick) {
      recommendedQuiz = {
        id: pick.id,
        title: pick.title,
        kind: pick.kind as 'quiz' | 'simulado',
        subjectName: pick.subject_name,
      };
    }
  }
  if (!recommendedQuiz) {
    const { data } = await supabase
      .from('v_resource_library')
      .select('id, title, kind, subject_name')
      .in('kind', ['quiz', 'simulado'])
      .order('sort_order')
      .limit(30);
    const pick = (data ?? []).find((r) => !attemptedResourceIds.has(r.id));
    if (pick) {
      recommendedQuiz = {
        id: pick.id,
        title: pick.title,
        kind: pick.kind as 'quiz' | 'simulado',
        subjectName: pick.subject_name,
      };
    }
  }

  return {
    today,
    greetingName: profile?.full_name?.trim().split(/\s+/)[0] ?? '',
    streak,
    longestStreak,
    avatarUrl: profile?.avatar_url ?? null,
    dailyGoalMinutes: profile?.daily_study_goal_minutes ?? 45,
    studiedTodayMinutes: Math.round(studiedTodaySeconds / 60),
    weeklyGoalMinutes: profile?.weekly_study_goal_minutes ?? 0,
    weekStudiedMinutes: Math.round(weekStudiedSeconds / 60),
    previousWeekStudiedMinutes: Math.round(previousWeekStudiedSeconds / 60),
    weekDays,
    overallScore,
    routines,
    candidates,
    upcoming,
    classesToday,
    runningSessionId: running?.id ?? null,
    runningSessionStartedAt: running?.started_at ?? null,
    resume,
    resumeAudio,
    resumeVideo,
    recommendedQuiz,
  };
}
