'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { buildGrande2Seed } from '@/features/content/lib/grande2-seed';
import { G2_TAG } from '@/features/content/seed/grande2';
import { requireAccess } from './guard';
import { targetSchoolId } from './target-school';
import {
  missingOptions,
  missingQuestions,
  presentQuestionIds,
  presentResourceIds,
} from './seed-fill';

import type { StudySeedState } from './study-seed-actions';

const BATCH = 250;
const BANCAS = ['enem', 'fuvest', 'unicamp', 'unesp', 'ita', 'ime'];
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
      // Ids fixos: o que já existe é ignorado, então criar de novo nunca duplica.
      .upsert(rows.slice(i, i + BATCH) as never, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (error) return { added, error: `${table}: ${error.message}` };
    added += data?.length ?? 0;
  }
  return { added, error: null };
}

/**
 * "Grande criação 2": cria COMO RASCUNHO 100 quizzes e 100 simulados do Nexa Study (6º ano ao 3º EM, 16 matérias,
 * mais de 100 com discursiva corrigida por IA) e 32 simulados de vestibular (ENEM, Fuvest, Unicamp, Unesp, ITA, IME).
 * Destino geral para o admin geral; a própria escola para o admin da escola. Rodar de novo não duplica.
 */
export async function createGrande2(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const schoolId = targetSchoolId(identity, formData);

  const seed = buildGrande2Seed(schoolId);
  const slugs = [...new Set(seed.resources.map((r) => r.subject_slug))];
  const { data: subjects, error: subjectsError } = await supabase
    .from('subject_catalog')
    .select('id, slug')
    .in('slug', slugs);
  if (subjectsError || !subjects?.length)
    return fail('Não encontrei as matérias do catálogo. Confira se o banco está atualizado.');
  const subjectId = new Map(subjects.map((s) => [s.slug, s.id]));
  const { data: exams } = await supabase.from('exams').select('id, slug').in('slug', BANCAS);
  const examId = new Map((exams ?? []).map((e) => [e.slug, e.id]));

  // O que já está no painel (mesmo tipo, título e série) não é criado de novo.
  const { data: already } = await supabase
    .from('resources')
    .select('kind, title, grade_levels')
    .contains('tags', [G2_TAG]);
  const key = (kind: string, title: string, grades: string[] | null) =>
    `${kind}/${title}/${(grades ?? []).join(',')}`;
  const have = new Set((already ?? []).map((r) => key(r.kind, r.title, r.grade_levels)));

  const semMateria = new Set<string>();
  const semBanca = new Set<string>();
  const fresh = seed.resources.filter((r) => {
    if (have.has(key(r.kind, r.title, r.grade_levels))) return false;
    if (!subjectId.has(r.subject_slug)) {
      semMateria.add(r.subject_slug);
      return false;
    }
    if (r.exam_slug && !examId.has(r.exam_slug)) {
      semBanca.add(r.exam_slug);
      return false;
    }
    return true;
  });

  const resources = await insertAll(
    supabase,
    'resources',
    fresh.map((r) => ({
      id: r.id,
      school_id: r.school_id,
      subject_catalog_id: subjectId.get(r.subject_slug),
      kind: r.kind,
      // O banco só aceita 'school' ou 'vestibular' (o Nexa Study é 'school').
      context: r.context === 'vestibular' ? 'vestibular' : 'school',
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
  if (resources.error) return fail(`Não consegui criar: ${resources.error}`);

  // Completa também os já criados cujas questões não chegaram (carga interrompida no meio).
  const present = await presentResourceIds(
    supabase,
    seed.resources.map((r) => r.id),
  );
  const qs = await missingQuestions(supabase, seed.questions, present);
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
    // Colunas novas ausentes = o SQL das discursivas ainda não rodou. Remove os rascunhos vazios recém-criados.
    if (/kind|model_answer|rubric|column/i.test(questions.error)) {
      for (let i = 0; i < fresh.length; i += BATCH) {
        await supabase
          .from('resources')
          .delete()
          .in(
            'id',
            fresh.slice(i, i + BATCH).map((r) => r.id),
          );
      }
      return fail(
        'Falta rodar o SQL das questões discursivas no Supabase (migration 20261111000200). Depois, clique de novo.',
      );
    }
    return fail(`Não consegui criar: ${questions.error}`);
  }

  const qIds = await presentQuestionIds(
    supabase,
    seed.questions.filter((q) => present.has(q.resource_id)).map((q) => q.id),
  );
  const opts = await missingOptions(supabase, seed.options, qIds);
  const options = await insertAll(
    supabase,
    'question_options',
    opts.map((o) => ({
      id: o.id,
      question_id: o.question_id,
      position: o.position,
      body: o.body,
      is_correct: o.is_correct,
    })),
  );
  if (options.error) return fail(`Não consegui criar: ${options.error}`);

  revalidatePath('/admin/conteudo');
  const discursivas = qs.filter((q) => q.kind === 'discursiva').length;
  const avisos = [
    semMateria.size
      ? `Ficaram de fora matérias ausentes do catálogo: ${[...semMateria].join(', ')}.`
      : '',
    semBanca.size ? `Ficaram de fora provas ausentes no banco: ${[...semBanca].join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
  if (resources.added === 0) {
    return {
      status: avisos && questions.added === 0 ? 'error' : 'done',
      message:
        questions.added > 0
          ? `Completei ${questions.added} questões que faltavam (${discursivas} discursivas) em quizzes e simulados já criados.${avisos ? ` ${avisos}` : ''}`
          : avisos || 'A Grande criação 2 já estava completa. Nada foi duplicado.',
    };
  }
  return {
    status: 'done',
    message: `Criado como rascunho: ${resources.added} quizzes e simulados, ${questions.added} questões (${discursivas} discursivas). Revise e depois publique.${avisos ? ` ${avisos}` : ''}`,
  };
}

/** Publica de uma vez a Grande criação 2 que ainda é rascunho. */
export async function publishGrande2(formData?: FormData): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const escolha = identity.isGlobal ? formData?.get('schoolId') : undefined;
  const escola =
    typeof escolha === 'string' && escolha ? targetSchoolId(identity, formData) : undefined;
  if (typeof escolha === 'string' && escolha && !escola) return fail('Escola inválida.');
  let query = supabase.from('resources').update({ is_published: true }).contains('tags', [G2_TAG]);
  if (escola) query = query.eq('school_id', escola);
  const { data, error } = await query.eq('is_published', false).select('id');
  if (error) return fail(`Não consegui publicar: ${error.message}`);
  revalidatePath('/admin/conteudo');
  revalidatePath('/vestibular/provas');
  return {
    status: 'done',
    message: data?.length
      ? `${data.length} quizzes e simulados da Grande criação 2 publicados.`
      : 'Não há nada da Grande criação 2 em rascunho.',
  };
}
