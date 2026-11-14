import { z } from 'zod';

/**
 * Classificação de caderno/gabarito a partir da CAPA do PDF — a parte pura.
 *
 * A IA lê o texto da primeira página (ou a imagem, se o PDF for escaneado) e diz: qual vestibular, qual ano, se é caderno
 * de questões ou gabarito, qual dia/fase e qual a cor do caderno. Aqui a resposta é validada e transformada no nome
 * que aparece para o aluno ("1º dia · Caderno 2 · Amarelo"). O administrador sempre confere antes de cadastrar.
 */

export const EXAM_SLUGS = ['enem', 'fuvest', 'unicamp', 'unesp', 'ita', 'ime'] as const;
export type ExamSlug = (typeof EXAM_SLUGS)[number];

export const EXAM_NAMES: Record<ExamSlug, string> = { enem: 'ENEM', fuvest: 'FUVEST', unicamp: 'UNICAMP', unesp: 'UNESP', ita: 'ITA', ime: 'IME' };

export interface Classification {
  exam: ExamSlug | null;
  year: number | null;
  kind: 'caderno' | 'gabarito';
  /** "1º dia", "2ª fase"… */
  stage: string | null;
  /** Número do caderno, quando houver (ENEM: 1 a 8). */
  notebook: string | null;
  /** Cor do caderno (Azul, Amarelo, Branco, Rosa…). */
  color: string | null;
  /** Nome pronto para mostrar. */
  label: string;
  confidence: 'alta' | 'media' | 'baixa';
}

export const CLASSIFY_PROMPT = `Você recebe a CAPA (primeira página) de um PDF de prova de vestibular brasileiro. Diga o que é.
Responda SOMENTE com JSON, sem texto antes ou depois:
{
  "vestibular": "enem" | "fuvest" | "unicamp" | "unesp" | "ita" | "ime" | null,
  "ano": 2025,
  "tipo": "caderno" | "gabarito",
  "etapa": "1º dia" | "2º dia" | "1ª fase" | "2ª fase" | "Prova I" | null,
  "caderno": "2" | null,
  "cor": "Amarelo" | null,
  "confianca": "alta" | "media" | "baixa"
}
Regras: "gabarito" só se o documento for a folha de respostas oficial (lista de números e letras); caderno de questões é "caderno".
O ano é o da APLICAÇÃO da prova. Se não souber um campo, use null. Não invente: na dúvida, confianca "baixa".`;

const COLORS = ['azul', 'amarelo', 'branco', 'rosa', 'verde', 'cinza', 'laranja', 'vermelho', 'preto', 'roxo'];

const schema = z.object({
  vestibular: z.string().nullable().optional(),
  ano: z.coerce.number().int().nullable().optional(),
  tipo: z.string().optional(),
  etapa: z.string().nullable().optional(),
  caderno: z.union([z.string(), z.number()]).nullable().optional(),
  cor: z.string().nullable().optional(),
  confianca: z.string().optional(),
});

function stripFence(text: string): string {
  const t = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return (m?.[1] ?? t).trim();
}

function title(s: string): string {
  const t = s.trim().toLowerCase();
  return t ? t[0]!.toUpperCase() + t.slice(1) : t;
}

/** "1º dia · Caderno 2 · Amarelo" — só entram as partes que a IA encontrou. */
export function buildLabel(p: { stage?: string | null; notebook?: string | null; color?: string | null; kind: 'caderno' | 'gabarito' }): string {
  const parts = [p.stage?.trim(), p.notebook ? `Caderno ${String(p.notebook).trim()}` : null, p.color ? title(p.color) : null].filter(Boolean) as string[];
  if (parts.length === 0) return p.kind === 'gabarito' ? 'Gabarito' : 'Caderno de questões';
  return parts.join(' · ');
}

/** Lê a resposta da IA. `null` se não for um JSON utilizável. */
export function parseClassification(raw: string): Classification | null {
  let json: unknown;
  try {
    json = JSON.parse(stripFence(raw));
  } catch {
    return null;
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return null;
  const d = parsed.data;

  const slug = (d.vestibular ?? '').toLowerCase().trim();
  const exam = (EXAM_SLUGS as readonly string[]).includes(slug) ? (slug as ExamSlug) : null;
  const year = d.ano && d.ano >= 2000 && d.ano <= 2100 ? d.ano : null;
  const kind: 'caderno' | 'gabarito' = d.tipo?.toLowerCase().startsWith('gab') ? 'gabarito' : 'caderno';
  const colorRaw = (d.cor ?? '').trim().toLowerCase();
  const color = colorRaw && COLORS.some((c) => colorRaw.includes(c)) ? colorRaw : null;
  const notebook = d.caderno != null && String(d.caderno).trim() ? String(d.caderno).trim().slice(0, 10) : null;
  const stage = d.etapa?.trim() ? d.etapa.trim().slice(0, 30) : null;
  const confidence = d.confianca === 'alta' || d.confianca === 'media' ? d.confianca : 'baixa';

  return { exam, year, kind, stage, notebook, color, label: buildLabel({ stage, notebook, color, kind }), confidence };
}

/** Pistas do nome do arquivo quando a capa não ajuda (ex.: 2025_PV_impresso_D1_CD2.pdf). */
export function hintsFromFilename(name: string): Partial<Pick<Classification, 'exam' | 'year' | 'kind' | 'stage' | 'notebook'>> {
  const base = name.toLowerCase();
  const out: Partial<Pick<Classification, 'exam' | 'year' | 'kind' | 'stage' | 'notebook'>> = {};
  const year = /(?:^|[^0-9])(20\d{2})(?:[^0-9]|$)/.exec(base);
  if (year) out.year = Number(year[1]);
  for (const slug of EXAM_SLUGS) if (base.includes(slug)) out.exam = slug;
  if (/(^|[^a-z])(gb|gabarito)([^a-z]|$)/.test(base)) out.kind = 'gabarito';
  else if (/(^|[^a-z])(pv|prova|caderno)([^a-z]|$)/.test(base)) out.kind = 'caderno';
  const day = /(?:^|[^a-z])d([12])(?:[^0-9]|$)/.exec(base);
  if (day) out.stage = `${day[1]}º dia`;
  const cd = /(?:^|[^a-z])cd(\d{1,2})(?:[^0-9]|$)/.exec(base);
  if (cd) out.notebook = cd[1]!;
  return out;
}

/** Junta a capa e o nome do arquivo: a capa manda; o nome só preenche o que faltou. */
export function mergeClassification(fromCover: Classification | null, fileName: string): Classification {
  const hints = hintsFromFilename(fileName);
  const base: Classification = fromCover ?? { exam: null, year: null, kind: 'caderno', stage: null, notebook: null, color: null, label: '', confidence: 'baixa' };
  const exam = base.exam ?? hints.exam ?? null;
  const year = base.year ?? hints.year ?? null;
  const kind = fromCover ? base.kind : (hints.kind ?? base.kind);
  const stage = base.stage ?? hints.stage ?? null;
  const notebook = base.notebook ?? hints.notebook ?? null;
  return { exam, year, kind, stage, notebook, color: base.color, label: buildLabel({ stage, notebook, color: base.color, kind }), confidence: fromCover ? base.confidence : 'baixa' };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Padrão que liga CADERNO ↔ GABARITO: o par é dia/fase + cor ("1º dia · Amarelo"). O número do caderno ajuda a
 * achar o arquivo, mas a cor é o que o aluno vê na capa do caderno dele, então é a cor que manda.
 * ------------------------------------------------------------------------------------------------------------- */

/** "1° dia", "Dia 1", "primeiro dia", "2ª fase", "Fase 2" → "1º dia" / "2ª fase". Outros textos ficam como vieram. */
export function normalizeStage(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const num = /(\d)/.exec(lower)?.[1] ?? (/primeir/.test(lower) ? '1' : /segund/.test(lower) ? '2' : null);
  if (num && /dia/.test(lower)) return `${num}º dia`;
  if (num && /fase/.test(lower)) return `${num}ª fase`;
  return s;
}

export function variantFromParts(stage: string | null | undefined, color: string | null | undefined): string {
  const st = normalizeStage(stage);
  const c = (color ?? '').trim();
  return [st, c ? title(c) : null].filter(Boolean).join(' · ');
}

/** Tira dia/fase e cor de um nome como "1º dia · Caderno 2 · Amarelo". Sem cor nem etapa, devolve vazio. */
function partsOf(label: string): { stage: string | null; color: string | null } {
  const parts = label.split(/[·|]/).map((p) => p.trim()).filter(Boolean);
  const stage = parts.find((p) => /\b(dia|fase)\b/i.test(p)) ?? null;
  const colorPart = parts.find((p) => COLORS.some((c) => p.toLowerCase() === c || p.toLowerCase().endsWith(` ${c}`)));
  const color = colorPart ? (COLORS.find((c) => colorPart.toLowerCase().includes(c)) ?? null) : null;
  return { stage, color };
}

export function variantFromLabel(label: string): string {
  const { stage, color } = partsOf(label);
  return variantFromParts(stage, color);
}

/**
 * Chave de pareamento caderno ↔ gabarito: dia+cor quando o nome traz a cor; sem cor, o próprio nome
 * (assim "Caderno 1" e "Caderno 2" do mesmo dia não se misturam).
 */
export function pairingKey(label: string): string {
  const { stage, color } = partsOf(label);
  return (color ? variantFromParts(stage, color) : label).toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Áreas do ENEM para os números presentes (1-45 Linguagens, 46-90 Humanas, 91-135 Natureza, 136-180 Matemática). */
export function enemAreasFor(numbers: readonly number[]): string {
  const bands: [number, number, string][] = [
    [1, 45, 'Linguagens'],
    [46, 90, 'Ciências Humanas'],
    [91, 135, 'Ciências da Natureza'],
    [136, 180, 'Matemática'],
  ];
  const have = new Set(numbers);
  return bands.filter(([a, b]) => numbers.some((n) => n >= a && n <= b) || (have.size === 0 && a === 1 && b === 45)).map(([a, b, name]) => `${a}-${b} ${name}`).join(', ');
}
