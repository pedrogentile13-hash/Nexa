'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { buildGrande2Seed } from '@/features/content/lib/grande2-seed';
import { buildGrande3Seed } from '@/features/content/lib/grande3-seed';
import { PACOTES_PB4, PB4_TAG, RESUMOS_PB4, TRILHA_PB4 } from '@/features/content/seed/pb4';
import { requireAccess } from './guard';
import { targetSchoolId } from './target-school';
import type { StudySeedState } from './study-seed-actions';

const BATCH = 250;
const MATERIA = 'lingua-portuguesa';
const fail = (message: string): StudySeedState => ({ status: 'error', message });

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function insertAll(supabase: Supabase, table: string, rows: Record<string, unknown>[]) {
  let added = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { data, error } = await supabase
      .from(table as 'resources')
      // Ids fixos: o que já existe é ignorado, então carregar de novo nunca duplica.
      .upsert(rows.slice(i, i + BATCH) as never, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (error) return { added, error: `${table}: ${error.message}` };
    added += data?.length ?? 0;
  }
  return { added, error: null as string | null };
}

/**
 * Português do 4º bimestre (9º ano C, Anglo Morumbi): simulados e resumos das listas da professora e a trilha
 * "PB4 · Português". Só vai para a escola escolhida (o admin geral escolhe no card "Conteúdo da escola").
 * Entra como rascunho; clicar de novo não duplica.
 */
export async function createPb4(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const schoolId = targetSchoolId(identity, formData);
  if (identity.isGlobal && !schoolId) return fail('Escolha a escola antes de carregar.');
  const supabase = await createClient();

  const g2 = buildGrande2Seed(schoolId, PACOTES_PB4, PB4_TAG);
  const g3 = buildGrande3Seed(schoolId, RESUMOS_PB4, [TRILHA_PB4], PB4_TAG);

  const { data: subject } = await supabase
    .from('subject_catalog')
    .select('id')
    .eq('slug', MATERIA)
    .maybeSingle();
  if (!subject) return fail('Não encontrei a matéria Língua Portuguesa no catálogo.');

  const pending = { is_published: false, created_by: identity.userId };
  const resources = await insertAll(supabase, 'resources', [
    ...g2.resources.map((r) => ({
      ...pending,
      id: r.id,
      school_id: r.school_id,
      subject_catalog_id: subject.id,
      kind: r.kind,
      context: r.context === 'vestibular' ? 'vestibular' : 'school',
      exam_id: null,
      time_limit_seconds: r.time_limit_seconds,
      duration_seconds: r.time_limit_seconds,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      difficulty: r.difficulty,
      grade_levels: r.grade_levels,
      tags: r.tags,
      xp_reward: r.xp_reward,
      sort_order: r.sort_order,
    })),
    ...g3.resources.map((r) => ({
      ...pending,
      id: r.id,
      school_id: r.school_id,
      subject_catalog_id: subject.id,
      kind: 'resumo',
      context: r.context,
      exam_id: null,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      body: r.body,
      difficulty: 'medio',
      grade_levels: r.grade_levels,
      tags: r.tags,
      duration_seconds: r.duration_seconds,
      xp_reward: 10,
      sort_order: r.sort_order,
    })),
  ]);
  if (resources.error) return fail(`Não consegui criar: ${resources.error}`);

  const questions = await insertAll(
    supabase,
    'questions',
    g2.questions.map((q) => ({
      id: q.id,
      resource_id: q.resource_id,
      position: q.position,
      statement: q.statement,
      explanation: q.explanation,
      difficulty: q.difficulty,
      kind: q.kind,
      model_answer: q.model_answer,
      rubric: q.rubric,
    })),
  );
  if (questions.error) {
    return fail(
      /kind|model_answer|rubric|column/i.test(questions.error)
        ? 'Falta rodar o SQL das questões discursivas no Supabase (migration 20261111000200). Depois, clique de novo.'
        : `Não consegui criar: ${questions.error}`,
    );
  }

  const options = await insertAll(
    supabase,
    'question_options',
    g2.options.map((o) => ({
      id: o.id,
      question_id: o.question_id,
      position: o.position,
      body: o.body,
      is_correct: o.is_correct,
    })),
  );
  if (options.error) return fail(`Não consegui criar: ${options.error}`);

  const tracks = await insertAll(
    supabase,
    'tracks',
    g3.tracks.map((t) => ({
      id: t.id,
      school_id: t.school_id,
      subject_catalog_id: subject.id,
      title: t.title,
      description: t.description,
      category: t.category,
      grade_levels: t.grade_levels,
      sort_order: t.sort_order,
      is_published: false,
      created_by: identity.userId,
    })),
  );
  if (tracks.error) return fail(`Não consegui criar a trilha: ${tracks.error}`);
  const sections = await insertAll(supabase, 'track_sections', g3.sections);
  if (sections.error) return fail(`Não consegui criar as etapas: ${sections.error}`);
  const lessons = await insertAll(supabase, 'track_lessons', g3.lessons);
  if (lessons.error) return fail(`Não consegui criar as lições: ${lessons.error}`);
  const lessonResources = await insertAll(supabase, 'track_lesson_resources', g3.lessonResources);
  if (lessonResources.error) return fail(`Não consegui ligar os itens: ${lessonResources.error}`);

  revalidatePath('/admin/conteudo');
  return {
    status: 'done',
    message: `Português 4º bimestre criado como rascunho: ${PACOTES_PB4.length} simulados, ${RESUMOS_PB4.length} resumos e a trilha PB4 (${questions.added} questões). Revise e publique.`,
  };
}

/** Publica o que o botão do Português 4º bimestre criou para a escola escolhida. */
export async function publishPb4(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const schoolId = targetSchoolId(identity, formData);
  if (identity.isGlobal && !schoolId) return fail('Escolha a escola antes de publicar.');
  const supabase = await createClient();
  const trackIds = buildGrande3Seed(schoolId, RESUMOS_PB4, [TRILHA_PB4], PB4_TAG).tracks.map(
    (t) => t.id,
  );

  const base = () =>
    supabase.from('resources').update({
      is_published: true,
      published_at: new Date().toISOString(),
    } as never);
  const scoped = schoolId ? base().eq('school_id', schoolId) : base().is('school_id', null);
  const { data, error } = await scoped
    .contains('tags', [PB4_TAG])
    .eq('is_published', false)
    .select('id');
  if (error) return fail(`Não consegui publicar: ${error.message}`);

  const { error: trackError } = await supabase
    .from('tracks')
    .update({ is_published: true } as never)
    .in('id', trackIds)
    .eq('is_published', false);
  if (trackError) return fail(`Publiquei os conteúdos, mas não a trilha: ${trackError.message}`);

  revalidatePath('/admin/conteudo');
  return { status: 'done', message: `Publicado: ${data?.length ?? 0} conteúdos e a trilha PB4.` };
}
