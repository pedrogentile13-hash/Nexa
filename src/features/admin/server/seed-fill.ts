import type { createClient } from '@/lib/supabase/server';

/**
 * Completa questões e alternativas que faltam nos pacotes carregados pelo Admin.
 *
 * Por que existe: carregar um pacote grande faz dezenas de idas ao banco. Se a requisição cai no meio (o servidor
 * corta pedidos longos), os quizzes já estão salvos mas parte das questões não. Antes, clicar de novo pulava esses
 * quizzes ("já existe") e eles ficavam para sempre com "falta cadastrar questões". Agora cada carga completa o que
 * falta, sem duplicar nada e sem mexer no que o admin já editou (posição ocupada é respeitada).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;

interface SeedQuestion {
  id: string;
  resource_id: string;
  position: number;
}
interface SeedOption {
  id: string;
  question_id: string;
  position: number;
  is_correct: boolean;
}

const chunks = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Quais destes ids de recurso existem no banco. */
export async function presentResourceIds(supabase: Supabase, ids: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (const part of chunks([...new Set(ids)], 150)) {
    const { data } = await supabase.from('resources').select('id').in('id', part);
    for (const r of data ?? []) found.add(r.id);
  }
  return found;
}

/** Questões do pacote que faltam no banco, para recursos que existem. Respeita posições já ocupadas. */
export async function missingQuestions<Q extends SeedQuestion>(
  supabase: Supabase,
  seedQuestions: Q[],
  presentResources: Set<string>,
): Promise<Q[]> {
  const wanted = seedQuestions.filter((q) => presentResources.has(q.resource_id));
  const ids = new Set<string>();
  const taken = new Set<string>();
  // Lotes pequenos de recursos: cada lote devolve no máximo algumas centenas de linhas (limite de 1.000 do PostgREST).
  for (const part of chunks([...new Set(wanted.map((q) => q.resource_id))], 40)) {
    const { data } = await supabase
      .from('questions')
      .select('id, resource_id, position')
      .in('resource_id', part);
    for (const q of data ?? []) {
      ids.add(q.id);
      taken.add(`${q.resource_id}/${q.position}`);
    }
  }
  return wanted.filter((q) => !ids.has(q.id) && !taken.has(`${q.resource_id}/${q.position}`));
}

/** Alternativas do pacote que faltam, para questões que existem no banco. Respeita posição e a única certa. */
export async function missingOptions<O extends SeedOption>(
  supabase: Supabase,
  seedOptions: O[],
  questionIdsInDb: Set<string>,
): Promise<O[]> {
  const wanted = seedOptions.filter((o) => questionIdsInDb.has(o.question_id));
  const ids = new Set<string>();
  const taken = new Set<string>();
  const hasCorrect = new Set<string>();
  for (const part of chunks([...new Set(wanted.map((o) => o.question_id))], 150)) {
    const { data } = await supabase
      .from('question_options')
      .select('id, question_id, position, is_correct')
      .in('question_id', part);
    for (const o of data ?? []) {
      ids.add(o.id);
      taken.add(`${o.question_id}/${o.position}`);
      if (o.is_correct) hasCorrect.add(o.question_id);
    }
  }
  return wanted.filter(
    (o) =>
      !ids.has(o.id) &&
      !taken.has(`${o.question_id}/${o.position}`) &&
      !(o.is_correct && hasCorrect.has(o.question_id)),
  );
}

/** Quais destas questões (ids do pacote) existem no banco. */
export async function presentQuestionIds(supabase: Supabase, ids: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (const part of chunks([...new Set(ids)], 150)) {
    const { data } = await supabase.from('questions').select('id').in('id', part);
    for (const q of data ?? []) found.add(q.id);
  }
  return found;
}
