'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { fetchExamFile } from '@/features/vestibular/server/fetch-exam-file';
import { CLASSIFY_PROMPT, EXAM_SLUGS, mergeClassification, parseClassification, type Classification } from '@/features/vestibular/lib/classify-file';
import { requireAccess } from './guard';

const PATH = '/admin/arquivos-provas';
const STORAGE_PATH = /^provas\/\d{4}\/[0-9a-f-]{36}\.pdf$/;
const MAX_BYTES = 90 * 1024 * 1024;
const MAX_ATTACH_BYTES = 15 * 1024 * 1024;

function publicUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return base ? `${base}/storage/v1/object/public/nexa-content/${path}` : null;
}

export type ClassifyResult = { ok: true; classification: Classification; note: string | null } | { ok: false; message: string };

/**
 * Lê a CAPA de um PDF que o administrador acabou de enviar e diz qual vestibular, ano, tipo, dia/fase, caderno e cor.
 * O texto da primeira página vale mais que a imagem (é exato e barato); se o PDF for escaneado, a IA olha o arquivo.
 * Nunca falha em branco: se a IA não ajudar, usa o que o nome do arquivo diz e marca confiança baixa.
 */
export async function classifyUploadedFile(path: string, fileName: string): Promise<ClassifyResult> {
  await requireAccess(PATH);
  if (!STORAGE_PATH.test(path)) return { ok: false, message: 'Arquivo inválido.' };
  const url = publicUrl(path);
  if (!url) return { ok: false, message: 'O endereço do Supabase não está configurado.' };

  const downloaded = await fetchExamFile(url, MAX_BYTES);
  if (!downloaded.ok) return { ok: false, message: downloaded.message };

  let cover = '';
  try {
    const { extractPdfCover } = await import('./pdf');
    cover = await extractPdfCover(downloaded.data, 2);
  } catch {
    // PDF sem texto legível: tenta a imagem
  }

  let content = '';
  let attachments: { mimeType: string; data: string }[] | undefined;
  if (cover.length >= 40) {
    content = `${CLASSIFY_PROMPT}\n\nTexto da capa:\n"""\n${cover.slice(0, 3500)}\n"""\n\nNome do arquivo: ${fileName.slice(0, 120)}`;
  } else if (downloaded.data.byteLength <= MAX_ATTACH_BYTES) {
    content = `${CLASSIFY_PROMPT}\n\nNome do arquivo: ${fileName.slice(0, 120)}`;
    attachments = [{ mimeType: 'application/pdf', data: downloaded.data.toString('base64') }];
  }

  let fromCover: Classification | null = null;
  let note: string | null = null;
  if (content) {
    const ai = await completeWithAI([{ role: 'user', content, ...(attachments ? { attachments } : {}) }], { maxTokens: 400, temperature: 0, timeoutMs: 60_000, audience: 'staff' });
    if (ai.ok) fromCover = parseClassification(ai.text);
    if (!fromCover) note = 'A IA não conseguiu ler a capa; usei o nome do arquivo. Confira os campos.';
  } else {
    note = 'PDF grande e sem texto na capa; usei o nome do arquivo. Confira os campos.';
  }
  return { ok: true, classification: mergeClassification(fromCover, fileName), note };
}

const itemSchema = z.object({
  path: z.string().regex(STORAGE_PATH),
  exam: z.enum(EXAM_SLUGS),
  year: z.number().int().min(2000).max(2100),
  kind: z.enum(['caderno', 'gabarito']),
  label: z.string().trim().min(2).max(160),
});

export type RegisterItemResult = { path: string; ok: boolean; message: string };

/** Cadastra os arquivos já conferidos: cria a prova/edição que ainda não existir e registra o PDF enviado. */
export async function registerClassifiedFiles(items: unknown): Promise<RegisterItemResult[]> {
  await requireAccess(PATH);
  const parsed = z.array(z.unknown()).max(40).safeParse(items);
  if (!parsed.success) return [];

  const supabase = await createClient();
  const { data: exams } = await supabase.from('exams').select('id, slug').in('slug', [...EXAM_SLUGS]);
  const examId = new Map((exams ?? []).map((e) => [e.slug, e.id]));
  const editionCache = new Map<string, string>();
  const results: RegisterItemResult[] = [];

  for (const raw of parsed.data) {
    const item = itemSchema.safeParse(raw);
    const path = typeof (raw as { path?: unknown })?.path === 'string' ? (raw as { path: string }).path : '';
    if (!item.success) {
      results.push({ path, ok: false, message: 'Faltam dados (prova, ano ou nome).' });
      continue;
    }
    const d = item.data;
    const exam = examId.get(d.exam);
    const url = publicUrl(d.path);
    if (!exam || !url) {
      results.push({ path: d.path, ok: false, message: 'Prova não encontrada no banco.' });
      continue;
    }

    const cacheKey = `${d.exam}|${d.year}`;
    let editionId = editionCache.get(cacheKey);
    if (!editionId) {
      const { data: found } = await supabase.from('exam_editions').select('id').eq('exam_id', exam).eq('year', d.year).maybeSingle();
      editionId = found?.id;
      if (!editionId) {
        const { data: created, error } = await supabase.from('exam_editions').insert({ exam_id: exam, year: d.year }).select('id').single();
        if (error || !created) {
          results.push({ path: d.path, ok: false, message: 'Não consegui criar a edição da prova.' });
          continue;
        }
        editionId = created.id;
      }
      editionCache.set(cacheKey, editionId);
    }

    const { error } = await supabase
      .from('exam_files')
      .insert({ exam_edition_id: editionId, kind: d.kind, label: d.label, url, source: 'Enviado ao Nexa', is_published: true, sort_order: d.kind === 'caderno' ? 10 : 11 });
    results.push({ path: d.path, ok: !error, message: error ? (error.code === '23505' ? 'Já cadastrado.' : 'Não consegui salvar.') : 'Cadastrado.' });
  }

  revalidatePath(PATH);
  revalidatePath('/vestibular/provas');
  return results;
}
