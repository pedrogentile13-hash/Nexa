/**
 * Planos do Nexa.
 *
 * Duas casas no mesmo sistema:
 *   · Nexa Escolas — quem tem escola vinculada (`school`): sem anúncios, sem cobrança. O contrato é da escola.
 *   · Nexa padrão (Estudos e Vestibular) — `free` (com anúncios), `plus` e `pro` (sem anúncios, limites maiores).
 *
 * Os números ficam aqui (e não no banco) para ajustar sem migração, como em `ai/quota.ts`.
 */

import { COIN_ALLOWANCE } from '@/lib/ai/coins';

export type Plan = 'school' | 'free' | 'plus' | 'pro';
export type PaidPlan = 'plus' | 'pro';
export type BillingInterval = 'month' | 'year';

export interface PlanLimits {
  /** Saldo mensal de Nexa Coins (`ai/coins.ts`). */
  coins: number;
  /** Materiais (PDF, imagem, texto) guardados na Biblioteca. */
  libraryDocs: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  school: { coins: COIN_ALLOWANCE.school, libraryDocs: 30 }, // igual ao que o aluno de escola já tem
  free: { coins: COIN_ALLOWANCE.free, libraryDocs: 10 },
  plus: { coins: COIN_ALLOWANCE.plus, libraryDocs: 60 },
  pro: { coins: COIN_ALLOWANCE.pro, libraryDocs: 300 },
};

export interface Entitlements {
  plan: Plan;
  /** Anúncios só no Nexa padrão gratuito. */
  adsEnabled: boolean;
  /** A tela Nexa Pro e os botões de assinar só existem fora das escolas. */
  billingVisible: boolean;
  limits: PlanLimits;
}

export function entitlementsFor(plan: Plan): Entitlements {
  return {
    plan,
    adsEnabled: plan === 'free',
    billingVisible: plan !== 'school',
    limits: PLAN_LIMITS[plan],
  };
}

/** Sem informação (SQL ainda não rodou, erro de rede): trata como grátis — nunca como escola nem como pago. */
export const FALLBACK_ENTITLEMENTS = entitlementsFor('free');

export function parsePlan(value: unknown): Plan {
  return value === 'school' || value === 'plus' || value === 'pro' || value === 'free' ? value : 'free';
}

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'plus' || value === 'pro';
}

/** Preços exibidos na tela (em centavos). Precisam bater com os preços criados no Stripe. */
export const PLAN_PRICES: Record<PaidPlan, Record<BillingInterval, number>> = {
  plus: { month: 1990, year: 19900 },
  pro: { month: 3990, year: 39900 },
};

export const PLAN_LABEL: Record<Plan, string> = { school: 'Nexa Escolas', free: 'Grátis', plus: 'Nexa Plus', pro: 'Nexa Pro' };

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Quanto o plano anual economiza, em meses grátis (ex.: 19900 vs 12×1990 → 2 meses). */
export function yearlyFreeMonths(plan: PaidPlan): number {
  const monthly = PLAN_PRICES[plan].month;
  return Math.round((monthly * 12 - PLAN_PRICES[plan].year) / monthly);
}

/** Mensagem de limite para quem ainda pode assinar (no Nexa Escolas não se fala em plano). */
export function upgradeHint(plan: Plan): string {
  return plan === 'free' ? ' Com o Nexa Plus ou Pro você ganha mais.' : '';
}
