import type {
  ActivityRow,
  GradingSchemeCategoryRow,
  GradingSchemeRow,
  VSubjectTermAverageRow,
} from '@/types/database.types';
import type { GradeActivity, GradingCategory, GradingScheme, SubjectTermInput } from '../types';
import { formatGrade } from '../lib/rounding';

/**
 * The single seam between database rows and the pure domain model.
 *
 * Keeping it here means the engine never learns about snake_case, and a schema
 * rename touches this file instead of every calculation. It also normalizes
 * `numeric` columns: Supabase returns Postgres numerics as JavaScript numbers,
 * but a `null` weight or a string slipping through would silently poison an
 * average, so each one is coerced with an explicit fallback.
 */

function num(value: number | string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toGradingCategory(row: GradingSchemeCategoryRow): GradingCategory {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    weightPercent: num(row.weight_percent, 0),
    dropLowest: num(row.drop_lowest, 0),
    sequence: num(row.sequence, 1),
  };
}

export function toGradingScheme(
  scheme: GradingSchemeRow,
  categories: readonly GradingSchemeCategoryRow[],
): GradingScheme {
  return {
    id: scheme.id,
    name: scheme.name,
    gradeMin: num(scheme.grade_min, 0),
    gradeMax: num(scheme.grade_max, 10),
    passingGrade: num(scheme.passing_grade, 6),
    decimals: num(scheme.decimals, 1),
    roundingMode: scheme.rounding_mode,
    categories: categories
      .filter((c) => c.scheme_id === scheme.id)
      .map(toGradingCategory)
      .sort((a, b) => a.sequence - b.sequence),
  };
}

export function toGradeActivity(row: ActivityRow): GradeActivity {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    score: numOrNull(row.score),
    maxScore: numOrNull(row.max_score),
    weight: num(row.weight, 1),
    isDropped: row.is_dropped,
    replacesActivityId: row.replaces_activity_id,
    dueDate: row.due_date,
  };
}

export function toSubjectTermInput(args: {
  scheme: GradingSchemeRow;
  categories: readonly GradingSchemeCategoryRow[];
  activities: readonly ActivityRow[];
  targetGrade?: number | string | null;
  finalGradeOverride?: number | string | null;
}): SubjectTermInput {
  return {
    scheme: toGradingScheme(args.scheme, args.categories),
    activities: args.activities.map(toGradeActivity),
    targetGrade: numOrNull(args.targetGrade),
    finalGradeOverride: numOrNull(args.finalGradeOverride),
  };
}

/**
 * Severity of a subject, for the "disciplinas críticas" list.
 *
 * Ordered so the student sees what actually needs attention first, and so an
 * empty gradebook is never presented as a problem — README Parte 3 is explicit
 * that the app must not feel like it is scolding anyone.
 */
export type SubjectRisk = 'unknown' | 'ok' | 'watch' | 'critical';

export function subjectRisk(row: VSubjectTermAverageRow): SubjectRisk {
  const grade = numOrNull(row.final_grade);
  if (grade === null) return 'unknown';

  const passing = num(row.passing_grade, 6);
  if (grade < passing) return 'critical';

  const target = numOrNull(row.target_grade);
  // Within half a point of failing, or short of the student's own goal.
  if (grade < passing + 0.5) return 'watch';
  if (target !== null && grade < target) return 'watch';

  return 'ok';
}

/**
 * Tom da nota grande no cartão da matéria.
 *
 * Quatro degraus, como o kit desenha (4,2 vermelho · 5,8 laranja · 7,4 neutro ·
 * 8,6 verde). O degrau do meio existe porque "abaixo da aprovação" abriga
 * situações muito diferentes: quem está a 0,2 da média recupera na próxima
 * prova, quem está a 1,8 precisa de um plano. Pintar as duas de vermelho apaga
 * essa diferença justamente para quem mais precisa dela.
 */
export type GradeTone = 'danger' | 'warning' | 'neutral' | 'success';

export function gradeTone(grade: number | null, passing: number, target: number | null): GradeTone {
  if (grade === null) return 'neutral';
  if (grade < passing - 1) return 'danger';
  if (grade < passing) return 'warning';
  if (target !== null && grade < target) return 'neutral';
  return 'success';
}

/**
 * A etiqueta que explica a nota em uma frase curta.
 *
 * Sempre mede contra a referência que importa naquele momento: quem está abaixo
 * da aprovação precisa saber quanto falta para passar, não quanto falta para a
 * meta pessoal — que naquele ponto é uma preocupação de segunda ordem.
 */
export function gradeHint(
  grade: number | null,
  passing: number,
  target: number | null,
): { label: string; tone: GradeTone } | null {
  if (grade === null) return null;

  if (grade < passing) {
    return { label: `${formatGrade(passing - grade, 1)} abaixo da aprovação`, tone: 'danger' };
  }
  if (target !== null && grade < target) {
    return { label: `${formatGrade(target - grade, 1)} para a meta`, tone: 'warning' };
  }
  return { label: 'meta batida', tone: 'success' };
}
