'use server';

import { requireContentManager } from './guard';
import { completeWithAI } from '@/lib/ai/provider';
import { buildExamPrompt, generateExamDraftSchema, stripCodeFence } from '../lib/ai-exam-prompt';

/**
 * Geração de simulado por IA — reaproveita 100% do pipeline já testado do
 * importador manual. Esta action NUNCA grava nada no banco: só devolve texto
 * bruto pro cliente preencher o campo "Código" de `SimuladoImporter`, que já
 * roda `parseSimuladoCode` e mostra a MESMA prévia/validação de um JSON
 * colado à mão. Se o Groq devolver algo inválido, vira um erro de validação
 * normal — o admin edita ou pede de novo. Nasce sempre como rascunho.
 *
 * Mesmo provedor da NexaAI (`completeWithAI`, `src/lib/ai/provider.ts`) —
 * prompt e `max_tokens` próprios porque é um uso bem diferente (gerar um
 * JSON grande e estrito, não bater papo curto).
 */

export type GenerateExamDraftState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; code: string };

export async function generateExamDraft(
  _prev: GenerateExamDraftState,
  formData: FormData,
): Promise<GenerateExamDraftState> {
  await requireContentManager();

  const parsed = generateExamDraftSchema.safeParse({
    subjectName: formData.get('subjectName'),
    topic: formData.get('topic') || '',
    gradeLevel: formData.get('gradeLevel') || '',
    difficulty: formData.get('difficulty'),
    questionCount: formData.get('questionCount'),
    includeEssay: formData.get('includeEssay') || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  }

  const includeEssay = parsed.data.includeEssay === 'on';

  const result = await completeWithAI(
    [
      {
        role: 'system',
        content:
          'Você gera simulados em JSON estrito para uma plataforma de estudos brasileira. Responda sempre só com o JSON pedido, em português do Brasil, nada de texto fora dele.',
      },
      { role: 'user', content: buildExamPrompt(parsed.data, includeEssay) },
    ],
    { maxTokens: 4096, temperature: 0.7, timeoutMs: 45_000 },
  );

  if (!result.ok) {
    switch (result.reason) {
      case 'missing_api_key':
        return { status: 'error', message: 'A geração por IA precisa da GROQ_API_KEY configurada no servidor.' };
      case 'content_filter':
        return {
          status: 'error',
          message: 'O pedido esbarrou no filtro de conteúdo do provedor — tenta reformular o tema.',
        };
      case 'empty':
        return { status: 'error', message: 'A IA não devolveu nada — tenta de novo.' };
      default:
        return { status: 'error', message: 'Não consegui gerar agora — tenta de novo em instantes.' };
    }
  }

  return { status: 'ok', code: stripCodeFence(result.text) };
}
