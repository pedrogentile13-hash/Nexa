import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { COIN_COSTS, COIN_LABEL, allowanceFor, type CoinFeature } from '@/lib/ai/coins';
import { getPlanInfo } from './entitlements';

export interface CoinBalance {
  allowance: number;
  spent: number;
  remaining: number;
  byFeature: { feature: CoinFeature; label: string; coins: number; uses: number }[];
}

/** Saldo de Nexa Coins do mês. `null` quando o SQL das moedas ainda não rodou (a tela só esconde o saldo). */
export const getCoinBalance = cache(async (): Promise<CoinBalance | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('my_ai_coin_usage');
    if (error || !data) return null;
    const { plan } = await getPlanInfo();
    const allowance = allowanceFor(plan);
    const byFeature = data
      .filter((r) => r.feature in COIN_COSTS)
      .map((r) => ({ feature: r.feature as CoinFeature, label: COIN_LABEL[r.feature as CoinFeature], coins: r.coins, uses: r.uses }));
    const spent = byFeature.reduce((sum, r) => sum + r.coins, 0);
    return { allowance, spent, remaining: Math.max(allowance - spent, 0), byFeature };
  } catch {
    return null;
  }
});
