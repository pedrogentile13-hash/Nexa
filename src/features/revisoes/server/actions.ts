'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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

export async function markContentReviewed(resourceId: string, nextIntervalStep: number): Promise<void> {
  const parsed = schema.safeParse({ resourceId, nextIntervalStep });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('content_reviews').insert({
    user_id: user.id,
    resource_id: parsed.data.resourceId,
    interval_step: parsed.data.nextIntervalStep,
  });

  revalidatePath('/revisoes');
}

/** "Marcar como dominado" numa questão — igual à Central de Erros de antes. */
export async function dismissError(questionId: string): Promise<void> {
  const parsed = z.string().uuid().safeParse(questionId);
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.rpc('dismiss_question_error', { p_question_id: parsed.data });

  revalidatePath('/revisoes');
}
