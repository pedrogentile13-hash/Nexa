import { describe, expect, it } from 'vitest';
import { computeSubjectTerm } from './calc';
import { activity, defaultScheme, readmePbActivities } from './fixtures';
import {
  requiredScoreForActivity,
  requiredUniformScoreForPending,
  simulate,
  withHypotheticalActivity,
} from './solver';

/**
 * The numbers below are derived by hand from the same fixtures, so a regression
 * in the bisection shows up as a wrong grade rather than as a vague failure.
 *
 * Baseline: PB is graded at 6.8 (README example) and carries 35%.
 */
const baseline = () => ({
  scheme: defaultScheme(),
  activities: [
    ...readmePbActivities(),
    activity({ id: 'va-1', categoryId: 'va', score: null }),
    activity({ id: 'ql-1', categoryId: 'ql', score: null }),
  ],
});

describe('requiredScoreForActivity', () => {
  it('solves for one activity, ignoring what is still unknown', () => {
    // Grading only VA leaves PB(35) + VA(35) = 70 in play:
    //   (6.8·35 + x·35) / 70 = 8  →  x = 9.2
    const result = requiredScoreForActivity(baseline(), 'va-1', 8);

    expect(result.status).toBe('possible');
    expect(result.requiredScore).toBeCloseTo(9.2, 6);
    expect(result.projectedFinal).toBeCloseTo(8, 4);
  });

  it('says so plainly when the target is out of reach', () => {
    // Ceiling with a perfect VA: (6.8·35 + 10·35) / 70 = 8.4
    const result = requiredScoreForActivity(baseline(), 'va-1', 9.5);

    expect(result.status).toBe('impossible');
    expect(result.requiredScore).toBeNull();
    expect(result.bestPossibleFinal).toBeCloseTo(8.4, 6);
  });

  it('reports a target already secured even at a zero', () => {
    // Floor with a zero VA: (6.8·35 + 0) / 70 = 3.4
    const result = requiredScoreForActivity(baseline(), 'va-1', 3);

    expect(result.status).toBe('reached');
    expect(result.requiredScore).toBe(0);
    expect(result.worstPossibleFinal).toBeCloseTo(3.4, 6);
  });

  it('answers on the activity own scale when it is not 0–10', () => {
    const input = {
      scheme: defaultScheme(),
      activities: [
        ...readmePbActivities(),
        activity({ id: 'va-20', categoryId: 'va', score: null, maxScore: 20 }),
      ],
    };
    // Same 9.2 requirement, expressed out of 20 → 18.4.
    const result = requiredScoreForActivity(input, 'va-20', 8);

    expect(result.scale).toBe(20);
    expect(result.requiredScore).toBeCloseTo(18.4, 5);
  });

  it('is defensive about an unknown activity id', () => {
    const result = requiredScoreForActivity(baseline(), 'does-not-exist', 8);
    expect(result.status).toBe('impossible');
    expect(result.requiredScore).toBeNull();
  });
});

describe('requiredUniformScoreForPending', () => {
  it('spreads the requirement across everything still pending', () => {
    // All three categories end up graded:
    //   (6.8·35 + 10f·35 + 10f·30) / 100 = 8  →  f = 562/650  →  score ≈ 8.6462
    const result = requiredUniformScoreForPending(baseline(), 8);

    expect(result.status).toBe('possible');
    expect(result.pendingCount).toBe(2);
    expect(result.requiredScore).toBeCloseTo(8.6462, 3);
    expect(result.requiredFraction).toBeCloseTo(0.86462, 4);
    expect(result.projectedFinal).toBeCloseTo(8, 4);
  });

  it('treats a 20-point test and a 10-point test as equal effort', () => {
    const input = {
      scheme: defaultScheme(),
      activities: [
        ...readmePbActivities(),
        activity({ id: 'va-20', categoryId: 'va', score: null, maxScore: 20 }),
        activity({ id: 'ql-10', categoryId: 'ql', score: null }),
      ],
    };
    const result = requiredUniformScoreForPending(input, 8);

    // Same fraction as above; each activity is asked for the same share.
    expect(result.requiredFraction).toBeCloseTo(0.86462, 4);
  });

  it('falls back to the current grade when nothing is pending', () => {
    const settled = {
      scheme: defaultScheme(),
      activities: [
        ...readmePbActivities(),
        activity({ id: 'va-1', categoryId: 'va', score: 7 }),
        activity({ id: 'ql-1', categoryId: 'ql', score: 9 }),
      ],
    };

    expect(requiredUniformScoreForPending(settled, 7).status).toBe('reached');

    const missed = requiredUniformScoreForPending(settled, 9);
    expect(missed.status).toBe('impossible');
    expect(missed.pendingCount).toBe(0);
    expect(missed.projectedFinal).toBeCloseTo(7.53, 6);
  });
});

describe('simulate', () => {
  it('recomputes from hypothetical scores without touching the input', () => {
    const input = baseline();
    const projected = simulate(input, { 'va-1': 10, 'ql-1': 10 });

    // (6.8·35 + 10·35 + 10·30) / 100 = 8.88
    expect(projected.finalGrade).toBeCloseTo(8.88, 10);
    // The original input is untouched — safe to call on every slider frame.
    expect(computeSubjectTerm(input).finalGrade).toBeCloseTo(6.8, 10);
  });

  it('can un-grade an activity to ask "what if this one had not happened"', () => {
    const input = {
      scheme: defaultScheme(),
      activities: [
        activity({ id: 'good', categoryId: 'pb', score: 9 }),
        activity({ id: 'bad', categoryId: 'pb', score: 3 }),
      ],
    };
    expect(computeSubjectTerm(input).finalGrade).toBeCloseTo(6, 10);
    expect(simulate(input, { bad: null }).finalGrade).toBeCloseTo(9, 10);
  });
});

describe('withHypotheticalActivity', () => {
  it('answers "and if there is one more test worth 3?"', () => {
    const { input, activityId } = withHypotheticalActivity(
      { scheme: defaultScheme(), activities: readmePbActivities() },
      { categoryId: 'pb', title: 'Prova final', score: null, weight: 3 },
    );

    // PB becomes (68 + 3x) / 13, and PB is still the only graded category.
    //   (68 + 3x) / 13 = 8  →  x = 12  →  above the scale, so impossible.
    expect(requiredScoreForActivity(input, activityId, 8).status).toBe('impossible');

    //   (68 + 3x) / 13 = 7  →  x = 7.6666…
    const seven = requiredScoreForActivity(input, activityId, 7);
    expect(seven.status).toBe('possible');
    expect(seven.requiredScore).toBeCloseTo(7.6667, 3);
  });
});
