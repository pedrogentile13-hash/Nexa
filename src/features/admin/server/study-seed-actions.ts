'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { buildStudySeed } from '@/features/content/lib/study-seed';
import { SEED_TAG } from '@/features/content/seed';
import { requireAccess } from './guard';

export type StudySeedState = { status: 'idle' } | { status: 'done'; message: string } | { status: 'error'; message: string };

const BATCH = 150;
const fail = (message: string): StudySeedState => ({ status: 'error', message });

async function insertAll(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'content_topics' | 'resources' | 'questions' | 'question_options',
  rows: Record<string, unknown>[],
): Promise<{ added: number; error: string | null }> {
  let added = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { data, error } = await supabase
      .from(table)
      // Linhas com id fixo: o que já existe é ignorado, então carregar de novo nunca duplica.
      .upsert(rows.slice(i, i + BATCH) as never, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (error) return { added, error: `${table}: ${error.message}` };
    added += data?.length ?? 0;
  }
  return { added, error: null };
}

/**
 * Carrega o mapa de tópicos (6º ano ao 3º ano do EM) e os pacotes iniciais (resumo + quiz) COMO RASCUNHO.
 * Destino: o Colégio Anglo Morumbi (se existir) para o admin geral; a própria escola para o admin da escola.
 * Usa a sessão de quem clicou: as políticas do banco continuam decidindo o que pode ser escrito.
 */
export async function loadStudyStarter(): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();

  let schoolId: string | null = identity.schoolId;
  if (identity.isGlobal) {
    const { data: anglo } = await supabase.from('schools').select('id').ilike('name', '%anglo%morumbi%').order('created_at').limit(1).maybeSingle();
    schoolId = anglo?.id ?? null;
  }

  const seed = buildStudySeed(schoolId);
  const slugs = [...new Set(seed.topics.map((t) => t.subject_slug))];
  const { data: subjects, error: subjectsError } = await supabase.from('subject_catalog').select('id, slug').in('slug', slugs);
  if (subjectsError || !subjects?.length) return fail('Não encontrei as matérias do catálogo. Confira se o banco está atualizado.');
  const subjectId = new Map(subjects.map((s) => [s.slug, s.id]));

  // Se já existe um tópico com o mesmo nome técnico neste escopo, reaproveita (não cria outro igual).
  let existingQuery = supabase.from('content_topics').select('id, subject_catalog_id, slug');
  existingQuery = schoolId ? existingQuery.eq('school_id', schoolId) : existingQuery.is('school_id', null);
  const { data: existing } = await existingQuery;
  const existingId = new Map((existing ?? []).map((t) => [`${t.subject_catalog_id}/${t.slug}`, t.id]));

  const topicId = new Map<string, string>();
  const newTopics: Record<string, unknown>[] = [];
  for (const t of seed.topics) {
    const sid = subjectId.get(t.subject_slug);
    if (!sid) continue;
    const found = existingId.get(`${sid}/${t.slug}`);
    topicId.set(t.slug, found ?? t.id);
    if (!found) newTopics.push({ id: t.id, school_id: t.school_id, subject_catalog_id: sid, name: t.name, slug: t.slug, grade_levels: t.grade_levels, sort_order: t.sort_order, created_by: identity.userId });
  }

  const topics = await insertAll(supabase, 'content_topics', newTopics);
  if (topics.error) return fail(`Não consegui carregar: ${topics.error}`);

  const resources = await insertAll(
    supabase,
    'resources',
    seed.resources.map((r) => ({
      id: r.id,
      school_id: r.school_id,
      subject_catalog_id: subjectId.get(r.subject_slug),
      topic_id: topicId.get(r.topic_slug) ?? null,
      kind: r.kind,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      body: r.body,
      difficulty: r.difficulty,
      grade_levels: r.grade_levels,
      tags: r.tags,
      xp_reward: r.xp_reward,
      sort_order: r.sort_order,
      is_published: false,
      created_by: identity.userId,
    })),
  );
  if (resources.error) return fail(`Não consegui carregar: ${resources.error}`);

  const questions = await insertAll(
    supabase,
    'questions',
    seed.questions.map((q) => ({ id: q.id, resource_id: q.resource_id, topic_id: topicId.get(q.topic_slug) ?? null, position: q.position, statement: q.statement, explanation: q.explanation, difficulty: q.difficulty })),
  );
  if (questions.error) return fail(`Não consegui carregar: ${questions.error}`);

  const options = await insertAll(
    supabase,
    'question_options',
    seed.options.map((o) => ({ id: o.id, question_id: o.question_id, position: o.position, body: o.body, is_correct: o.is_correct })),
  );
  if (options.error) return fail(`Não consegui carregar: ${options.error}`);

  revalidatePath('/admin/conteudo');
  const nothingNew = topics.added + resources.added + questions.added === 0;
  return {
    status: 'done',
    message: nothingNew
      ? 'Tudo já estava carregado. Nada foi duplicado.'
      : `Carregado como rascunho: ${topics.added} tópicos, ${resources.added} conteúdos (resumos e quizzes) e ${questions.added} questões. Revise e depois publique.`,
  };
}

/** Publica de uma vez os rascunhos do pacote inicial (os marcados com a etiqueta do pacote). Faça depois de revisar. */
export async function publishStudyStarter(): Promise<StudySeedState> {
  await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const { data, error } = await supabase.from('resources').update({ is_published: true }).contains('tags', [SEED_TAG]).eq('is_published', false).select('id');
  if (error) return fail(`Não consegui publicar: ${error.message}`);
  revalidatePath('/admin/conteudo');
  return { status: 'done', message: data?.length ? `${data.length} conteúdos publicados.` : 'Não há rascunhos do pacote inicial para publicar.' };
}
