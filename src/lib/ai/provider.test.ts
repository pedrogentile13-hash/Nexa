import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FallbackProvider, GeminiProvider, GroqProvider, geminiEndpoint, getAIProvider, type AIProvider } from './provider';

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

describe('GeminiProvider — repetição em 5xx', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  function seq(responses: { ok: boolean; status: number; body: unknown }[]) {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let i = 0;
    const fn = vi.fn().mockImplementation(async () => {
      const r = responses[Math.min(i++, responses.length - 1)]!;
      return { ok: r.ok, status: r.status, json: async () => r.body, text: async () => JSON.stringify(r.body) };
    });
    vi.stubGlobal('fetch', fn);
    return fn;
  }
  const overload = { ok: false, status: 503, body: { error: { status: 'UNAVAILABLE' } } };
  const good = { ok: true, status: 200, body: { candidates: [{ content: { parts: [{ text: 'certo' }] } }] } };
  const msg = [{ role: 'user' as const, content: 'x' }];

  it('repete no 503 e entrega a resposta quando o Google volta', async () => {
    const fn = seq([overload, overload, good]);
    const result = await new GeminiProvider([0, 0]).complete(msg);
    expect(result).toEqual({ ok: true, text: 'certo' });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('desiste depois das tentativas e devolve o 503', async () => {
    const fn = seq([overload]);
    const result = await new GeminiProvider([0, 0], ['um-modelo']).complete(msg);
    expect(result).toMatchObject({ ok: false, reason: 'http_error', status: 503 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('NÃO repete erro de configuração (403/404): seria só atrasar o diagnóstico', async () => {
    const fn = seq([{ ok: false, status: 403, body: { error: 'x' } }]);
    await new GeminiProvider([0, 0]).complete(msg);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('GeminiProvider — lista de modelos', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  const overload = { ok: false, status: 503, json: async () => ({}), text: async () => '{}' };
  const good = { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'reserva' }] } }] }) };

  it('troca para o segundo modelo quando o primeiro segue em 503', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('GEMINI_API_KEY', 'k');
    vi.stubEnv('GEMINI_MODEL', 'a-model, b-model');
    const fn = vi.fn().mockResolvedValueOnce(overload).mockResolvedValueOnce(overload).mockResolvedValueOnce(good);
    vi.stubGlobal('fetch', fn);
    const result = await new GeminiProvider([0]).complete([{ role: 'user', content: 'x' }]);
    expect(result).toEqual({ ok: true, text: 'reserva' });
    expect(String(fn.mock.calls[2]![0])).toContain('b-model');
  });

  it('não troca de modelo em 403 (erro da chave, igual em qualquer modelo)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('GEMINI_API_KEY', 'k');
    vi.stubEnv('GEMINI_MODEL', 'a-model,b-model');
    const fn = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}), text: async () => '{}' });
    vi.stubGlobal('fetch', fn);
    await new GeminiProvider([0]).complete([{ role: 'user', content: 'x' }]);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('GeminiProvider — modelo', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  async function sentBody(model: string) {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    vi.stubEnv('GEMINI_MODEL', model);
    const fn = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'x' }] } }] }),
    });
    vi.stubGlobal('fetch', fn);
    await new GeminiProvider().complete([{ role: 'user', content: 'x' }], { maxTokens: 1000 });
    return { url: String(fn.mock.calls[0]![0]), body: JSON.parse((fn.mock.calls[0]![1] as RequestInit).body as string) };
  }

  it('usa o modelo de GEMINI_MODEL na URL', async () => {
    expect((await sentBody('gemini-3.8-flash')).url).toContain('models/gemini-3.8-flash:');
  });
  it('no 2.5 flash zera o raciocínio e mantém o teto', async () => {
    const { body } = await sentBody('gemini-2.5-flash');
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(body.generationConfig.maxOutputTokens).toBe(1000);
  });
  it('em outros modelos NÃO manda parâmetro de raciocínio e dá folga ao teto', async () => {
    const { body } = await sentBody('gemini-3.8-flash');
    expect(body.generationConfig.thinkingConfig).toBeUndefined();
    expect(body.generationConfig.maxOutputTokens).toBeGreaterThan(1000);
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

describe('anexos (imagem/PDF)', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it('o Gemini recebe o arquivo como inlineData ANTES do texto', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'k');
    const fn = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'li o arquivo' }] } }] }),
    });
    vi.stubGlobal('fetch', fn);

    const result = await new GeminiProvider([]).complete([
      { role: 'user', content: 'resuma', attachments: [{ mimeType: 'application/pdf', data: 'QUJD' }] },
    ]);

    expect(result).toEqual({ ok: true, text: 'li o arquivo' });
    const body = JSON.parse((fn.mock.calls[0]![1] as { body: string }).body);
    expect(body.contents[0].parts[0]).toEqual({ inlineData: { mimeType: 'application/pdf', data: 'QUJD' } });
    expect(body.contents[0].parts[1]).toEqual({ text: 'resuma' });
  });

  it('a Groq RECUSA arquivo em vez de fingir que leu', async () => {
    vi.stubEnv('GROQ_API_KEY', 'k');
    const fn = vi.fn();
    vi.stubGlobal('fetch', fn);
    const r = await new GroqProvider().complete([{ role: 'user', content: 'x', attachments: [{ mimeType: 'image/png', data: 'AA' }] }]);
    expect(r).toEqual({ ok: false, reason: 'unsupported' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('com anexo, falha do Gemini NÃO cai no reserva de texto', async () => {
    const primary = { complete: vi.fn().mockResolvedValue({ ok: false, reason: 'http_error', status: 503 }) };
    const secondary = { complete: vi.fn() };
    const r = await new FallbackProvider(primary, secondary).complete([
      { role: 'user', content: 'x', attachments: [{ mimeType: 'image/png', data: 'AA' }] },
    ]);
    expect(r).toMatchObject({ ok: false, reason: 'http_error' });
    expect(secondary.complete).not.toHaveBeenCalled();
  });
});
