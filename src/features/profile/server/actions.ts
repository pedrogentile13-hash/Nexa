'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Edição do perfil.
 *
 * O fuso é editável de propósito: um aluno que muda de cidade (ou viaja) fica
 * com a sequência quebrando sozinha até corrigir isso, e ele não teria como
 * adivinhar a causa.
 */

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Diga seu nome.').max(80),
  gradeLevel: z.string().trim().max(40).nullable(),
  className: z.string().trim().max(20).nullable(),
  dailyStudyGoalMinutes: z
    .number()
    .int()
    .min(0, 'A meta não pode ser negativa.')
    .max(1440, 'Um dia tem 24 horas.'),
  weeklyStudyGoalMinutes: z.number().int().min(0).max(10080),
  timezone: z.string().trim().min(1).max(60),
});

export type ProfileState =
  { status: 'idle' } | { status: 'saved' } | { status: 'error'; message: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    gradeLevel: formData.get('gradeLevel') || null,
    className: formData.get('className') || null,
    dailyStudyGoalMinutes: Number(formData.get('dailyStudyGoalMinutes')),
    weeklyStudyGoalMinutes: Number(formData.get('weeklyStudyGoalMinutes')),
    timezone: formData.get('timezone'),
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const data = parsed.data;
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      grade_level: data.gradeLevel,
      class_name: data.className,
      daily_study_goal_minutes: data.dailyStudyGoalMinutes,
      weekly_study_goal_minutes: data.weeklyStudyGoalMinutes,
      timezone: data.timezone,
    })
    .eq('id', user.id);

  if (error) {
    // 22023 vem do Postgres quando o fuso não existe — vale dizer isso em vez
    // de "erro ao salvar", porque é o único campo aqui que dá para digitar errado.
    const message =
      error.code === '22023'
        ? 'Esse fuso horário não é válido.'
        : 'Não consegui salvar as alterações.';
    return { status: 'error', message };
  }

  // O nome aparece no cabeçalho de todas as telas; a meta muda o cálculo do
  // progresso diário. Revalidar só /perfil deixaria as duas coisas velhas.
  revalidatePath('/', 'layout');
  return { status: 'saved' };
}
