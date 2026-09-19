import { createClient } from '@/lib/supabase/server';
import type { Difficulty, MasteryStatus, VestibularAnswerSource } from '@/types/database.types';

/**
 * Desempenho da preparação e central de erros.
 *
 * Tudo vem de `vestibular_latest_answers` no banco — a função que sabe somar
 * as DUAS origens de resposta (prova e treino avulso) e contar só a mais
 * recente de cada questão. Nenhuma agregação é refeita aqui em cima: se o
 * critério de "qual resposta vale" mudar, ele muda num lugar só.
 */

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  correctCount: number;
  totalCount: number;
  accuracyPercent: number;
  status: MasteryStatus;
}

export async function getVestibularSubjectPerformance(): Promise<SubjectPerformance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('vestibular_subject_performance');
  if (error || !data) return [];

  return data.map((r) => ({
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    correctCount: Number(r.correct_count),
    totalCount: Number(r.total_count),
    accuracyPercent: Number(r.accuracy_percent),
    status: r.status,
  }));
}

export interface TopicPerformance extends SubjectPerformance {
  topicId: string | null;
  topicName: string;
}

export async function getVestibularTopicPerformance(
  subjectCatalogId?: string | null,
): Promise<TopicPerformance[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('vestibular_topic_performance', {
    p_subject_catalog_id: subjectCatalogId ?? null,
  });
  if (error || !data) return [];

  return data.map((r) => ({
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    topicId: r.topic_id,
    topicName: r.topic_name,
    correctCount: Number(r.correct_count),
    totalCount: Number(r.total_count),
    accuracyPercent: Number(r.accuracy_percent),
    status: r.status,
  }));
}

export interface VestibularError {
  questionId: string;
  statement: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  examName: string | null;
  editionYear: number | null;
  difficulty: Difficulty;
  correctOptionBody: string | null;
  explanation: string | null;
  source: VestibularAnswerSource;
  answeredAt: string;
}

export async function listVestibularErrors(
  subjectCatalogId?: string | null,
  limit = 30,
): Promise<VestibularError[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('vestibular_error_list', {
    p_subject_catalog_id: subjectCatalogId ?? null,
    p_limit: limit,
  });
  if (error || !data) return [];

  return data.map((r) => ({
    questionId: r.question_id,
    statement: r.statement,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    topicName: r.topic_name,
    examName: r.exam_name,
    editionYear: r.edition_year,
    difficulty: r.difficulty,
    correctOptionBody: r.correct_option_body,
    explanation: r.explanation,
    source: r.source,
    answeredAt: r.answered_at,
  }));
}
