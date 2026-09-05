import { createClient } from '@/lib/supabase/server';

/**
 * Eventos da agenda.
 *
 * Não existe tabela `events`: a agenda é uma projeção sobre o que já está
 * modelado — avaliações, tarefas e sessões de estudo. Uma tabela paralela
 * significaria manter duas verdades sobre a mesma prova, e elas divergem.
 */

export type AgendaKind = 'assessment' | 'task' | 'study';

export interface AgendaEvent {
  id: string;
  kind: AgendaKind;
  title: string;
  date: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string;
  categoryCode: string | null;
  /** Avaliação já com nota, ou tarefa concluída. */
  isDone: boolean;
  score: number | null;
}

export interface AgendaRange {
  from: string;
  to: string;
  today: string;
  events: AgendaEvent[];
}

/** O "hoje" do aluno, no fuso dele. Barato o bastante para ser chamado sozinho. */
export async function getUserToday(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('user_local_date', { p_user_id: userId });
  return (data as string | null) ?? new Date().toISOString().slice(0, 10);
}

/**
 * Não recebe `userId`: a RLS já limita cada consulta às linhas do aluno
 * autenticado. Filtrar de novo aqui daria a impressão de que o isolamento
 * depende deste código — e um dia alguém removeria o filtro achando que é
 * redundante, sem perceber que a proteção real está no banco.
 */
export async function getAgenda(from: string, to: string, today: string): Promise<AgendaRange> {
  const supabase = await createClient();

  const [activitiesRes, tasksRes, sessionsRes] = await Promise.all([
    supabase
      .from('v_activities_effective')
      .select('id, title, due_date, score, category_code, subject_id, subject_name, subject_color')
      .not('due_date', 'is', null)
      .gte('due_date', from)
      .lte('due_date', to),
    supabase
      .from('tasks')
      .select('id, title, due_date, completed_at, subject_id, subjects(name, color)')
      .not('due_date', 'is', null)
      .gte('due_date', from)
      .lte('due_date', to),
    supabase
      .from('study_sessions')
      .select('id, local_date, duration_seconds, subject_id, subjects(name, color)')
      .gte('local_date', from)
      .lte('local_date', to)
      .not('ended_at', 'is', null),
  ]);

  const events: AgendaEvent[] = [];

  for (const row of activitiesRes.data ?? []) {
    events.push({
      id: `a-${row.id}`,
      kind: 'assessment',
      title: row.title,
      date: row.due_date as string,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectColor: row.subject_color ?? 'blue',
      categoryCode: row.category_code,
      isDone: row.score !== null,
      score: row.score,
    });
  }

  for (const row of tasksRes.data ?? []) {
    const subject = row.subjects as unknown as { name: string; color: string } | null;
    events.push({
      id: `t-${row.id}`,
      kind: 'task',
      title: row.title,
      date: row.due_date as string,
      subjectId: row.subject_id,
      subjectName: subject?.name ?? null,
      subjectColor: subject?.color ?? 'slate',
      categoryCode: null,
      isDone: row.completed_at !== null,
      score: null,
    });
  }

  // Sessões de estudo do mesmo dia viram uma linha só: quinze entradas de
  // "estudou Matemática" não são informação, são ruído.
  const studyByDay = new Map<string, { minutes: number; subject: string | null; color: string }>();
  for (const row of sessionsRes.data ?? []) {
    const subject = row.subjects as unknown as { name: string; color: string } | null;
    const current = studyByDay.get(row.local_date);
    studyByDay.set(row.local_date, {
      minutes: (current?.minutes ?? 0) + Math.round((row.duration_seconds ?? 0) / 60),
      subject: current?.subject ?? subject?.name ?? null,
      color: current?.color ?? subject?.color ?? 'teal',
    });
  }

  for (const [date, info] of studyByDay) {
    if (info.minutes < 1) continue;
    events.push({
      id: `s-${date}`,
      kind: 'study',
      title: `${info.minutes} min de estudo`,
      date,
      subjectId: null,
      subjectName: info.subject,
      subjectColor: info.color,
      categoryCode: null,
      isDone: true,
      score: null,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR'));

  return { from, to, today, events };
}
