import { describe, expect, it } from 'vitest';
import { computeOverallAverage, computeSubjectTerm, normalizeScore } from './calc';
import { activity, defaultScheme, readmePbActivities } from './fixtures';
import { clamp, formatGrade, roundGrade } from './rounding';

/**
 * Parity suite. Every expected value here also appears in
 * `supabase/tests/10_grading.test.sql`, which asserts it against the SQL views.
 * The two must agree; the duplication is the point.
 */

describe('normalizeScore', () => {
  it('leaves a score already on the scheme scale untouched', () => {
    expect(normalizeScore(8, null, 10)).toBe(8);
    expect(normalizeScore(8, 10, 10)).toBe(8);
  });

  it('rescales a score given on another scale — 18/20 is a 9 out of 10', () => {
    expect(normalizeScore(18, 20, 10)).toBe(9);
    expect(normalizeScore(85, 100, 10)).toBe(8.5);
  });

  it('keeps ungraded activities ungraded rather than treating them as zero', () => {
    expect(normalizeScore(null, 20, 10)).toBeNull();
  });
});

describe('computeSubjectTerm — README Parte 2 worked example', () => {
  it('weights the category average by peso: (8·2 + 10·1 + 6·7) / 10 = 6.8', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: readmePbActivities(),
    });

    const pb = result.categories.find((c) => c.category.id === 'pb');
    expect(pb?.average).toBeCloseTo(6.8, 10);
    expect(pb?.countedCount).toBe(3);
    expect(pb?.countedWeight).toBe(10);
  });

  it('reports a partial term as the graded categories only, with honest coverage', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: readmePbActivities(),
    });

    // Only PB is posted: the average IS the PB average, not a third of it.
    expect(result.averageCurrent).toBeCloseTo(6.8, 10);
    expect(result.coveragePercent).toBeCloseTo(35, 10);
    expect(result.finalGrade).toBeCloseTo(6.8, 10);
    expect(result.isBelowPassing).toBe(false);
  });

  it('combines the three categories: (6.8·35 + 7·35 + 9·30) / 100 = 7.53', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: [
        ...readmePbActivities(),
        activity({ id: 'va-1', categoryId: 'va', score: 7 }),
        activity({ id: 'ql-1', categoryId: 'ql', score: 9 }),
      ],
    });

    expect(result.averageCurrent).toBeCloseTo(7.53, 10);
    expect(result.coveragePercent).toBeCloseTo(100, 10);
    expect(result.categories.filter((c) => c.average !== null)).toHaveLength(3);
  });

  it('normalizes category weights that do not total 100 instead of going wrong', () => {
    // PB 40 · VA 40 · QL 30 = 110 → (6.8·40 + 7·40 + 9·30) / 110 = 7.4727…
    const scheme = defaultScheme();
    const result = computeSubjectTerm({
      scheme: {
        ...scheme,
        categories: scheme.categories.map((c) => (c.id === 'ql' ? c : { ...c, weightPercent: 40 })),
      },
      activities: [
        ...readmePbActivities(),
        activity({ id: 'va-1', categoryId: 'va', score: 7 }),
        activity({ id: 'ql-1', categoryId: 'ql', score: 9 }),
      ],
    });

    expect(result.averageCurrent).toBeCloseTo(7.4727, 4);
    expect(result.weightTotal).toBe(110);
  });
});

describe('computeSubjectTerm — exclusion rules', () => {
  it('applies dropLowest to the lowest counted grade: (4,8,9) → 8.5', () => {
    const scheme = defaultScheme();
    const activities = [
      activity({ id: 'a', categoryId: 'pb', score: 4 }),
      activity({ id: 'b', categoryId: 'pb', score: 8 }),
      activity({ id: 'c', categoryId: 'pb', score: 9 }),
    ];

    const before = computeSubjectTerm({ scheme, activities });
    expect(before.categories[0]?.average).toBeCloseTo(7, 10);

    const after = computeSubjectTerm({
      scheme: {
        ...scheme,
        categories: scheme.categories.map((c) => (c.id === 'pb' ? { ...c, dropLowest: 1 } : c)),
      },
      activities,
    });
    expect(after.categories[0]?.average).toBeCloseTo(8.5, 10);
    expect(after.categories[0]?.countedCount).toBe(2);
  });

  it('never lets dropLowest consume an ungraded activity', () => {
    const scheme = defaultScheme();
    const result = computeSubjectTerm({
      scheme: {
        ...scheme,
        categories: scheme.categories.map((c) => (c.id === 'pb' ? { ...c, dropLowest: 1 } : c)),
      },
      activities: [
        activity({ id: 'graded-low', categoryId: 'pb', score: 4 }),
        activity({ id: 'graded-high', categoryId: 'pb', score: 8 }),
        activity({ id: 'pending', categoryId: 'pb', score: null }),
      ],
    });

    // The 4 is dropped (not the pending row), leaving just the 8.
    expect(result.categories[0]?.average).toBeCloseTo(8, 10);
    expect(result.categories[0]?.countedCount).toBe(1);
    expect(result.categories[0]?.pendingCount).toBe(1);
  });

  it('lets a graded substitutiva retire the activity it replaces', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: [
        activity({ id: 'original', categoryId: 'pb', score: 3 }),
        activity({ id: 'sub', categoryId: 'pb', score: 8, replacesActivityId: 'original' }),
      ],
    });

    expect(result.categories[0]?.average).toBeCloseTo(8, 10);
    const original = result.categories[0]?.activities.find((a) => a.id === 'original');
    expect(original?.isCounted).toBe(false);
    expect(original?.isSuperseded).toBe(true);
  });

  it('ignores an ungraded substitutiva — the original still counts', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: [
        activity({ id: 'original', categoryId: 'pb', score: 3 }),
        activity({ id: 'sub', categoryId: 'pb', score: null, replacesActivityId: 'original' }),
      ],
    });

    expect(result.categories[0]?.average).toBeCloseTo(3, 10);
  });

  it('excludes a manually dropped activity', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: [
        activity({ id: 'a', categoryId: 'pb', score: 2, isDropped: true }),
        activity({ id: 'b', categoryId: 'pb', score: 8 }),
      ],
    });
    expect(result.categories[0]?.average).toBeCloseTo(8, 10);
  });

  it('reports null rather than 0 when nothing is graded at all', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: [activity({ id: 'a', categoryId: 'pb', score: null })],
    });

    expect(result.averageCurrent).toBeNull();
    expect(result.finalGrade).toBeNull();
    expect(result.coveragePercent).toBe(0);
    // An empty gradebook must never be reported as failing.
    expect(result.isBelowPassing).toBe(false);
  });
});

describe('computeSubjectTerm — targets and overrides', () => {
  it('lets a published final grade override the computed one', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: readmePbActivities(),
      finalGradeOverride: 8,
    });

    expect(result.finalGrade).toBe(8);
    expect(result.isOverridden).toBe(true);
    // The computed value stays visible so the difference is explainable.
    expect(result.averageCurrent).toBeCloseTo(6.8, 10);
  });

  it('flags a subject below its own target without calling it a failure', () => {
    const result = computeSubjectTerm({
      scheme: defaultScheme(),
      activities: readmePbActivities(),
      targetGrade: 8,
    });

    expect(result.isBelowTarget).toBe(true);
    expect(result.isBelowPassing).toBe(false);
  });
});

describe('computeOverallAverage', () => {
  it('weighs every subject equally and skips ungraded ones', () => {
    expect(computeOverallAverage([8, 6, 10])).toBeCloseTo(8, 10);
    expect(computeOverallAverage([8, null, 6])).toBeCloseTo(7, 10);
    expect(computeOverallAverage([null, null])).toBeNull();
    expect(computeOverallAverage([])).toBeNull();
  });
});

describe('rounding', () => {
  it('rounds half up without the IEEE-754 surprise', () => {
    expect(roundGrade(1.005, 2)).toBe(1.01);
    expect(roundGrade(6.95, 1)).toBe(7);
    expect(roundGrade(7.53, 1)).toBe(7.5);
    expect(roundGrade(7.55, 1)).toBe(7.6);
  });

  it('supports the other modes a school might use', () => {
    expect(roundGrade(2.5, 0, 'half_even')).toBe(2);
    expect(roundGrade(3.5, 0, 'half_even')).toBe(4);
    expect(roundGrade(7.99, 1, 'floor')).toBe(7.9);
    expect(roundGrade(7.91, 1, 'ceil')).toBe(8);
  });

  it('formats in pt-BR and renders "—" for an unknown grade', () => {
    expect(formatGrade(7.53, 1)).toBe('7,5');
    expect(formatGrade(10, 1)).toBe('10,0');
    expect(formatGrade(null)).toBe('—');
    expect(formatGrade(undefined)).toBe('—');
  });

  it('clamps', () => {
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
