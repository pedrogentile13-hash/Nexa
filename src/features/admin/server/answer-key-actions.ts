'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { aiMessage } from '@/features/nexa-ia/server/material-ingest';
import { fetchExamFile } from '@/features/vestibular/server/fetch-exam-file';
import { ANSWER_KEY_PROMPT, applyAreas, missingNumbers, parseAnswerKeyText, parseAreaRanges, type KeyEntry } from '@/features/vestibular/lib/answer-sheet';
import { requireAccess } from './guard';

export type KeyPreview = { ok: true; text: string; count: number; missing: number[]; source: 'texto do PDF' | 'IA' } | { ok: false; message: string };
export type KeySaved = { ok: true; message: string } | { ok: false; message: string };

const editionSchema = z.string().uuid();

/** Traduz o erro do banco: o mais comum é o SQL do cartão-resposta ainda não ter sido rodado. */
function dbProblem(error: { code?: string; message: string }): string {
  if (error.code === '42P01' || /exam_answer_keys/i.test(error.message) && /does not exist|schema cache|could not find/i.test(error.message)) {
    return 'O banco ainda não tem a tabela de gabaritos. Rode o SQL do cartão-resposta (migration 20261109000600) no Supabase e tente de novo.';
  }
  if (error.code === '42703' || /variant/i.test(error.message)) {
    return 'O banco ainda não tem o gabarito por caderno. Rode o SQL 20261110000200_gabarito_por_caderno no Supabase e tente de novo.';
  }
  if (error.code === '42501') return 'Sem permissão para salvar. Entre com a conta de administrador geral.';
  return `Não consegui salvar: ${error.message}`;
}

/** Lê o gabarito de um PDF/imagem já em memória: primeiro o texto do PDF (exato); se não houver texto, a IA lê a imagem. */
async function readKey(data: Buffer, mime: string): Promise<KeyPreview> {
  // 1) texto do PDF
  try {
    const { extractPdf } = await import('./pdf');
    const pdf = await extractPdf(data);
    const entries = parseAnswerKeyText(pdf.text).entries;
    if (entries.length >= 20) {
      return { ok: true, text: entries.map((e) => `${e.number}-${e.annulled ? 'anulada' : e.correct}`).join(' '), count: entries.length, missing: missingNumbers(entries), source: 'texto do PDF' };
    }
  } catch {
    // cai para a IA
  }

  // 2) IA lê o arquivo
  const ai = await completeWithAI(
    [{ role: 'user', content: ANSWER_KEY_PROMPT, attachments: [{ mimeType: mime.includes('pdf') ? 'application/pdf' : mime, data: data.toString('base64') }] }],
    { maxTokens: 8192, temperature: 0, timeoutMs: 90_000, audience: 'staff' },
  );
  if (!ai.ok) return { ok: false, message: aiMessage(ai.reason) };
  const entries = parseAnswerKeyText(ai.text).entries;
  if (entries.length === 0) return { ok: false, message: 'Não consegui ler o gabarito do arquivo. Cole o gabarito à mão.' };
  return { ok: true, text: entries.map((e) => `${e.number}-${e.annulled ? 'anulada' : e.correct}`).join(' '), count: entries.length, missing: missingNumbers(entries), source: 'IA' };
}

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

/** Salva (substitui) o gabarito da edição. `text`: "1-A 2-C ..."; `areas`: "1-45 Linguagens, 46-90 Humanas". */
export async function saveAnswerKey(editionId: string, variant: string, text: string, areas: string): Promise<KeySaved> {
  await requireAccess('/admin/gabaritos');
  if (!editionSchema.safeParse(editionId).success) return { ok: false, message: 'Edição inválida.' };
  const name = variant.trim();
  if (name.length > 60) return { ok: false, message: 'Nome do caderno grande demais (máximo 60 letras).' };
  if (text.length > 20_000) return { ok: false, message: 'Texto grande demais.' };

  let entries: KeyEntry[] = parseAnswerKeyText(text).entries;
  if (entries.length === 0) return { ok: false, message: 'Não encontrei nenhuma resposta. Use o formato "1-A 2-C 3-anulada".' };
  const missing = missingNumbers(entries);
  if (missing.length > 0) return { ok: false, message: `Faltam questões no gabarito: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? '…' : ''}.` };

  const ranges = parseAreaRanges(areas);
  if (ranges.length > 0) entries = applyAreas(entries, ranges);

  const supabase = await createClient();
  const removed = await supabase.from('exam_answer_keys').delete().eq('exam_edition_id', editionId).eq('variant', name);
  if (removed.error) return { ok: false, message: dbProblem(removed.error) };
  const { error } = await supabase.from('exam_answer_keys').insert(
    entries.map((e) => ({ exam_edition_id: editionId, variant: name, number: e.number, correct: e.correct, annulled: e.annulled, area: e.area ?? null })),
  );
  if (error) return { ok: false, message: dbProblem(error) };

  revalidatePath('/admin/gabaritos');
  revalidatePath('/vestibular/provas');
  return { ok: true, message: `Gabarito${name ? ` do caderno ${name}` : ''} salvo: ${entries.length} questões${ranges.length ? ` em ${ranges.length} áreas` : ''}.` };
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
