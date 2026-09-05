'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

/**
 * Escrita de notas.
 *
 * Uma única Server Action por operação, com Zod na fronteira. O banco ainda
 * valida por cima (trigger de categoria × esquema, checks de faixa) — isto aqui
 * existe para devolver mensagem legível antes de o aluno ver um erro do
 * Postgres.
 */

const activitySchema = z.object({
  subjectTermId: z.string().uuid(),
  categoryId: z.string().uuid(),
  title: z.string().trim().min(1, 'Dê um nome à avaliação.').max(160),
  score: z.number().min(0, 'Nota não pode ser negativa.').nullable(),
  maxScore: z.number().positive('A escala precisa ser maior que zero.').nullable(),
  weight: z.number().positive('O peso precisa ser maior que zero.'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
    .nullable(),
  notes: z.string().trim().max(2000).nullable(),
});

export type ActivityInput = z.input<typeof activitySchema>;

export type GradeActionResult = { ok: true; id?: string } | { ok: false; message: string };

function friendlyError(code: string | undefined, fallback: string): string {
  // 23514 é o trigger que impede uma nota de apontar para categoria de outro
  // esquema — sem essa mensagem o aluno veria um erro de constraint cru.
  if (code === '23514') return 'Essa categoria não pertence ao modelo de notas da disciplina.';
  if (code === '23505') return 'Já existe uma avaliação igual a essa.';
  return fallback;
}

export async function createActivity(input: ActivityInput): Promise<GradeActionResult> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const data = parsed.data;
  const { data: row, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      subject_term_id: data.subjectTermId,
      category_id: data.categoryId,
      title: data.title,
      score: data.score,
      max_score: data.maxScore,
      weight: data.weight,
      due_date: data.dueDate,
      notes: data.notes,
      // Uma nota lançada junto com a criação já nasce com data de lançamento.
      graded_at: data.score !== null ? new Date().toISOString().slice(0, 10) : null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    return { ok: false, message: friendlyError(error.code, 'Não consegui salvar a avaliação.') };
  }

  if (data.score !== null) {
    await supabase.rpc('award_xp', {
      p_amount: 5,
      p_reason: 'Nota registrada',
      p_source_type: 'activity',
      p_source_id: row?.id ?? null,
      p_user_id: user.id,
    });
  }

  revalidateGradeScreens();
  return { ok: true, id: row?.id };
}

const updateSchema = activitySchema.partial().extend({ id: z.string().uuid() });

export async function updateActivity(
  input: z.input<typeof updateSchema>,
): Promise<GradeActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const { id, ...rest } = parsed.data;

  // Tipado como o Update da tabela: `Record<string, unknown>` faria o
  // supabase-js recusar o objeto, e um `any` esconderia um nome de coluna errado.
  const patch: Database['public']['Tables']['activities']['Update'] = {};
  if (rest.title !== undefined) patch.title = rest.title;
  if (rest.categoryId !== undefined) patch.category_id = rest.categoryId;
  if (rest.weight !== undefined) patch.weight = rest.weight;
  if (rest.maxScore !== undefined) patch.max_score = rest.maxScore;
  if (rest.dueDate !== undefined) patch.due_date = rest.dueDate;
  if (rest.notes !== undefined) patch.notes = rest.notes;
  if (rest.score !== undefined) {
    patch.score = rest.score;
    patch.graded_at = rest.score !== null ? new Date().toISOString().slice(0, 10) : null;
  }

  if (Object.keys(patch).length === 0) return { ok: true, id };

  const { error } = await supabase.from('activities').update(patch).eq('id', id);
  if (error) {
    return { ok: false, message: friendlyError(error.code, 'Não consegui salvar a alteração.') };
  }

  revalidateGradeScreens();
  return { ok: true, id };
}

export async function deleteActivity(id: string): Promise<GradeActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: 'Avaliação inválida.' };

  const supabase = await createClient();
  const { error } = await supabase.from('activities').delete().eq('id', parsed.data);

  if (error) return { ok: false, message: 'Não consegui remover a avaliação.' };

  revalidateGradeScreens();
  return { ok: true };
}

const targetSchema = z.object({
  subjectTermId: z.string().uuid(),
  targetGrade: z.number().min(0).max(1000).nullable(),
});

/** Define a meta do aluno para a disciplina neste período. */
export async function setSubjectTermTarget(
  input: z.input<typeof targetSchema>,
): Promise<GradeActionResult> {
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Meta inválida.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('subject_terms')
    .update({ target_grade: parsed.data.targetGrade })
    .eq('id', parsed.data.subjectTermId);

  if (error) return { ok: false, message: 'Não consegui salvar a meta.' };

  revalidateGradeScreens();
  return { ok: true };
}

/**
 * As médias aparecem em quatro telas; uma nota lançada muda todas.
 * Revalidar só a página atual deixaria a Hoje mostrando o risco antigo.
 */
function revalidateGradeScreens() {
  revalidatePath('/hoje');
  revalidatePath('/disciplinas');
  revalidatePath('/disciplinas/[subjectId]', 'page');
  revalidatePath('/desempenho');
  revalidatePath('/agenda');
}
