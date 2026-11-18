/**
 * Prompt do resumo gerado a partir do planejamento do professor.
 *
 * A regra central é a mesma do simulado: o planejamento é a ÚNICA fonte. Um
 * resumo que completa com "o que o modelo sabe" pode contradizer o que o
 * professor ensinou — e o aluno decora o errado.
 */

export const MAX_PLAN_CHARS = 20000;

export function buildPlanSummaryMessages(title: string, content: string) {
  const system =
    'Você escreve resumos de estudo em português do Brasil, em Markdown, para alunos do ensino fundamental e médio. ' +
    'Você usa EXCLUSIVAMENTE o material do professor fornecido: não acrescenta fatos, datas, nomes, fórmulas ou ' +
    'exemplos que não estejam nele, ainda que sejam verdadeiros. Se o material for curto, o resumo é curto.';

  const user = `Material do professor — "${title.trim()}":
<<<MATERIAL
${content.trim().slice(0, MAX_PLAN_CHARS)}
MATERIAL>>>

Escreva o resumo para o aluno estudar, assim:
- um título (#) e seções com subtítulos (##);
- frases curtas e claras, com **negrito** nos termos-chave;
- listas quando houver etapas, causas ou comparações;
- ao final, uma seção "## Para fixar" com 3 a 5 perguntas de revisão (só perguntas, sem respostas), baseadas SÓ no material.
Responda apenas com o Markdown do resumo.`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}
