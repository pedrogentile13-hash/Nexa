'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { buildGrande3Seed } from '@/features/content/lib/grande3-seed';
import { G3_TAG } from '@/features/content/seed/grande3';
import { requireAccess } from './guard';
import { targetSchoolId } from './target-school';
import type { StudySeedState } from './study-seed-actions';

const BATCH = 250;
const fail = (message: string): StudySeedState => ({ status: 'error', message });

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Tabela =
  'resources' | 'tracks' | 'track_sections' | 'track_lessons' | 'track_lesson_resources';

async function insertAll(supabase: Supabase, table: Tabela, rows: Record<string, unknown>[]) {
  let added = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { data, error } = await supabase
      .from(table)
      // Ids fixos: o que já existe é ignorado, então criar de novo nunca duplica.
      .upsert(rows.slice(i, i + BATCH) as never, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (error) return { added, error: `${table}: ${error.message}` };
    added += data?.length ?? 0;
  }
  return { added, error: null as string | null };
}

/** Quais destes ids de recurso existem no banco (em lotes, para não estourar a URL). */
async function existingResourceIds(supabase: Supabase, ids: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 150) {
    const { data } = await supabase
      .from('resources')
      .select('id')
      .in('id', unique.slice(i, i + 150));
    for (const r of data ?? []) found.add(r.id);
  }
  return found;
}

/**
 * "Grande criação 3": cria COMO RASCUNHO os resumos (Nexa Study e Biblioteca do Vestibular, com planos de estudo)
 * e as trilhas que juntam resumos, quizzes e simulados da Grande criação 2. Clicar de novo não duplica e
 * completa as trilhas com os itens que ainda faltavam (por exemplo, se a Grande criação 2 foi criada depois).
 */
export async function createGrande3(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const schoolId = targetSchoolId(identity, formData);
  const seed = buildGrande3Seed(schoolId);

  const slugs = [
    ...new Set([
      ...seed.resources.map((r) => r.subject_slug),
      ...seed.tracks.map((t) => t.subject_slug),
    ]),
  ];
  const { data: subjects, error: subjectsError } = await supabase
    .from('subject_catalog')
    .select('id, slug')
    .in('slug', slugs);
  if (subjectsError || !subjects?.length)
    return fail('Não encontrei as matérias do catálogo. Confira se o banco está atualizado.');
  const subjectId = new Map(subjects.map((s) => [s.slug, s.id]));
  const semMateria = slugs.filter((s) => !subjectId.has(s));

  const resources = await insertAll(
    supabase,
    'resources',
    seed.resources
      .filter((r) => subjectId.has(r.subject_slug))
      .map((r) => ({
        id: r.id,
        school_id: r.school_id,
        subject_catalog_id: subjectId.get(r.subject_slug),
        kind: 'resumo',
        context: r.context,
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
        is_published: false,
        created_by: identity.userId,
      })),
  );
  if (resources.error) return fail(`Não consegui criar os resumos: ${resources.error}`);

  const tracks = await insertAll(
    supabase,
    'tracks',
    seed.tracks
      .filter((t) => subjectId.has(t.subject_slug))
      .map((t) => ({
        id: t.id,
        school_id: t.school_id,
        subject_catalog_id: subjectId.get(t.subject_slug),
        title: t.title,
        description: t.description,
        category: t.category,
        grade_levels: t.grade_levels,
        sort_order: t.sort_order,
        is_published: false,
        created_by: identity.userId,
      })),
  );
  if (tracks.error) return fail(`Não consegui criar as trilhas: ${tracks.error}`);

  const trackIds = new Set(
    seed.tracks.filter((t) => subjectId.has(t.subject_slug)).map((t) => t.id),
  );
  const sections = seed.sections.filter((s) => trackIds.has(s.track_id));
  const sec = await insertAll(supabase, 'track_sections', sections);
  if (sec.error) return fail(`Não consegui criar as etapas: ${sec.error}`);
  const sectionIds = new Set(sections.map((s) => s.id));
  const lessons = seed.lessons.filter((l) => sectionIds.has(l.section_id));
  const les = await insertAll(supabase, 'track_lessons', lessons);
  if (les.error) return fail(`Não consegui criar as lições: ${les.error}`);

  // Só liga à lição o que existe no banco: quizzes e simulados vêm da Grande criação 2.
  const lessonIds = new Set(lessons.map((l) => l.id));
  const wanted = seed.lessonResources.filter((x) => lessonIds.has(x.lesson_id));
  const exist = await existingResourceIds(
    supabase,
    wanted.map((x) => x.resource_id),
  );
  const items = await insertAll(
    supabase,
    'track_lesson_resources',
    wanted.filter((x) => exist.has(x.resource_id)),
  );
  if (items.error) return fail(`Não consegui ligar os conteúdos às trilhas: ${items.error}`);
  const faltando = wanted.filter((x) => !exist.has(x.resource_id)).length;

  revalidatePath('/admin/conteudo');
  revalidatePath('/admin/trilhas');
  const partes = [
    resources.added || tracks.added || items.added
      ? `Criado como rascunho: ${resources.added} resumos, ${tracks.added} trilhas e ${items.added} itens de trilha.`
      : 'A Grande criação 3 já estava criada. Nada foi duplicado.',
    faltando
      ? `${faltando} itens das trilhas ficaram de fora porque os quizzes e simulados ainda não existem: crie a Grande criação 2 e clique aqui de novo.`
      : '',
    semMateria.length ? `Matérias ausentes no catálogo: ${semMateria.join(', ')}.` : '',
  ];
  return { status: 'done', message: partes.filter(Boolean).join(' ') };
}

/** Publica os resumos e as trilhas da Grande criação 3 que ainda são rascunho. */
export async function publishGrande3(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const escolha = identity.isGlobal ? formData?.get('schoolId') : undefined;
  const escola =
    typeof escolha === 'string' && escolha ? targetSchoolId(identity, formData) : undefined;
  if (typeof escolha === 'string' && escolha && !escola) return fail('Escola inválida.');
  const schoolId: string | null = escola ?? (identity.isGlobal ? null : identity.schoolId);
  let query = supabase
    .from('resources')
    .update({ is_published: true, published_at: new Date().toISOString() } as never)
    .contains('tags', [G3_TAG]);
  if (escola) query = query.eq('school_id', escola);
  const { data: res, error } = await query.eq('is_published', false).select('id');
  if (error) return fail(`Não consegui publicar os resumos: ${error.message}`);
  const trackIds = buildGrande3Seed(schoolId).tracks.map((t) => t.id);
  const { data: trs, error: trackError } = await supabase
    .from('tracks')
    .update({ is_published: true } as never)
    .in('id', trackIds)
    .eq('is_published', false)
    .select('id');
  if (trackError) return fail(`Não consegui publicar as trilhas: ${trackError.message}`);
  revalidatePath('/admin/conteudo');
  revalidatePath('/admin/trilhas');
  revalidatePath('/vestibular/provas');
  return {
    status: 'done',
    message:
      (res?.length ?? 0) + (trs?.length ?? 0)
        ? `${res?.length ?? 0} resumos e ${trs?.length ?? 0} trilhas publicados.`
        : 'Não há nada da Grande criação 3 em rascunho.',
  };
}
