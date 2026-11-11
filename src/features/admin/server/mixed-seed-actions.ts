'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { buildMixedSeed } from '@/features/content/lib/mixed-seed';
import { MISTO_TAG } from '@/features/content/seed/misto';
import { requireAccess } from './guard';
import type { StudySeedState } from './study-seed-actions';

const BATCH = 100;
const fail = (message: string): StudySeedState => ({ status: 'error', message });

async function insertAll(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'resources' | 'questions' | 'question_options',
  rows: Record<string, unknown>[],
): Promise<{ added: number; error: string | null }> {
  let added = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { data, error } = await supabase
      .from(table)
      // Ids fixos: o que já existe é ignorado, então carregar de novo nunca duplica.
      .upsert(rows.slice(i, i + BATCH) as never, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (error) return { added, error: `${table}: ${error.message}` };
    added += data?.length ?? 0;
  }
  return { added, error: null };
}

/**
 * Carrega os pacotes MISTOS (objetivas + discursivas com correção por IA) COMO RASCUNHO: quiz e simulado de sete matérias
 * do Nexa Study e simulados de 2ª fase (Fuvest, Unicamp, Unesp). O ENEM continua só com simulados objetivos.
 * Destino geral para o admin geral; a própria escola para o admin da escola.
 */
export async function loadMixedPackages(): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const schoolId: string | null = identity.isGlobal ? null : identity.schoolId;

  const seed = buildMixedSeed(schoolId);
  const slugs = [...new Set(seed.resources.map((r) => r.subject_slug))];
  const { data: subjects, error: subjectsError } = await supabase
    .from('subject_catalog')
    .select('id, slug')
    .in('slug', slugs);
  if (subjectsError || !subjects?.length)
    return fail('Não encontrei as matérias do catálogo. Confira se o banco está atualizado.');
  const subjectId = new Map(subjects.map((s) => [s.slug, s.id]));
  const { data: exams } = await supabase
    .from('exams')
    .select('id, slug')
    .in('slug', ['fuvest', 'unicamp', 'unesp']);
  const examId = new Map((exams ?? []).map((e) => [e.slug, e.id]));

  // O que já está no painel (mesmo tipo e título) não é carregado de novo.
  const { data: already } = await supabase
    .from('resources')
    .select('kind, title')
    .contains('tags', [MISTO_TAG]);
  const have = new Set((already ?? []).map((r) => `${r.kind}/${r.title}`));
  const fresh = seed.resources.filter(
    (r) =>
      !have.has(`${r.kind}/${r.title}`) &&
      subjectId.has(r.subject_slug) &&
      (r.exam_slug === null || examId.has(r.exam_slug)),
  );
  if (fresh.length < seed.resources.length - have.size && examId.size === 0) {
    return fail(
      'Não encontrei as provas (Fuvest, Unicamp, Unesp) no banco. Rode o SQL do Vestibular primeiro.',
    );
  }
  const freshIds = new Set(fresh.map((r) => r.id));

  const resources = await insertAll(
    supabase,
    'resources',
    fresh.map((r) => ({
      id: r.id,
      school_id: r.school_id,
      subject_catalog_id: subjectId.get(r.subject_slug),
      kind: r.kind,
      context: r.context,
      exam_id: r.exam_slug ? (examId.get(r.exam_slug) ?? null) : null,
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
      is_published: false,
      created_by: identity.userId,
    })),
  );
  if (resources.error) return fail(`Não consegui carregar: ${resources.error}`);

  const qs = seed.questions.filter((q) => freshIds.has(q.resource_id));
  const questions = await insertAll(
    supabase,
    'questions',
    qs.map((q) => ({
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
    // Colunas novas ausentes = o SQL das discursivas ainda não rodou. As linhas já criadas ficam como rascunho vazio: removemos.
    if (/kind|model_answer|rubric|column/i.test(questions.error)) {
      await supabase
        .from('resources')
        .delete()
        .in('id', [...freshIds]);
      return fail(
        'Falta rodar o SQL das questões discursivas no Supabase (migration 20261111000200). Depois, carregue de novo.',
      );
    }
    return fail(`Não consegui carregar: ${questions.error}`);
  }

  const qIds = new Set(qs.map((q) => q.id));
  const options = await insertAll(
    supabase,
    'question_options',
    seed.options
      .filter((o) => qIds.has(o.question_id))
      .map((o) => ({
        id: o.id,
        question_id: o.question_id,
        position: o.position,
        body: o.body,
        is_correct: o.is_correct,
      })),
  );
  if (options.error) return fail(`Não consegui carregar: ${options.error}`);

  revalidatePath('/admin/conteudo');
  const discursivas = qs.filter((q) => q.kind === 'discursiva').length;
  return {
    status: 'done',
    message:
      resources.added === 0
        ? 'Os pacotes mistos já estavam carregados. Nada foi duplicado.'
        : `Carregado como rascunho: ${resources.added} pacotes e ${questions.added} questões (${discursivas} discursivas). Revise e depois publique.`,
  };
}

/** Publica de uma vez os pacotes mistos que ainda são rascunho. Faça depois de revisar. */
export async function publishMixedPackages(): Promise<StudySeedState> {
  await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .update({ is_published: true })
    .contains('tags', [MISTO_TAG])
    .eq('is_published', false)
    .select('id');
  if (error) return fail(`Não consegui publicar: ${error.message}`);
  revalidatePath('/admin/conteudo');
  revalidatePath('/vestibular/provas');
  return {
    status: 'done',
    message: data?.length
      ? `${data.length} pacotes mistos publicados.`
      : 'Não há pacotes mistos em rascunho.',
  };
}
