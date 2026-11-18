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

/** Contas com Nexa Pro de cortesia. Troque por `NEXA_PRO_FREE_EMAILS` (e-mails separados por vírgula) sem mexer no código. */
const DEFAULT_PRO_EMAILS = ['pedrogentile13@gmail.com'];

export function isComplimentaryPro(email: string | null | undefined, env = process.env.NEXA_PRO_FREE_EMAILS): boolean {
  if (!email) return false;
  const list = env?.trim() ? env.split(',') : DEFAULT_PRO_EMAILS;
  return list.some((e) => e.trim().toLowerCase() === email.trim().toLowerCase());
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

    // Nexa Pro de cortesia: só para as contas da lista (sem cobrança, sem tela de assinatura). Escola continua sendo escola.
    if (parsePlan(row.plan) !== 'school') {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (isComplimentaryPro(user?.email)) return { ...entitlementsFor('pro'), billingVisible: false, ...NO_SUB };
    }
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
