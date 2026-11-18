import { enzoEssays, enzoEssayThemes, enzoEssay } from '@/lib/demo/enzo-vestibular-screens';
import { isDemoSession } from '@/lib/demo/server';
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
  if (await isDemoSession()) return enzoEssays().slice(0, limit);
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
  /** Gênero pedido (UNICAMP): "carta-denúncia", "manifesto"... */
  genre: string | null;
  /** Observação da edição (ex.: "havia opção de gênero"). */
  note: string | null;
  proposalNo: number | null;
  /** 'enem' = régua do ENEM; 'outras' = modelo adaptado para as demais bancas. */
  model: 'enem' | 'outras';
}

/**
 * Temas publicados. Os reais só aparecem depois de conferidos (a política do
 * banco esconde os demais). Antes do SQL rodar a tabela não existe: devolve
 * vazio e a tela cai no "tema livre".
 */
export async function listEssayThemes(): Promise<EssayThemeItem[]> {
  if (await isDemoSession()) return enzoEssayThemes();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('essay_themes')
    .select('id, title, kind, year, context_text, axis, genre, edition_note, proposal_no, correction_model, exams(name)')
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
    genre: t.genre,
    note: t.edition_note,
    proposalNo: t.proposal_no,
    model: t.correction_model === 'outras' ? 'outras' : 'enem',
  }));
}

export interface EssayDetail extends EssayHistoryItem {
  essay: string;
  themeId: string | null;
}

/** Uma correção inteira (texto + laudo) para a página do laudo. A política do banco só devolve as do próprio aluno. */
export async function getEssay(id: string): Promise<EssayDetail | null> {
  if (await isDemoSession()) return enzoEssay(id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('essay_corrections')
    .select('id, theme, theme_id, essay, c1, c2, c3, c4, c5, total, feedback, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    theme: data.theme,
    themeId: data.theme_id,
    essay: data.essay,
    total: data.total,
    scores: [data.c1, data.c2, data.c3, data.c4, data.c5],
    createdAt: data.created_at,
    feedback:
      data.feedback && typeof data.feedback === 'object' && 'competencies' in (data.feedback as object)
        ? (data.feedback as EssayFeedback)
        : null,
  };
}
