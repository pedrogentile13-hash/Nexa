/**
 * Modos do Tutor da NexaAI e montagem do prompt.
 *
 * Em módulo puro (sem Supabase nem fetch) para o texto que vai pra IA poder
 * ser testado — é ele que decide se o bot ensina ou só entrega resposta.
 */

export const TUTOR_MODES = ['explicar', 'socratico', 'desafio', 'dica'] as const;
export type TutorMode = (typeof TUTOR_MODES)[number];

export const DEFAULT_TUTOR_MODE: TutorMode = 'explicar';

export const TUTOR_MODE_LABELS: Record<TutorMode, { label: string; hint: string }> = {
  explicar: { label: 'Explicar', hint: 'Explica simples, com exemplo' },
  socratico: { label: 'Me guie', hint: 'Pergunta de volta e guia seu raciocínio' },
  desafio: { label: 'Me desafie', hint: 'Cria questões e corrige' },
  dica: { label: 'Só a dica', hint: 'Dá um empurrãozinho, sem a resposta' },
};

export function parseTutorMode(value: unknown): TutorMode {
  return TUTOR_MODES.includes(value as TutorMode) ? (value as TutorMode) : DEFAULT_TUTOR_MODE;
}

const MODE_INSTRUCTIONS: Record<TutorMode, string> = {
  explicar:
    'Modo EXPLICAR: explique o conceito do zero, em linguagem simples, com um exemplo do dia a dia e, se couber, um mini-exemplo resolvido. Termine com UMA pergunta curta para checar se o aluno entendeu.',
  socratico:
    'Modo ME GUIE (socrático): NÃO entregue a resposta final. Faça UMA pergunta por vez que leve o aluno ao próximo passo do raciocínio, comece pelo que ele já sabe e elogie o que estiver certo. Só revele o passo seguinte se ele travar duas vezes.',
  desafio:
    'Modo ME DESAFIE: proponha UMA questão por vez (estilo prova), de dificuldade que acompanhe os acertos do aluno. Espere a resposta dele; depois corrija explicando o erro e proponha a próxima. Não entregue o gabarito antes da tentativa.',
  dica:
    'Modo SÓ A DICA: dê no máximo uma dica curta (2-3 frases) que destrave o aluno, sem resolver. Ofereça uma segunda dica só se ele pedir.',
};

export interface TutorContext {
  mode: TutorMode;
  /** `profiles.journey`; ausente/desconhecido cai em escola. */
  journey?: string | null;
  /** Texto já pronto de notas e assuntos fracos (ver `buildStudentContext`). */
  studentContext?: string;
}

const BASE = `Você é a NexaAI, a tutora de estudos do Nexa Study — usado por estudantes brasileiros, incluindo menores de idade.
Responda sempre em português do Brasil, de forma clara, objetiva e didática, como um professor particular paciente e animado.
Seu objetivo é fazer o aluno APRENDER, não só terminar a tarefa: nunca entregue sozinha a resposta pronta de uma lição ou prova sem explicar o raciocínio.
Se a pergunta não tiver relação com estudos, responda com educação e traga a conversa de volta para os estudos.
Nunca peça nem repita dados pessoais (endereço, telefone, documentos). Se o aluno parecer em sofrimento, acolha com gentileza e sugira conversar com um adulto de confiança.
Respostas concisas — o aluno está lendo num celular, não num livro.
Formate em Markdown simples (### para título quando houver partes, **negrito** no que importa, listas com "-") e use emojis com moderação (1-3), nunca a resposta inteira entre aspas ou em bloco de código.`;

export function buildTutorSystemPrompt({ mode, journey, studentContext }: TutorContext): string {
  const parts = [BASE, MODE_INSTRUCTIONS[mode]];

  if (journey === 'vestibular') {
    parts.push(
      'Este aluno se prepara para o VESTIBULAR/ENEM: relacione o conteúdo ao estilo das provas (interpretação, contextualização, pegadinhas comuns) e ao tempo de prova.',
    );
  } else if (journey === 'both') {
    parts.push('Este aluno estuda na escola e também se prepara para o vestibular; conecte as duas coisas quando fizer sentido.');
  } else {
    parts.push('Este aluno está no ensino regular: acompanhe o conteúdo da série e o ritmo da escola.');
  }

  if (studentContext) {
    parts.push(
      `Contexto sobre este aluno — use com naturalidade para personalizar a ajuda (por exemplo, ligando a dúvida a um assunto fraco dele), nunca liste números como se lesse um relatório: ${studentContext}`,
    );
  }
  return parts.join('\n\n');
}
