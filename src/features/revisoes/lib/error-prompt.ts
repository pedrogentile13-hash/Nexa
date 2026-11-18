/**
 * Prompt do "Por que errei?".
 *
 * A IA recebe a questão, o que o aluno marcou, a resposta certa e a explicação
 * que já existe — e diz a CAUSA PROVÁVEL do erro numa de três categorias. Essa
 * classificação é o que transforma uma lista de erros num diagnóstico: quem
 * erra por distração precisa de outra ajuda que quem erra por não saber a matéria.
 */

export const ERROR_CAUSES = ['conceito', 'distração', 'interpretação'] as const;
export type ErrorCause = (typeof ERROR_CAUSES)[number];

export interface ErrorContext {
  subjectName: string;
  topicName: string | null;
  statement: string;
  chosen: string | null;
  correct: string | null;
  explanation: string | null;
}

export function buildErrorExplanationMessages(c: ErrorContext) {
  const system =
    'Você é a NexaAI, tutora de estudos de um aluno brasileiro (possivelmente menor de idade). ' +
    'Explica o erro dele com gentileza, sem julgar, em português do Brasil, de forma curta. ' +
    'Nunca diga que o aluno "é fraco" em algo; fale do erro, não da pessoa.';

  const user = `Matéria: ${c.subjectName}${c.topicName ? ` — ${c.topicName}` : ''}

Questão: ${c.statement}
O aluno marcou: ${c.chosen ?? '(não registrado)'}
Resposta certa: ${c.correct ?? '(não registrada)'}
${c.explanation ? `Explicação oficial: ${c.explanation}` : ''}

Responda assim, em Markdown, no máximo 6 frases no total:
**Causa provável:** uma destas palavras — conceito (não domina a ideia), distração (sabia, mas escorregou) ou interpretação (leu a questão de outro jeito).
**Por que essa alternativa tenta:** o raciocínio que leva a marcar a errada.
**Como a certa funciona:** a ideia correta, simples.
**Para não errar de novo:** uma dica prática de uma frase.`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

/** Extrai a causa da resposta, para futuras estatísticas. Desconhecida → null. */
export function parseCause(markdown: string): ErrorCause | null {
  const m = /causa prov[aá]vel:?\**\s*:?\s*\**\s*([a-zçãõáéíóú]+)/i.exec(markdown);
  if (!m) return null;
  const word = m[1]!.toLowerCase();
  return (ERROR_CAUSES as readonly string[]).find((c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '') === word.normalize('NFD').replace(/[̀-ͯ]/g, '')) as ErrorCause | null ?? null;
}
