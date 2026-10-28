/**
 * Dica de IA dentro do simulado.
 *
 * A IA recebe a questão e as alternativas EXATAMENTE como o aluno as vê — sem
 * gabarito (a única porta de leitura do aluno, `quiz_questions`, já o omite).
 * Então ela não "sabe" qual é a certa: só consegue ajudar a raciocinar. E o
 * prompt a proíbe de apontar alternativa mesmo assim, porque um palpite dela
 * dito com confiança seria pior que nenhuma ajuda.
 */

export const MAX_HINT_LEVEL = 2;

export interface HintQuestion {
  subjectName: string;
  statement: string;
  options: { body: string }[];
  /** A questão depende de figura/gráfico/texto-base que a IA não enxerga. */
  hasAttachments: boolean;
}

const LEVEL_INSTRUCTION: Record<1 | 2, string> = {
  1: 'Nível 1 — dica LEVE: diga qual conceito, fórmula ou ideia o aluno precisa lembrar, e uma pergunta que o faça pensar. Não resolva nada.',
  2: 'Nível 2 — dica MAIS DIRETA: mostre o primeiro passo do raciocínio ou como descartar o tipo de erro mais comum, SEM chegar à conclusão e SEM dizer qual alternativa é a certa.',
};

export function buildHintMessages(q: HintQuestion, level: 1 | 2) {
  const system =
    'Você é a NexaAI, tutora de um estudante brasileiro fazendo um simulado. Ajude a RACIOCINAR, em português do Brasil, com no máximo 3 frases. ' +
    'REGRAS: nunca diga qual alternativa é a correta, nunca cite a letra nem o texto de uma alternativa como resposta, nunca dê o resultado final. ' +
    'Você não conhece o gabarito; se não tiver certeza de um fato, oriente o método em vez de afirmar. ' +
    'Se a questão depende de uma figura ou texto que você não vê, diga isso com gentileza e ajude só com o método geral.';

  const options = q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o.body}`).join('\n');

  const user = `Matéria: ${q.subjectName}
${q.hasAttachments ? '(Atenção: esta questão tem figura/texto-base que você NÃO vê.)\n' : ''}
Questão: ${q.statement}
${options}

${LEVEL_INSTRUCTION[level]}`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

/**
 * Última barreira: se, mesmo proibida, a IA escreveu algo como "a resposta é a
 * B" / "alternativa C", a dica é descartada em vez de mostrada. Melhor negar a
 * ajuda do que entregar (e talvez errar) a resposta.
 */
export function leaksAnswer(text: string): boolean {
  // A LETRA precisa estar em maiúscula (A–E): é como a IA aponta uma alternativa,
  // e evita confundir com o artigo "a" ("a resposta a essa questão").
  const KEY = '(?:[Rr]esposta|[Aa]lternativa|[Oo]p[cç][aã]o|[Gg]abarito|[Ll]etra)';
  const CONNECTOR = '(?:\\s+(?:correta|certa))?\\s*(?:é|e|eh|seria|será|sera|:|-|=)?\\s*(?:a\\s+)?(?:(?:letra|alternativa|op[cç][aã]o)\\s+)?';
  const direct = new RegExp(`\\b${KEY}${CONNECTOR}\\(?[A-E]\\b\\)?(?![a-zà-ú])`);
  const imperative = /\b(?:[Mm]arque|[Ee]scolha|[Aa]ssinale)\s+(?:a\s+)?(?:(?:alternativa|letra|op[cç][aã]o)\s+)?\(?[A-E]\b/;
  return direct.test(text) || imperative.test(text);
}
