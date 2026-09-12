'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * "Quero tirar 8 em Matemática." Não é nota — é a meta que o aluno compara
 * contra a nota automática (`subjects.target_grade`, já existia, só que antes
 * media contra uma nota digitada e agora mede contra a calculada).
 */
const schema = z.object({
  subjectId: z.string().uuid(),
  targetGrade: z.number().min(0).max(10).nullable(),
});

export async function updateSubjectTargetGrade(
  subjectId: string,
  targetGrade: number | null,
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ subjectId, targetGrade });
  if (!parsed.success) return { error: 'Meta inválida.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('subjects')
    .update({ target_grade: parsed.data.targetGrade })
    .eq('id', parsed.data.subjectId);

  if (error) return { error: 'Não deu para salvar a meta agora.' };

  revalidatePath('/disciplinas');
  revalidatePath(`/disciplinas/${subjectId}`);
  revalidatePath('/desempenho');
  return { error: null };
}
