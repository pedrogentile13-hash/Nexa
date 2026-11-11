import type { Dificuldade } from '../helpers';

/** Marca dos pacotes mistos (objetivas + discursivas): serve para achar e publicar tudo de uma vez. */
export const MISTO_TAG = 'pacote-misto-v1';

/** Questão objetiva: 4 alternativas, a certa pelo índice. */
export interface QuestaoObj {
  k: 'o';
  d: Dificuldade;
  s: string;
  o: [string, string, string, string];
  c: 0 | 1 | 2 | 3;
  e: string;
}

/** Questão discursiva: o aluno escreve e a IA corrige com a resposta esperada e os critérios abaixo. */
export interface QuestaoDisc {
  k: 'd';
  d: Dificuldade;
  s: string;
  /** Resposta esperada (referência do professor). Nunca aparece antes de a tentativa ser encerrada. */
  ref: string;
  /** Critérios de correção, um por linha. */
  crit: string;
  /** Comentário que aparece no gabarito (opcional). */
  e?: string;
}

export type QuestaoMista = QuestaoObj | QuestaoDisc;

export interface PacoteMisto {
  slug: string;
  /** Quiz = feedback na hora; simulado = cronômetro e correção no fim. */
  kind: 'quiz' | 'simulado';
  context: 'study' | 'vestibular';
  /** Só vestibular: a banca (aparece na Biblioteca do Vestibular). */
  banca?: 'fuvest' | 'unicamp' | 'unesp';
  /** Matéria do catálogo (slug). */
  subject: string;
  grade: string;
  title: string;
  subtitle: string;
  description: string;
  /** Tempo do simulado, em minutos (quiz não tem). */
  minutes?: number;
  questoes: QuestaoMista[];
}

/** Objetiva. */
export const mo = (
  d: Dificuldade,
  s: string,
  o: [string, string, string, string],
  c: 0 | 1 | 2 | 3,
  e: string,
): QuestaoObj => ({ k: 'o', d, s, o, c, e });
/** Discursiva: enunciado, resposta esperada, critérios (linhas) e comentário opcional. */
export const md = (
  d: Dificuldade,
  s: string,
  ref: string,
  crit: string[],
  e?: string,
): QuestaoDisc => ({
  k: 'd',
  d,
  s,
  ref,
  crit: crit.map((c) => `• ${c}`).join('\n'),
  ...(e ? { e } : {}),
});
