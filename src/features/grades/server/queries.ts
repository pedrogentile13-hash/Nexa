import { createClient } from '@/lib/supabase/server';
import type { GradeActivity, GradingScheme } from '../types';
import { toGradeActivity, toGradingScheme } from './mappers';

/**
 * Dados de uma disciplina em um período.
 *
 * Devolve o esquema e as atividades já no formato do domínio, para o cliente
 * poder recalcular a média enquanto o aluno digita sem precisar conhecer o
 * banco — é isso que faz a nota aparecer no mesmo frame.
 */

export interface SubjectTermDetail {
  subjectTermId: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  termId: string;
  termName: string;
  termSequence: number;
  scheme: GradingScheme;
  activities: GradeActivity[];
  targetGrade: number | null;
  finalGradeOverride: number | null;
  /** Outros períodos da mesma disciplina, para o seletor. */
  siblingTerms: { subjectTermId: string; termName: string; sequence: number }[];
}

export async function getSubjectTermDetail(
  subjectTermId: string,
): Promise<SubjectTermDetail | null> {
  const supabase = await createClient();

  const { data: resolved } = await supabase
    .from('v_subject_terms_resolved')
    .select('*')
    .eq('subject_term_id', subjectTermId)
    .maybeSingle();

  if (!resolved) return null;

  const [{ data: schemeRow }, { data: categoryRows }, { data: activityRows }, { data: siblings }] =
    await Promise.all([
      supabase.from('grading_schemes').select('*').eq('id', resolved.scheme_id).maybeSingle(),
      supabase
        .from('grading_scheme_categories')
        .select('*')
        .eq('scheme_id', resolved.scheme_id)
        .order('sequence'),
      supabase
        .from('activities')
        .select('*')
        .eq('subject_term_id', subjectTermId)
        .order('due_date', { nullsFirst: false })
        .order('created_at'),
      supabase
        .from('v_subject_terms_resolved')
        .select('subject_term_id, term_name, term_sequence')
        .eq('subject_id', resolved.subject_id)
        .order('term_sequence'),
    ]);

  if (!schemeRow) return null;

  return {
    subjectTermId: resolved.subject_term_id,
    subjectId: resolved.subject_id,
    subjectName: resolved.subject_name,
    subjectColor: resolved.subject_color,
    termId: resolved.term_id,
    termName: resolved.term_name,
    termSequence: resolved.term_sequence,
    scheme: toGradingScheme(schemeRow, categoryRows ?? []),
    activities: (activityRows ?? []).map(toGradeActivity),
    targetGrade: resolved.subject_term_target ?? resolved.subject_target,
    finalGradeOverride: resolved.final_grade_override,
    siblingTerms: (siblings ?? []).map((s) => ({
      subjectTermId: s.subject_term_id,
      termName: s.term_name,
      sequence: s.term_sequence,
    })),
  };
}

/** O subject_term da disciplina no período atual — o destino de /disciplinas/[id]. */
export async function getCurrentSubjectTermId(
  subjectId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: termId } = await supabase.rpc('current_term_id', { p_user_id: userId });

  const { data } = await supabase
    .from('subject_terms')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('term_id', (termId as string) ?? '')
    .maybeSingle();

  return data?.id ?? null;
}
