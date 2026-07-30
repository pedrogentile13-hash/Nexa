import type { RoundingMode } from '../types';

/**
 * Rounds a grade for DISPLAY. Never feed the result back into a calculation:
 * rounding intermediate averages is how a 6.95 becomes a 6.9 becomes a 6.
 *
 * The naive `Math.round(v * 10 ** d) / 10 ** d` is wrong often enough to matter
 * here — `1.005 * 100` is `100.49999999999999` in IEEE 754, so a 1.005 average
 * would display as 1.00 and a student would swear the app is broken. The
 * epsilon nudge below fixes the representable-value cases.
 */
export function roundGrade(value: number, decimals = 1, mode: RoundingMode = 'half_up'): number {
  if (!Number.isFinite(value)) return value;

  const factor = 10 ** decimals;
  const scaled = value * factor;

  switch (mode) {
    case 'floor':
      return Math.floor(scaled) / factor;
    case 'ceil':
      return Math.ceil(scaled) / factor;
    case 'half_even': {
      // Deliberately NOT nudged: the nudge exists to push half_up over a .5
      // boundary, and applying it here would destroy the tie this mode is
      // defined by (2.5 would stop looking like a tie and round to 3).
      const floor = Math.floor(scaled);
      const isTie = Math.abs(scaled - floor - 0.5) <= tolerance(scaled);
      if (!isTie) return Math.round(scaled) / factor;
      return (floor % 2 === 0 ? floor : floor + 1) / factor;
    }
    case 'half_up':
    default:
      return Math.round(nudge(scaled)) / factor;
  }
}

/** Relative slack for "is this value sitting exactly on a .5 boundary?". */
function tolerance(scaled: number): number {
  return Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4;
}

/** Pulls a value that is a hair below a .5 boundary onto it. */
function nudge(scaled: number): number {
  const epsilon = tolerance(scaled);
  return scaled + (scaled >= 0 ? epsilon : -epsilon);
}

/** Formats a grade the way it is shown in the UI, in pt-BR (comma decimal). */
export function formatGrade(
  value: number | null | undefined,
  decimals = 1,
  mode: RoundingMode = 'half_up',
  locale = 'pt-BR',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return roundGrade(value, decimals, mode).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Clamps a value into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
