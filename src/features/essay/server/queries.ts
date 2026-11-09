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

export interface EssayThemeItem {
  id: string;
  title: string;
  kind: 'real' | 'inspirado';
  year: number | null;
  examName: string | null;
  context: string | null;
  axis: string | null;
}

/**
 * Temas publicados. Os reais só aparecem depois de conferidos (a política do
 * banco esconde os demais). Antes do SQL rodar a tabela não existe: devolve
 * vazio e a tela cai no "tema livre".
 */
export async function listEssayThemes(): Promise<EssayThemeItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('essay_themes')
    .select('id, title, kind, year, context_text, axis, exams(name)')
    .order('year', { ascending: false, nullsFirst: false })
    .order('sort_order');
  if (error || !data) return [];

  return data.map((t) => ({
    id: t.id,
    title: t.title,
    kind: t.kind === 'real' ? 'real' : 'inspirado',
    year: t.year,
    examName: (t.exams as unknown as { name: string } | null)?.name ?? null,
    context: t.context_text,
    axis: t.axis,
  }));
}
