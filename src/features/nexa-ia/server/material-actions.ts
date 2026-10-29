'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { aiMessage, readUploadedFile } from './material-ingest';
import { checkAiQuota } from '@/lib/ai/quota';
import { parseSimuladoCode } from '@/features/admin/lib/simulado-import';
import { stripCodeFence, toCreatorQuestionsPayload } from '@/features/community/lib/creator-prompt';
import {
  buildMaterialQuestionMessages,
  buildMaterialQuizPrompt,
  buildMaterialSummaryMessages,
  classifyUpload,
  titleFromFilename,
  validateUploads,
} from '../lib/material';

/**
 * Material de estudo do aluno. Só o TEXTO do arquivo fica guardado (não o
 * arquivo). Tudo que a IA cria daqui nasce privado, na Biblioteca do aluno.
 */

const MAX_DOCUMENTS = 30;
const MIN_TEXT = 20;

export type MaterialState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; message: string };

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addStudyDocuments(_prev: MaterialState, formData: FormData): Promise<MaterialState> {
  const { supabase, user } = await me();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const pasted = String(formData.get('text') ?? '').trim();
  const pastedTitle = String(formData.get('title') ?? '').trim();
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0 && pasted.length < MIN_TEXT) {
    return { status: 'error', message: 'Envie um arquivo ou cole um texto com pelo menos algumas linhas.' };
  }
  if (files.length > 0) {
    const check = validateUploads(files.map((f) => ({ name: f.name, type: f.type, size: f.size })));
    if (!check.ok) return { status: 'error', message: check.message };
  }

  const { count } = await supabase.from('study_documents').select('id', { count: 'exact', head: true });
  if ((count ?? 0) + files.length + (pasted ? 1 : 0) > MAX_DOCUMENTS) {
    return { status: 'error', message: `Você já tem muitos materiais (máx. ${MAX_DOCUMENTS}). Apague algum para adicionar.` };
  }

  const rows: { user_id: string; title: string; source_kind: 'pdf' | 'image' | 'text'; content: string; pages: number | null }[] = [];
  const problems: string[] = [];

  for (const file of files) {
    const kind = classifyUpload(file.type)!;
    // Imagem e PDF escaneado gastam a IA: contam na cota.
    if (kind !== 'text') {
      const quota = await checkAiQuota(supabase, 'material');
      if (!quota.ok) {
        problems.push(quota.message);
        break;
      }
    }
    const r = await readUploadedFile(file);
    if (!r.ok) {
      problems.push(`"${file.name}": ${r.message}`);
      continue;
    }
    if (r.text.length < MIN_TEXT) {
      problems.push(`"${file.name}": não encontrei texto para estudar.`);
      continue;
    }
    rows.push({
      user_id: user.id,
      title: titleFromFilename(file.name),
      source_kind: kind,
      content: r.text.slice(0, 120_000),
      pages: r.pages,
    });
  }

  if (pasted.length >= MIN_TEXT) {
    rows.push({
      user_id: user.id,
      title: (pastedTitle || pasted.split('\n')[0] || 'Anotações').slice(0, 160),
      source_kind: 'text',
      content: pasted.slice(0, 120_000),
      pages: null,
    });
  }

  if (rows.length === 0) return { status: 'error', message: problems[0] ?? 'Não consegui ler o material.' };

  const { error } = await supabase.from('study_documents').insert(rows);
  if (error) {
    return { status: 'error', message: 'Não consegui salvar o material. A atualização do banco pode estar pendente.' };
  }

  revalidatePath('/nexa-ia');
  const base = rows.length === 1 ? 'Material adicionado.' : `${rows.length} materiais adicionados.`;
  return { status: 'ok', message: problems.length ? `${base} Mas: ${problems.join(' ')}` : base };
}

export async function renameStudyDocument(id: string, title: string): Promise<{ ok: boolean }> {
  const parsed = z.object({ id: z.string().uuid(), title: z.string().trim().min(2).max(160) }).safeParse({ id, title });
  if (!parsed.success) return { ok: false };
  const { supabase } = await me();
  const { error } = await supabase.from('study_documents').update({ title: parsed.data.title }).eq('id', parsed.data.id);
  revalidatePath('/nexa-ia');
  return { ok: !error };
}

export async function deleteStudyDocument(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!z.string().uuid().safeParse(id).success) return;
  const { supabase } = await me();
  await supabase.from('study_documents').delete().eq('id', id);
  revalidatePath('/nexa-ia');
}

async function loadDoc(documentId: string) {
  const { supabase, user } = await me();
  if (!user) return null;
  const { data } = await supabase
    .from('study_documents')
    .select('id, title, content')
    .eq('id', documentId)
    .maybeSingle();
  return data ? { supabase, doc: data } : null;
}

export type AskState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; answer: string };

export async function askAboutDocument(_prev: AskState, formData: FormData): Promise<AskState> {
  const parsed = z
    .object({ documentId: z.string().uuid(), question: z.string().trim().min(2, 'Escreva sua pergunta.').max(600) })
    .safeParse({ documentId: formData.get('documentId'), question: formData.get('question') });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise a pergunta.' };

  const ctx = await loadDoc(parsed.data.documentId);
  if (!ctx) return { status: 'error', message: 'Material não encontrado.' };

  const quota = await checkAiQuota(ctx.supabase, 'material');
  if (!quota.ok) return { status: 'error', message: quota.message };

  const r = await completeWithAI(buildMaterialQuestionMessages(ctx.doc.title, ctx.doc.content, parsed.data.question), {
    maxTokens: 1024,
    temperature: 0.3,
    timeoutMs: 40_000,
  });
  return r.ok ? { status: 'ok', answer: r.text } : { status: 'error', message: aiMessage(r.reason) };
}

export type CreateFromDocState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; title: string };

const createSchema = z.object({
  documentId: z.string().uuid(),
  subjectCatalogId: z.string().uuid('Escolha a matéria.'),
  count: z.coerce.number().int().min(1).max(10).default(5),
  difficulty: z.enum(['facil', 'medio', 'dificil']).default('medio'),
});

async function subjectName(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.from('subject_catalog').select('name').eq('id', id).maybeSingle();
  return data?.name ?? null;
}

export async function createSummaryFromDocument(_prev: CreateFromDocState, formData: FormData): Promise<CreateFromDocState> {
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };

  const ctx = await loadDoc(parsed.data.documentId);
  if (!ctx) return { status: 'error', message: 'Material não encontrado.' };
  if (!(await subjectName(ctx.supabase, parsed.data.subjectCatalogId))) return { status: 'error', message: 'Matéria inválida.' };

  const quota = await checkAiQuota(ctx.supabase, 'creator');
  if (!quota.ok) return { status: 'error', message: quota.message };

  const r = await completeWithAI(buildMaterialSummaryMessages(ctx.doc.title, ctx.doc.content), {
    maxTokens: 2048,
    temperature: 0.4,
    timeoutMs: 45_000,
  });
  if (!r.ok) return { status: 'error', message: aiMessage(r.reason) };
  const body = stripCodeFence(r.text);
  if (!body) return { status: 'error', message: 'A IA não devolveu nada — tente de novo.' };

  const { data, error } = await ctx.supabase.rpc('create_ai_resource', {
    p_kind: 'resumo',
    p_subject_catalog_id: parsed.data.subjectCatalogId,
    p_title: `Resumo — ${ctx.doc.title}`.slice(0, 160),
    p_body: body,
  });
  if (error || !data) return { status: 'error', message: 'Não consegui salvar o resumo. Tente de novo.' };

  revalidatePath('/nexa-ia');
  return { status: 'ok', title: ctx.doc.title };
}

export async function createQuizFromDocument(_prev: CreateFromDocState, formData: FormData): Promise<CreateFromDocState> {
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };

  const ctx = await loadDoc(parsed.data.documentId);
  if (!ctx) return { status: 'error', message: 'Material não encontrado.' };
  const subject = await subjectName(ctx.supabase, parsed.data.subjectCatalogId);
  if (!subject) return { status: 'error', message: 'Matéria inválida.' };

  const quota = await checkAiQuota(ctx.supabase, 'creator');
  if (!quota.ok) return { status: 'error', message: quota.message };

  const r = await completeWithAI(
    [
      {
        role: 'system',
        content:
          'Você gera quizzes em JSON estrito para uma plataforma de estudos brasileira, usando só o material fornecido. Responda apenas com o JSON pedido.',
      },
      { role: 'user', content: buildMaterialQuizPrompt(subject, ctx.doc.title, ctx.doc.content, parsed.data.count, parsed.data.difficulty) },
    ],
    { maxTokens: 3072, temperature: 0.5, timeoutMs: 50_000 },
  );
  if (!r.ok) return { status: 'error', message: aiMessage(r.reason) };

  const quiz = parseSimuladoCode(stripCodeFence(r.text));
  if (!quiz.ok) {
    const first =
      quiz.parseError ?? quiz.simulationErrors[0] ?? quiz.questions.flatMap((q) => q.errors)[0] ?? 'A IA devolveu um formato inesperado.';
    return { status: 'error', message: `${first} Tente gerar de novo.` };
  }

  const { data, error } = await ctx.supabase.rpc('create_ai_resource', {
    p_kind: 'quiz',
    p_subject_catalog_id: parsed.data.subjectCatalogId,
    p_title: (quiz.simulationTitle ?? `Quiz — ${ctx.doc.title}`).slice(0, 160),
    p_questions: toCreatorQuestionsPayload(quiz.questions),
  });
  if (error || !data) return { status: 'error', message: 'Não consegui salvar o quiz. Tente de novo.' };

  revalidatePath('/nexa-ia');
  return { status: 'ok', title: ctx.doc.title };
}

/** Pede à coordenação/direção que o conteúdo vire da escola. */
export async function requestPublicationAction(formData: FormData): Promise<void> {
  const resourceId = String(formData.get('resourceId') ?? '');
  const note = String(formData.get('note') ?? '').trim().slice(0, 500) || null;
  if (!z.string().uuid().safeParse(resourceId).success) return;
  const { supabase } = await me();
  await supabase.rpc('request_publication', { p_resource_id: resourceId, p_note: note });
  revalidatePath('/nexa-ia');
}

/** Apaga um conteúdo criado pela IA (só o dono, ou o admin). Apaga também as questões e os pedidos de publicação dele. */
export async function deleteMyCreation(formData: FormData): Promise<void> {
  const resourceId = String(formData.get('resourceId') ?? '');
  if (!z.string().uuid().safeParse(resourceId).success) return;
  const { supabase } = await me();
  await supabase.rpc('delete_ai_resource', { p_resource_id: resourceId });
  revalidatePath('/nexa-ia');
  revalidatePath('/estudar');
}

export async function decidePublicationAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get('requestId') ?? '');
  const approve = formData.get('decision') === 'approve';
  const note = String(formData.get('note') ?? '').trim().slice(0, 500) || null;
  if (!z.string().uuid().safeParse(requestId).success) return;
  const { supabase } = await me();
  await supabase.rpc('decide_publication', { p_request_id: requestId, p_approve: approve, p_note: note });
  revalidatePath('/admin/publicacoes');
}
