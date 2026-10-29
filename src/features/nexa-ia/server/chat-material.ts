import { classifyUpload, MAX_FILE_BYTES, titleFromFilename } from '../lib/material';
import { findDocCodes, type DocRef } from '../lib/doc-refs';
import { MIN_TEXT, readUploadedFile } from './material-ingest';
import type { createClient } from '@/lib/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Materiais da biblioteca do aluno citados pela sigla no texto ("B01"). Só os dele (RLS). */
export async function loadDocsMentioned(supabase: Supabase, text: string): Promise<DocRef[]> {
  const codes = findDocCodes(text);
  if (codes.length === 0) return [];
  const { data, error } = await supabase.from('study_documents').select('code, title, content').in('code', codes);
  if (error || !data) return [];
  return codes.flatMap((code) => {
    const row = data.find((d) => d.code === code);
    return row ? [{ code, title: row.title, content: row.content }] : [];
  });
}

export type ChatFileCheck = { ok: true; kind: 'pdf' | 'image' } | { ok: false; message: string };

/** Anexo do chat: PDF ou imagem, até o limite. Texto solto se cola na própria mensagem. */
export function checkChatFile(file: File): ChatFileCheck {
  const kind = classifyUpload(file.type);
  if (kind !== 'pdf' && kind !== 'image') return { ok: false, message: 'Anexe um PDF ou uma imagem (PNG, JPG, WebP).' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: 'Arquivo grande demais (máx. 6 MB).' };
  return { ok: true, kind };
}

/** Guarda o arquivo anexado na biblioteca do aluno e devolve o material já com a sigla. */
export async function saveChatFileToLibrary(
  supabase: Supabase,
  userId: string,
  file: File,
  kind: 'pdf' | 'image',
): Promise<{ ok: true; doc: DocRef } | { ok: false; message: string }> {
  const read = await readUploadedFile(file);
  if (!read.ok) return { ok: false, message: read.message };
  if (read.text.length < MIN_TEXT) return { ok: false, message: 'Não encontrei texto neste arquivo para estudar.' };

  const { data, error } = await supabase
    .from('study_documents')
    .insert({
      user_id: userId,
      title: titleFromFilename(file.name),
      source_kind: kind,
      content: read.text.slice(0, 120_000),
      pages: read.pages,
    })
    .select('code, title, content')
    .single();
  if (error || !data) return { ok: false, message: 'Não consegui guardar o arquivo na biblioteca. Tente de novo.' };
  return { ok: true, doc: { code: data.code ?? '', title: data.title, content: data.content } };
}
