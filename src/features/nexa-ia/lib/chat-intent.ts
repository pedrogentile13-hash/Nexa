import { z } from 'zod';

/**
 * Pedido de criação feito DENTRO do chat ("crie um simulado de 3 questões sobre
 * Segunda Guerra"). Puro e testável: detecta o pedido, monta a pergunta que a IA
 * responde em JSON e valida a resposta antes de qualquer coisa ser criada.
 */

const norm = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const VERB =
  '(?:cri\\w*|ger\\w*|faca|fazer|faz|monte|montar|prepar\\w*|elabor\\w*|escrev\\w*|quero|preciso de|pode (?:me )?(?:criar|gerar|fazer)|me d\\w+)';
const QUIZ_WORDS = '(?:simulado|quiz|questoes|questao|prova|teste)';
const SUMMARY_WORDS = '(?:resumo|resumao)';

const QUIZ_RE = new RegExp(`\\b${VERB}\\b[^.?!\\n]{0,40}\\b${QUIZ_WORDS}\\b`);
const SUMMARY_RE = new RegExp(`\\b${VERB}\\b[^.?!\\n]{0,40}\\b${SUMMARY_WORDS}\\b`);

export function detectCreateIntent(text: string): 'quiz' | 'resumo' | null {
  const t = norm(text);
  const quiz = QUIZ_RE.test(t);
  const summary = SUMMARY_RE.test(t);
  if (quiz && !summary) return 'quiz';
  if (summary && !quiz) return 'resumo';
  if (quiz && summary) return t.search(new RegExp(QUIZ_WORDS)) < t.search(new RegExp(SUMMARY_WORDS)) ? 'quiz' : 'resumo';
  return null;
}

export interface SubjectOption {
  id: string;
  name: string;
}

export function buildIntentPrompt(text: string, kind: 'quiz' | 'resumo', subjects: SubjectOption[]): string {
  return `Um aluno pediu para criar conteúdo de estudo. Extraia os dados do pedido e responda APENAS com JSON, sem texto fora dele e sem cercar com \`\`\`.

Pedido do aluno: """${text.slice(0, 600)}"""

Matérias disponíveis (use o id exato):
${subjects.map((s) => `- ${s.id}: ${s.name}`).join('\n')}

Formato:
{"kind": "${kind}", "topic": "assunto em poucas palavras", "subjectId": "id de uma das matérias acima", "count": 5, "difficulty": "facil" | "medio" | "dificil"}

Regras: "count" é o número de questões pedido (1 a 10; use 5 se não disser; sempre 5 para resumo); "difficulty" é "medio" se não disser; escolha a matéria que mais combina com o assunto.`;
}

const intentSchema = z.object({
  kind: z.enum(['quiz', 'resumo']),
  topic: z.string().trim().min(2).max(160),
  subjectId: z.string().uuid(),
  count: z.coerce.number().int().min(1).max(10).catch(5),
  difficulty: z.enum(['facil', 'medio', 'dificil']).catch('medio'),
});
export type CreateIntent = z.infer<typeof intentSchema>;

/** `null` se a IA não devolveu JSON válido ou escolheu uma matéria que não existe. */
export function parseIntent(raw: string, subjects: SubjectOption[]): CreateIntent | null {
  const body = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const parsed = intentSchema.safeParse(JSON.parse(body));
    if (!parsed.success) return null;
    return subjects.some((s) => s.id === parsed.data.subjectId) ? parsed.data : null;
  } catch {
    return null;
  }
}
