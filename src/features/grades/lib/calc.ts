import type {
  CategoryResult,
  EffectiveActivity,
  GradeActivity,
  GradingCategory,
  GradingScheme,
  SubjectTermInput,
  SubjectTermResult,
} from '../types';

/**
 * The grade engine.
 *
 * ── Why this exists alongside the SQL views ────────────────────────────────
 * `supabase/migrations/…_grade_views.sql` is the AUTHORITY: it is what every
 * list, dashboard and chart reads, so all clients agree on every number. This
 * module is its mirror, and it earns its keep in two places SQL cannot reach:
 *
 *   1. Optimistic UI. Typing a grade must move the average in the same frame —
 *      a round trip before the number updates is the difference between
 *      "feels like an app" and "feels like a website".
 *   2. What-if simulation. "If I get an 8 on the PB, where do I land?" runs
 *      against hypothetical activities that do not exist in the database.
 *
 * The two implementations are kept honest by running the SAME fixtures with the
 * SAME expected values in both suites: see `calc.test.ts` and
 * `supabase/tests/10_grading.test.sql` (README Parte 2's worked example → 6.8,
 * the three-category final → 7.53, dropLowest → 8.5, 18/20 → 9).
 * Change one, and the other's assertions fail.
 *
 * ── The rules, in order ───────────────────────────────────────────────────
 *  1. Normalize: `score / maxScore × gradeMax`, so a test out of 20 and one out
 *     of 10 live in the same category.
 *  2. An activity counts unless it is ungraded, manually dropped, superseded by
 *     a substitutiva, or removed by the category's `dropLowest`.
 *  3. Category average = weighted mean of counted activities (peso = weight).
 *  4. Final = weighted mean of category averages, normalized over the
 *     categories that ACTUALLY have grades.
 */

/** Rescales a raw score onto the scheme's range. */
export function normalizeScore(
  score: number | null,
  maxScore: number | null,
  gradeMax: number,
): number | null {
  if (score === null) return null;
  const scale = maxScore ?? gradeMax;
  if (!scale) return null;
  return (score / scale) * gradeMax;
}

/**
 * Resolves the derived flags for every activity of a subject×term.
 *
 * `dropLowest` is applied per category and only among *eligible* activities, so
 * ungraded rows never absorb a drop slot — the student loses their worst real
 * grade, which is what the rule is for.
 */
export function computeEffectiveActivities(
  activities: readonly GradeActivity[],
  scheme: GradingScheme,
): EffectiveActivity[] {
  const supersededIds = new Set(
    activities
      .filter((a) => a.replacesActivityId !== null && a.score !== null)
      .map((a) => a.replacesActivityId as string),
  );

  const dropLowestByCategory = new Map(scheme.categories.map((c) => [c.id, c.dropLowest]));

  const base = activities.map((activity) => {
    const normalizedScore = normalizeScore(activity.score, activity.maxScore, scheme.gradeMax);
    const isSuperseded = supersededIds.has(activity.id);
    const eligible = activity.score !== null && !activity.isDropped && !isSuperseded;
    return { activity, normalizedScore, isSuperseded, eligible };
  });

  // Which activities the dropLowest rule removes, per category.
  const droppedByRule = new Set<string>();
  for (const [categoryId, dropLowest] of dropLowestByCategory) {
    if (dropLowest <= 0) continue;
    const eligible = base
      .filter((b) => b.eligible && b.activity.categoryId === categoryId)
      .sort(
        (a, b) =>
          (a.normalizedScore ?? 0) - (b.normalizedScore ?? 0) ||
          a.activity.id.localeCompare(b.activity.id),
      );
    for (const item of eligible.slice(0, dropLowest)) {
      droppedByRule.add(item.activity.id);
    }
  }

  return base.map(({ activity, normalizedScore, isSuperseded, eligible }) => {
    const isDroppedByRule = droppedByRule.has(activity.id);
    return {
      ...activity,
      normalizedScore,
      isSuperseded,
      isDroppedByRule,
      isCounted: eligible && !isDroppedByRule,
    };
  });
}

/** Weighted mean of the counted activities. `null` when nothing counts yet. */
export function computeCategoryResult(
  category: GradingCategory,
  effective: readonly EffectiveActivity[],
): CategoryResult {
  const mine = effective.filter((a) => a.categoryId === category.id);
  const counted = mine.filter((a) => a.isCounted);

  const countedWeight = counted.reduce((sum, a) => sum + a.weight, 0);
  const weightedSum = counted.reduce((sum, a) => sum + (a.normalizedScore ?? 0) * a.weight, 0);

  return {
    category,
    average: countedWeight > 0 ? weightedSum / countedWeight : null,
    activityCount: mine.length,
    countedCount: counted.length,
    pendingCount: mine.filter((a) => a.score === null).length,
    countedWeight,
    activities: mine,
  };
}

/**
 * Full result for one subject in one term: per-category averages, the current
 * final average, and how much of the term that average is based on.
 */
export function computeSubjectTerm(input: SubjectTermInput): SubjectTermResult {
  const { scheme, activities, targetGrade = null, finalGradeOverride = null } = input;

  const effective = computeEffectiveActivities(activities, scheme);
  const categories = [...scheme.categories]
    .sort((a, b) => a.sequence - b.sequence)
    .map((category) => computeCategoryResult(category, effective));

  const weightTotal = categories.reduce((sum, c) => sum + c.category.weightPercent, 0);
  const graded = categories.filter((c) => c.average !== null);
  const gradedWeight = graded.reduce((sum, c) => sum + c.category.weightPercent, 0);

  const averageCurrent =
    gradedWeight > 0
      ? graded.reduce((sum, c) => sum + (c.average as number) * c.category.weightPercent, 0) /
        gradedWeight
      : null;

  const finalGrade = finalGradeOverride ?? averageCurrent;

  return {
    averageCurrent,
    coveragePercent: weightTotal > 0 ? (gradedWeight / weightTotal) * 100 : 0,
    finalGrade,
    isOverridden: finalGradeOverride !== null,
    weightTotal,
    gradedWeight,
    categories,
    activityCount: effective.length,
    pendingCount: effective.filter((a) => a.score === null).length,
    isBelowPassing: finalGrade !== null && finalGrade < scheme.passingGrade,
    isBelowTarget: finalGrade !== null && targetGrade !== null && finalGrade < targetGrade,
    targetGrade,
  };
}

/**
 * Overall average across subjects, for a term.
 *
 * Subjects weigh equally on purpose: no school computes a bulletin mean that
 * values Matemática above Artes, and inventing one would surprise the student.
 */
export function computeOverallAverage(finalGrades: readonly (number | null)[]): number | null {
  const graded = finalGrades.filter((g): g is number => g !== null);
  if (graded.length === 0) return null;
  return graded.reduce((sum, g) => sum + g, 0) / graded.length;
}
