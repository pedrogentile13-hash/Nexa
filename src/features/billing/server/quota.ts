import { checkAiQuota, type AiFeature, type QuotaResult } from '@/lib/ai/quota';
import { upgradeHint } from '../lib/plans';
import { getPlanInfo } from './entitlements';

type Client = Parameters<typeof checkAiQuota>[0];

/** O limite diário de IA já com o plano da pessoa. Quem está no grátis ainda recebe a dica de assinar; escola, nunca. */
export async function checkPlanQuota(client: Client, feature: AiFeature): Promise<QuotaResult> {
  const info = await getPlanInfo();
  const result = await checkAiQuota(client, feature, info.limits.aiMultiplier);
  return result.ok ? result : { ok: false, message: result.message + upgradeHint(info.plan) };
}
