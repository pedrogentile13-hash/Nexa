import { createClient } from '@/lib/supabase/server';
import type { Difficulty } from '@/types/database.types';

/**
 * Leituras do banco de questões avulsas.
 *
 * O que NÃO está aqui, de propósito: nada que leia `question_options` direto.
 * Toda alternativa chega por `practice_questions`, que é a única função que
 * sabe devolver o enunciado sem o gabarito junto.
 */

export interface PracticeFilterOption {
  id: string;
  name: string;
  questionCount: number;
}

export interface PracticeFilters {
  exams: PracticeFilterOption[];
  subjects: PracticeFilterOption[];
}

export async function getPracticeFilters(): Promise<PracticeFilters> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('practice_filters');
  if (error || !data) return { exams: [], subjects: [] };

  const exams: PracticeFilterOption[] = [];
  const subjects: PracticeFilterOption[] = [];
  for (const row of data) {
    const option = { id: row.id, name: row.name, questionCount: Number(row.question_count) };
    (row.kind === 'exam' ? exams : subjects).push(option);
  }
  return { exams, subjects };
}

export interface PracticeOption {
  id: string;
  position: number;
  body: string;
}

export interface PracticeQuestion {
  questionId: string;
  position: number;
  statement: string;
  difficulty: Difficulty;
  topicName: string | null;
  subjectName: string | null;
  examName: string | null;
  editionYear: number | null;
  options: PracticeOption[];
  myOptionId: string | null;
  myIsCorrect: boolean | null;
}

export async function getPracticeQuestions(sessionId: string): Promise<PracticeQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('practice_questions', { p_session_id: sessionId });
  if (error || !data) return [];

  return data.map((q) => ({
    questionId: q.question_id,
    position: q.question_position,
    statement: q.statement,
    difficulty: q.difficulty,
    topicName: q.topic_name,
    subjectName: q.subject_name,
    examName: q.exam_name,
    editionYear: q.edition_year,
    options: q.options ?? [],
    myOptionId: q.my_option_id,
    myIsCorrect: q.my_is_correct,
  }));
}

export interface PracticeReviewItem {
  questionId: string;
  position: number;
  statement: string;
  subjectName: string | null;
  topicName: string | null;
  examName: string | null;
  editionYear: number | null;
  difficulty: Difficulty;
  myOptionBody: string | null;
  correctOptionBody: string | null;
  isCorrect: boolean;
  explanation: string | null;
}

export async function getPracticeReview(sessionId: string): Promise<PracticeReviewItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('practice_session_review', { p_session_id: sessionId });
  if (error || !data) return [];

  return data.map((q) => ({
    questionId: q.question_id,
    position: q.question_position,
    statement: q.statement,
    subjectName: q.subject_name,
    topicName: q.topic_name,
    examName: q.exam_name,
    editionYear: q.edition_year,
    difficulty: q.difficulty,
    myOptionBody: q.my_option_body,
    correctOptionBody: q.correct_option_body,
    isCorrect: q.is_correct,
    explanation: q.explanation,
  }));
}

export interface PracticeSessionSummary {
  id: string;
  examName: string | null;
  subjectName: string | null;
  correctCount: number;
  totalCount: number;
  startedAt: string;
  finishedAt: string | null;
}

export async function listPracticeSessions(limit = 8): Promise<PracticeSessionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_practice_sessions', { p_limit: limit });
  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    examName: s.exam_name,
    subjectName: s.subject_name,
    correctCount: s.correct_count,
    totalCount: s.total_count,
    startedAt: s.started_at,
    finishedAt: s.finished_at,
  }));
}
