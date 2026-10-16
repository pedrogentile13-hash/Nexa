import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiProvider, getAIProvider } from './provider';

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
    expect(result).toEqual({ ok: false, reason: 'http_error', status: 429 });
  });
});

describe('getAIProvider', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('usa Gemini quando há a chave, e volta pra Groq sem ela', () => {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    expect(getAIProvider()).toBeInstanceOf(GeminiProvider);
    vi.stubEnv('GEMINI_API_KEY', '');
    expect(getAIProvider()).not.toBeInstanceOf(GeminiProvider);
  });

  it('AI_PROVIDER=groq vence a presença da chave do Gemini', () => {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    vi.stubEnv('AI_PROVIDER', 'groq');
    expect(getAIProvider()).not.toBeInstanceOf(GeminiProvider);
  });
});
