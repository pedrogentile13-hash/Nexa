import { describe, expect, it, vi } from 'vitest';
import { checkAiQuota, refundAiCoins } from './quota';
import { COIN_ALLOWANCE, COIN_COSTS, allowanceFor, howMany } from './coins';

const client = (impl: () => Promise<{ data: unknown; error: unknown }>) => ({ rpc: vi.fn(impl) });

describe('checkAiQuota (Nexa Coin)', () => {
  it('gasta o custo da ação e informa o saldo', async () => {
    const c = client(async () => ({ data: [{ allowed: true, spent: 8, remaining: 142 }], error: null }));
    expect(await checkAiQuota(c, 'essay', 150)).toEqual({ ok: true, remaining: 142, cost: COIN_COSTS.essay });
    expect(c.rpc).toHaveBeenCalledWith('spend_ai_coins', { p_feature: 'essay', p_cost: COIN_COSTS.essay, p_allowance: 150 });
  });

  it('nega quando o saldo acabou, dizendo o custo e o que sobra', async () => {
    const c = client(async () => ({ data: [{ allowed: false, spent: 145, remaining: 5 }], error: null }));
    const r = await checkAiQuota(c, 'essay_pro', 150);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/Nexa Coins.*PRO.*custa 30.*restam 5/);
  });

  it('o painel da equipe usa limite diário, não moedas', async () => {
    const c = client(async () => ({ data: [{ allowed: true, used: 1, remaining: 149 }], error: null }));
    expect(await checkAiQuota(c, 'staff_ia', 1)).toEqual({ ok: true, remaining: 149, cost: 0 });
    expect(c.rpc).toHaveBeenCalledWith('consume_ai_quota', { p_feature: 'staff_ia', p_daily_limit: 150 });
  });

  it('FALHA ABERTA: erro do banco, função inexistente ou exceção liberam a IA', async () => {
    expect((await checkAiQuota(client(async () => ({ data: null, error: { code: '42883' } })), 'explain', 150)).ok).toBe(true);
    expect((await checkAiQuota(client(async () => ({ data: [], error: null })), 'explain', 150)).ok).toBe(true);
    expect((await checkAiQuota(client(async () => { throw new Error('rede'); }), 'quiz', 150)).ok).toBe(true);
  });

  it('estorna as moedas, mas nunca de recurso diário nem de custo zero', async () => {
    const c = client(async () => ({ data: null, error: null }));
    await refundAiCoins(c, 'essay', 8);
    expect(c.rpc).toHaveBeenCalledWith('refund_ai_coins', { p_feature: 'essay', p_cost: 8 });
    await refundAiCoins(c, 'staff_ia', 1);
    await refundAiCoins(c, 'essay', 0);
    expect(c.rpc).toHaveBeenCalledTimes(1);
  });
});

describe('Nexa Coin — tabela', () => {
  it('quanto mais avançada a ação, mais cara', () => {
    expect(COIN_COSTS.nexa_ia).toBeLessThan(COIN_COSTS.summary);
    expect(COIN_COSTS.summary).toBeLessThan(COIN_COSTS.quiz);
    expect(COIN_COSTS.essay).toBeLessThan(COIN_COSTS.essay_pro);
  });
  it('os planos pagos têm mais moedas e plano desconhecido vira grátis', () => {
    expect(COIN_ALLOWANCE.plus).toBeGreaterThan(COIN_ALLOWANCE.free);
    expect(COIN_ALLOWANCE.pro).toBeGreaterThan(COIN_ALLOWANCE.plus);
    expect(allowanceFor('xyz')).toBe(COIN_ALLOWANCE.free);
    expect(howMany('free', 'essay_pro')).toBeGreaterThanOrEqual(1);
  });
});
