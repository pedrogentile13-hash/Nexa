'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/** "Marcar como dominado" — dispensa um erro sem precisar refazer a questão. */
export async function dismissError(questionId: string): Promise<void> {
  const parsed = z.string().uuid().safeParse(questionId);
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.rpc('dismiss_question_error', { p_question_id: parsed.data });

  revalidatePath('/erros');
}
