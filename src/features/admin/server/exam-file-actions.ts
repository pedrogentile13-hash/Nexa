'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { allowedHosts, checkExamFileUrl, explainUpstreamStatus } from '@/features/vestibular/lib/exam-file-proxy';
import { requireAccess } from './guard';

const PATH = '/admin/arquivos-provas';

export type FileState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok'; message: string };
export type TestResult = { ok: boolean; message: string };

const schema = z.object({
  editionId: z.string().uuid('Escolha a prova.'),
  kind: z.enum(['caderno', 'gabarito']),
  label: z.string().trim().min(2, 'Escreva um nome (ex.: 1º dia · Caderno 1).').max(160),
  url: z.string().trim().optional(),
  path: z.string().trim().optional(),
});

/** Cadastra um caderno ou gabarito: por endereço (https de site oficial) ou por PDF enviado ao Nexa. */
export async function addExamFile(_prev: FileState, formData: FormData): Promise<FileState> {
  await requireAccess(PATH);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  const { editionId, kind, label, url, path } = parsed.data;

  let finalUrl = url ?? '';
  let source = 'Link oficial';
  if (path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    if (!base) return { status: 'error', message: 'O endereço do Supabase não está configurado.' };
    finalUrl = `${base}/storage/v1/object/public/nexa-content/${path}`;
    source = 'Enviado ao Nexa';
  }
  if (!finalUrl) return { status: 'error', message: 'Cole o endereço do PDF ou envie o arquivo.' };
  if (!finalUrl.startsWith('https://')) return { status: 'error', message: 'O endereço precisa começar com https://.' };

  const hosts = allowedHosts({ extra: process.env.EXAM_FILE_HOSTS, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL });
  if (!checkExamFileUrl(finalUrl, hosts, true)) {
    return { status: 'error', message: `Esse site não está na lista de sites oficiais (${[...hosts].join(', ')}). Envie o PDF para o Nexa ou peça para liberar o site em EXAM_FILE_HOSTS.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('exam_files').insert({ exam_edition_id: editionId, kind, label, url: finalUrl, source, is_published: true, sort_order: kind === 'caderno' ? 10 : 11 });
  if (error) return { status: 'error', message: error.code === '23505' ? 'Esse endereço já está cadastrado nesta prova.' : 'Não consegui salvar.' };
  revalidatePath(PATH);
  return { status: 'ok', message: 'Arquivo cadastrado. Toque em Testar para conferir.' };
}

export async function deleteExamFile(formData: FormData): Promise<void> {
  await requireAccess(PATH);
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('exam_files').delete().eq('id', id.data);
  revalidatePath(PATH);
}

export async function toggleExamFile(formData: FormData): Promise<void> {
  await requireAccess(PATH);
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('exam_files').update({ is_published: formData.get('publish') === '1' }).eq('id', id.data);
  revalidatePath(PATH);
}

/** Abre o endereço como o visualizador abre (pelo servidor) e diz o que aconteceu. */
export async function testExamFile(id: string): Promise<TestResult> {
  await requireAccess(PATH);
  if (!z.string().uuid().safeParse(id).success) return { ok: false, message: 'Arquivo inválido.' };
  const supabase = await createClient();
  const { data: file } = await supabase.from('exam_files').select('url').eq('id', id).maybeSingle();
  if (!file) return { ok: false, message: 'Arquivo não encontrado.' };

  const production = process.env.NODE_ENV === 'production';
  const hosts = allowedHosts({ extra: process.env.EXAM_FILE_HOSTS, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL });
  const first = checkExamFileUrl(file.url, hosts, production);
  if (!first) return { ok: false, message: 'O site desse endereço não está na lista de sites permitidos (EXAM_FILE_HOSTS).' };
  let target: URL = first;

  for (let hop = 0; hop <= 3; hop++) {
    let res: Response;
    try {
      res = await fetch(target, { redirect: 'manual', headers: { 'User-Agent': 'NexaStudy/1.0 (teste de link)', Range: 'bytes=0-0', Accept: 'application/pdf' }, signal: AbortSignal.timeout(20_000) });
    } catch (e) {
      const why = e instanceof Error ? e.name : 'erro';
      return { ok: false, message: `O servidor do Nexa não conseguiu falar com ${target.host} (${why}). Pode ser bloqueio do site oficial ou rede da hospedagem: envie o PDF para o Nexa.` };
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      const checked: URL | null = next ? checkExamFileUrl(new URL(next, target).toString(), hosts, production) : null;
      if (!checked) return { ok: false, message: 'O endereço redireciona para um site fora da lista permitida.' };
      target = checked;
      continue;
    }
    if (res.status !== 200 && res.status !== 206) return { ok: false, message: explainUpstreamStatus(res.status) };
    const type = res.headers.get('content-type') ?? '';
    if (!/pdf|octet-stream/i.test(type)) return { ok: false, message: `O endereço abre, mas não é um PDF (tipo: ${type || 'desconhecido'}). Provavelmente é uma página do site: cole o link direto do arquivo .pdf.` };
    await res.body?.cancel();
    return { ok: true, message: 'Funcionando: o Nexa consegue abrir este PDF.' };
  }
  return { ok: false, message: 'Redirecionamentos demais.' };
}
