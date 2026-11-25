import type { Dificuldade } from '../helpers';

export type Banca = 'enem' | 'fuvest' | 'unicamp' | 'unesp';

export interface QuestaoVest {
  d: Dificuldade;
  /** Texto-base e comando separados por uma linha em branco: o último parágrafo é o comando. */
  s: string;
  /** 4 (Unicamp) ou 5 alternativas. */
  o: string[];
  /** Índice da correta. */
  c: number;
  e: string;
}

export interface SimuladoVest {
  slug: string;
  banca: Banca;
  /** Matéria do catálogo em que o simulado aparece. */
  subject: string;
  title: string;
  subtitle: string;
  minutes: number;
  questoes: QuestaoVest[];
}

export const qv = (d: Dificuldade, s: string, o: string[], c: number, e: string): QuestaoVest => ({ d, s, o, c, e });

/** Marca dos simulados de vestibular carregados por aqui. */
export const VEST_TAG = 'pacote-vestibular-v1';

export const BANCA_LABEL: Record<Banca, string> = { enem: 'ENEM', fuvest: 'Fuvest', unicamp: 'Unicamp', unesp: 'Unesp' };
