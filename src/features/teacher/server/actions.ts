'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireTeacher } from './guard';
import type { AdminState } from '@/features/admin/server/actions';

export type { AdminState } from '@/features/admin/server/actions';

/**
 * Escritas de `/professor` que são genuinamente exclusivas do professor.
 *
 * As ações de CONTEÚDO (criar/editar recurso, questões, importar simulado)
 * foram unificadas com as do admin em `admin/server/actions.ts`
 * (`requireContentManager()` aceita professor também) — não duplicam mais
 * aqui. `notifyMyClass` fica, porque "avisar minha turma" não existe do
 * lado do admin.
 */

const ok: AdminState = { status: 'saved' };
const fail = (message: string): AdminState => ({ status: 'error', message });

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Revise os campos.';
}

const noticeSchema = z.object({
  classId: z.string().uuid('Escolha a turma.'),
  subjectCatalogId: z.string().uuid('Escolha a matéria.'),
  title: z.string().trim().min(2, 'Dê um título ao aviso.').max(160),
  body: z.string().trim().max(500).optional().or(z.literal('')),
  link: z.string().trim().max(300).optional().or(z.literal('')),
});

export async function notifyMyClass(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireTeacher();

  const parsed = noticeSchema.safeParse({
    classId: formData.get('classId'),
    subjectCatalogId: formData.get('subjectCatalogId'),
    title: formData.get('title'),
    body: formData.get('body') || '',
    link: formData.get('link') || '',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.rpc('notify_class', {
    p_class_id: parsed.data.classId,
    p_subject_catalog_id: parsed.data.subjectCatalogId,
    p_school_id: identity.schoolId,
    p_title: parsed.data.title,
    p_body: parsed.data.body || null,
    p_link: parsed.data.link || null,
  });
  if (error) return fail(error.message);

  revalidatePath('/professor/avisos');
  return ok;
}
