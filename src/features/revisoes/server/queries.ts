import { enzoReviewQueue } from '@/lib/demo/enzo-screens';
import { isDemoSession } from '@/lib/demo/server';
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

/**
 * `platform`: o Vestibular tem a própria fila (só o que veio de conteúdo do vestibular); o Estudos mostra o resto.
 * Sem informação do contexto dos itens, não filtra (nunca esconde revisão por engano).
 */
export async function getReviewQueue(userId: string, platform: 'school' | 'vestibular' = 'school'): Promise<ReviewItem[]> {
  if (await isDemoSession()) return enzoReviewQueue();
  const supabase = await createClient();
  const { data: all } = await supabase.rpc('review_queue', { p_user_id: userId });

  let data = all ?? [];
  const ids = [...new Set(data.map((r) => r.resource_id))];
  if (ids.length > 0) {
    const { data: contexts, error } = await supabase.from('resources').select('id, context').in('id', ids);
    if (!error && contexts) {
      const vestibular = new Set(contexts.filter((c) => c.context === 'vestibular').map((c) => c.id));
      data = data.filter((r) => (platform === 'vestibular' ? vestibular.has(r.resource_id) : !vestibular.has(r.resource_id)));
    }
  }

  return data.map((row) => ({
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
