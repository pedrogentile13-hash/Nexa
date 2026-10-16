import { createClient } from '@/lib/supabase/server';
import type { ResourceKind } from '@/types/database.types';

/**
 * Leituras de Revisões — substitui a Central de Erros (ADR-037 revisto: as
 * duas telas fundiam "erros" e "revisões de hoje" porque na época eram a
 * mesma coisa; agora Revisões é mais ampla, com fila de hoje/atrasadas/
 * próximas/concluídas e repetição espaçada real de conteúdo concluído).
 *
 * Tudo sai de `review_queue()` (migration `content_reviews.sql`), que já
 * junta questões erradas (via `recent_errors()`) e conteúdo vencido.
 */

export type ReviewBucket = 'atrasada' | 'hoje' | 'proxima' | 'concluida';
export type ReviewKind = 'erro' | 'conteudo';

export interface ReviewItem {
  kind: ReviewKind;
  bucket: ReviewBucket;
  questionId: string | null;
  resourceId: string;
  resourceTitle: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  statement: string | null;
  explanation: string | null;
  chosenBody: string | null;
  correctBody: string | null;
  answeredAt: string | null;
  dueDate: string;
  nextIntervalStep: number;
  resourceKind: ResourceKind | null;
}

export async function getReviewQueue(userId: string): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('review_queue', { p_user_id: userId });

  return (data ?? []).map((row) => ({
    kind: row.kind as ReviewKind,
    bucket: row.bucket as ReviewBucket,
    questionId: row.question_id,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    topicName: row.topic_name,
    statement: row.statement,
    explanation: row.explanation,
    chosenBody: row.chosen_body,
    correctBody: row.correct_body,
    answeredAt: row.answered_at,
    dueDate: row.due_date,
    nextIntervalStep: row.next_interval_step,
    resourceKind: row.resource_kind,
  }));
}
