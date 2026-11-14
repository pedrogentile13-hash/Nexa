/**
 * Controle de uso da IA.
 *
 *   · Alunos: Nexa Coin (`coins.ts`) — cada ação custa moedas e o plano traz um saldo mensal.
 *   · Painel da equipe: um limite diário próprio (`consume_ai_quota`), fora das moedas.
 *
 * Os números ficam no app (e não no banco) para ajustar sem migração. O banco só conta, de forma atômica.
 *
 * FALHA ABERTA de propósito: se a função não existe (SQL ainda não rodou) ou o banco não responde, a IA funciona
 * normalmente. Um limite que derruba o recurso quando quebra é pior do que a falta de limite.
 */
import { COIN_COSTS, COIN_LABEL, STAFF_DAILY_LIMIT, type CoinFeature, type DailyFeature } from './coins';

export type AiFeature = CoinFeature | DailyFeature;

interface QuotaClient {
  rpc(fn: 'consume_ai_quota', args: { p_feature: string; p_daily_limit: number }): PromiseLike<{ data: unknown; error: unknown }>;
  rpc(fn: 'spend_ai_coins', args: { p_feature: string; p_cost: number; p_allowance: number }): PromiseLike<{ data: unknown; error: unknown }>;
  rpc(fn: 'refund_ai_coins', args: { p_feature: string; p_cost: number }): PromiseLike<{ data: unknown; error: unknown }>;
}

export type QuotaResult =
  | { ok: true; remaining: number | null; cost: number }
  | { ok: false; message: string };

function isDaily(feature: AiFeature): feature is DailyFeature {
  return feature === 'staff_ia';
}

/** Gasta as moedas desta ação. `allowance` é o saldo mensal do plano da pessoa. */
export async function checkAiQuota(client: QuotaClient, feature: AiFeature, allowance: number): Promise<QuotaResult> {
  try {
    if (isDaily(feature)) {
      const { data, error } = await client.rpc('consume_ai_quota', { p_feature: feature, p_daily_limit: STAFF_DAILY_LIMIT });
      if (error) return { ok: true, remaining: null, cost: 0 };
      const row = (data as { allowed: boolean; remaining: number }[] | null)?.[0];
      if (!row) return { ok: true, remaining: null, cost: 0 };
      if (!row.allowed) return { ok: false, message: `Você usou todas as ${STAFF_DAILY_LIMIT} perguntas à NexaAI do painel de hoje. O limite volta amanhã.` };
      return { ok: true, remaining: row.remaining, cost: 0 };
    }

    const cost = COIN_COSTS[feature];
    const { data, error } = await client.rpc('spend_ai_coins', { p_feature: feature, p_cost: cost, p_allowance: allowance });
    if (error) return { ok: true, remaining: null, cost: 0 };
    const row = (data as { allowed: boolean; spent: number; remaining: number }[] | null)?.[0];
    if (!row) return { ok: true, remaining: null, cost: 0 };
    if (!row.allowed) {
      return {
        ok: false,
        message: `Suas Nexa Coins deste mês acabaram (${COIN_LABEL[feature]} custa ${cost}; restam ${row.remaining}). O saldo renova no começo do mês — e você ainda pode estudar pelos resumos e simulados.`,
      };
    }
    return { ok: true, remaining: row.remaining, cost };
  } catch {
    return { ok: true, remaining: null, cost: 0 };
  }
}

/** A IA falhou depois de cobrar: devolve as moedas. Nunca quebra o fluxo. */
export async function refundAiCoins(client: QuotaClient, feature: AiFeature, cost: number): Promise<void> {
  if (isDaily(feature) || cost < 1) return;
  try {
    await client.rpc('refund_ai_coins', { p_feature: feature, p_cost: cost });
  } catch {
    // sem estorno: não vale derrubar a resposta de erro por isso
  }
}
