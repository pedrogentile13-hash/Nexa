import { z } from 'zod';

/**
 * Corretor de redação (modelo ENEM) — a parte pura.
 *
 * O ENEM dá 0 a 200 em cada uma de 5 competências, em degraus de 40
 * (0, 40, 80, 120, 160, 200), somando até 1000. A IA estima isso; este módulo
 * garante que o que chega ao aluno respeita a régua mesmo se o modelo errar o
 * formato: nota fora do degrau é arredondada, fora de 0-200 é cortada, resposta
 * quebrada vira erro (nunca uma nota inventada).
 *
 * É uma ESTIMATIVA. A tela diz isso — nota oficial é de corretores humanos.
 */

export const COMPETENCIES = [
  { id: 1, name: 'Domínio da norma culta', hint: 'ortografia, gramática, concordância, pontuação' },
  { id: 2, name: 'Compreensão do tema', hint: 'fuga ao tema, repertório sociocultural, tipo textual' },
  { id: 3, name: 'Argumentação', hint: 'seleção e organização de argumentos e projeto de texto' },
  { id: 4, name: 'Coesão', hint: 'conectivos e articulação entre frases e parágrafos' },
  { id: 5, name: 'Proposta de intervenção', hint: 'agente, ação, meio, finalidade e detalhamento' },
] as const;

export const MIN_WORDS = 50;
export const MAX_WORDS = 600;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Régua por competência, resumida dos critérios públicos do INEP (a nota real é de corretores humanos). */
const RUBRIC = `Critérios (resumo dos critérios públicos do INEP):
C1 Norma culta — 200: no máximo 2 desvios e sem erros reincidentes; 160: poucos desvios; 120: alguns desvios; 80: muitos desvios; 40: precário; 0: desconhecimento.
C2 Tema e tipo textual — 200: tema bem desenvolvido, repertório sociocultural LEGITIMADO, PERTINENTE e PRODUTIVO (livro, filme, fato histórico, dado com fonte, filósofo...), texto dissertativo-argumentativo completo; 160: repertório legitimado e pertinente, bom domínio; 120: repertório só dos textos motivadores ou não pertinente; 80: cópia dos motivadores ou domínio insuficiente do tipo textual; 40: tangencia o tema; 0: foge ao tema.
C3 Argumentação — 200: projeto de texto estratégico, ideias consistentes, defesa clara de um ponto de vista, indício de autoria; 160: boa organização, com poucas falhas; 120: ideias previsíveis ou presas aos motivadores; 80: ideias desorganizadas ou contraditórias; 40: pouco relacionadas ao tema; 0: desconexas.
C4 Coesão — 200: articula bem as partes, repertório variado de conectivos, sem inadequações; 160: poucas inadequações; 120: algumas, repertório pouco variado; 80: inadequações frequentes ou repetição; 40: precária; 0: ausente.
C5 Proposta de intervenção — conte os 5 elementos: agente (quem), ação (o quê), meio/modo (como), finalidade (para quê) e detalhamento (de um deles). 5 elementos = 200, 4 = 160, 3 = 120, 2 = 80, 1 = 40, nenhum ou fora do tema = 0. Se a proposta desrespeita os direitos humanos, C5 = 0.`;

export function buildEssayMessages(theme: string, essay: string, themeContext?: string | null) {
  const system =
    'Você é um corretor experiente de redação do ENEM. Avalia com rigor justo e linguagem acolhedora, em português do Brasil. ' +
    'Corrige o TEXTO, nunca a pessoa. Não inventa trechos que o aluno não escreveu: todo trecho citado precisa existir literalmente no texto. ' +
    'Não infla notas: 200 é raro e exige o critério completo; na dúvida entre dois degraus, escolha o menor. ' +
    'Responde SEMPRE e SOMENTE com JSON válido, sem texto antes ou depois.';

  const comps = COMPETENCIES.map((c) => `${c.id}. ${c.name} (${c.hint})`).join('\n');
  const context = themeContext?.trim() ? `\nContexto do tema (apenas para você avaliar a adequação ao tema):\n${themeContext.trim()}\n` : '';

  const user = `Tema da redação: ${theme.trim()}
${context}
Texto do aluno:
<<<REDACAO
${essay.trim()}
REDACAO>>>

${RUBRIC}

Avalie nas 5 competências do ENEM:
${comps}

Cada nota é um destes valores: 0, 40, 80, 120, 160 ou 200.

Devolva exatamente este JSON:
{
  "competencias": [
    { "id": 1, "nota": 120, "comentario": "1 a 2 frases, específicas ao texto" },
    { "id": 2, "nota": 160, "comentario": "..." },
    { "id": 3, "nota": 120, "comentario": "..." },
    { "id": 4, "nota": 160, "comentario": "..." },
    { "id": 5, "nota": 120, "comentario": "..." }
  ],
  "intervencao": { "agente": true, "acao": true, "meio": false, "finalidade": true, "detalhamento": false },
  "repertorio": "o repertório sociocultural usado (ou \\"nenhum\\") e se é legitimado, pertinente e produtivo",
  "alertas": ["só se houver: possível ANULAÇÃO (fuga ao tema, texto não dissertativo-argumentativo, menos de 7 linhas, cópia dos motivadores, partes desconectadas) ou desrespeito aos direitos humanos na proposta"],
  "pontosFortes": ["até 3 itens curtos"],
  "melhorias": ["até 3 ações práticas, em ordem de impacto"],
  "trechos": [
    { "trecho": "cópia LITERAL de um trecho do texto (até 25 palavras)", "problema": "o que está errado", "sugestao": "como reescrever" }
  ],
  "reescrita": "reescreva UM parágrafo do aluno (o mais fraco) mostrando a melhoria"
}
"trechos" tem de 1 a 4 itens. "alertas" é uma lista vazia quando não há nada grave.`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

const feedbackSchema = z.object({
  competencias: z
    .array(
      z.object({
        id: z.coerce.number().int().min(1).max(5),
        nota: z.coerce.number(),
        comentario: z.string().trim().max(600).default(''),
      }),
    )
    .length(5),
  intervencao: z
    .object({
      agente: z.coerce.boolean().default(false),
      acao: z.coerce.boolean().default(false),
      meio: z.coerce.boolean().default(false),
      finalidade: z.coerce.boolean().default(false),
      detalhamento: z.coerce.boolean().default(false),
    })
    .optional(),
  repertorio: z.string().trim().max(400).optional(),
  alertas: z.array(z.string().trim().max(300)).max(4).default([]),
  pontosFortes: z.array(z.string().trim().max(240)).max(5).default([]),
  melhorias: z.array(z.string().trim().max(300)).max(5).default([]),
  trechos: z
    .array(
      z.object({
        trecho: z.string().trim().max(400),
        problema: z.string().trim().max(400),
        sugestao: z.string().trim().max(400).default(''),
      }),
    )
    .max(6)
    .default([]),
  reescrita: z.string().trim().max(2000).default(''),
});

export interface EssayFeedback {
  competencies: { id: number; name: string; score: number; comment: string }[];
  total: number;
  strengths: string[];
  improvements: string[];
  excerpts: { excerpt: string; problem: string; suggestion: string }[];
  rewrite: string;
  /** Os 5 elementos da proposta de intervenção; ausente em correções antigas. */
  intervention?: { agent: boolean; action: boolean; means: boolean; purpose: boolean; detail: boolean };
  /** Resumo do repertório sociocultural identificado. */
  repertoire?: string;
  /** Avisos graves (possível anulação, direitos humanos). */
  alerts?: string[];
}

/** Aproxima para o degrau de 40 mais próximo e limita a 0–200. */
export function snapScore(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  const clamped = Math.min(200, Math.max(0, raw));
  return Math.round(clamped / 40) * 40;
}

function stripFence(text: string): string {
  const t = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(t);
  return (m?.[1] ?? t).trim();
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Lê a resposta da IA. Devolve `null` se não for um JSON utilizável — quem chama
 * mostra "não consegui corrigir" em vez de uma nota inventada.
 *
 * Trechos "citados" que NÃO existem no texto do aluno são descartados: é a
 * defesa contra a IA inventar uma frase que o aluno nunca escreveu.
 */
export function parseEssayFeedback(raw: string, essay: string): EssayFeedback | null {
  let json: unknown;
  try {
    json = JSON.parse(stripFence(raw));
  } catch {
    return null;
  }
  const parsed = feedbackSchema.safeParse(json);
  if (!parsed.success) return null;

  const byId = new Map(parsed.data.competencias.map((c) => [c.id, c]));
  if (byId.size !== 5) return null;

  const inter = parsed.data.intervencao;
  const interventionOk = inter
    ? { agent: inter.agente, action: inter.acao, means: inter.meio, purpose: inter.finalidade, detail: inter.detalhamento }
    : undefined;
  // A C5 não passa do que os elementos presentes permitem (5 → 200 ... 0 → 0).
  const c5Cap = interventionOk ? Object.values(interventionOk).filter(Boolean).length * 40 : 200;

  const competencies = COMPETENCIES.map((c) => {
    const found = byId.get(c.id)!;
    const snapped = snapScore(found.nota);
    return { id: c.id, name: c.name, score: c.id === 5 ? Math.min(snapped, c5Cap) : snapped, comment: found.comentario };
  });

  const text = norm(essay);
  const excerpts = parsed.data.trechos
    .filter((t) => t.trecho.length >= 4 && text.includes(norm(t.trecho)))
    .map((t) => ({ excerpt: t.trecho, problem: t.problema, suggestion: t.sugestao }));

  return {
    competencies,
    total: competencies.reduce((sum, c) => sum + c.score, 0),
    strengths: parsed.data.pontosFortes.filter(Boolean),
    improvements: parsed.data.melhorias.filter(Boolean),
    excerpts,
    rewrite: parsed.data.reescrita,
    ...(interventionOk ? { intervention: interventionOk } : {}),
    ...(parsed.data.repertorio ? { repertoire: parsed.data.repertorio } : {}),
    alerts: parsed.data.alertas.filter(Boolean),
  };
}

/** A competência mais fraca entre várias redações — o "erro que mais se repete". */
export function weakestCompetency(history: { scores: number[] }[]): { id: number; name: string; average: number } | null {
  if (history.length === 0) return null;
  const sums = [0, 0, 0, 0, 0];
  for (const h of history) h.scores.forEach((s, i) => (sums[i] = (sums[i] ?? 0) + s));
  const avgs = sums.map((s) => s / history.length);
  const min = Math.min(...avgs);
  const i = avgs.indexOf(min);
  return { id: i + 1, name: COMPETENCIES[i]!.name, average: Math.round(min) };
}
