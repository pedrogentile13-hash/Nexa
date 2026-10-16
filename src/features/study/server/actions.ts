'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Escritas da aba Estudar.
 *
 * Quase tudo aqui é uma chamada a uma função do banco, não um `insert`. A razão
 * é o gabarito: corrigir no cliente exigiria mandar a resposta certa para ele
 * antes de responder. As funções corrigem no Postgres e devolvem só o veredito.
 */

/**
 * Favoritar generaliza para qualquer recurso — `resource_progress` já é por
 * (aluno, recurso) independente de formato — mas a tela dedicada de
 * "Meus favoritos" continua em aberto (ADR-037). Isto só liga o sinalizador.
 */
export async function toggleFavorite(resourceId: string, favorited: boolean): Promise<void> {
  const parsed = z.string().uuid().safeParse(resourceId);
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('resource_progress').upsert(
    {
      user_id: user.id,
      resource_id: parsed.data,
      is_favorited: favorited,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,resource_id' },
  );

  revalidatePath(`/estudar/${resourceId}`);
}

export async function saveProgress(
  resourceId: string,
  percent: number | null,
  positionSeconds: number | null,
  completed = false,
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('mark_resource_progress', {
    p_resource_id: resourceId,
    p_percent: percent,
    p_position_seconds: positionSeconds,
    p_completed: completed,
  });
}

export type StartAttemptResult =
  { status: 'ok'; attemptId: string } | { status: 'error'; message: string };

export async function startAttempt(resourceId: string): Promise<StartAttemptResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('start_quiz_attempt', { p_resource_id: resourceId });

  if (error) {
    return {
      status: 'error',
      message: /questões/i.test(error.message)
        ? 'Este material ainda não tem questões cadastradas.'
        : 'Não consegui começar agora. Tente de novo.',
    };
  }

  return { status: 'ok', attemptId: data as string };
}

export interface AnswerResult {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
}

export async function answerQuestion(
  attemptId: string,
  questionId: string,
  optionId: string | null,
  timeSpentSeconds = 0,
): Promise<AnswerResult | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('answer_quiz_question', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_option_id: optionId,
    p_time_spent_seconds: Math.max(0, Math.round(timeSpentSeconds)),
  });

  if (error || !data?.[0]) return null;

  return {
    isCorrect: data[0].is_correct,
    correctOptionId: data[0].correct_option_id,
    explanation: data[0].explanation,
  };
}

export interface AttemptAnswerState {
  questionId: string;
  optionId: string | null;
  flagged: boolean;
}

/** Restaura respostas e marcações já salvas — recarregar a página não perde nada. */
export async function getAttemptState(attemptId: string): Promise<AttemptAnswerState[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('quiz_attempt_state', { p_attempt_id: attemptId });
  return (data ?? []).map((row) => ({
    questionId: row.question_id,
    optionId: row.option_id,
    flagged: row.flagged,
  }));
}

/** "Marcar para revisar". Devolve o novo estado (true = marcada). */
export async function toggleQuestionFlag(attemptId: string, questionId: string): Promise<boolean | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('toggle_question_flag', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
  });
  if (error) return null;
  return data;
}

/** Autosave da redação — devolve a contagem de palavras pro contador ao vivo. */
export async function saveEssayDraft(
  attemptId: string,
  writingTaskId: string,
  content: string,
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_essay_draft', {
    p_attempt_id: attemptId,
    p_writing_task_id: writingTaskId,
    p_content: content,
  });
  if (error) return null;
  return data;
}

export async function submitEssay(attemptId: string, writingTaskId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_essay', {
    p_attempt_id: attemptId,
    p_writing_task_id: writingTaskId,
  });
  return !error;
}

export interface EssayDraft {
  writingTaskId: string;
  content: string;
  wordCount: number;
  isSubmitted: boolean;
}

/** Hidrata o editor de redação ao entrar/retomar uma tentativa. */
export async function getEssayDrafts(attemptId: string): Promise<EssayDraft[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('essay_submissions')
    .select('writing_task_id, content, word_count, is_submitted')
    .eq('attempt_id', attemptId);

  return (data ?? []).map((d) => ({
    writingTaskId: d.writing_task_id,
    content: d.content,
    wordCount: d.word_count,
    isSubmitted: d.is_submitted,
  }));
}

export interface FinishResult {
  correctCount: number;
  totalCount: number;
  durationSeconds: number;
  xpAwarded: number;
}

export async function finishAttempt(attemptId: string): Promise<FinishResult | null> {
  const supabase = await createClient();

  // Qualquer rascunho de redação com conteúdo e ainda não entregue é
  // auto-entregue ao finalizar — a prova não pode fechar com um texto
  // escrito e nunca submetido, mesmo se o aluno saiu sem clicar "Entregar".
  const { data: drafts } = await supabase
    .from('essay_submissions')
    .select('writing_task_id, content, is_submitted')
    .eq('attempt_id', attemptId);
  for (const draft of drafts ?? []) {
    if (!draft.is_submitted && draft.content.trim()) {
      await supabase.rpc('submit_essay', { p_attempt_id: attemptId, p_writing_task_id: draft.writing_task_id });
    }
  }

  const { data, error } = await supabase.rpc('finish_quiz_attempt', { p_attempt_id: attemptId });

  if (error || !data?.[0]) return null;

  revalidatePath('/estudar');
  revalidatePath('/desempenho');
  revalidatePath('/ranking');

  return {
    correctCount: data[0].correct_count,
    totalCount: data[0].total_count,
    durationSeconds: data[0].duration_seconds,
    xpAwarded: data[0].xp_awarded,
  };
}

export async function startLesson(lessonId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('start_lesson', { p_lesson_id: lessonId });
  revalidatePath('/estudar');
}

export async function completeLesson(
  lessonId: string,
  flawless = false,
): Promise<{ state: string; xpAwarded: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('complete_lesson', {
    p_lesson_id: lessonId,
    p_flawless: flawless,
  });

  if (error || !data?.[0]) return null;

  revalidatePath('/estudar');
  revalidatePath('/ranking');
  return { state: data[0].state, xpAwarded: data[0].xp_awarded };
}

const highlightSchema = z.object({
  resourceId: z.string().uuid(),
  quote: z.string().trim().min(1).max(2000),
});

export async function addHighlight(resourceId: string, quote: string): Promise<void> {
  const parsed = highlightSchema.safeParse({ resourceId, quote });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('highlights').insert({
    user_id: user.id,
    resource_id: parsed.data.resourceId,
    quote: parsed.data.quote,
  });

  revalidatePath(`/estudar/${resourceId}`);
}

export async function removeHighlight(formData: FormData): Promise<void> {
  const id = formData.get('id');
  const resourceId = formData.get('resourceId');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('highlights').delete().eq('id', id);
  if (typeof resourceId === 'string') revalidatePath(`/estudar/${resourceId}`);
}

/** Flashcard: "sei esta" / "ainda não sei". Alimenta a repetição futura. */
export async function reviewFlashcard(resourceId: string, knows: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('flashcard_reviews').insert({
    user_id: user.id,
    resource_id: resourceId,
    knows,
  });

  await supabase.rpc('mark_resource_progress', {
    p_resource_id: resourceId,
    p_percent: knows ? 100 : 50,
    p_position_seconds: null,
    p_completed: knows,
  });
}
