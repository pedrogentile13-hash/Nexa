/**
 * Limite diário de uso da IA, por aluno e por recurso.
 *
 * Os números ficam aqui (e não no banco) para ajustá-los sem migração. O banco
 * só conta, de forma atômica (`consume_ai_quota`).
 *
 * FALHA ABERTA de propósito: se a função não existe (SQL ainda não rodou) ou o
 * banco não responde, a IA funciona normalmente. Um limite que derruba o
 * recurso quando quebra é pior do que a falta de limite.
 */

export const AI_DAILY_LIMITS = {
  nexa_ia: 40, // perguntas ao NexaAI
  explain: 60, // "Explicar com IA" em resumos
  creator: 10, // Quiz/Resumo com IA
} as const;

export type AiFeature = keyof typeof AI_DAILY_LIMITS;

const LABEL: Record<AiFeature, string> = {
  nexa_ia: 'perguntas ao NexaAI',
  explain: 'explicações de hoje',
  creator: 'criações com IA de hoje',
};

interface QuotaClient {
  rpc: (
    fn: 'consume_ai_quota',
    args: { p_feature: string; p_daily_limit: number },
  ) => PromiseLike<{ data: unknown; error: unknown }>;
}

export type QuotaResult = { ok: true; remaining: number | null } | { ok: false; message: string };

export async function checkAiQuota(client: QuotaClient, feature: AiFeature): Promise<QuotaResult> {
  const limit = AI_DAILY_LIMITS[feature];
  try {
    const { data, error } = await client.rpc('consume_ai_quota', { p_feature: feature, p_daily_limit: limit });
    if (error) return { ok: true, remaining: null };

    const row = (data as { allowed: boolean; remaining: number }[] | null)?.[0];
    if (!row) return { ok: true, remaining: null };
    if (!row.allowed) {
      return {
        ok: false,
        message: `Você usou todas as ${limit} ${LABEL[feature]}. O limite volta amanhã — e você ainda pode estudar pelos resumos e simulados.`,
      };
    }
    return { ok: true, remaining: row.remaining };
  } catch {
    return { ok: true, remaining: null };
  }
}
