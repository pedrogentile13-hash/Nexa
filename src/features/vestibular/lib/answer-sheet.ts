/**
 * Cartão-resposta digital: leitura de gabaritos e de respostas (texto ou IA), em funções puras para testar.
 */

export const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
export type Letter = (typeof LETTERS)[number];

export interface KeyEntry {
  number: number;
  /** `null` quando a questão foi anulada. */
  correct: Letter | null;
  annulled: boolean;
  area?: string | null;
}

const isLetter = (v: string): v is Letter => (LETTERS as readonly string[]).includes(v);

/**
 * Lê um gabarito colado como texto. Aceita "1-A 2-C", "1 A", "01) B", "1: C", uma por linha ou várias na mesma linha.
 * `X`, `*` ou "anulada" marcam questão anulada. O ENEM às vezes traz as cinco colunas "Q | LT | ..." — o número vem antes da letra.
 */
export function parseAnswerKeyText(text: string): { entries: KeyEntry[]; ignored: number } {
  const found = new Map<number, KeyEntry>();
  const re = /(?<![\d])(\d{1,3})\s*(?:[-–—:.)=]|\s)\s*(anulad[ao]|[A-Ea-eXx*])(?![A-Za-z])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const number = Number(match[1]);
    if (number < 1 || number > 400) continue;
    const raw = match[2]!;
    const upper = raw.toUpperCase();
    const annulled = upper.startsWith('ANULAD') || upper === 'X' || upper === '*';
    if (annulled) found.set(number, { number, correct: null, annulled: true });
    else if (isLetter(upper)) found.set(number, { number, correct: upper, annulled: false });
  }
  const entries = [...found.values()].sort((a, b) => a.number - b.number);
  return { entries, ignored: 0 };
}

/** Confere se a lista cobre 1..N sem buracos. Devolve os números que faltam. */
export function missingNumbers(entries: readonly KeyEntry[]): number[] {
  if (entries.length === 0) return [];
  const have = new Set(entries.map((e) => e.number));
  const max = Math.max(...have);
  const missing: number[] = [];
  for (let n = 1; n <= max; n++) if (!have.has(n)) missing.push(n);
  return missing;
}

/** Atribui a área de cada questão a partir de faixas: `[{ from: 1, to: 45, area: 'Linguagens' }, ...]`. */
export function applyAreas(entries: KeyEntry[], ranges: { from: number; to: number; area: string }[]): KeyEntry[] {
  return entries.map((e) => ({ ...e, area: ranges.find((r) => e.number >= r.from && e.number <= r.to)?.area ?? e.area ?? null }));
}

/** Respostas do aluno por número: letra ou `null` (em branco). */
export type AnswerMap = Record<number, Letter | null>;

/**
 * Lê a resposta da IA ao olhar a foto do cartão. Tolera cerca de código e formatos variados:
 * `{"respostas":[{"numero":1,"resposta":"A"}]}`, `{"1":"A"}` ou uma lista. Letra inválida vira em branco.
 */
export function parseAiAnswers(raw: string, max = 400): { answers: AnswerMap; doubtful: number[] } | null {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[{[]/);
  if (start < 0) return null;
  let data: unknown;
  try {
    data = JSON.parse(cleaned.slice(start, Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']')) + 1));
  } catch {
    return null;
  }

  const answers: AnswerMap = {};
  const doubtful: number[] = [];
  const put = (n: unknown, letter: unknown, doubt: unknown) => {
    const number = Number(n);
    if (!Number.isInteger(number) || number < 1 || number > max) return;
    const l = typeof letter === 'string' ? letter.trim().toUpperCase() : '';
    answers[number] = isLetter(l) ? l : null;
    if (doubt === true) doubtful.push(number);
  };

  const list =
    Array.isArray(data) ? data
    : data && typeof data === 'object' && Array.isArray((data as { respostas?: unknown }).respostas) ? (data as { respostas: unknown[] }).respostas
    : null;
  if (list) {
    for (const item of list) {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        put(o.numero ?? o.questao ?? o.n, o.resposta ?? o.letra ?? o.r, o.duvida ?? o.incerto);
      }
    }
  } else if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) put(k, v, false);
  }
  return Object.keys(answers).length ? { answers, doubtful: [...new Set(doubtful)].sort((a, b) => a - b) } : null;
}

/** Agrupa questões consecutivas da mesma área (para desenhar o cartão em blocos). */
export function groupByArea<T extends { number: number; area: string }>(layout: readonly T[]): { area: string; items: T[] }[] {
  const groups: { area: string; items: T[] }[] = [];
  for (const q of layout) {
    const last = groups[groups.length - 1];
    if (last && last.area === q.area) last.items.push(q);
    else groups.push({ area: q.area, items: [q] });
  }
  return groups;
}

/** Só as respostas marcadas, no formato que vai para o banco: `{ "1": "A", ... }`. */
export function answersToPayload(map: AnswerMap): Record<string, Letter> {
  const out: Record<string, Letter> = {};
  for (const [n, l] of Object.entries(map)) if (l) out[n] = l;
  return out;
}

export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Instrução enviada à IA junto com a foto do cartão-resposta. */
export function answerSheetPrompt(total: number): string {
  return [
    `Esta imagem é a foto de um cartão-resposta de prova com ${total} questões (alternativas A a E).`,
    'Leia APENAS o que está marcado (bolinha preenchida ou letra circulada). Não invente respostas.',
    'Responda somente com JSON, sem texto fora dele, neste formato:',
    '{"respostas":[{"numero":1,"resposta":"A"},{"numero":2,"resposta":null,"duvida":true}]}',
    'Use "resposta": null para questão em branco ou com mais de uma marcação. Use "duvida": true quando não tiver certeza da leitura.',
    'Inclua todas as questões que conseguir ver, em ordem.',
  ].join('\n');
}

/** Instrução para a IA ler um gabarito oficial em PDF ou imagem. */
export const ANSWER_KEY_PROMPT = [
  'Esta é a página de um gabarito oficial de prova. Extraia o número da questão e a alternativa correta (A a E).',
  'Se uma questão estiver ANULADA, use "anulada".',
  'Responda somente com linhas no formato "número-letra", por exemplo: 1-A 2-C 3-anulada. Sem comentários.',
].join('\n');

/** "1-45 Linguagens, 46-90 Ciências Humanas" → faixas. Linhas ou vírgulas separam as faixas. */
export function parseAreaRanges(text: string): { from: number; to: number; area: string }[] {
  const out: { from: number; to: number; area: string }[] = [];
  for (const part of text.split(/[\n;,]+/)) {
    const m = part.trim().match(/^(\d{1,3})\s*(?:-|–|a|até)\s*(\d{1,3})\s+(.{1,60})$/i);
    if (!m) continue;
    const from = Number(m[1]);
    const to = Number(m[2]);
    if (from >= 1 && to >= from && to <= 400) out.push({ from, to, area: m[3]!.trim() });
  }
  return out;
}

/** Faixas usadas como sugestão nas provas mais comuns. */
export const AREA_PRESETS: { label: string; text: string }[] = [
  { label: 'ENEM — 1º dia', text: '1-45 Linguagens, 46-90 Ciências Humanas' },
  { label: 'ENEM — 2º dia', text: '91-135 Ciências da Natureza, 136-180 Matemática' },
  { label: 'ENEM — completo', text: '1-45 Linguagens, 46-90 Ciências Humanas, 91-135 Ciências da Natureza, 136-180 Matemática' },
];
