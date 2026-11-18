/**
 * Nexa Coin — a moeda de uso da IA.
 *
 * Cada ação custa moedas; cada plano traz um saldo por mês. Tudo aqui (e não no banco) para ajustar preços e saldos
 * sem migração. O banco só conta, de forma atômica (`spend_ai_coins`).
 *
 * Os custos seguem o que cada ação realmente gasta do provedor: conversa curta é barata; ler uma foto, criar um
 * quiz inteiro ou corrigir uma redação com o modelo avançado custam bem mais.
 */

export const COIN_COSTS = {
  nexa_ia: 1, // uma pergunta ao NexaAI
  explain: 1, // "Explicar com IA" em resumos
  hint: 1, // dica dentro do simulado
  material: 2, // pergunta/leitura de material (PDF, imagem)
  summary: 4, // resumo com IA
  quiz: 6, // quiz/simulado com IA
  answer_sheet: 6, // leitura da foto do cartão-resposta
  essay: 8, // correção de redação — modelo BÁSICO
  essay_pro: 30, // correção de redação — modelo PRO (avançado + régua rígida + calibração)
  exam_ai: 12, // simulado de vestibular gerado pela IA (estilo de uma banca)
  discursive: 3, // correção por IA de UMA questão discursiva (quiz ou simulado)
} as const;

export type CoinFeature = keyof typeof COIN_COSTS;

/** Recurso do painel da equipe: segue um limite diário próprio (não consome moedas do aluno). */
export type DailyFeature = 'staff_ia';

export const STAFF_DAILY_LIMIT = 150;

export const COIN_LABEL: Record<CoinFeature, string> = {
  nexa_ia: 'Conversa com a NexaAI',
  explain: 'Explicar com IA',
  hint: 'Dica no simulado',
  material: 'Leitura de material',
  summary: 'Resumo com IA',
  quiz: 'Quiz com IA',
  answer_sheet: 'Cartão-resposta por foto',
  essay: 'Correção de redação (básico)',
  essay_pro: 'Correção de redação (PRO)',
  exam_ai: 'Simulado de vestibular com IA',
  discursive: 'Correção de questão discursiva',
};

/** Saldo mensal por plano. Escola é generosa: o contrato é da escola, e o aluno não vê cobrança. */
export const COIN_ALLOWANCE = {
  school: 600,
  free: 150,
  plus: 2000,
  pro: 6000,
} as const;

export type CoinPlan = keyof typeof COIN_ALLOWANCE;

export function allowanceFor(plan: string): number {
  return plan in COIN_ALLOWANCE ? COIN_ALLOWANCE[plan as CoinPlan] : COIN_ALLOWANCE.free;
}

/** Quantas vezes cabe uma ação no saldo do plano — para mostrar nas telas de plano. */
export function howMany(plan: CoinPlan, feature: CoinFeature): number {
  return Math.floor(COIN_ALLOWANCE[plan] / COIN_COSTS[feature]);
}
