import type { SerieG2 } from '../grande2/types';

/**
 * "Grande criação 3": resumos (Nexa Study e Vestibular) e trilhas personalizadas que juntam resumos, quizzes e
 * simulados da Grande criação 2. Tudo entra como rascunho.
 */
export const G3_TAG = 'grande-criacao-3';

export interface ResumoG3 {
  /** Único em todo o pacote (vira o id fixo). */
  slug: string;
  subject: string;
  grade: SerieG2 | 'Pré-vestibular';
  /** school = Nexa Study; vestibular = Biblioteca do Vestibular (nunca entra na nota escolar). */
  context: 'school' | 'vestibular';
  title: string;
  subtitle: string;
  /** Markdown. */
  body: string;
}

export const resumo = (
  subject: string,
  grade: ResumoG3['grade'],
  slug: string,
  title: string,
  subtitle: string,
  body: string,
  context: ResumoG3['context'] = 'school',
): ResumoG3 => ({
  slug: `g3-${slug}`,
  subject,
  grade,
  context,
  title,
  subtitle,
  body: body.trim(),
});

export type CategoriaTrilha = 'enem' | 'fundamental' | 'reforco' | 'carreiras' | 'habilidades';

export interface LicaoG3 {
  titulo: string;
  descricao?: string;
  minutos: number;
  /** Slugs de resumos (g3-…) ou de quizzes e simulados da Grande criação 2 (g2-…). */
  itens: string[];
}

export interface SecaoG3 {
  titulo: string;
  licoes: LicaoG3[];
}

export interface TrilhaG3 {
  slug: string;
  /** Matéria principal (catálogo). */
  subject: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTrilha;
  series: string[];
  secoes: SecaoG3[];
}
