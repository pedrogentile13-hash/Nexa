'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  onboardingSchema,
  vestibularOnboardingSchema,
  type OnboardingState,
} from '../schemas';

/**
 * Completes onboarding.
 *
 * Everything happens inside `bootstrap_student()`, which is one transaction:
 * profile, academic year, terms (só para a grade de aulas — não há mais
 * nota manual), subjects e um checklist inicial. Doing this from the client
 * would be ~25 sequential REST calls that can half-fail.
 */
export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const raw = formData.get('payload');
  if (typeof raw !== 'string') {
    return { status: 'error', message: 'Não recebi os dados do formulário.' };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'Não consegui ler os dados enviados.' };
  }

  const parsed = onboardingSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue?.message ?? 'Revise os dados e tente novamente.',
      field: issue?.path[0]?.toString(),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.rpc('bootstrap_student', {
    p_full_name: data.fullName,
    p_grade_level: data.gradeLevel,
    p_school_id: null,
    p_timezone: data.timezone,
    p_year_label: null,
    p_year_starts_on: null,
    p_year_ends_on: null,
    p_catalog_ids: data.catalogIds,
    p_custom_subjects: data.customSubjects,
    p_daily_goal_minutes: data.dailyGoalMinutes,
  });

  if (error) {
    // 23505 is the RPC's own guard against running twice — treat a double
    // submit as success rather than showing a scary error over a finished setup.
    if (error.code === '23505') {
      revalidatePath('/', 'layout');
      redirect('/hoje');
    }
    return {
      status: 'error',
      message: 'Não consegui concluir a configuração. Tente novamente em instantes.',
    };
  }

  // The middleware reads `onboarded_at` on every request; the layout cache has
  // to be dropped or the next navigation still thinks onboarding is pending.
  revalidatePath('/', 'layout');
  redirect('/hoje');
}

/**
 * Conclui o onboarding de quem escolheu a jornada do vestibular.
 *
 * Caminho SEPARADO de propósito, não um `if` dentro de `completeOnboarding`:
 * o bootstrap do vestibulando não cria ano letivo nem bimestre, e a metade
 * do payload é diferente. Dois caminhos curtos e legíveis valem mais que um
 * longo cheio de campo opcional que só vale pra metade dos usuários.
 */
export async function completeVestibularOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const raw = formData.get('payload');
  if (typeof raw !== 'string') {
    return { status: 'error', message: 'Não recebi os dados do formulário.' };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'Não consegui ler os dados enviados.' };
  }

  const parsed = vestibularOnboardingSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue?.message ?? 'Revise os dados e tente novamente.',
      field: issue?.path[0]?.toString(),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.rpc('bootstrap_vestibular_student', {
    p_full_name: data.fullName,
    p_main_exam_id: data.mainExamId,
    p_target_year: data.targetYear,
    p_timezone: data.timezone,
    p_daily_goal_minutes: data.dailyGoalMinutes,
    p_catalog_ids: [],
    p_target_course: data.targetCourse || null,
    p_target_institution: data.targetInstitution || null,
    p_study_days_per_week: data.studyDaysPerWeek,
    p_finished_high_school: data.finishedHighSchool,
    p_prep_context: data.prepContext,
    p_grade_level: data.gradeLevel || null,
    p_also_school: data.journey === 'both',
  });

  if (error) {
    // Mesma leitura de `completeOnboarding`: 23505 é a própria trava do RPC
    // contra rodar duas vezes, então um duplo toque é sucesso, não erro.
    if (error.code === '23505') {
      revalidatePath('/', 'layout');
      redirect('/vestibular');
    }
    return {
      status: 'error',
      message: 'Não consegui concluir a configuração. Tente novamente em instantes.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/vestibular');
}
