/**
 * Prompt do "Explicar com IA" no leitor de resumo.
 *
 * Módulo puro para poder ser testado: é ele que garante que a IA explica o
 * trecho que o aluno marcou, no contexto do resumo, e não responde de forma
 * genérica.
 */

export const EXPLAIN_STYLES = ['normal', 'simples', 'exemplo'] as const;
export type ExplainStyle = (typeof EXPLAIN_STYLES)[number];

export const MAX_PASSAGE_CHARS = 600;
const CONTEXT_RADIUS = 700;

export function parseExplainStyle(value: unknown): ExplainStyle {
  return EXPLAIN_STYLES.includes(value as ExplainStyle) ? (value as ExplainStyle) : 'normal';
}

/** Trecho do resumo em volta da seleção, para a IA não explicar às cegas. */
export function surroundingText(body: string, passage: string): string {
  const at = body.indexOf(passage);
  if (at === -1) return body.slice(0, CONTEXT_RADIUS * 2);
  const start = Math.max(0, at - CONTEXT_RADIUS);
  const end = Math.min(body.length, at + passage.length + CONTEXT_RADIUS);
  return body.slice(start, end);
}

const STYLE_INSTRUCTIONS: Record<ExplainStyle, string> = {
  normal: 'Explique o que o trecho quer dizer, em linguagem simples, em no máximo 4 frases.',
  simples:
    'O aluno AINDA não entendeu a explicação normal. Explique de um jeito bem mais simples, como para quem nunca viu o assunto, usando uma analogia do dia a dia. No máximo 4 frases.',
  exemplo:
    'Dê UM exemplo concreto e curto (numérico, se for o caso) que mostre o trecho funcionando. No máximo 5 frases.',
};

export function buildExplainMessages(args: {
  title: string;
  subjectName: string;
  passage: string;
  context: string;
  style: ExplainStyle;
}) {
  const system = `Você é a NexaAI, tutora do Nexa Study, falando com um estudante brasileiro (talvez menor de idade) que está lendo um resumo e marcou um trecho que não entendeu.
Responda em português do Brasil, com tom acolhedor e direto. ${STYLE_INSTRUCTIONS[args.style]}
Baseie-se no resumo; se o trecho tiver um erro evidente, diga com gentileza. Não repita o trecho inteiro, não faça introdução ("Claro!") e não use títulos. Pode usar **negrito** no termo-chave.`;

  const user = `Resumo: "${args.title}" (${args.subjectName})

Texto em volta:
"""
${args.context}
"""

Trecho que não entendi:
"""
${args.passage.slice(0, MAX_PASSAGE_CHARS)}
"""`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}
