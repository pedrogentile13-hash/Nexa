import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant/server';
import { FALLBACK_ENTITLEMENTS, entitlementsFor, parsePlan, type Entitlements } from '../lib/plans';

export interface PlanInfo extends Entitlements {
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  interval: 'month' | 'year' | null;
}

const NO_SUB = { status: null, periodEnd: null, cancelAtPeriodEnd: false, interval: null } as const;

/**
 * O que esta pessoa pode ver e usar: plano, anúncios, limites.
 *
 * Duas fronteiras, as duas valendo:
 *   1. ENDEREÇO de escola (ex.: anglomorumbi.nexastudy.com.br) → sempre Nexa Escolas, mesmo para quem ainda não entrou.
 *   2. PERFIL com escola vinculada → o banco (`my_plan`) devolve `school`.
 * Falha (SQL ainda não rodou, rede): vira grátis, nunca escola nem pago.
 */
export const getPlanInfo = cache(async (): Promise<PlanInfo> => {
  if (await getTenant()) return { ...entitlementsFor('school'), ...NO_SUB };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('my_plan');
    const row = data?.[0];
    if (error || !row) return { ...FALLBACK_ENTITLEMENTS, ...NO_SUB };
    return {
      ...entitlementsFor(parsePlan(row.plan)),
      status: row.status,
      periodEnd: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      interval: row.interval_name === 'year' ? 'year' : row.interval_name === 'month' ? 'month' : null,
    };
  } catch {
    return { ...FALLBACK_ENTITLEMENTS, ...NO_SUB };
  }
});
