export type Dificuldade = 'facil' | 'medio' | 'dificil';

export interface QuestaoSeed {
  d: Dificuldade;
  s: string;
  /** Quatro alternativas, texto simples. */
  o: [string, string, string, string];
  /** Índice (0 a 3) da alternativa correta. */
  c: 0 | 1 | 2 | 3;
  e: string;
}

export interface PacoteSeed {
  /** Slug do tópico em `topicos.ts`. */
  topic: string;
  grade: string;
  title: string;
  subtitle: string;
  resumo: string;
  questoes: QuestaoSeed[];
}

/** Questão: dificuldade, enunciado, 4 alternativas (texto simples), índice da certa (0 a 3), explicação. */
export const q = (d: Dificuldade, s: string, o: [string, string, string, string], c: 0 | 1 | 2 | 3, e: string): QuestaoSeed => ({ d, s, o, c, e });
