'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { buildPb4Rows, pb4TrackInsertRow } from '@/features/content/lib/pb4-seed';
import { requireAccess } from './guard';
import { targetSchoolId } from './target-school';
import type { StudySeedState } from './study-seed-actions';

const BATCH = 250;
const fail = (message: string): StudySeedState => ({ status: 'error', message });

async function insertAll(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  rows: Record<string, unknown>[],
): Promise<{ added: number; error: string | null }> {
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
  return { added, error: null };
}

/**
 * Português do 4º bimestre, já PUBLICADO: os resumos ficam públicos para todas as escolas, os simulados e a
 * trilha ficam só na escola escolhida. Carregar de novo não duplica.
 */
export async function createPb4(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const schoolId = targetSchoolId(identity, formData);
  if (!schoolId) return fail('Escolha a escola antes de carregar.');
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from('subject_catalog')
    .select('id')
    .eq('slug', 'lingua-portuguesa')
    .maybeSingle();
  if (!subject) return fail('Não encontrei a matéria Língua Portuguesa no catálogo.');

  const rows = buildPb4Rows(schoolId);
  const now = new Date().toISOString();
  const by = { created_by: identity.userId, is_published: true, published_at: now };

  const resources = await insertAll(supabase, 'resources', [
    ...rows.resumos.map((r) => ({
      ...by,
      id: r.id,
      school_id: null,
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
    ...rows.simulados.resources.map((r) => ({
      ...by,
      id: r.id,
      school_id: schoolId,
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
  ]);
  if (resources.error) return fail(`Não consegui criar: ${resources.error}`);

  const questions = await insertAll(
    supabase,
    'questions',
    rows.simulados.questions.map((q) => ({
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
    rows.simulados.options.map((o) => ({
      id: o.id,
      question_id: o.question_id,
      position: o.position,
      body: o.body,
      is_correct: o.is_correct,
    })),
  );
  if (options.error) return fail(`Não consegui criar: ${options.error}`);

  const track = await insertAll(supabase, 'tracks', [
    pb4TrackInsertRow(rows.track, subject.id, identity.userId),
  ]);
  if (track.error) return fail(`Não consegui criar a trilha: ${track.error}`);
  for (const [tabela, linhas] of [
    ['track_sections', rows.sections],
    ['track_lessons', rows.lessons],
    ['track_lesson_resources', rows.lessonResources],
  ] as const) {
    const r = await insertAll(supabase, tabela, [...linhas]);
    if (r.error) return fail(`Não consegui montar a trilha: ${r.error}`);
  }

  revalidatePath('/admin/conteudo');
  return {
    status: 'done',
    message: `Publicado: ${rows.resumos.length} resumos (públicos para todas as escolas), ${rows.simulados.resources.length} simulados e a trilha PB4 (fechados para a escola escolhida). Questões: ${questions.added}. Quem já tinha carregado antes só recebeu o que faltava.`,
  };
}
