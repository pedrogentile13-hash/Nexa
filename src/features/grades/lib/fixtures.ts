import type { GradeActivity, GradingScheme } from '../types';

/**
 * Shared test fixtures.
 *
 * These mirror `supabase/tests/10_grading.test.sql` case for case. Both suites
 * assert the SAME numbers on the SAME inputs — that is what keeps the SQL views
 * (the authority) and the TypeScript engine (the optimistic mirror) from
 * drifting apart. If you change a rule, both suites must be updated together,
 * and if you change only one, the other fails.
 */

/** PB 35% · VA 35% · Qualitativa 30% on a 0–10 scale — README Parte 1 default. */
export function defaultScheme(overrides: Partial<GradingScheme> = {}): GradingScheme {
  return {
    id: 'scheme-1',
    name: 'Padrão da escola',
    gradeMin: 0,
    gradeMax: 10,
    passingGrade: 6,
    decimals: 1,
    roundingMode: 'half_up',
    categories: [
      {
        id: 'pb',
        name: 'Prova Bimestral',
        shortCode: 'PB',
        weightPercent: 35,
        dropLowest: 0,
        sequence: 1,
      },
      {
        id: 'va',
        name: 'Verificação de Aprendizagem',
        shortCode: 'VA',
        weightPercent: 35,
        dropLowest: 0,
        sequence: 2,
      },
      {
        id: 'ql',
        name: 'Qualitativa',
        shortCode: 'QL',
        weightPercent: 30,
        dropLowest: 0,
        sequence: 3,
      },
    ],
    ...overrides,
  };
}

export function activity(
  partial: Partial<GradeActivity> & { id: string; categoryId: string },
): GradeActivity {
  return {
    title: partial.id,
    score: null,
    maxScore: null,
    weight: 1,
    isDropped: false,
    replacesActivityId: null,
    ...partial,
  };
}

/**
 * The worked example from README Parte 2:
 *   Lista 1 · nota 8 · peso 2
 *   Lista 2 · nota 10 · peso 1
 *   Prova   · nota 6 · peso 7
 *   → (8·2 + 10·1 + 6·7) / 10 = 6,8
 */
export function readmePbActivities(): GradeActivity[] {
  return [
    activity({ id: 'lista-1', categoryId: 'pb', title: 'Lista 1', score: 8, weight: 2 }),
    activity({ id: 'lista-2', categoryId: 'pb', title: 'Lista 2', score: 10, weight: 1 }),
    activity({ id: 'prova', categoryId: 'pb', title: 'Prova', score: 6, weight: 7 }),
  ];
}
