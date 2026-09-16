import { createClient } from '@/lib/supabase/server';
import type { Difficulty } from '@/types/database.types';

/**
 * Leituras da seção Simulados.
 *
 * Consolida o que antes ficava espalhado entre a Biblioteca (formato
 * "simulado" misturado com o resto do acervo) e o cartão de histórico em
 * Desempenho: aqui é o único lugar que junta "o que dá pra fazer" com "o que
 * já foi feito".
 */

export interface SimuladoCatalogItem {
  id: string;
  title: string;
  subtitle: string | null;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  questionCount: number;
  difficulty: Difficulty;
  durationSeconds: number | null;
  xpReward: number;
}

/** Todos os simulados publicados e visíveis para o aluno — RLS de `v_resource_library` já resolve escola/global. */
export async function getSimuladoCatalog(): Promise<SimuladoCatalogItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('v_resource_library')
    .select('*')
    .eq('kind', 'simulado')
    .order('sort_order')
    .order('published_at', { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    subjectId: r.subject_catalog_id,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    topicName: r.topic_name,
    questionCount: Number(r.question_count ?? 0),
    difficulty: r.difficulty,
    durationSeconds: r.duration_seconds,
    xpReward: r.xp_reward,
  }));
}
