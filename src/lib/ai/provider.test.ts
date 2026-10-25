import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FallbackProvider, GeminiProvider, geminiEndpoint, getAIProvider, type AIProvider } from './provider';

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'chave-de-teste');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function mockFetch(body: unknown, ok = true, status = 200) {
    const fn = vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('devolve missing_api_key sem chave, sem chamar a rede', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fn = mockFetch({});
    const result = await new GeminiProvider().complete([{ role: 'user', content: 'oi' }]);
    expect(result).toEqual({ ok: false, reason: 'missing_api_key' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('manda a chave no cabeçalho, nunca na URL', async () => {
    const fn = mockFetch({ candidates: [{ content: { parts: [{ text: 'olá' }] } }] });
    await new GeminiProvider().complete([{ role: 'user', content: 'oi' }]);
    const [url, init] = fn.mock.calls[0]!;
    expect(String(url)).not.toContain('chave-de-teste');
    expect((init as RequestInit).headers).toMatchObject({ 'x-goog-api-key': 'chave-de-teste' });
  });

  it('separa a instrução de sistema e troca assistant por model', async () => {
    const fn = mockFetch({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiProvider().complete([
      { role: 'system', content: 'Seja breve.' },
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
    ]);
    const body = JSON.parse((fn.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.systemInstruction.parts[0].text).toBe('Seja breve.');
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model']);
  });

  it('junta as partes do texto', async () => {
    mockFetch({ candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] });
    const result = await new GeminiProvider().complete([{ role: 'user', content: 'x' }]);
    expect(result).toEqual({ ok: true, text: 'ab' });
  });

  it('classifica bloqueio de segurança como content_filter', async () => {
    mockFetch({ candidates: [{ finishReason: 'SAFETY' }] });
    const result = await new GeminiProvider().complete([{ role: 'user', content: 'x' }]);
    expect(result).toEqual({ ok: false, reason: 'content_filter' });
  });

  it('propaga o status de erro HTTP', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch({ error: 'cota' }, false, 429);
    const result = await new GeminiProvider().complete([{ role: 'user', content: 'x' }]);
    // `detail` carrega o corpo do erro do provedor: é ele que diz POR QUE foi 429.
    expect(result).toEqual({ ok: false, reason: 'http_error', status: 429, detail: '{"error":"cota"}' });
  });
});

describe('getAIProvider', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('usa Gemini com reserva quando há a chave, e só Groq sem ela', () => {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    expect(getAIProvider()).toBeInstanceOf(FallbackProvider);
    vi.stubEnv('GEMINI_API_KEY', '');
    expect(getAIProvider()).not.toBeInstanceOf(GeminiProvider);
  });

  it('AI_PROVIDER=groq vence a presença da chave do Gemini', () => {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    vi.stubEnv('AI_PROVIDER', 'groq');
    expect(getAIProvider()).not.toBeInstanceOf(GeminiProvider);
  });
});

describe('geminiEndpoint', () => {
  it('usa sempre o Gemini API, inclusive para chaves AQ. (regressão: já foram mandadas ao Vertex, que deu 403)', () => {
    expect(geminiEndpoint('gemini-2.5-flash')).toContain('generativelanguage.googleapis.com');
    expect(geminiEndpoint('gemini-2.5-flash')).not.toContain('aiplatform');
  });
});

describe('FallbackProvider', () => {
  const ok: AIProvider = { complete: async () => ({ ok: true, text: 'reserva' }) };
  const fail: AIProvider = { complete: async () => ({ ok: false, reason: 'http_error', status: 403 }) };
  const filtered: AIProvider = { complete: async () => ({ ok: false, reason: 'content_filter' }) };
  const noKey: AIProvider = { complete: async () => ({ ok: false, reason: 'missing_api_key' }) };
  const msg = [{ role: 'user' as const, content: 'x' }];

  it('cai pro reserva quando o principal falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await new FallbackProvider(fail, ok).complete(msg)).toEqual({ ok: true, text: 'reserva' });
  });
  it('NÃO contorna o filtro de conteúdo mandando pro reserva', async () => {
    expect(await new FallbackProvider(filtered, ok).complete(msg)).toEqual({ ok: false, reason: 'content_filter' });
  });
  it('reporta o erro do principal se o reserva nem está configurado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await new FallbackProvider(fail, noKey).complete(msg)).toEqual({ ok: false, reason: 'http_error', status: 403 });
  });
});
