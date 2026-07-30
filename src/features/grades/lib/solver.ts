import type { GradeActivity, SubjectTermInput, SubjectTermResult } from '../types';
import { computeSubjectTerm } from './calc';

/**
 * The "quanto falta para a média 8?" engine.
 *
 * README Parte 1 lists that question as one of the six the product exists to
 * answer, and nothing else in the spec answers it. This module does, and it is
 * the cheapest high-value feature in Nexa: the data is already there, students
 * currently compute this by hand on paper, and getting it right converts the
 * grade screen from a record-keeper into an advisor.
 *
 * Method: bisection rather than algebra. The final average IS linear in a single
 * score, but `dropLowest` makes the closed form branch on which activity is
 * discarded, and a substitutiva changes which rows count at all. Bisection over
 * a monotonic function sidesteps every one of those special cases — raising a
 * score can only raise or hold the average — and 60 iterations lands well
 * inside display precision. Correctness beats cleverness for a number a student
 * will plan their month around.
 */

export type SolverStatus =
  /** The target holds even if everything pending scores zero. */
  | 'reached'
  /** Achievable: `requiredScore` is the minimum that gets there. */
  | 'possible'
  /** Out of reach even with perfect scores on everything remaining. */
  | 'impossible';

export interface RequiredScoreResult {
  status: SolverStatus;
  /** Minimum score needed, on the activity's own scale. `null` when impossible. */
  requiredScore: number | null;
  /** The scale `requiredScore` is expressed on (an activity's maxScore, or gradeMax). */
  scale: number;
  /** Final average if `requiredScore` is achieved. */
  projectedFinal: number | null;
  /** Final average if everything remaining is perfect — the ceiling. */
  bestPossibleFinal: number | null;
  /** Final average if everything remaining is zero — the floor. */
  worstPossibleFinal: number | null;
}

export interface UniformRequirementResult extends RequiredScoreResult {
  /** How many ungraded activities the requirement is spread across. */
  pendingCount: number;
  /** The same requirement as a fraction of each activity's own scale (0–1). */
  requiredFraction: number | null;
}

const ITERATIONS = 60;

/** Applies hypothetical scores and recomputes. The core of what-if simulation. */
export function simulate(
  input: SubjectTermInput,
  overrides: Readonly<Record<string, number | null>>,
): SubjectTermResult {
  const activities = input.activities.map((activity) =>
    Object.hasOwn(overrides, activity.id)
      ? { ...activity, score: overrides[activity.id] ?? null }
      : activity,
  );
  return computeSubjectTerm({ ...input, activities });
}

/** A hypothetical activity: only what the caller must decide is required. */
export type HypotheticalActivity = Pick<GradeActivity, 'categoryId' | 'title' | 'weight'> & {
  id?: string;
  score?: number | null;
  maxScore?: number | null;
};

/** Adds a hypothetical activity — "and if there's one more test worth 3?" */
export function withHypotheticalActivity(
  input: SubjectTermInput,
  activity: HypotheticalActivity,
): { input: SubjectTermInput; activityId: string } {
  const id = activity.id ?? `hypothetical-${Math.random().toString(36).slice(2, 10)}`;
  const full: GradeActivity = {
    id,
    categoryId: activity.categoryId,
    title: activity.title,
    weight: activity.weight,
    score: activity.score ?? null,
    maxScore: activity.maxScore ?? null,
    isDropped: false,
    replacesActivityId: null,
  };
  return { input: { ...input, activities: [...input.activities, full] }, activityId: id };
}

/**
 * Minimum score needed on ONE specific activity to reach `target`.
 *
 * Every other ungraded activity is left ungraded, i.e. excluded from the
 * average rather than assumed to be a zero. That matches how a student reads
 * the question: "if this is the next thing I'm graded on, what do I need?"
 */
export function requiredScoreForActivity(
  input: SubjectTermInput,
  activityId: string,
  target: number,
): RequiredScoreResult {
  const activity = input.activities.find((a) => a.id === activityId);
  const scale = activity?.maxScore ?? input.scheme.gradeMax;

  if (!activity) {
    return {
      status: 'impossible',
      requiredScore: null,
      scale,
      projectedFinal: null,
      bestPossibleFinal: null,
      worstPossibleFinal: null,
    };
  }

  const finalAt = (score: number): number | null =>
    simulate(input, { [activityId]: score }).finalGrade;

  return solveMonotonic({
    scale,
    target,
    finalAt,
    toScore: (fraction) => fraction * scale,
  });
}

/**
 * Minimum score needed on EVERY remaining activity, assuming the same
 * performance on each — "você precisa de 7,4 no que ainda falta".
 *
 * This is usually the more useful headline than a single-activity answer,
 * because a student mid-term normally has several things pending at once.
 */
export function requiredUniformScoreForPending(
  input: SubjectTermInput,
  target: number,
): UniformRequirementResult {
  const pending = input.activities.filter((a) => a.score === null && !a.isDropped);
  const scale = input.scheme.gradeMax;

  if (pending.length === 0) {
    const current = computeSubjectTerm(input).finalGrade;
    const reached = current !== null && current >= target;
    return {
      status: reached ? 'reached' : 'impossible',
      requiredScore: reached ? 0 : null,
      requiredFraction: reached ? 0 : null,
      scale,
      projectedFinal: current,
      bestPossibleFinal: current,
      worstPossibleFinal: current,
      pendingCount: 0,
    };
  }

  // Each pending activity is scored at the same FRACTION of its own scale, so a
  // test out of 20 and one out of 10 are treated as equal effort.
  const finalAtFraction = (fraction: number): number | null => {
    const overrides: Record<string, number> = {};
    for (const a of pending) {
      overrides[a.id] = fraction * (a.maxScore ?? input.scheme.gradeMax);
    }
    return simulate(input, overrides).finalGrade;
  };

  const solved = solveMonotonic({
    scale,
    target,
    finalAt: (score) => finalAtFraction(score / scale),
    toScore: (fraction) => fraction * scale,
  });

  return {
    ...solved,
    pendingCount: pending.length,
    requiredFraction: solved.requiredScore === null ? null : solved.requiredScore / scale,
  };
}

/**
 * Bisection over a monotonically non-decreasing `finalAt`.
 * `finalAt` receives a score on `scale`; the result is the smallest such score
 * whose projected final reaches `target`.
 */
function solveMonotonic(args: {
  scale: number;
  target: number;
  finalAt: (score: number) => number | null;
  toScore: (fraction: number) => number;
}): RequiredScoreResult {
  const { scale, target, finalAt } = args;

  const worst = finalAt(0);
  const best = finalAt(scale);

  if (worst !== null && worst >= target) {
    return {
      status: 'reached',
      requiredScore: 0,
      scale,
      projectedFinal: worst,
      bestPossibleFinal: best,
      worstPossibleFinal: worst,
    };
  }

  if (best === null || best < target) {
    return {
      status: 'impossible',
      requiredScore: null,
      scale,
      projectedFinal: null,
      bestPossibleFinal: best,
      worstPossibleFinal: worst,
    };
  }

  let low = 0;
  let high = scale;
  for (let i = 0; i < ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    const value = finalAt(mid);
    if (value !== null && value >= target) high = mid;
    else low = mid;
  }

  return {
    status: 'possible',
    requiredScore: high,
    scale,
    projectedFinal: finalAt(high),
    bestPossibleFinal: best,
    worstPossibleFinal: worst,
  };
}
