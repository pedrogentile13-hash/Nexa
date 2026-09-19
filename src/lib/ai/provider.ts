/**
 * Abstração de provedor de IA — o fetch/timeout/parsing de "chat completions"
 * que hoje está duplicado em `nexa-ia/server/actions.ts`,
 * `admin/server/ai-exam.ts` e `admin/server/ai-assistant.ts` (três cópias do
 * mesmo bloco, cada uma com timeout/max_tokens diferentes, mas a MESMA lógica
 * de erro). Concentrado aqui pra parar de triplicar quando o Nexa Community
 * (IA Creator, seção 12 do plano) precisar gerar em mais lugares, e pra trocar
 * de provedor (OpenAI, Gemini) em um só ponto no futuro, sem tocar em cada
 * Server Action.
 *
 * Cada chamador mantém seu próprio texto de erro em português — os motivos
 * (`reason`) aqui são só a causa técnica; a mensagem pro usuário continua
 * decisão de cada feature, porque cada uma fala com um público diferente
 * (aluno vs. admin/professor) e já tinha textos próprios antes desta extração.
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export type AICompletionResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'missing_api_key' }
  | { ok: false; reason: 'content_filter' }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'http_error'; status: number }
  | { ok: false; reason: 'network'; error: unknown };

export interface AIProvider {
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;
}

// `llama-3.3-70b-versatile` saiu do catálogo da Groq (passou a devolver
// `model_not_found`, visto no painel da própria Groq) — `gpt-oss-120b` é o
// maior modelo de chat de propósito geral disponível na conta atual.
const GROQ_MODEL = 'openai/gpt-oss-120b';

class GroqProvider implements AIProvider {
  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AICompletionResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { ok: false, reason: 'missing_api_key' };

    const { maxTokens = 1024, temperature = 0.7, timeoutMs = 30_000 } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error('[ai/provider] Groq respondeu erro', response.status, await response.text());
        return { ok: false, reason: 'http_error', status: response.status };
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string }; finish_reason?: string }[];
      };
      const choice = data.choices?.[0];
      const text = choice?.message?.content?.trim() ?? '';

      if (!text) {
        return choice?.finish_reason === 'content_filter'
          ? { ok: false, reason: 'content_filter' }
          : { ok: false, reason: 'empty' };
      }

      return { ok: true, text };
    } catch (err) {
      console.error('[ai/provider] falha ao chamar a Groq', err);
      return { ok: false, reason: 'network', error: err };
    } finally {
      clearTimeout(timeout);
    }
  }
}

const provider: AIProvider = new GroqProvider();

/** Único ponto de acesso ao provedor configurado — troca de implementação (OpenAI, Gemini) muda só aqui. */
export function getAIProvider(): AIProvider {
  return provider;
}

export async function completeWithAI(
  messages: AIMessage[],
  options?: AICompletionOptions,
): Promise<AICompletionResult> {
  return getAIProvider().complete(messages, options);
}
