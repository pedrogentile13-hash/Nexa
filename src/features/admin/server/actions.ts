'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, resolveSchoolId } from './guard';

/**
 * Escritas do painel.
 *
 * Toda ação começa por `requireAdmin()` e termina numa escrita que a RLS
 * também autorizaria por conta própria. A checagem no TypeScript não substitui
 * a do banco — ela existe para que a falha vire uma mensagem em vez de um erro
 * cru do PostgREST, e para que o `school_id` de uma escrita venha do PERFIL de
 * quem escreve, nunca de um campo do formulário.
 */

export type AdminState =
  { status: 'idle' } | { status: 'saved' } | { status: 'error'; message: string };

const ok: AdminState = { status: 'saved' };
const fail = (message: string): AdminState => ({ status: 'error', message });

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Revise os campos.';
}

/** Texto → slug estável. Chave de URL não pode depender de acento. */
function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// ---------------------------------------------------------------- escolas --

const schoolSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'O nome da escola precisa de ao menos 2 letras.').max(160),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().length(2, 'A UF tem 2 letras.').optional().or(z.literal('')),
});

export async function saveSchool(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireAdmin();
  if (!identity.isGlobal) return fail('Só a administração geral cria e edita escolas.');

  const parsed = schoolSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    city: formData.get('city') || null,
    state: formData.get('state') || '',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    city: parsed.data.city || null,
    state: parsed.data.state ? parsed.data.state.toUpperCase() : null,
    is_verified: true,
    created_by: identity.userId,
  };

  const { error } = parsed.data.id
    ? await supabase.from('schools').update(payload).eq('id', parsed.data.id)
    : await supabase.from('schools').insert(payload);

  if (error) return fail(error.message);

  revalidatePath('/admin/escolas');
  return ok;
}

export async function deleteSchool(formData: FormData): Promise<void> {
  const identity = await requireAdmin();
  if (!identity.isGlobal) return;

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('schools').delete().eq('id', id);
  revalidatePath('/admin/escolas');
}

// --------------------------------------------------------------- matérias --

const subjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Dê um nome à matéria.').max(80),
  area: z.enum(['linguagens', 'matematica', 'ciencias', 'humanas', 'tecnologia', 'outros']),
  defaultColor: z.string().trim().min(2).max(20),
  defaultIcon: z.string().trim().min(2).max(40),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.coerce.boolean(),
});

export async function saveSubject(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireAdmin();
  if (!identity.isGlobal)
    return fail('O catálogo de matérias é compartilhado por todas as escolas.');

  const parsed = subjectSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    area: formData.get('area'),
    defaultColor: formData.get('defaultColor') || 'blue',
    defaultIcon: formData.get('defaultIcon') || 'book-open',
    sortOrder: formData.get('sortOrder') || 100,
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    slug: toSlug(parsed.data.name),
    area: parsed.data.area,
    default_color: parsed.data.defaultColor,
    default_icon: parsed.data.defaultIcon,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };

  const { error } = parsed.data.id
    ? await supabase.from('subject_catalog').update(payload).eq('id', parsed.data.id)
    : await supabase.from('subject_catalog').insert(payload);

  if (error) {
    return fail(error.code === '23505' ? 'Já existe uma matéria com esse nome.' : error.message);
  }

  revalidatePath('/admin/materias');
  return ok;
}

// --------------------------------------------------------------- assuntos --

const topicSchema = z.object({
  id: z.string().uuid().optional(),
  subjectId: z.string().uuid('Escolha a matéria.'),
  name: z.string().trim().min(2, 'Dê um nome ao assunto.').max(120),
  schoolId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export async function saveTopic(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireAdmin();

  const parsed = topicSchema.safeParse({
    id: formData.get('id') || undefined,
    subjectId: formData.get('subjectId'),
    name: formData.get('name'),
    schoolId: formData.get('schoolId') || undefined,
    sortOrder: formData.get('sortOrder') || 100,
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const payload = {
    subject_catalog_id: parsed.data.subjectId,
    name: parsed.data.name,
    slug: toSlug(parsed.data.name),
    school_id: resolveSchoolId(identity, parsed.data.schoolId ?? null),
    sort_order: parsed.data.sortOrder,
    created_by: identity.userId,
  };

  const { error } = parsed.data.id
    ? await supabase.from('content_topics').update(payload).eq('id', parsed.data.id)
    : await supabase.from('content_topics').insert(payload);

  if (error) {
    return fail(
      error.code === '23505' ? 'Já existe um assunto com esse nome nesta matéria.' : error.message,
    );
  }

  revalidatePath('/admin/materias');
  return ok;
}

export async function deleteTopic(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('content_topics').delete().eq('id', id);
  revalidatePath('/admin/materias');
}

// --------------------------------------------------------------- conteúdo --

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(['resumo', 'podcast', 'video', 'imagem', 'musica', 'quiz', 'simulado']),
  subjectId: z.string().uuid('Escolha a matéria.'),
  topicId: z.string().uuid().optional().or(z.literal('')),
  schoolId: z.string().optional(),
  title: z.string().trim().min(2, 'Dê um título.').max(200),
  subtitle: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  body: z.string().max(200_000).optional().or(z.literal('')),
  storagePath: z.string().trim().max(500).optional().or(z.literal('')),
  externalUrl: z
    .string()
    .trim()
    .url('O link precisa começar com http.')
    .optional()
    .or(z.literal('')),
  thumbnailUrl: z
    .string()
    .trim()
    .url('A capa precisa ser um link válido.')
    .optional()
    .or(z.literal('')),
  durationSeconds: z.coerce.number().int().min(0).max(86400).optional(),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  timeLimitSeconds: z.coerce.number().int().min(0).max(86400).optional(),
  xpReward: z.coerce.number().int().min(0).max(1000),
  isPublished: z.boolean(),
  tags: z.string().max(300).optional().or(z.literal('')),
});

export async function saveResource(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireAdmin();

  const parsed = resourceSchema.safeParse({
    id: formData.get('id') || undefined,
    kind: formData.get('kind'),
    subjectId: formData.get('subjectId'),
    topicId: formData.get('topicId') || '',
    schoolId: formData.get('schoolId') || undefined,
    title: formData.get('title'),
    subtitle: formData.get('subtitle') || '',
    description: formData.get('description') || '',
    body: formData.get('body') || '',
    storagePath: formData.get('storagePath') || '',
    externalUrl: formData.get('externalUrl') || '',
    thumbnailUrl: formData.get('thumbnailUrl') || '',
    durationSeconds: formData.get('durationSeconds') || 0,
    difficulty: formData.get('difficulty') || 'medio',
    timeLimitSeconds: formData.get('timeLimitSeconds') || 0,
    xpReward: formData.get('xpReward') || 0,
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
    tags: formData.get('tags') || '',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const data = parsed.data;

  // O check `resources_has_payload` no banco recusaria isso, mas com uma
  // mensagem de constraint. Aqui a recusa é em português e diz o que fazer.
  const needsPayload = data.kind !== 'quiz' && data.kind !== 'simulado';
  if (needsPayload && !data.body && !data.storagePath && !data.externalUrl) {
    return fail('Falta o conteúdo: escreva o texto, envie um arquivo ou informe um link.');
  }

  const supabase = await createClient();
  const payload = {
    kind: data.kind,
    subject_catalog_id: data.subjectId,
    topic_id: data.topicId || null,
    school_id: resolveSchoolId(identity, data.schoolId ?? null),
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description || null,
    body: data.body || null,
    storage_path: data.storagePath || null,
    external_url: data.externalUrl || null,
    thumbnail_url: data.thumbnailUrl || null,
    duration_seconds: data.durationSeconds ? data.durationSeconds : null,
    difficulty: data.difficulty,
    time_limit_seconds: data.timeLimitSeconds ? data.timeLimitSeconds : null,
    xp_reward: data.xpReward,
    is_published: data.isPublished,
    tags: data.tags
      ? data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    created_by: identity.userId,
  };

  if (data.id) {
    const { error } = await supabase.from('resources').update(payload).eq('id', data.id);
    if (error) return fail(error.message);
    revalidatePath('/admin/conteudo');
    revalidatePath(`/admin/conteudo/${data.id}`);
    return ok;
  }

  const { data: created, error } = await supabase
    .from('resources')
    .insert(payload)
    .select('id')
    .single();

  if (error) return fail(error.message);

  revalidatePath('/admin/conteudo');
  // Quiz e simulado nascem vazios: o próximo passo real é cadastrar questões,
  // então a ação leva direto para lá em vez de devolver a uma lista.
  redirect(
    data.kind === 'quiz' || data.kind === 'simulado'
      ? `/admin/conteudo/${created.id}/questoes`
      : `/admin/conteudo/${created.id}`,
  );
}

export async function toggleResourcePublished(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id');
  const next = formData.get('next') === 'true';
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('resources').update({ is_published: next }).eq('id', id);
  revalidatePath('/admin/conteudo');
  revalidatePath(`/admin/conteudo/${id}`);
}

export async function deleteResource(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('resources').delete().eq('id', id);
  revalidatePath('/admin/conteudo');
  redirect('/admin/conteudo');
}

// --------------------------------------------------------------- questões --

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  resourceId: z.string().uuid(),
  statement: z.string().trim().min(3, 'Escreva o enunciado.').max(4000),
  explanation: z.string().trim().max(4000).optional().or(z.literal('')),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  topicId: z.string().uuid().optional().or(z.literal('')),
  options: z
    .array(z.string().trim().min(1, 'Nenhuma alternativa pode ficar vazia.').max(1000))
    .min(2, 'Uma questão precisa de pelo menos 2 alternativas.')
    .max(6, 'No máximo 6 alternativas.'),
  correctIndex: z.coerce.number().int().min(0),
});

export async function saveQuestion(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

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
    topicId: formData.get('topicId') || '',
    options,
    correctIndex: formData.get('correctIndex') ?? 0,
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { resourceId, statement, explanation, difficulty, topicId, correctIndex } = parsed.data;
  if (correctIndex >= parsed.data.options.length) {
    return fail('Marque qual alternativa é a correta.');
  }

  const supabase = await createClient();

  let questionId = parsed.data.id;
  if (questionId) {
    const { error } = await supabase
      .from('questions')
      .update({
        statement,
        explanation: explanation || null,
        difficulty,
        topic_id: topicId || null,
      })
      .eq('id', questionId);
    if (error) return fail(error.message);

    // As alternativas são reescritas por inteiro. Casar uma a uma pelo índice
    // criaria o caso em que a resposta certa migra para outra alternativa
    // durante uma reordenação — silenciosamente, e só percebido na correção.
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
        topic_id: topicId || null,
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

  revalidatePath(`/admin/conteudo/${resourceId}/questoes`);
  return ok;
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id');
  const resourceId = formData.get('resourceId');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('questions').delete().eq('id', id);
  if (typeof resourceId === 'string') revalidatePath(`/admin/conteudo/${resourceId}/questoes`);
}

// ---------------------------------------------------------------- trilhas --

const trackSchema = z.object({
  id: z.string().uuid().optional(),
  subjectId: z.string().uuid('Escolha a matéria.'),
  schoolId: z.string().optional(),
  title: z.string().trim().min(2, 'Dê um título à trilha.').max(160),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  isPublished: z.boolean(),
});

export async function saveTrack(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireAdmin();

  const parsed = trackSchema.safeParse({
    id: formData.get('id') || undefined,
    subjectId: formData.get('subjectId'),
    schoolId: formData.get('schoolId') || undefined,
    title: formData.get('title'),
    description: formData.get('description') || '',
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const payload = {
    subject_catalog_id: parsed.data.subjectId,
    school_id: resolveSchoolId(identity, parsed.data.schoolId ?? null),
    title: parsed.data.title,
    description: parsed.data.description || null,
    is_published: parsed.data.isPublished,
    created_by: identity.userId,
  };

  if (parsed.data.id) {
    const { error } = await supabase.from('tracks').update(payload).eq('id', parsed.data.id);
    if (error) return fail(error.message);
    revalidatePath(`/admin/trilhas/${parsed.data.id}`);
    return ok;
  }

  const { data: created, error } = await supabase
    .from('tracks')
    .insert(payload)
    .select('id')
    .single();
  if (error) return fail(error.message);

  revalidatePath('/admin/trilhas');
  redirect(`/admin/trilhas/${created.id}`);
}

export async function addTrackSection(formData: FormData): Promise<void> {
  await requireAdmin();
  const trackId = formData.get('trackId');
  const title = formData.get('title');
  if (typeof trackId !== 'string' || typeof title !== 'string' || !title.trim()) return;

  const supabase = await createClient();
  const { data: last } = await supabase
    .from('track_sections')
    .select('position')
    .eq('track_id', trackId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from('track_sections')
    .insert({ track_id: trackId, title: title.trim(), position: (last?.position ?? 0) + 1 });

  revalidatePath(`/admin/trilhas/${trackId}`);
}

export async function addTrackLesson(formData: FormData): Promise<void> {
  await requireAdmin();
  const sectionId = formData.get('sectionId');
  const trackId = formData.get('trackId');
  const title = formData.get('title');
  if (typeof sectionId !== 'string' || typeof title !== 'string' || !title.trim()) return;

  const supabase = await createClient();
  const { data: last } = await supabase
    .from('track_lessons')
    .select('id, position')
    .eq('section_id', sectionId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from('track_lessons').insert({
    section_id: sectionId,
    title: title.trim(),
    position: (last?.position ?? 0) + 1,
    estimated_minutes: Number(formData.get('estimatedMinutes')) || null,
    xp_reward: Number(formData.get('xpReward')) || 20,
    // Encadeia na anterior por padrão: uma trilha é uma sequência, e ter que
    // ligar cada nó à mão é o tipo de passo que se esquece e só aparece quando
    // o aluno vê tudo destravado de uma vez.
    unlock_after_lesson_id: last?.id ?? null,
  });

  if (typeof trackId === 'string') revalidatePath(`/admin/trilhas/${trackId}`);
}

export async function attachLessonResource(formData: FormData): Promise<void> {
  await requireAdmin();
  const lessonId = formData.get('lessonId');
  const resourceId = formData.get('resourceId');
  const trackId = formData.get('trackId');
  if (typeof lessonId !== 'string' || typeof resourceId !== 'string' || !resourceId) return;

  const supabase = await createClient();
  const { data: last } = await supabase
    .from('track_lesson_resources')
    .select('position')
    .eq('lesson_id', lessonId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from('track_lesson_resources')
    .insert({ lesson_id: lessonId, resource_id: resourceId, position: (last?.position ?? 0) + 1 });

  if (typeof trackId === 'string') revalidatePath(`/admin/trilhas/${trackId}`);
}

export async function detachLessonResource(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id');
  const trackId = formData.get('trackId');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('track_lesson_resources').delete().eq('id', id);
  if (typeof trackId === 'string') revalidatePath(`/admin/trilhas/${trackId}`);
}

export async function deleteTrackLesson(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get('id');
  const trackId = formData.get('trackId');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('track_lessons').delete().eq('id', id);
  if (typeof trackId === 'string') revalidatePath(`/admin/trilhas/${trackId}`);
}

// ----------------------------------------------------------------- pessoas --

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['student', 'school_admin', 'admin']),
  schoolId: z.string().optional(),
});

export async function setPersonRole(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const identity = await requireAdmin();
  if (!identity.isGlobal) return fail('Só a administração geral muda papéis.');

  const parsed = roleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
    schoolId: formData.get('schoolId') || undefined,
  });
  if (!parsed.success) return fail(firstIssue(parsed.error));

  // Rebaixar a si mesmo deixaria o painel sem dono e sem porta de volta: só o
  // SQL Editor traria alguém de novo. É um erro de um clique, e caro.
  if (parsed.data.userId === identity.userId && parsed.data.role !== 'admin') {
    return fail('Você não pode retirar o próprio acesso de administrador.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      role: parsed.data.role,
      // school_admin sem escola não administra nada; vincular junto evita o
      // estado intermediário em que o painel abre vazio sem dizer por quê.
      ...(parsed.data.role === 'school_admin' && parsed.data.schoolId
        ? { school_id: parsed.data.schoolId }
        : {}),
    })
    .eq('id', parsed.data.userId);

  if (error) return fail(error.message);

  revalidatePath('/admin/usuarios');
  return ok;
}
