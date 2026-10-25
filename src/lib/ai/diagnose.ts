import { GeminiProvider, geminiModels, GroqProvider, type AICompletionResult, type AIProvider } from './provider';

/**
 * Diagnóstico dos provedores de IA, para o painel do admin.
 *
 * Existe porque "Não consegui pensar numa resposta" não diz NADA: a causa
 * (chave inválida, modelo aposentado, cota, variável ausente) só estava no
 * log do servidor, que quase ninguém abre. Aqui cada provedor é testado
 * SEPARADAMENTE — com o reserva automático ligado, um Gemini quebrado fica
 * escondido atrás de uma Groq que responde, e vice-versa.
 *
 * Nunca devolve o valor de uma chave. Só diz se existe e de que FORMATO é
 * (os 4 primeiros caracteres identificam o tipo, não o segredo).
 */

export interface ProviderDiagnosis {
  name: 'Gemini' | 'Groq';
  configured: boolean;
  /** Ex.: "AIza…" ou "AQ.…" (Gemini API), "gsk_…" (Groq). Nunca a chave. */
  keyShape: string | null;
  tested: boolean;
  ok: boolean | null;
  summary: string;
  detail: string | null;
}

function shapeOf(key: string | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('AIza')) return 'AIza… (Google AI Studio)';
  if (key.startsWith('AQ.')) return 'AQ.… (Gemini API)';
  if (key.startsWith('gsk_')) return 'gsk_… (Groq)';
  return `${key.slice(0, 3)}… (formato desconhecido)`;
}

function explain(name: string, r: AICompletionResult): { summary: string; detail: string | null } {
  if (r.ok) return { summary: `Respondeu: "${r.text.slice(0, 60)}"`, detail: null };
  switch (r.reason) {
    case 'missing_api_key':
      return { summary: 'Variável de ambiente não encontrada pelo app.', detail: null };
    case 'content_filter':
      return { summary: 'Bloqueado pelo filtro de conteúdo do provedor.', detail: null };
    case 'empty':
      return { summary: 'O provedor respondeu, mas sem texto.', detail: null };
    case 'network':
      return { summary: 'Falha de rede ou tempo esgotado ao chamar o provedor.', detail: null };
    case 'http_error': {
      const hint: Record<number, string> = {
        400: 'Requisição recusada — chave de formato errado ou parâmetro inválido.',
        401: 'Chave inválida ou expirada.',
        403: 'Chave sem permissão para esta API (ou API não habilitada no projeto).',
        404: name === 'Gemini' ? 'Modelo não existe ou foi aposentado — defina GEMINI_MODEL.' : 'Modelo não existe.',
        429: 'Limite de uso estourado — camada gratuita esgotada ou falta faturamento.',
      };
      return { summary: `HTTP ${r.status}. ${hint[r.status] ?? 'Erro do provedor.'}`, detail: r.detail ?? null };
    }
  }
}

async function test(name: ProviderDiagnosis['name'], provider: AIProvider, key: string | undefined): Promise<ProviderDiagnosis> {
  const base = { name, configured: Boolean(key), keyShape: shapeOf(key) };
  if (!key) {
    return { ...base, tested: false, ok: null, summary: 'Sem chave configurada neste ambiente.', detail: null };
  }
  const result = await provider.complete(
    [{ role: 'user', content: 'Responda apenas: ok' }],
    { maxTokens: 32, temperature: 0, timeoutMs: 15_000 },
  );
  const { summary, detail } = explain(name, result);
  return { ...base, tested: true, ok: result.ok, summary, detail };
}

export async function diagnoseAI(run: boolean): Promise<ProviderDiagnosis[]> {
  const gemini = process.env.GEMINI_API_KEY;
  const groq = process.env.GROQ_API_KEY;

  if (!run) {
    return [
      { name: 'Gemini', configured: Boolean(gemini), keyShape: shapeOf(gemini), tested: false, ok: null, summary: 'Ainda não testado.', detail: null },
      { name: 'Groq', configured: Boolean(groq), keyShape: shapeOf(groq), tested: false, ok: null, summary: 'Ainda não testado.', detail: null },
    ];
  }
  // Um teste por modelo da lista, cada um isolado: assim aparece qual responde
  // e qual está sobrecarregado/aposentado, em vez de o reserva mascarar o principal.
  const geminiRows = Promise.all(
    geminiModels().map(async (model) => {
      const row = await test('Gemini', new GeminiProvider([], [model]), gemini);
      return { ...row, summary: `[${model}] ${row.summary}` };
    }),
  );
  const [g, r] = await Promise.all([geminiRows, test('Groq', new GroqProvider(), groq)]);
  return [...g, r];
}
