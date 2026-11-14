import type { Dificuldade } from '../helpers';

/**
 * "Grande criação 2": pacote grande de quizzes e simulados do Nexa Study (todas as séries, várias matérias)
 * e simulados de vestibular (ENEM, Fuvest, Unicamp, Unesp, ITA e IME). Carregado pelo botão do Admin → Conteúdo.
 */
export const G2_TAG = 'grande-criacao-2';

export type BancaG2 = 'enem' | 'fuvest' | 'unicamp' | 'unesp' | 'ita' | 'ime';

export const SERIES_G2 = [
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
] as const;
export type SerieG2 = (typeof SERIES_G2)[number];

/**
 * Objetiva: a CERTA vem primeiro (`ok`), as erradas depois. O montador põe a certa numa posição que roda
 * de questão em questão, sempre igual a cada carregamento (nunca fica sempre na letra A).
 */
export interface ObjG2 {
  k: 'o';
  d: Dificuldade;
  s: string;
  ok: string;
  wrong: string[];
  e: string;
}

/** Discursiva: o aluno escreve e a IA corrige com a resposta esperada e os critérios. */
export interface DiscG2 {
  k: 'd';
  d: Dificuldade;
  s: string;
  ref: string;
  /** Critérios, um por linha (começam com "• "). */
  crit: string;
  e?: string;
}

export type QuestaoG2 = ObjG2 | DiscG2;

export interface PacoteG2 {
  slug: string;
  kind: 'quiz' | 'simulado';
  context: 'study' | 'vestibular';
  banca?: BancaG2;
  subject: string;
  grade: SerieG2;
  title: string;
  subtitle: string;
  description: string;
  /** Só simulado. */
  minutes?: number;
  questoes: QuestaoG2[];
}

/** Objetiva: dificuldade, enunciado, a certa, as erradas (3 para 4 alternativas, 4 para 5), explicação. */
export const o = (d: Dificuldade, s: string, ok: string, wrong: string[], e: string): ObjG2 => ({
  k: 'o',
  d,
  s,
  ok,
  wrong,
  e,
});

/** Discursiva: dificuldade, enunciado, resposta esperada, critérios, comentário opcional. */
export const dq = (d: Dificuldade, s: string, ref: string, crit: string[], e?: string): DiscG2 => ({
  k: 'd',
  d,
  s,
  ref,
  crit: crit.map((c) => `• ${c}`).join('\n'),
  ...(e ? { e } : {}),
});

/** Tempo sugerido: 3 min por objetiva, 8 por discursiva (arredondado para cima de 5 em 5). */
export function minutosSugeridos(questoes: QuestaoG2[]): number {
  const raw = questoes.reduce((t, q) => t + (q.k === 'o' ? 3 : 8), 0);
  return Math.max(10, Math.ceil(raw / 5) * 5);
}

/** Bloco temático escrito à mão: um quiz e um simulado da mesma matéria e série. */
export interface BlocoG2 {
  subject: string;
  grade: SerieG2;
  /** Tema (aparece no título). */
  tema: string;
  /** Sufixo do slug (único dentro da matéria). */
  id: string;
  quiz: QuestaoG2[];
  simulado: QuestaoG2[];
}

const SUBJECT_LABEL: Record<string, string> = {
  matematica: 'Matemática',
  'lingua-portuguesa': 'Português',
  literatura: 'Literatura',
  ingles: 'Inglês',
  espanhol: 'Espanhol',
  artes: 'Artes',
  ciencias: 'Ciências',
  biologia: 'Biologia',
  fisica: 'Física',
  quimica: 'Química',
  historia: 'História',
  geografia: 'Geografia',
  filosofia: 'Filosofia',
  sociologia: 'Sociologia',
  'educacao-financeira': 'Educação Financeira',
  'pensamento-computacional': 'Pensamento Computacional',
};
export const subjectLabel = (slug: string) => SUBJECT_LABEL[slug] ?? slug;

const contagem = (qs: QuestaoG2[]) => {
  const disc = qs.filter((q) => q.k === 'd').length;
  return disc > 0
    ? `${qs.length} questões (${disc} discursiva${disc > 1 ? 's' : ''})`
    : `${qs.length} questões`;
};

/** Transforma um bloco em dois pacotes: quiz (feedback na hora) e simulado (cronômetro e correção no fim). */
export function blocoParaPacotes(b: BlocoG2): PacoteG2[] {
  const materia = subjectLabel(b.subject);
  return [
    {
      slug: `g2-${b.subject}-${b.id}-quiz`,
      kind: 'quiz',
      context: 'study',
      subject: b.subject,
      grade: b.grade,
      title: `Quiz · ${b.tema}`,
      subtitle: `${materia} · ${b.grade} · ${contagem(b.quiz)}`,
      description: `Quiz rápido de ${materia} (${b.grade}) sobre ${b.tema.toLowerCase()}: cada resposta mostra a explicação na hora.`,
      questoes: b.quiz,
    },
    {
      slug: `g2-${b.subject}-${b.id}-simulado`,
      kind: 'simulado',
      context: 'study',
      subject: b.subject,
      grade: b.grade,
      title: `Simulado · ${b.tema}`,
      subtitle: `${materia} · ${b.grade} · ${contagem(b.simulado)}`,
      description: `Simulado de ${materia} (${b.grade}) sobre ${b.tema.toLowerCase()}, com cronômetro. A correção sai no fim${
        b.simulado.some((q) => q.k === 'd')
          ? '; as discursivas são corrigidas pela IA (nota estimada, não oficial)'
          : ''
      }.`,
      minutes: minutosSugeridos(b.simulado),
      questoes: b.simulado,
    },
  ];
}
