'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Escritas do banco de questões avulsas.
 *
 * `answerPracticeQuestion` é a ÚNICA porta por onde o gabarito sai — e sai
 * depois de a escolha já estar gravada. A recusa de reescrever uma questão
 * já respondida vive na RPC, não aqui: a trava tem que valer mesmo para quem
 * chamar a API direto, sem passar por esta tela.
 */

export async function createPracticeSession(input: {
  examId?: string | null;
  subjectId?: string | null;
  difficulty?: string | null;
  questionCount?: number;
}): Promise<{ status: 'ok'; sessionId: string } | { status: 'error'; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('start_practice_session', {
    p_exam_id: input.examId ?? null,
    p_subject_catalog_id: input.subjectId ?? null,
    p_difficulty: input.difficulty ?? null,
    p_question_count: Math.min(50, Math.max(1, input.questionCount ?? 10)),
  });

  if (error || !data) {
    return {
      status: 'error',
      message: 'Não achei questões com esses filtros. Tenta afrouxar a matéria ou a dificuldade.',
    };
  }

  revalidatePath('/vestibular/questoes');
  return { status: 'ok', sessionId: data };
}

export interface PracticeFeedback {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
}

export async function answerPracticeQuestion(input: {
  sessionId: string;
  questionId: string;
  optionId: string;
  timeSpentSeconds?: number;
}): Promise<{ status: 'ok'; feedback: PracticeFeedback } | { status: 'error'; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('answer_practice_question', {
    p_session_id: input.sessionId,
    p_question_id: input.questionId,
    p_option_id: input.optionId,
    p_time_spent_seconds: Math.max(0, Math.round(input.timeSpentSeconds ?? 0)),
  });

  const row = data?.[0];
  if (error || !row) {
    return { status: 'error', message: 'Não consegui registrar sua resposta — tenta de novo.' };
  }

  return {
    status: 'ok',
    feedback: {
      isCorrect: row.is_correct,
      correctOptionId: row.correct_option_id,
      explanation: row.explanation,
    },
  };
}

export async function finishPracticeSession(
  sessionId: string,
): Promise<
  | { status: 'ok'; correctCount: number; totalCount: number; xpAwarded: number }
  | { status: 'error'; message: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('finish_practice_session', { p_session_id: sessionId });

  const row = data?.[0];
  if (error || !row) {
    return { status: 'error', message: 'Não consegui encerrar a sessão — tenta de novo.' };
  }

  revalidatePath('/vestibular/questoes');
  revalidatePath('/vestibular');
  return {
    status: 'ok',
    correctCount: row.correct_count,
    totalCount: row.total_count,
    xpAwarded: row.xp_awarded,
  };
}
