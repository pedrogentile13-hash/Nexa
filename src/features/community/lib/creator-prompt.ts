import { z } from 'zod';
import type { ParsedQuestion } from '@/features/admin/lib/simulado-import';

/**
 * Peças puras da geração de conteúdo por IA do aluno — sem rede, sem
 * `'use server'`, mesmo espírito de `admin/lib/ai-exam-prompt.ts` (que já
 * gera o mesmo formato de JSON pro admin). Aqui o prompt é mais enxuto de
 * propósito: sem redação, sem textos-base/imagens/gráficos — só o essencial
 * pra sair confiável do modelo na primeira tentativa.
 */

export const generateCreatorQuizSchema = z.object({
  subjectCatalogId: z.string().uuid('Escolha uma matéria.'),
  topic: z.string().trim().min(1, 'Diga sobre o que é o quiz.').max(160),
  difficulty: z.enum(['facil', 'medio', 'dificil']),
  questionCount: z.coerce.number().int().min(1, 'Pelo menos 1 questão.').max(10, 'No máximo 10 por vez.'),
});
export type GenerateCreatorQuizInput = z.infer<typeof generateCreatorQuizSchema>;

export const generateCreatorSummarySchema = z.object({
  subjectCatalogId: z.string().uuid('Escolha uma matéria.'),
  topic: z.string().trim().min(1, 'Diga sobre o que é o resumo.').max(160),
});
export type GenerateCreatorSummaryInput = z.infer<typeof generateCreatorSummarySchema>;

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'fácil',
  medio: 'média',
  dificil: 'difícil',
};

export function buildCreatorQuizPrompt(subjectName: string, input: GenerateCreatorQuizInput): string {
  return `Gere um quiz em JSON estrito sobre a matéria "${subjectName}", tema "${input.topic}", dificuldade ${
    DIFFICULTY_LABEL[input.difficulty] ?? input.difficulty
  }, com exatamente ${input.questionCount} questões de múltipla escolha (4 alternativas, chaves A a D).

Responda APENAS com o JSON abaixo preenchido — sem texto antes ou depois, sem cercar com \`\`\`, exatamente neste formato:

{
  "simulation": {
    "schemaVersion": "2.0",
    "code": "um-codigo-curto-em-maiusculas-com-hifen",
    "title": "título curto do quiz",
    "questions": [
      {
        "id": "Q1",
        "statement": "enunciado completo da questão",
        "alternatives": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "correctAlternative": "B",
        "explanation": "por que essa é a resposta certa",
        "difficulty": "${input.difficulty}"
      }
    ]
  }
}

Regras obrigatórias: "correctAlternative" tem que ser uma das chaves usadas em "alternatives" daquela mesma questão; os "id" das questões são "Q1", "Q2", etc, sem repetir; não invente campos fora do formato mostrado; não deixe nenhuma questão sem "correctAlternative"; escreva em português do Brasil.`;
}

export function buildCreatorSummaryPrompt(subjectName: string, input: GenerateCreatorSummaryInput): string {
  return `Escreva um resumo de estudo em Markdown sobre a matéria "${subjectName}", tema "${input.topic}", para um aluno do ensino básico brasileiro. Use títulos, listas e negrito onde ajudar. Responda só com o Markdown do resumo — sem texto antes ou depois, sem cercar com \`\`\`. Escreva em português do Brasil.`;
}

/** O modelo às vezes cerca a resposta com ```markdown ou ```json apesar do pedido. */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json|markdown)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}

/** Formato que `create_ai_resource` espera em `p_questions`. */
export interface CreatorQuestionPayload {
  statement: string;
  explanation: string | null;
  difficulty: string;
  options: { body: string; is_correct: boolean }[];
}

/** Converte o que `parseSimuladoCode` já validou para o shape da RPC. */
export function toCreatorQuestionsPayload(questions: ParsedQuestion[]): CreatorQuestionPayload[] {
  return questions.map((q) => ({
    statement: q.statement,
    explanation: q.explanation,
    difficulty: q.difficulty,
    options: q.options.map((o) => ({ body: o.text, is_correct: o.key === q.correctKey })),
  }));
}
