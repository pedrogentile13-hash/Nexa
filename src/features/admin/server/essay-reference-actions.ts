'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAccess } from './guard';

export type RefState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok'; message: string };

const grade = z.coerce.number().refine((n) => [0, 40, 80, 120, 160, 200].includes(n), 'Notas são 0, 40, 80, 120, 160 ou 200.');

const schema = z.object({
  banca: z.string().trim().min(1).max(60),
  theme: z.string().trim().min(3, 'Escreva o tema.').max(300),
  essay: z.string().trim().min(200, 'Cole a redação inteira (mínimo 200 caracteres).').max(12000),
  c1: grade,
  c2: grade,
  c3: grade,
  c4: grade,
  c5: grade,
  source: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1500).optional(),
});

/** Cadastra uma redação real já corrigida, que calibra o corretor PRO. Só o administrador geral. */
export async function addEssayReference(_prev: RefState, formData: FormData): Promise<RefState> {
  await requireAccess('/admin/redacoes-modelo');
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase.from('essay_references').insert({
    banca: d.banca,
    theme: d.theme,
    essay: d.essay,
    c1: d.c1,
    c2: d.c2,
    c3: d.c3,
    c4: d.c4,
    c5: d.c5,
    source: d.source || null,
    notes: d.notes || null,
  });
  if (error) return { status: 'error', message: 'Não consegui salvar (rode o SQL das Nexa Coins).' };
  revalidatePath('/admin/redacoes-modelo');
  return { status: 'ok', message: 'Redação-modelo salva. O corretor PRO já usa nas próximas correções.' };
}

export async function toggleEssayReference(formData: FormData): Promise<void> {
  await requireAccess('/admin/redacoes-modelo');
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  const active = formData.get('active') === '1';
  await supabase.from('essay_references').update({ is_active: active }).eq('id', id.data);
  revalidatePath('/admin/redacoes-modelo');
}

export async function deleteEssayReference(formData: FormData): Promise<void> {
  await requireAccess('/admin/redacoes-modelo');
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('essay_references').delete().eq('id', id.data);
  revalidatePath('/admin/redacoes-modelo');
}
