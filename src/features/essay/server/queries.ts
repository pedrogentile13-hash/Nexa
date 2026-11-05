import { createClient } from '@/lib/supabase/server';
import type { EssayFeedback } from '../lib/essay';

export interface EssayHistoryItem {
  id: string;
  theme: string;
  total: number;
  scores: number[];
  createdAt: string;
  feedback: EssayFeedback | null;
}

/** Antes do SQL rodar a tabela não existe: devolve vazio em vez de quebrar a tela. */
export async function listEssays(limit = 20): Promise<EssayHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('essay_corrections')
    .select('id, theme, c1, c2, c3, c4, c5, total, feedback, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    theme: e.theme,
    total: e.total,
    scores: [e.c1, e.c2, e.c3, e.c4, e.c5],
    createdAt: e.created_at,
    feedback: (e.feedback && typeof e.feedback === 'object' && 'competencies' in (e.feedback as object)
      ? (e.feedback as EssayFeedback)
      : null),
  }));
}
