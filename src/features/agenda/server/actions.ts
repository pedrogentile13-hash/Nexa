'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * "Adicionar compromisso" na Agenda.
 *
 * Não existe tela de criação de evento porque não existe tabela de evento — a
 * Agenda projeta tarefas (inclusive provas, `kind = 'prova'`) e sessões de
 * estudo (ver `server/queries.ts`). Um "compromisso" pessoal do aluno é, na
 * prática, uma linha comum em `tasks`: mesma tabela que já alimenta o
 * checklist do Hoje.
 */

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Dê um nome ao compromisso.').max(120),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha uma data.'),
});

export interface CreateTaskResult {
  ok: boolean;
  message?: string;
}

/** Argumentos simples, não `FormData`: chamado direto de dentro de um
 * `startTransition` no cliente (mesmo padrão de `toggleTask`/`startStudySession`),
 * sem precisar de um `<form>` para um popover de duas perguntas. */
export async function createAgendaTask(title: string, dueDate: string): Promise<CreateTaskResult> {
  const parsed = createTaskSchema.safeParse({ title, dueDate });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: parsed.data.title,
    due_date: parsed.data.dueDate,
    kind: 'custom',
  });

  if (error) return { ok: false, message: 'Não consegui salvar. Tente de novo.' };

  revalidatePath('/agenda');
  revalidatePath('/hoje');
  return { ok: true };
}
