'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  buildPa7Rows,
  buildPa8Rows,
  buildPb4Rows,
  pb4TrackInsertRow,
} from '@/features/content/lib/pb4-seed';
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

type Rows = ReturnType<typeof buildPb4Rows>;
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Publica um conjunto (resumos públicos, simulados e trilha da escola). Devolve o que foi criado ou o erro. */
async function publishSet(
  supabase: Supabase,
  rows: Rows,
  ctx: { schoolId: string; subjectId: string; userId: string },
): Promise<{ ok: true; questions: number } | { ok: false; message: string }> {
  const { schoolId, subjectId, userId } = ctx;
  const now = new Date().toISOString();
  const by = { created_by: userId, is_published: true, published_at: now };

  // Cada matéria do conjunto (Português, História, Geografia…) tem o seu id no catálogo.
  const { data: catalog } = await supabase.from('subject_catalog').select('id, slug');
  const subjectBySlug = new Map((catalog ?? []).map((c) => [c.slug, c.id]));
  const subjectOf = (slug: string) => subjectBySlug.get(slug) ?? subjectId;

  const resources = await insertAll(supabase, 'resources', [
    ...rows.resumos.map((r) => ({
      ...by,
      id: r.id,
      school_id: null,
      subject_catalog_id: subjectOf(r.subject_slug),
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
      subject_catalog_id: subjectOf(r.subject_slug),
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
  if (resources.error) return { ok: false, message: `Não consegui criar: ${resources.error}` };

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
    return {
      ok: false,
      message: /kind|model_answer|rubric|column/i.test(questions.error)
        ? 'Falta rodar o SQL das questões discursivas no Supabase (migration 20261111000200). Depois, clique de novo.'
        : `Não consegui criar: ${questions.error}`,
    };
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
  if (options.error) return { ok: false, message: `Não consegui criar: ${options.error}` };

  const track = await insertAll(supabase, 'tracks', [
    pb4TrackInsertRow(rows.track, subjectId, userId),
  ]);
  if (track.error) return { ok: false, message: `Não consegui criar a trilha: ${track.error}` };
  for (const [tabela, linhas] of [
    ['track_sections', rows.sections],
    ['track_lessons', rows.lessons],
    ['track_lesson_resources', rows.lessonResources],
  ] as const) {
    const r = await insertAll(supabase, tabela, [...linhas]);
    if (r.error) return { ok: false, message: `Não consegui montar a trilha: ${r.error}` };
  }
  return { ok: true, questions: questions.added };
}

/**
 * Conteúdo do colégio, já PUBLICADO: Português do 4º bimestre (PB4), a Prova Anglo 7 (PA7) e a Prova Anglo 8 (PA8). Os resumos ficam
 * públicos para todas as escolas; os simulados e as trilhas ficam só na escola escolhida. Carregar de novo não
 * duplica e completa o que faltar.
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

  const ctx = { schoolId, subjectId: subject.id, userId: identity.userId };
  const partes: string[] = [];
  for (const [nome, rows] of [
    ['PB4', buildPb4Rows(schoolId)],
    ['PA7', buildPa7Rows(schoolId)],
    ['PA8', buildPa8Rows(schoolId)],
  ] as const) {
    const r = await publishSet(supabase, rows, ctx);
    if (!r.ok) return fail(`${nome}: ${r.message}`);
    partes.push(
      `${nome}: ${rows.resumos.length} resumos, ${rows.simulados.resources.length} simulados e a trilha`,
    );
  }

  revalidatePath('/admin/conteudo');
  revalidatePath('/estudar');
  return {
    status: 'done',
    message: `Publicado. ${partes.join(' · ')}. Resumos ficam públicos; simulados e trilhas, só na escola escolhida. Quem já tinha carregado antes só recebeu o que faltava.`,
  };
}
