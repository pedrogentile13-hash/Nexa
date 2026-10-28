'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { reportError } from '@/features/observability/server/actions';
import { buildErrorExplanationMessages } from '../lib/error-prompt';
import { getReviewQueue } from './queries';

/**
 * "Marcar como revisado" — grava uma confirmação em `content_reviews` e
 * avança `interval_step`. O passo seguinte já vem calculado por
 * `review_queue()` (é o que o aluno está vendo na tela), não é recalculado
 * aqui: esta ação só registra a confirmação.
 */
const schema = z.object({
  resourceId: z.string().uuid(),
  nextIntervalStep: z.number().int().min(0).max(3),
});

export async function markContentReviewed(
  resourceId: string,
  nextIntervalStep: number,
): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse({ resourceId, nextIntervalStep });
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from('content_reviews').insert({
    user_id: user.id,
    resource_id: parsed.data.resourceId,
    interval_step: parsed.data.nextIntervalStep,
  });

  revalidatePath('/revisoes');
  return { ok: !error };
}

/** "Marcar como dominado" numa questão — igual à Central de Erros de antes. */
export async function dismissError(questionId: string): Promise<{ ok: boolean }> {
  const parsed = z.string().uuid().safeParse(questionId);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc('dismiss_question_error', { p_question_id: parsed.data });

  revalidatePath('/revisoes');
  return { ok: !error };
}

export type ErrorExplanation = { ok: true; markdown: string } | { ok: false; message: string };

/**
 * "Por que errei?" — a IA explica o erro e diz a causa provável.
 *
 * Recebe só o id da questão: o enunciado, a alternativa marcada e a certa são
 * relidos aqui, da fila do PRÓPRIO aluno. Assim ninguém usa isto como um
 * pedido de IA com texto livre, e só se explica um erro que a pessoa cometeu.
 */
export async function explainMyError(questionId: string): Promise<ErrorExplanation> {
  const id = z.string().uuid().safeParse(questionId);
  if (!id.success) return { ok: false, message: 'Questão inválida.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const item = (await getReviewQueue(user.id)).find((i) => i.kind === 'erro' && i.questionId === id.data);
  if (!item || !item.statement) return { ok: false, message: 'Não encontrei este erro na sua fila.' };

  const quota = await checkAiQuota(supabase, 'explain');
  if (!quota.ok) return { ok: false, message: quota.message };

  const result = await completeWithAI(
    buildErrorExplanationMessages({
      subjectName: item.subjectName,
      topicName: item.topicName,
      statement: item.statement,
      chosen: item.chosenBody,
      correct: item.correctBody,
      explanation: item.explanation,
    }),
    { maxTokens: 500, temperature: 0.4, timeoutMs: 20_000 },
  );
  if (result.ok) return { ok: true, markdown: result.text };

  if (result.reason === 'content_filter') return { ok: false, message: 'Não consegui explicar este erro.' };
  await reportError({
    origin: 'server',
    message: `Por que errei falhou: ${result.reason}${'status' in result ? ` (HTTP ${result.status})` : ''}`,
    pathname: '/revisoes',
  });
  return { ok: false, message: 'A IA não respondeu agora — tente de novo em instantes.' };
}
