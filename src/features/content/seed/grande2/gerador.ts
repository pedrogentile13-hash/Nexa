import type { Dificuldade } from '../helpers';
import {
  minutosSugeridos,
  subjectLabel,
  type DiscG2,
  type ObjG2,
  type PacoteG2,
  type QuestaoG2,
  type SerieG2,
} from './types';

/**
 * Motor das questões CALCULADAS (Matemática, Física, Química, Educação Financeira, Pensamento Computacional).
 * Os números são sorteados com semente fixa (o resultado é sempre o mesmo) e a resposta certa é CALCULADA
 * pelo código, então o gabarito não tem erro de conta. As erradas são os enganos típicos de cada conta.
 */

export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
}

/** Sorteio determinístico a partir de um texto (mulberry32). */
export function rngFrom(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)]!,
  };
}

const round = (n: number, dec = 2) => Math.round(n * 10 ** dec) / 10 ** dec;

/** Número no formato brasileiro (vírgula decimal, ponto de milhar). */
export function fmt(n: number, dec = 2): string {
  const v = round(n, dec) || 0; // evita "−0"
  return v.toLocaleString('pt-BR', { maximumFractionDigits: dec });
}

/** Dinheiro: R$ 1.234,50. */
export const brl = (n: number) =>
  `R$ ${round(n, 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Monta as alternativas numéricas: a certa e as erradas a partir dos enganos típicos (`cands`),
 * completando com vizinhas se faltar. Nunca repete texto.
 */
export function numOpts(
  ans: number,
  cands: number[],
  wrongCount: number,
  show: (n: number) => string = (n) => fmt(n),
): { ok: string; wrong: string[] } {
  const ok = show(ans);
  const seen = new Set([ok]);
  const wrong: string[] = [];
  const step = Math.max(1, Math.round(Math.abs(ans) / 10));
  const pool = [
    ...cands,
    ans + step,
    ans - step,
    ans * 2,
    ans + 2 * step,
    ans / 2,
    ans + 3 * step,
    ans - 2 * step,
    ans * 10,
    ans + 4 * step,
  ];
  for (const c of pool) {
    if (wrong.length >= wrongCount) break;
    if (!Number.isFinite(c)) continue;
    const s = show(c);
    if (seen.has(s)) continue;
    seen.add(s);
    wrong.push(s);
  }
  return { ok, wrong };
}

/**
 * Limpa a escrita algébrica gerada: tira termos com coeficiente 0 ("+ 0x²"), coeficiente 1 ("1x" → "x")
 * e troca o hífen de número negativo pelo sinal de menos.
 */
export function limpa(t: string): string {
  return t
    .replace(/ [+−] 0x[²³]?(?![\d,])/g, '')
    .replace(/ [+−] 0(?=[\s=)?.,;]|$)(?!,\d)/g, '')
    .replace(/(^|[\s(=·])1x/g, '$1x')
    .replace(/(^|[\s(=[,/])-(?=\d)/g, '$1−')
    .replace(/(^|[\s(=·])−1x/g, '$1−x');
}

/** Objetiva numérica. */
export function numQ(
  d: Dificuldade,
  s: string,
  ans: number,
  cands: number[],
  e: string,
  wrongCount: number,
  show?: (n: number) => string,
): ObjG2 {
  const { ok, wrong } = numOpts(ans, cands, wrongCount, show);
  return { k: 'o', d, s: limpa(s), ok: limpa(ok), wrong: wrong.map(limpa), e: limpa(e) };
}

/** Objetiva com alternativas em texto (a certa e as erradas já prontas). */
export function textQ(
  d: Dificuldade,
  s: string,
  ok: string,
  wrong: string[],
  e: string,
  wrongCount: number,
): ObjG2 {
  const certa = limpa(ok);
  const erradas = [...new Set(wrong.map(limpa))].filter((w) => w !== certa).slice(0, wrongCount);
  return { k: 'o', d, s: limpa(s), ok: certa, wrong: erradas, e: limpa(e) };
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** Fração simplificada em texto ("6/36" → "1/6"; "4/4" → "1"). */
export function fracao(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  const [a, b] = [n / g, d / g];
  return b === 1 ? String(a) : `${a}/${b}`;
}

/**
 * Objetiva com frações: simplifica todas e descarta as erradas que valem o mesmo que a certa
 * (evita "6/36" certa e "1/6" errada, que são iguais).
 */
export function fracQ(
  d: Dificuldade,
  s: string,
  ok: [number, number],
  wrong: [number, number][],
  e: string,
  wrongCount: number,
): ObjG2 {
  const val = ([n, dd]: [number, number]) => n / dd;
  const alvo = val(ok);
  const vistos = new Set<number>([alvo]);
  const erradas: string[] = [];
  for (const w of wrong) {
    if (erradas.length >= wrongCount) break;
    if (w[1] <= 0 || w[0] < 0) continue;
    const v = Math.round(val(w) * 1e9) / 1e9;
    if ([...vistos].some((x) => Math.abs(x - v) < 1e-9)) continue;
    vistos.add(v);
    erradas.push(fracao(w[0], w[1]));
  }
  return { k: 'o', d, s: limpa(s), ok: fracao(ok[0], ok[1]), wrong: erradas, e: limpa(e) };
}

export function discQ(d: Dificuldade, s: string, ref: string, crit: string[], e?: string): DiscG2 {
  return {
    k: 'd',
    d,
    s: limpa(s),
    ref: limpa(ref),
    crit: crit.map((c) => `• ${c}`).join('\n'),
    ...(e ? { e } : {}),
  };
}

/** Gera uma objetiva. `w` = quantas erradas (3 para 4 alternativas, 4 para 5). */
export type GenObj = (r: Rng, w: number) => ObjG2;
export type GenDisc = (r: Rng) => DiscG2;

export interface TemaGen {
  id: string;
  tema: string;
  gens: GenObj[];
}

export interface SerieGen {
  subject: string;
  grade: SerieG2;
  temas: TemaGen[];
  disc: GenDisc[];
}

/** Sorteia `n` questões distintas (pelo enunciado) usando os geradores em rodízio. */
export function sortear(gens: GenObj[], r: Rng, n: number, w: number, start = 0): ObjG2[] {
  const out: ObjG2[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < n && i < n * 12; i++) {
    const g = gens[(start + i) % gens.length]!;
    const q = g(r, w);
    if (seen.has(q.s) || q.wrong.length < w) continue;
    seen.add(q.s);
    out.push(q);
  }
  return out;
}

const ordemDificuldade = { facil: 0, medio: 1, dificil: 2 } as const;
const porDificuldade = <T extends QuestaoG2>(qs: T[]) =>
  [...qs].sort((a, b) => ordemDificuldade[a.d] - ordemDificuldade[b.d]);

/**
 * Para cada tema da série: um quiz (5 questões do tema) e um simulado (4 do tema + 3 de revisão dos
 * outros temas da série + 1 discursiva com o cálculo explicado).
 */
export function pacotesDaSerie(sg: SerieGen): PacoteG2[] {
  const materia = subjectLabel(sg.subject);
  const gradeSlug = sg.grade
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
  return sg.temas.flatMap((t, j) => {
    const base = `g2-${sg.subject}-${gradeSlug}-${t.id}`;
    const quiz = porDificuldade(sortear(t.gens, rngFrom(`${base}/quiz`), 5, 3));
    const rs = rngFrom(`${base}/simulado`);
    const outros = sg.temas.filter((_, i) => i !== j).flatMap((x) => x.gens);
    // Série com um tema só: as 7 objetivas saem do próprio tema (sem repetir enunciado).
    const proprios = sortear(t.gens, rs, outros.length ? 4 : 7, 3, 2);
    const vistos = new Set(proprios.map((q) => q.s));
    const revisao = outros.length
      ? sortear(outros, rs, 3, 3, j).filter((q) => !vistos.has(q.s))
      : [];
    const objetivas = porDificuldade([...proprios, ...revisao]);
    const disc = sg.disc[j % sg.disc.length]!(rs);
    const simulado: QuestaoG2[] = [...objetivas, disc];
    return [
      {
        slug: `${base}-quiz`,
        kind: 'quiz',
        context: 'study',
        subject: sg.subject,
        grade: sg.grade,
        title: `Quiz · ${t.tema}`,
        subtitle: `${materia} · ${sg.grade} · ${quiz.length} questões`,
        description: `Quiz de ${materia} (${sg.grade}) sobre ${t.tema.toLowerCase()}: cada resposta mostra a resolução na hora.`,
        questoes: quiz,
      },
      {
        slug: `${base}-simulado`,
        kind: 'simulado',
        context: 'study',
        subject: sg.subject,
        grade: sg.grade,
        title: `Simulado · ${t.tema} e revisão`,
        subtitle: `${materia} · ${sg.grade} · ${simulado.length} questões (1 discursiva)`,
        description: `Simulado de ${materia} (${sg.grade}): ${t.tema.toLowerCase()} e revisão da série, com cronômetro. A discursiva pede o cálculo explicado e é corrigida pela IA (nota estimada, não oficial).`,
        minutes: minutosSugeridos(simulado),
        questoes: simulado,
      },
    ];
  });
}
