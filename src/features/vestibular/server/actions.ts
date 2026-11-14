'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Escritas do Nexa Vestibular. A trava de flag mora na RPC
 * (`is_feature_enabled('vestibular_enabled')`), não só aqui — desligar a flag
 * em produção corta a escrita de verdade, não só esconde o formulário.
 */

export type VestibularFormState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok' };

const profileSchema = z.object({
  mainExamId: z.string().uuid('Escolha qual vestibular é o seu foco.'),
  targetYear: z.coerce
    .number()
    .int()
    .min(new Date().getFullYear(), 'O ano da prova não pode estar no passado.')
    .max(2100),
  dailyStudyMinutes: z.coerce
    .number()
    .int()
    .min(10, 'Pelo menos 10 minutos por dia.')
    .max(900, 'No máximo 15 horas por dia.'),
});

export async function saveVestibularProfile(
  _prev: VestibularFormState,
  formData: FormData,
): Promise<VestibularFormState> {
  const parsed = profileSchema.safeParse({
    mainExamId: formData.get('mainExamId'),
    targetYear: formData.get('targetYear'),
    dailyStudyMinutes: formData.get('dailyStudyMinutes'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('save_vestibular_profile', {
    p_main_exam_id: parsed.data.mainExamId,
    p_target_year: parsed.data.targetYear,
    p_daily_study_minutes: parsed.data.dailyStudyMinutes,
  });

  if (error) return { status: 'error', message: 'Não consegui salvar agora — tenta de novo.' };

  // O objetivo principal também vira um alvo listável, pra quando houver mais de um.
  await supabase.rpc('set_exam_target', {
    p_exam_id: parsed.data.mainExamId,
    p_target_year: parsed.data.targetYear,
    p_priority: 1,
  });

  revalidatePath('/vestibular');
  return { status: 'ok' };
}

export async function removeExamTarget(formData: FormData): Promise<void> {
  const examId = formData.get('examId')?.toString();
  if (!examId) return;

  const supabase = await createClient();
  await supabase.rpc('remove_exam_target', { p_exam_id: examId });
  revalidatePath('/vestibular');
}

/**
 * Troca a jornada da conta (Perfil).
 *
 * `revalidatePath('/', 'layout')` e não só a rota atual: a jornada decide a
 * navegação do shell inteiro, que vive no layout — sem derrubar o cache dele,
 * o menu continuaria mostrando a plataforma antiga até a próxima recarga
 * completa.
 */
export async function changeJourney(
  journey: 'school' | 'vestibular' | 'both',
): Promise<{ status: 'ok' } | { status: 'error'; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_journey', { p_journey: journey });

  if (error) {
    return { status: 'error', message: 'Não consegui trocar agora — tenta de novo.' };
  }

  revalidatePath('/', 'layout');
  return { status: 'ok' };
}
