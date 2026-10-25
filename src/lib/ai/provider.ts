/**
 * Abstração de provedor de IA — o fetch/timeout/parsing de "chat completions"
 * que hoje está duplicado em `nexa-ia/server/actions.ts`,
 * `admin/server/ai-exam.ts` e `admin/server/ai-assistant.ts` (três cópias do
 * mesmo bloco, cada uma com timeout/max_tokens diferentes, mas a MESMA lógica
 * de erro). Concentrado aqui pra parar de triplicar quando o Nexa Community
 * (IA Creator, seção 12 do plano) precisar gerar em mais lugares, e pra trocar
 * de provedor (Groq, Gemini) em um só ponto no futuro, sem tocar em cada
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
  | { ok: false; reason: 'http_error'; status: number; detail?: string }
  | { ok: false; reason: 'network'; error: unknown };

export interface AIProvider {
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;
}

// `llama-3.3-70b-versatile` saiu do catálogo da Groq (passou a devolver
// `model_not_found`, visto no painel da própria Groq) — `gpt-oss-120b` é o
// maior modelo de chat de propósito geral disponível na conta atual.
const GROQ_MODEL = 'openai/gpt-oss-120b';

export class GroqProvider implements AIProvider {
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
        const detail = (await response.text()).slice(0, 300);
        console.error('[ai/provider] Groq respondeu erro', response.status, detail);
        return { ok: false, reason: 'http_error', status: response.status, detail };
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

/**
 * Modelo do Gemini. Configurável por `GEMINI_MODEL` porque o Google aposenta
 * modelos com aviso curto — trocar o modelo não pode exigir novo deploy de
 * código, só mudar uma variável.
 */
// O Google aposentou o 2.5-flash para contas novas e indicou este na própria
// mensagem de erro (404). Continua sobrescrevível por GEMINI_MODEL.
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash-lite,gemini-3.8-flash';

/**
 * Endereço do Gemini API. Vale para chaves `AIza...` E `AQ....`: as duas são
 * chaves do Gemini API. Uma versão anterior mandava `AQ.` para o Vertex AI
 * por suposição minha, e o Google respondeu 403 "API has not been used in
 * project" — a chave do usuário funcionava no Gemini API (outro projeto dele
 * a usa assim), só não tinha o Vertex ativado.
 */
export function geminiEndpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

const THINKING_HEADROOM = 2048;

/** Status HTTP que significam "o Google está sobrecarregado", não "você errou". */
const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);

export function geminiModels(): string[] {
  const raw = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  const list = raw.split(',').map((m) => m.trim()).filter(Boolean);
  return list.length ? list : ['gemini-2.5-flash-lite'];
}

export class GeminiProvider implements AIProvider {
  /**
   * @param retryDelaysMs pausas entre tentativas no MESMO modelo. Parametrizável
   *   só para o teste não esperar de verdade.
   * @param modelsOverride força a lista de modelos (o diagnóstico testa só o
   *   primeiro, para um reserva que responde não esconder o principal quebrado).
   */
  constructor(
    private readonly retryDelaysMs: number[] = [400, 1200],
    private readonly modelsOverride?: string[],
  ) {}

  /**
   * `GEMINI_MODEL` aceita uma LISTA separada por vírgula, tentada em ordem.
   * Modelo novo costuma ficar sobrecarregado (503) ou ser aposentado (404)
   * justamente quando todo mundo migra pra ele; ter um segundo na lista
   * transforma isso de "IA fora do ar" em "respondeu pelo modelo ao lado".
   */
  private models(): string[] {
    return this.modelsOverride?.length ? this.modelsOverride : geminiModels();
  }

  /**
   * Para cada modelo: tenta, repete em 5xx, e só passa ao próximo se o motivo
   * for do MODELO (5xx persistente ou 404). 400/403 são da chave/projeto e
   * seriam iguais em qualquer modelo — trocar só atrasaria o diagnóstico.
   *
   * Um orçamento de tempo só (`timeoutMs`) para tudo, para várias tentativas
   * nunca somarem várias vezes o limite da Server Action.
   */
  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AICompletionResult> {
    const total = options.timeoutMs ?? 30_000;
    const deadline = Date.now() + total;
    let result: AICompletionResult = { ok: false, reason: 'missing_api_key' };

    const models = this.models();
    for (let m = 0; m < models.length; m += 1) {
      const model = models[m]!;
      if (m > 0 && deadline - Date.now() < 3_000) break;

      result = await this.attempt(model, messages, { ...options, timeoutMs: deadline - Date.now() });
      for (const delay of this.retryDelaysMs) {
        const transient =
          !result.ok && result.reason === 'http_error' && TRANSIENT_STATUS.has(result.status);
        const remaining = deadline - Date.now() - delay;
        if (!transient || remaining < 3_000) break;

        console.error('[ai/provider] Gemini sobrecarregado, tentando de novo em', delay, 'ms', model);
        await new Promise((resolve) => setTimeout(resolve, delay));
        result = await this.attempt(model, messages, { ...options, timeoutMs: remaining });
      }

      if (result.ok) return result;
      if (result.reason !== 'http_error') return result;
      const modelProblem = TRANSIENT_STATUS.has(result.status) || result.status === 404;
      if (!modelProblem) return result;
      if (m < models.length - 1) console.error('[ai/provider] modelo indisponível, trocando:', model, result.status);
    }
    return result;
  }

  private async attempt(
    model: string,
    messages: AIMessage[],
    options: AICompletionOptions,
  ): Promise<AICompletionResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, reason: 'missing_api_key' };

    const thinkingDisabled = /2\.5-flash/.test(model);
    const { maxTokens = 1024, temperature = 0.7, timeoutMs = 30_000 } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // O Gemini não tem papel "system" dentro de `contents`: a instrução vai em
    // `systemInstruction`, e o papel do modelo se chama "model", não "assistant".
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    try {
      const response = await fetch(geminiEndpoint(model), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Cabeçalho e não `?key=`: chave na URL acaba em log de proxy e de CDN.
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            contents,
            generationConfig: {
              // Modelos que "pensam" gastam parte deste teto antes de escrever.
              // No 2.5 flash dá pra zerar o raciocínio (abaixo); nos outros o
              // parâmetro muda de nome entre versões e mandar um desconhecido é
              // erro 400, então em vez disso sobra folga: sem ela, um teto de
              // 1024 pode ser consumido inteiro pensando e voltar texto vazio.
              maxOutputTokens: thinkingDisabled ? maxTokens : maxTokens + THINKING_HEADROOM,
              temperature,
              // Os modelos 2.5 "flash" gastam parte de `maxOutputTokens` pensando
              // antes de responder; com 1024 de teto isso pode consumir tudo e
              // devolver texto VAZIO — que o app mostra como "não consegui
              // pensar". Para tirar dúvida de estudante não compensa pensar
              // longo, então o orçamento de raciocínio é zerado onde é aceito.
              ...(thinkingDisabled ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
          signal: controller.signal,
        });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        console.error('[ai/provider] Gemini respondeu erro', response.status, detail);
        return { ok: false, reason: 'http_error', status: response.status, detail };
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        promptFeedback?: { blockReason?: string };
      };
      const candidate = data.candidates?.[0];
      const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();

      if (!text) {
        const blocked =
          Boolean(data.promptFeedback?.blockReason) ||
          candidate?.finishReason === 'SAFETY' ||
          candidate?.finishReason === 'PROHIBITED_CONTENT';
        return blocked ? { ok: false, reason: 'content_filter' } : { ok: false, reason: 'empty' };
      }

      return { ok: true, text };
    } catch (err) {
      console.error('[ai/provider] falha ao chamar o Gemini', err);
      return { ok: false, reason: 'network', error: err };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Escolhe o provedor. Gemini quando há `GEMINI_API_KEY`; senão, Groq — assim
 * subir só a variável nova já troca o provedor, e removê-la devolve o
 * anterior sem tocar em código (é o caminho de volta se algo der errado).
 * `AI_PROVIDER=groq|gemini` força um dos dois mesmo com as duas chaves.
 */
/**
 * Tenta o provedor principal e, se ele FALHAR por motivo técnico, o reserva.
 *
 * Só cai pro reserva em falha de infraestrutura (chave ausente, erro HTTP,
 * rede, resposta vazia). `content_filter` NÃO cai: a pergunta foi barrada de
 * propósito, e mandá-la a outro provedor seria contornar o filtro em vez de
 * respeitá-lo.
 */
export class FallbackProvider implements AIProvider {
  constructor(
    private readonly primary: AIProvider,
    private readonly secondary: AIProvider,
  ) {}

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    const first = await this.primary.complete(messages, options);
    if (first.ok || first.reason === 'content_filter') return first;

    console.error('[ai/provider] principal falhou, tentando o reserva:', first.reason);
    const second = await this.secondary.complete(messages, options);
    // Se o reserva também não está configurado, o erro útil é o do principal.
    return !second.ok && second.reason === 'missing_api_key' ? first : second;
  }
}

export function getAIProvider(): AIProvider {
  const forced = process.env.AI_PROVIDER;
  if (forced === 'groq') return new GroqProvider();
  if (forced === 'gemini') return new GeminiProvider();
  if (process.env.GEMINI_API_KEY) return new FallbackProvider(new GeminiProvider(), new GroqProvider());
  return new GroqProvider();
}

export async function completeWithAI(
  messages: AIMessage[],
  options?: AICompletionOptions,
): Promise<AICompletionResult> {
  return getAIProvider().complete(messages, options);
}
