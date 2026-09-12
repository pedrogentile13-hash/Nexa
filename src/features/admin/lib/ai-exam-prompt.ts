import { z } from 'zod';

/**
 * Peças puras da geração de simulado por IA — sem rede, sem `'use server'`,
 * testáveis isoladamente (mesmo padrão de `pdf.ts`: a parte sem efeito
 * colateral fica separada da Server Action que faz a chamada de verdade).
 */

export const generateExamDraftSchema = z.object({
  subjectName: z.string().trim().min(1, 'Diga a matéria.').max(80),
  topic: z.string().trim().max(160).optional().or(z.literal('')),
  gradeLevel: z.string().trim().max(40).optional().or(z.literal('')),
  difficulty: z.enum(['facil', 'medio', 'dificil', 'anglo']),
  questionCount: z.coerce
    .number()
    .int()
    .min(1, 'Pelo menos 1 questão.')
    .max(20, 'No máximo 20 por vez.'),
  includeEssay: z.enum(['on']).optional(),
});

export type GenerateExamDraftInput = z.infer<typeof generateExamDraftSchema>;

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'fácil',
  medio: 'média',
  dificil: 'difícil',
  anglo: 'nível Anglo/ENEM (interpretação, textos-base)',
};

export function buildExamPrompt(input: GenerateExamDraftInput, includeEssay: boolean): string {
  const parts = [
    `matéria "${input.subjectName}"`,
    input.topic ? `tema "${input.topic}"` : null,
    input.gradeLevel ? `para o ${input.gradeLevel}` : null,
    `dificuldade ${DIFFICULTY_LABEL[input.difficulty] ?? input.difficulty}`,
    `exatamente ${input.questionCount} questões de múltipla escolha (4 ou 5 alternativas, chaves A a E)`,
  ].filter(Boolean);

  const essayBlock = includeEssay
    ? `,
    "writingTasks": [
      {
        "id": "R1",
        "title": "Produção de Texto",
        "genre": "artigo_de_opiniao",
        "theme": "tema da redação, relacionado ao assunto pedido",
        "prompt": "comando da redação para o aluno",
        "minWords": 150,
        "maxWords": 400
      }
    ]`
    : '';

  return `Gere um simulado em JSON estrito sobre ${parts.join(', ')}${includeEssay ? ', incluindo uma redação (writingTasks)' : ''}.

Responda APENAS com o JSON abaixo preenchido — sem texto antes ou depois, sem cercar com \`\`\`, exatamente neste formato:

{
  "simulation": {
    "schemaVersion": "2.0",
    "code": "um-codigo-curto-em-maiusculas-com-hifen",
    "title": "título do simulado",
    "description": "descrição curta de uma linha",
    "questions": [
      {
        "id": "Q1",
        "statement": "enunciado completo da questão",
        "alternatives": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "correctAlternative": "B",
        "explanation": "por que essa é a resposta certa",
        "difficulty": "${input.difficulty}"
      }
    ]${essayBlock}
  }
}

Regras obrigatórias: "correctAlternative" tem que ser uma das chaves usadas em "alternatives" daquela mesma questão; os "id" das questões são "Q1", "Q2", etc, sem repetir; não invente campos fora do formato mostrado; não deixe nenhuma questão sem "correctAlternative".`;
}

/** O modelo às vezes cerca o JSON com ```json apesar do pedido — remove a cerca quando vier. */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}
