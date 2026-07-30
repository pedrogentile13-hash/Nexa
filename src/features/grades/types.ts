/**
 * Pure domain types for the grade engine.
 *
 * Deliberately independent of the database row shapes: the engine is a pure
 * function of these, which is what makes it testable, reusable for what-if
 * simulation, and safe to run on the client for optimistic UI. Mapping from
 * Supabase rows lives in `../server/mappers.ts`, never in here.
 */

export type RoundingMode = 'half_up' | 'half_even' | 'floor' | 'ceil';

/** A weighted bucket of activities — "PB", "VA", "Qualitativa". */
export interface GradingCategory {
  id: string;
  name: string;
  shortCode: string | null;
  /**
   * Share of the final grade. Not required to sum to 100 across categories:
   * the engine always normalizes by the real sum, so a half-finished
   * configuration still yields a correct average instead of a wrong one.
   */
  weightPercent: number;
  /** Discard the N lowest counted grades in this category. */
  dropLowest: number;
  sequence: number;
}

export interface GradingScheme {
  id: string;
  name: string;
  gradeMin: number;
  gradeMax: number;
  passingGrade: number;
  /** Display precision. Calculation itself is always full-precision. */
  decimals: number;
  roundingMode: RoundingMode;
  categories: GradingCategory[];
}

/** One graded (or yet-to-be-graded) item inside a category. */
export interface GradeActivity {
  id: string;
  categoryId: string;
  title: string;
  /** `null` means "not graded yet" — the basis of every projection. */
  score: number | null;
  /** Scale the score was given on. `null` falls back to the scheme's gradeMax. */
  maxScore: number | null;
  /** Peso. Strictly positive. */
  weight: number;
  isDropped: boolean;
  /** Set on a substitutiva: it retires the activity it points at. */
  replacesActivityId: string | null;
  dueDate?: string | null;
}

/** An activity plus everything the average derives from it. */
export interface EffectiveActivity extends GradeActivity {
  /** Score rescaled to the scheme's range, or `null` when ungraded. */
  normalizedScore: number | null;
  isSuperseded: boolean;
  /** Excluded by this category's dropLowest rule. */
  isDroppedByRule: boolean;
  /** Whether it contributes to the category average. */
  isCounted: boolean;
}

export interface CategoryResult {
  category: GradingCategory;
  /** `null` when nothing in this category is graded yet. */
  average: number | null;
  activityCount: number;
  countedCount: number;
  pendingCount: number;
  countedWeight: number;
  activities: EffectiveActivity[];
}

export interface SubjectTermResult {
  /**
   * Weighted mean of the categories that actually have grades. A term with only
   * PB posted reports the PB average — not a pessimistic third of it.
   */
  averageCurrent: number | null;
  /** Honesty gauge for `averageCurrent`: how much of the term it covers. */
  coveragePercent: number;
  /** `finalGradeOverride` when present, else `averageCurrent`. */
  finalGrade: number | null;
  isOverridden: boolean;
  weightTotal: number;
  gradedWeight: number;
  categories: CategoryResult[];
  activityCount: number;
  pendingCount: number;
  isBelowPassing: boolean;
  isBelowTarget: boolean;
  targetGrade: number | null;
}

export interface SubjectTermInput {
  scheme: GradingScheme;
  activities: GradeActivity[];
  targetGrade?: number | null;
  finalGradeOverride?: number | null;
}
