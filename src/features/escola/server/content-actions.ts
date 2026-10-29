'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { sendPushToUsers } from '@/lib/push/send';
import { assertSubjectAllowed, requireContentManager, resolveSchoolId } from '@/features/admin/server/guard';
import { parseSimuladoCode } from '@/features/admin/lib/simulado-import';
import { buildCreatorQuizPrompt, buildCreatorSummaryPrompt, stripCodeFence } from '@/features/community/lib/creator-prompt';
import { requireStaff } from './guard';

/**
 * Criação de conteúdo pelo portal da equipe: o caminho curto (resumo e simulado) com IA como
 * rascunho. Tudo nasce como RASCUNHO; só publica quando a pessoa manda. A permissão final é da RLS.
 */

export type DraftState<T> = { status: 'idle' } | { status: 'error'; message: string } | ({ status: 'ok' } & T);

const aiMessage = (reason: string) =>
  reason === 'missing_api_key'
    ? 'A IA não está configurada no servidor.'
    : reason === 'content_filter'
      ? 'O pedido esbarrou no filtro de conteúdo. Reformule o tema.'
      : 'A IA não respondeu agora — tente de novo em instantes.';

async function subjectNameFor(subjectId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('subject_catalog').select('name').eq('id', subjectId).maybeSingle();
  return data?.name ?? null;
}

const draftSchema = z.object({
  subjectId: z.string().uuid('Escolha a matéria.'),
  topic: z.string().trim().min(2, 'Diga o tema.').max(160),
});

/** Rascunho de resumo por IA — só devolve o texto; quem decide salvar é o professor. */
export async function draftSummary(_prev: DraftState<{ markdown: string }>, formData: FormData): Promise<DraftState<{ markdown: string }>> {
  await requireStaff();
  const identity = await requireContentManager();
  const parsed = draftSchema.safeParse({ subjectId: formData.get('subjectId'), topic: formData.get('topic') });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  const denied = assertSubjectAllowed(identity, parsed.data.subjectId);
  if (denied) return { status: 'error', message: denied };
  const subject = await subjectNameFor(parsed.data.subjectId);
  if (!subject) return { status: 'error', message: 'Matéria inválida.' };

  const result = await completeWithAI(
    [
      { role: 'system', content: 'Você escreve resumos de estudo claros e objetivos em português do Brasil, em Markdown.' },
      { role: 'user', content: buildCreatorSummaryPrompt(subject, { subjectCatalogId: parsed.data.subjectId, topic: parsed.data.topic }) },
    ],
    { maxTokens: 1800, temperature: 0.6, timeoutMs: 40_000, audience: 'staff' },
  );
  if (!result.ok) return { status: 'error', message: aiMessage(result.reason) };
  return { status: 'ok', markdown: stripCodeFence(result.text) };
}

export interface DraftQuestion {
  statement: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string | null;
}

const quizSchema = draftSchema.extend({
  count: z.coerce.number().int().min(1).max(10),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
});

/** Rascunho de simulado por IA: devolve as questões já validadas para o professor revisar. */
export async function draftQuiz(
  _prev: DraftState<{ title: string; questions: DraftQuestion[] }>,
  formData: FormData,
): Promise<DraftState<{ title: string; questions: DraftQuestion[] }>> {
  await requireStaff();
  const identity = await requireContentManager();
  const parsed = quizSchema.safeParse({
    subjectId: formData.get('subjectId'),
    topic: formData.get('topic'),
    count: formData.get('count'),
    difficulty: formData.get('difficulty'),
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  const denied = assertSubjectAllowed(identity, parsed.data.subjectId);
  if (denied) return { status: 'error', message: denied };
  const subject = await subjectNameFor(parsed.data.subjectId);
  if (!subject) return { status: 'error', message: 'Matéria inválida.' };

  const result = await completeWithAI(
    [
      { role: 'system', content: 'Você gera quizzes em JSON estrito para uma plataforma de estudos brasileira. Responda só com o JSON pedido, em português do Brasil.' },
      {
        role: 'user',
        content: buildCreatorQuizPrompt(subject, {
          subjectCatalogId: parsed.data.subjectId,
          topic: parsed.data.topic,
          difficulty: parsed.data.difficulty,
          questionCount: parsed.data.count,
        }),
      },
    ],
    { maxTokens: 3072, temperature: 0.6, timeoutMs: 50_000 },
  );
  if (!result.ok) return { status: 'error', message: aiMessage(result.reason) };

  const quiz = parseSimuladoCode(stripCodeFence(result.text));
  if (!quiz.ok) {
    const first = quiz.parseError ?? quiz.simulationErrors[0] ?? quiz.questions.flatMap((q) => q.errors)[0] ?? 'A IA devolveu um formato inesperado.';
    return { status: 'error', message: `${first} Tente gerar de novo.` };
  }

  return {
    status: 'ok',
    title: quiz.simulationTitle ?? `Quiz — ${parsed.data.topic}`,
    questions: quiz.questions.map((q) => ({
      statement: q.statement,
      options: q.options,
      correctKey: q.correctKey ?? q.options[0]!.key,
      explanation: q.explanation,
    })),
  };
}

// --------------------------------------------------------------- gravar --

export type SaveState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'saved'; id: string };

async function notifyPublished(supabase: Awaited<ReturnType<typeof createClient>>, subjectId: string, title: string, id: string, schoolId: string | null) {
  const { data: ids } = await supabase.rpc('notify_subject_students', {
    p_subject_catalog_id: subjectId,
    p_title: 'Novo conteúdo publicado',
    p_body: title,
    p_link: `/estudar/${id}`,
    p_school_id: schoolId,
  });
  if (ids && ids.length > 0) await sendPushToUsers(ids, { title: 'Novo conteúdo publicado', body: title, link: `/estudar/${id}` });
}

const summarySchema = z.object({
  id: z.string().uuid().optional(),
  subjectId: z.string().uuid('Escolha a matéria.'),
  title: z.string().trim().min(2, 'Dê um título.').max(200),
  body: z.string().trim().min(20, 'Escreva o resumo (pelo menos algumas linhas).').max(200_000),
  publish: z.boolean(),
});

export async function saveSummary(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireStaff();
  const identity = await requireContentManager();
  const parsed = summarySchema.safeParse({
    id: formData.get('id') || undefined,
    subjectId: formData.get('subjectId'),
    title: formData.get('title'),
    body: formData.get('body'),
    publish: formData.get('publish') === 'on',
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  const d = parsed.data;
  const denied = assertSubjectAllowed(identity, d.subjectId);
  if (denied) return { status: 'error', message: denied };

  const supabase = await createClient();
  const schoolId = resolveSchoolId(identity, null);

  if (d.id) {
    const { data: before } = await supabase.from('resources').select('is_published').eq('id', d.id).maybeSingle();
    const { error } = await supabase.from('resources').update({ title: d.title, body: d.body, subject_catalog_id: d.subjectId, is_published: d.publish }).eq('id', d.id);
    if (error) return { status: 'error', message: 'Não consegui salvar. Tente de novo.' };
    if (d.publish && !before?.is_published) await notifyPublished(supabase, d.subjectId, d.title, d.id, schoolId);
    revalidatePath('/escola/conteudo');
    return { status: 'saved', id: d.id };
  }

  const { data, error } = await supabase
    .from('resources')
    .insert({
      kind: 'resumo',
      subject_catalog_id: d.subjectId,
      school_id: schoolId,
      title: d.title,
      body: d.body,
      content_format: 'markdown',
      difficulty: 'medio',
      xp_reward: 10,
      is_published: d.publish,
      tags: [],
      context: 'school',
      created_by: identity.userId,
    })
    .select('id')
    .single();
  if (error || !data) return { status: 'error', message: 'Não consegui salvar. Tente de novo.' };
  if (d.publish) await notifyPublished(supabase, d.subjectId, d.title, data.id, schoolId);
  revalidatePath('/escola/conteudo');
  return { status: 'saved', id: data.id };
}

const quizSaveSchema = z.object({
  subjectId: z.string().uuid('Escolha a matéria.'),
  title: z.string().trim().min(2, 'Dê um título.').max(200),
  kind: z.enum(['quiz', 'simulado']),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  publish: z.boolean(),
  questions: z
    .array(
      z.object({
        statement: z.string().trim().min(3),
        explanation: z.string().nullable(),
        options: z.array(z.object({ key: z.string(), text: z.string().trim().min(1) })).min(2).max(6),
        correctKey: z.string(),
      }),
    )
    .min(1, 'Sem questões.')
    .max(40),
});

/** Grava o simulado revisado (questões e alternativas) de uma vez. */
export async function saveQuiz(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireStaff();
  const identity = await requireContentManager();
  let questions: unknown;
  try {
    questions = JSON.parse(String(formData.get('questions') ?? '[]'));
  } catch {
    return { status: 'error', message: 'Questões inválidas.' };
  }
  const parsed = quizSaveSchema.safeParse({
    subjectId: formData.get('subjectId'),
    title: formData.get('title'),
    kind: formData.get('kind') || 'quiz',
    difficulty: formData.get('difficulty') || 'medio',
    publish: formData.get('publish') === 'on',
    questions,
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  const d = parsed.data;
  const denied = assertSubjectAllowed(identity, d.subjectId);
  if (denied) return { status: 'error', message: denied };
  if (d.questions.some((q) => !q.options.some((o) => o.key === q.correctKey))) {
    return { status: 'error', message: 'Toda questão precisa de uma alternativa correta marcada.' };
  }

  const supabase = await createClient();
  const schoolId = resolveSchoolId(identity, null);
  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      kind: d.kind,
      subject_catalog_id: d.subjectId,
      school_id: schoolId,
      title: d.title,
      content_format: 'markdown',
      difficulty: d.difficulty,
      xp_reward: 20,
      is_published: false,
      tags: [],
      context: 'school',
      created_by: identity.userId,
      schema_version: '2.0',
    })
    .select('id')
    .single();
  if (error || !resource) return { status: 'error', message: 'Não consegui criar o simulado.' };

  const undo = async () => void (await supabase.from('resources').delete().eq('id', resource.id));

  for (let i = 0; i < d.questions.length; i += 1) {
    const q = d.questions[i]!;
    const { data: question, error: qError } = await supabase
      .from('questions')
      .insert({ resource_id: resource.id, position: i + 1, statement: q.statement, explanation: q.explanation, difficulty: d.difficulty })
      .select('id')
      .single();
    if (qError || !question) {
      await undo();
      return { status: 'error', message: 'Não consegui gravar as questões. Nada foi criado.' };
    }
    const { error: oError } = await supabase.from('question_options').insert(
      q.options.map((o, j) => ({ question_id: question.id, position: j + 1, body: o.text, is_correct: o.key === q.correctKey })),
    );
    if (oError) {
      await undo();
      return { status: 'error', message: 'Não consegui gravar as alternativas. Nada foi criado.' };
    }
  }

  if (d.publish) {
    await supabase.from('resources').update({ is_published: true }).eq('id', resource.id);
    await notifyPublished(supabase, d.subjectId, d.title, resource.id, schoolId);
  }
  revalidatePath('/escola/conteudo');
  return { status: 'saved', id: resource.id };
}

export async function togglePublish(formData: FormData): Promise<void> {
  await requireStaff();
  const identity = await requireContentManager();
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const next = formData.get('next') === 'true';

  const supabase = await createClient();
  const { data: r } = await supabase.from('resources').select('is_published, subject_catalog_id, title, school_id').eq('id', id.data).eq('ai_generated', false).maybeSingle();
  if (!r || assertSubjectAllowed(identity, r.subject_catalog_id)) return;
  await supabase.from('resources').update({ is_published: next }).eq('id', id.data);
  if (next && !r.is_published) await notifyPublished(supabase, r.subject_catalog_id, r.title, id.data, r.school_id);
  revalidatePath('/escola/conteudo');
  revalidatePath(`/escola/conteudo/${id.data}`);
}

export async function removeContent(formData: FormData): Promise<void> {
  await requireStaff();
  const identity = await requireContentManager();
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  const { data: r } = await supabase.from('resources').select('subject_catalog_id').eq('id', id.data).eq('ai_generated', false).maybeSingle();
  if (!r || assertSubjectAllowed(identity, r.subject_catalog_id)) return;
  await supabase.from('resources').delete().eq('id', id.data);
  revalidatePath('/escola/conteudo');
}
