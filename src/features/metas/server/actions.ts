'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Escritas de Metas.
 *
 * `long_term_goals` é a única parte do produto onde o aluno digita um número
 * manualmente (o quanto acha que avançou numa meta de vida) — em todo o
 * resto do app os números vêm de atividade real, nunca de auto-avaliação.
 */

const goalsSchema = z.object({
  monthlyActivitiesGoal: z.number().int().min(0).max(500),
  monthlySubjectsGoal: z.number().int().min(0).max(50),
});

export type GoalsSettingsState =
  | { status: 'idle' }
  | { status: 'saved' }
  | { status: 'error'; message: string };

export async function updateMonthlyGoals(
  _prev: GoalsSettingsState,
  formData: FormData,
): Promise<GoalsSettingsState> {
  const parsed = goalsSchema.safeParse({
    monthlyActivitiesGoal: Number(formData.get('monthlyActivitiesGoal')),
    monthlySubjectsGoal: Number(formData.get('monthlySubjectsGoal')),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os números.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      monthly_activities_goal: parsed.data.monthlyActivitiesGoal,
      monthly_subjects_goal: parsed.data.monthlySubjectsGoal,
    })
    .eq('id', user.id);
  if (error) return { status: 'error', message: 'Não consegui salvar as metas.' };

  revalidatePath('/metas');
  return { status: 'saved' };
}

const createGoalSchema = z.object({
  title: z.string().trim().min(2, 'Dê um nome à meta.').max(120),
  icon: z.string().trim().min(1).max(40),
});

export async function createLongTermGoal(formData: FormData): Promise<void> {
  const parsed = createGoalSchema.safeParse({
    title: formData.get('title'),
    icon: formData.get('icon'),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('long_term_goals').insert({
    user_id: user.id,
    title: parsed.data.title,
    icon: parsed.data.icon,
  });

  revalidatePath('/metas');
}

export async function updateGoalProgress(goalId: string, progressPercent: number): Promise<void> {
  const parsedId = z.string().uuid().safeParse(goalId);
  const parsedProgress = z.number().int().min(0).max(100).safeParse(progressPercent);
  if (!parsedId.success || !parsedProgress.success) return;

  const supabase = await createClient();
  await supabase
    .from('long_term_goals')
    .update({ progress_percent: parsedProgress.data })
    .eq('id', parsedId.data);

  revalidatePath('/metas');
}

export async function deleteLongTermGoal(goalId: string): Promise<void> {
  const parsed = z.string().uuid().safeParse(goalId);
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from('long_term_goals').delete().eq('id', parsed.data);

  revalidatePath('/metas');
}
