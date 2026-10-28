'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { reportError } from '@/features/observability/server/actions';
import { buildEssayMessages, countWords, MAX_WORDS, MIN_WORDS, parseEssayFeedback, type EssayFeedback } from '../lib/essay';

export type EssayState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; theme: string; feedback: EssayFeedback; saved: boolean };

const schema = z.object({
  theme: z.string().trim().min(3, 'Escreva o tema da redação.').max(300),
  essay: z.string().trim().min(1, 'Cole ou escreva a redação.').max(8000, 'Texto grande demais.'),
});

/**
 * Corrige a redação (estimativa no modelo ENEM) e guarda no histórico.
 *
 * Se guardar falhar (SQL ainda não rodou, por exemplo), o aluno AINDA recebe a
 * correção — ela custou uma chamada de IA e é o que ele veio buscar; só o
 * histórico fica de fora, e a tela avisa.
 */
export async function correctEssay(_prev: EssayState, formData: FormData): Promise<EssayState> {
  const parsed = schema.safeParse({ theme: formData.get('theme'), essay: formData.get('essay') });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };

  const words = countWords(parsed.data.essay);
  if (words < MIN_WORDS) return { status: 'error', message: `A redação tem ${words} palavras. Escreva pelo menos ${MIN_WORDS} para eu poder avaliar.` };
  if (words > MAX_WORDS) return { status: 'error', message: `A redação tem ${words} palavras; o máximo aqui é ${MAX_WORDS}.` };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const quota = await checkAiQuota(supabase, 'essay');
  if (!quota.ok) return { status: 'error', message: quota.message };

  const result = await completeWithAI(buildEssayMessages(parsed.data.theme, parsed.data.essay), {
    maxTokens: 2500,
    temperature: 0.3,
    timeoutMs: 45_000,
  });

  if (!result.ok) {
    if (result.reason === 'content_filter') {
      return { status: 'error', message: 'O provedor de IA recusou este texto. Confira se há algo ofensivo e tente de novo.' };
    }
    await reportError({
      origin: 'server',
      message: `Correção de redação falhou: ${result.reason}${'status' in result ? ` (HTTP ${result.status})` : ''}`,
      pathname: '/vestibular/redacao',
    });
    return { status: 'error', message: 'A IA não respondeu agora — tente de novo em instantes.' };
  }

  const feedback = parseEssayFeedback(result.text, parsed.data.essay);
  if (!feedback) {
    return { status: 'error', message: 'A IA devolveu uma correção que não consegui ler. Tente de novo (não conta no seu histórico).' };
  }

  const score = (id: number) => feedback.competencies.find((c) => c.id === id)!.score;
  const { error } = await supabase.from('essay_corrections').insert({
    user_id: user.id,
    theme: parsed.data.theme,
    essay: parsed.data.essay,
    c1: score(1),
    c2: score(2),
    c3: score(3),
    c4: score(4),
    c5: score(5),
    feedback: feedback as unknown,
  });

  revalidatePath('/vestibular/redacao');
  return { status: 'done', theme: parsed.data.theme, feedback, saved: !error };
}

export async function deleteEssay(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('essay_corrections').delete().eq('id', id.data);
  revalidatePath('/vestibular/redacao');
}
