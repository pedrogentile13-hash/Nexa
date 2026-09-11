'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireTeacher, getTeacherAssignments } from './guard';
import type { AdminState } from '@/features/admin/server/actions';

export type { AdminState } from '@/features/admin/server/actions';

/**
 * Escritas de `/professor`.
 *
 * Mesma disciplina do painel admin (`admin/server/actions.ts`): a checagem
 * aqui nunca substitui a RLS (`is_teacher_of`/`is_teacher_of_student`) — ela
 * só transforma uma recusa em mensagem legível em vez de erro cru do
 * PostgREST, e trava `school_id`/`subject_catalog_id` no que o professor tem
 * atribuído, nunca no que vem do formulário. Sem PDF/extração (0911 (6)):
 * simplificação deliberada desta primeira rodada — resumo do professor é
 * sempre markdown.
 */

const ok: AdminState = { status: 'saved' };
const fail = (message: string): AdminState => ({ status: 'error', message });

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Revise os campos.';
}

async function assertOwnSubject(subjectCatalogId: string): Promise<string | null> {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const owns = assignments.some((a) => a.subjectCatalogId === subjectCatalogId);
  return owns ? null : 'Você só pode gerenciar conteúdo das matérias atribuídas a você.';
}

// -------------------------------------------------------------- recursos --

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(['resumo', 'podcast', 'video', 'imagem', 'musica', 'quiz', 'simulado']),
  subjectId: z.string().uuid('Escolha a matéria.'),
  title: z.string().trim().min(2, 'Dê um título.').max(200),
  subtitle: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  body: z.string().max(200_000).optional().or(z.literal('')),
  externalUrl: z.string().trim().url('O link precisa começar com http.').optional().or(z.literal('')),
  durationSeconds: z.coerce.number().int().min(0).max(86400).optional(),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  xpReward: z.coerce.number().int().min(0).max(1000),
  isPublished: z.boolean(),
});

export async function saveTeacherResource(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireTeacher();

  const parsed = resourceSchema.safeParse({
    id: formData.get('id') || undefined,
    kind: formData.get('kind'),
    subjectId: formData.get('subjectId'),
    title: formData.get('title'),
    subtitle: formData.get('subtitle') || '',
    description: formData.get('description') || '',
    body: formData.get('body') || '',
    externalUrl: formData.get('externalUrl') || '',
    durationSeconds: formData.get('durationSeconds') || 0,
    difficulty: formData.get('difficulty') || 'medio',
    xpReward: formData.get('xpReward') || 0,
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const data = parsed.data;
  const scopeError = await assertOwnSubject(data.subjectId);
  if (scopeError) return fail(scopeError);

  const needsPayload = data.kind !== 'quiz' && data.kind !== 'simulado';
  if (needsPayload && !data.body && !data.externalUrl) {
    return fail('Falta o conteúdo: escreva o texto ou informe um link.');
  }

  const supabase = await createClient();
  const payload = {
    kind: data.kind,
    subject_catalog_id: data.subjectId,
    // Nunca vem do formulário: um professor só publica na própria escola.
    school_id: identity.schoolId,
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description || null,
    body: data.body || null,
    content_format: 'markdown' as const,
    external_url: data.externalUrl || null,
    duration_seconds: data.durationSeconds || null,
    difficulty: data.difficulty,
    xp_reward: data.xpReward,
    is_published: data.isPublished,
    created_by: identity.userId,
  };

  if (data.id) {
    const { error } = await supabase.from('resources').update(payload).eq('id', data.id);
    if (error) return fail(error.message);
    revalidatePath('/professor/conteudo');
    revalidatePath(`/professor/conteudo/${data.id}`);
    return ok;
  }

  const { data: created, error } = await supabase
    .from('resources')
    .insert(payload)
    .select('id')
    .single();
  if (error) return fail(error.message);

  revalidatePath('/professor/conteudo');
  redirect(
    data.kind === 'quiz' || data.kind === 'simulado'
      ? `/professor/conteudo/${created.id}/questoes`
      : `/professor/conteudo/${created.id}`,
  );
}

export async function toggleTeacherResourcePublished(formData: FormData): Promise<void> {
  await requireTeacher();
  const id = formData.get('id');
  const next = formData.get('next') === 'true';
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('resources').update({ is_published: next }).eq('id', id);
  revalidatePath('/professor/conteudo');
  revalidatePath(`/professor/conteudo/${id}`);
}

export async function deleteTeacherResource(formData: FormData): Promise<void> {
  await requireTeacher();
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('resources').delete().eq('id', id);
  revalidatePath('/professor/conteudo');
  redirect('/professor/conteudo');
}

// --------------------------------------------------------------- questões --

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  resourceId: z.string().uuid(),
  statement: z.string().trim().min(3, 'Escreva o enunciado.').max(4000),
  explanation: z.string().trim().max(4000).optional().or(z.literal('')),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  options: z
    .array(z.string().trim().min(1, 'Nenhuma alternativa pode ficar vazia.').max(1000))
    .min(2, 'Uma questão precisa de pelo menos 2 alternativas.')
    .max(6, 'No máximo 6 alternativas.'),
  correctIndex: z.coerce.number().int().min(0),
});

export async function saveTeacherQuestion(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireTeacher();

  const options = formData
    .getAll('option')
    .map((o) => String(o))
    .filter((o) => o.trim().length > 0);

  const parsed = questionSchema.safeParse({
    id: formData.get('id') || undefined,
    resourceId: formData.get('resourceId'),
    statement: formData.get('statement'),
    explanation: formData.get('explanation') || '',
    difficulty: formData.get('difficulty') || 'medio',
    options,
    correctIndex: formData.get('correctIndex') ?? 0,
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { resourceId, statement, explanation, difficulty, correctIndex } = parsed.data;
  if (correctIndex >= parsed.data.options.length) {
    return fail('Marque qual alternativa é a correta.');
  }

  const supabase = await createClient();

  let questionId = parsed.data.id;
  if (questionId) {
    const { error } = await supabase
      .from('questions')
      .update({ statement, explanation: explanation || null, difficulty })
      .eq('id', questionId);
    if (error) return fail(error.message);

    await supabase.from('question_options').delete().eq('question_id', questionId);
  } else {
    const { data: last } = await supabase
      .from('questions')
      .select('position')
      .eq('resource_id', resourceId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: created, error } = await supabase
      .from('questions')
      .insert({
        resource_id: resourceId,
        position: (last?.position ?? 0) + 1,
        statement,
        explanation: explanation || null,
        difficulty,
      })
      .select('id')
      .single();

    if (error) return fail(error.message);
    questionId = created.id;
  }

  const { error: optionsError } = await supabase.from('question_options').insert(
    parsed.data.options.map((body, index) => ({
      question_id: questionId as string,
      position: index + 1,
      body,
      is_correct: index === correctIndex,
    })),
  );
  if (optionsError) return fail(optionsError.message);

  revalidatePath(`/professor/conteudo/${resourceId}/questoes`);
  return ok;
}

export async function deleteTeacherQuestion(formData: FormData): Promise<void> {
  await requireTeacher();
  const id = formData.get('id');
  const resourceId = formData.get('resourceId');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('questions').delete().eq('id', id);
  if (typeof resourceId === 'string') revalidatePath(`/professor/conteudo/${resourceId}/questoes`);
}

// ----------------------------------------------------------------- avisos --

const noticeSchema = z.object({
  className: z.string().trim().min(1, 'Escolha a turma.').max(80),
  subjectCatalogId: z.string().uuid('Escolha a matéria.'),
  title: z.string().trim().min(2, 'Dê um título ao aviso.').max(160),
  body: z.string().trim().max(500).optional().or(z.literal('')),
  link: z.string().trim().max(300).optional().or(z.literal('')),
});

export async function notifyMyClass(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireTeacher();

  const parsed = noticeSchema.safeParse({
    className: formData.get('className'),
    subjectCatalogId: formData.get('subjectCatalogId'),
    title: formData.get('title'),
    body: formData.get('body') || '',
    link: formData.get('link') || '',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.rpc('notify_class', {
    p_class_name: parsed.data.className,
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
