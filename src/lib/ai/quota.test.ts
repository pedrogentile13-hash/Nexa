import { describe, expect, it, vi } from 'vitest';
import { AI_DAILY_LIMITS, checkAiQuota } from './quota';

const client = (impl: () => Promise<{ data: unknown; error: unknown }>) => ({ rpc: vi.fn(impl) });

describe('checkAiQuota', () => {
  it('libera e informa quantos restam', async () => {
    const c = client(async () => ({ data: [{ allowed: true, used: 1, remaining: 39 }], error: null }));
    expect(await checkAiQuota(c, 'nexa_ia')).toEqual({ ok: true, remaining: 39 });
    expect(c.rpc).toHaveBeenCalledWith('consume_ai_quota', { p_feature: 'nexa_ia', p_daily_limit: AI_DAILY_LIMITS.nexa_ia });
  });

  it('nega com uma mensagem que diz o limite e que volta amanhã', async () => {
    const c = client(async () => ({ data: [{ allowed: false, used: 40, remaining: 0 }], error: null }));
    const r = await checkAiQuota(c, 'nexa_ia');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/40 perguntas ao NexaAI.*amanhã/);
  });

  it('FALHA ABERTA: erro do banco, função inexistente ou exceção liberam a IA', async () => {
    expect((await checkAiQuota(client(async () => ({ data: null, error: { code: '42883' } })), 'explain')).ok).toBe(true);
    expect((await checkAiQuota(client(async () => ({ data: [], error: null })), 'explain')).ok).toBe(true);
    expect((await checkAiQuota(client(async () => { throw new Error('rede'); }), 'creator')).ok).toBe(true);
  });
});
