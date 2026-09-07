import { createClient } from '@/lib/supabase/server';

/**
 * Central de Erros.
 *
 * "Última resposta errada de cada questão" vem pronto da função
 * `recent_errors()` (migration `20260907000200_loop_nexa.sql`) — o mesmo
 * mecanismo por trás do domínio por assunto em Desempenho, só que devolvendo
 * a questão inteira em vez do agregado.
 */

export interface RecentError {
  questionId: string;
  statement: string;
  explanation: string | null;
  difficulty: string;
  resourceId: string;
  resourceTitle: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  chosenBody: string | null;
  correctBody: string | null;
  answeredAt: string;
}

export async function getRecentErrors(): Promise<RecentError[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('recent_errors');

  return (data ?? []).map((row) => ({
    questionId: row.question_id,
    statement: row.statement,
    explanation: row.explanation,
    difficulty: row.difficulty,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    topicName: row.topic_name,
    chosenBody: row.chosen_body,
    correctBody: row.correct_body,
    answeredAt: row.answered_at,
  }));
}
