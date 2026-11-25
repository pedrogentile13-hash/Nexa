'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { fetchExamFile } from '@/features/vestibular/server/fetch-exam-file';
import { dbProblem, persistAnswerKey, readKey, type KeyPreview } from './answer-key-store';
import { requireAccess } from './guard';

export type { KeyPreview } from './answer-key-store';
export type KeySaved = { ok: true; message: string } | { ok: false; message: string };

const editionSchema = z.string().uuid();

/**
 * Lê o gabarito de um arquivo de gabarito JÁ CADASTRADO na edição (`fileId`; sem ele, o primeiro). O resultado é só uma
 * PRÉVIA em texto: o administrador confere e corrige antes de salvar.
 */
export async function previewAnswerKey(editionId: string, fileId?: string): Promise<KeyPreview> {
  await requireAccess('/admin/gabaritos');
  if (!editionSchema.safeParse(editionId).success) return { ok: false, message: 'Edição inválida.' };

  const supabase = await createClient();
  let query = supabase.from('exam_files').select('url').eq('exam_edition_id', editionId).eq('kind', 'gabarito');
  if (fileId && editionSchema.safeParse(fileId).success) query = query.eq('id', fileId);
  const { data: file } = await query.order('sort_order').limit(1).maybeSingle();
  if (!file) return { ok: false, message: 'Esta edição não tem arquivo de gabarito cadastrado. Envie o PDF aqui ou cole o gabarito.' };

  const downloaded = await fetchExamFile(file.url);
  if (!downloaded.ok) return { ok: false, message: `${downloaded.message} Você pode enviar o PDF do gabarito direto aqui.` };
  return readKey(downloaded.data, downloaded.mime);
}

const UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** Lê o gabarito de um PDF (ou foto) enviado agora pelo administrador, sem depender do site oficial. */
export async function previewAnswerKeyUpload(formData: FormData): Promise<KeyPreview> {
  await requireAccess('/admin/gabaritos');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Escolha o PDF do gabarito.' };
  if (!UPLOAD_TYPES.includes(file.type)) return { ok: false, message: 'Envie um PDF, JPG, PNG ou WebP.' };
  if (file.size > 12 * 1024 * 1024) return { ok: false, message: 'O arquivo é grande demais (máximo 12 MB).' };
  return readKey(Buffer.from(await file.arrayBuffer()), file.type);
}

/** Salva (substitui) o gabarito de um caderno da edição. `text`: "1-A 2-C ..."; `areas`: "1-45 Linguagens, 46-90 Humanas". */
export async function saveAnswerKey(editionId: string, variant: string, text: string, areas: string): Promise<KeySaved> {
  await requireAccess('/admin/gabaritos');
  if (!editionSchema.safeParse(editionId).success) return { ok: false, message: 'Edição inválida.' };
  const supabase = await createClient();
  const r = await persistAnswerKey(supabase, editionId, variant, text, areas);
  if (r.ok) {
    revalidatePath('/admin/gabaritos');
    revalidatePath('/vestibular/provas');
  }
  return r;
}

export async function deleteAnswerKey(editionId: string, variant: string): Promise<KeySaved> {
  await requireAccess('/admin/gabaritos');
  if (!editionSchema.safeParse(editionId).success) return { ok: false, message: 'Edição inválida.' };
  const supabase = await createClient();
  const { error } = await supabase.from('exam_answer_keys').delete().eq('exam_edition_id', editionId).eq('variant', variant.trim());
  if (error) return { ok: false, message: dbProblem(error) };
  revalidatePath('/admin/gabaritos');
  return { ok: true, message: 'Gabarito apagado.' };
}
