import { createClient } from '@/lib/supabase/server';
import type { ExamAttemptRow } from '@/types/database.types';

/** Leituras do cartão-resposta. O gabarito nunca passa por aqui: só o desenho do cartão e o resultado do próprio aluno. */

export interface SheetQuestion {
  number: number;
  area: string;
  annulled: boolean;
}

/** O desenho do cartão do caderno escolhido (sem `variant`, o primeiro caderno). Só manda o argumento novo quando há caderno. */
export async function getSheetLayout(editionId: string, variant = ''): Promise<SheetQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('exam_key_layout', variant ? { p_edition_id: editionId, p_variant: variant } : { p_edition_id: editionId });
  return (data ?? []).map((q) => ({ number: q.number, area: q.area, annulled: q.annulled }));
}

/** Os cadernos (cores) com gabarito cadastrado. Antes do SQL novo, ou com gabarito único, devolve vazio ou um item só. */
export async function getKeyVariants(editionId: string): Promise<{ variant: string; total: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('exam_key_variants', { p_edition_id: editionId });
  return error || !data ? [] : data;
}

/** Quantas questões tem o gabarito de cada edição (as que ainda não têm gabarito não aparecem). */
export async function getKeyTotals(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('exam_keys_summary');
  return new Map((data ?? []).map((r) => [r.exam_edition_id, r.total]));
}

export async function listMyAttempts(editionId: string): Promise<ExamAttemptRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_edition_id', editionId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as ExamAttemptRow[];
}

export async function getMyAttempt(attemptId: string): Promise<ExamAttemptRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('exam_attempts').select('*').eq('id', attemptId).maybeSingle();
  return (data ?? null) as ExamAttemptRow | null;
}

export interface ReviewRow {
  number: number;
  area: string;
  chosen: string | null;
  correct: string | null;
  status: 'certa' | 'errada' | 'branca' | 'anulada';
}

export async function getAttemptReview(attemptId: string): Promise<ReviewRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('exam_attempt_review', { p_attempt_id: attemptId });
  return (data ?? []) as ReviewRow[];
}
