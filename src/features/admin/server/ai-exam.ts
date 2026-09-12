'use server';

import { requireContentManager } from './guard';
import { buildExamPrompt, generateExamDraftSchema, stripCodeFence } from '../lib/ai-exam-prompt';

/**
 * Geração de simulado por IA — reaproveita 100% do pipeline já testado do
 * importador manual. Esta action NUNCA grava nada no banco: só devolve texto
 * bruto pro cliente preencher o campo "Código" de `SimuladoImporter`, que já
 * roda `parseSimuladoCode` e mostra a MESMA prévia/validação de um JSON
 * colado à mão. Se o Groq devolver algo inválido, vira um erro de validação
 * normal — o admin edita ou pede de novo. Nasce sempre como rascunho.
 *
 * Mesmo modelo/endpoint da Nexa IA (`nexa-ia/server/actions.ts`) — mantido
 * separado de propósito: são dois usos bem diferentes (chat curto vs. gerar
 * um JSON grande e estrito), com prompts, `max_tokens` e tratamento de erro
 * próprios de cada um.
 */
const GROQ_MODEL = 'openai/gpt-oss-120b';

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      status: 'error',
      message: 'A geração por IA precisa da GROQ_API_KEY configurada no servidor.',
    };
  }

  const includeEssay = parsed.data.includeEssay === 'on';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Você gera simulados em JSON estrito para uma plataforma de estudos brasileira. Responda sempre só com o JSON pedido, em português do Brasil, nada de texto fora dele.',
          },
          { role: 'user', content: buildExamPrompt(parsed.data, includeEssay) },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('[ai-exam] Groq respondeu erro', response.status, await response.text());
      return { status: 'error', message: 'Não consegui gerar agora — tenta de novo em instantes.' };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? '';
    if (!text.trim()) {
      return choice?.finish_reason === 'content_filter'
        ? { status: 'error', message: 'O pedido esbarrou no filtro de conteúdo do provedor — tenta reformular o tema.' }
        : { status: 'error', message: 'A IA não devolveu nada — tenta de novo.' };
    }

    return { status: 'ok', code: stripCodeFence(text) };
  } catch (err) {
    console.error('[ai-exam] falha ao chamar a Groq', err);
    return { status: 'error', message: 'Não consegui gerar agora — tenta de novo em instantes.' };
  } finally {
    clearTimeout(timeout);
  }
}
