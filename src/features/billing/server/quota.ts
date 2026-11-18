import { checkAiQuota, refundAiCoins, type AiFeature, type QuotaResult } from '@/lib/ai/quota';
import { allowanceFor } from '@/lib/ai/coins';
import { upgradeHint } from '../lib/plans';
import { getPlanInfo } from './entitlements';

type Client = Parameters<typeof checkAiQuota>[0];

/** Gasta as Nexa Coins da ação, com o saldo do plano da pessoa. Quem está no grátis ainda recebe a dica de assinar; escola, nunca. */
export async function checkPlanQuota(client: Client, feature: AiFeature): Promise<QuotaResult> {
  const info = await getPlanInfo();
  const result = await checkAiQuota(client, feature, allowanceFor(info.plan));
  return result.ok ? result : { ok: false, message: result.message + upgradeHint(info.plan) };
}

/** Devolve as moedas quando a IA não respondeu. */
export async function refundPlanQuota(client: Client, feature: AiFeature, quota: QuotaResult): Promise<void> {
  if (quota.ok) await refundAiCoins(client, feature, quota.cost);
}
