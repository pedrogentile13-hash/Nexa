'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { onboardingSchema, type OnboardingState } from '../schemas';

/**
 * Completes onboarding.
 *
 * Everything happens inside `bootstrap_student()`, which is one transaction:
 * profile, academic year, terms, grading scheme, categories, subjects, the
 * subject × term matrix and a starter checklist. Doing this from the client
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
    p_class_name: data.className ?? null,
    p_school_id: null,
    p_timezone: data.timezone,
    p_year_label: null,
    p_year_starts_on: null,
    p_year_ends_on: null,
    p_term_count: data.termCount,
    p_catalog_ids: data.catalogIds,
    p_custom_subjects: data.customSubjects,
    p_categories: data.categories.map((c) => ({
      name: c.name,
      short_code: c.shortCode ?? null,
      weight_percent: c.weightPercent,
    })),
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
