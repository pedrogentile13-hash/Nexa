import { describe, expect, it } from 'vitest';
import { DEFAULT_NEXT, safeNext } from './safe-next';

/** Inputs that must never send the student off-origin. */
const HOSTILE = [
  'https://nexa-falso.app',
  'http://evil.test/roubar',
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  '//evil.test',
  '/\\evil.test',
  '\\\\evil.test',
  '/hoje\nLocation: https://evil.test',
  '/hoje\r\nSet-Cookie: a=b',
  'https:/\\evil.test',
  '/\t/evil.test',
];

describe('safeNext', () => {
  it('keeps a plain relative path, query and hash included', () => {
    expect(safeNext('/disciplinas')).toBe('/disciplinas');
    expect(safeNext('/disciplinas/matematica?termo=2')).toBe('/disciplinas/matematica?termo=2');
    expect(safeNext('/desempenho#grafico')).toBe('/desempenho#grafico');
  });

  it('falls back when there is nothing to go to', () => {
    expect(safeNext(null)).toBe(DEFAULT_NEXT);
    expect(safeNext(undefined)).toBe(DEFAULT_NEXT);
    expect(safeNext('')).toBe(DEFAULT_NEXT);
    expect(safeNext('   ')).toBe(DEFAULT_NEXT);
  });

  it.each(HOSTILE)('never leaves the origin for %j', (input) => {
    const result = safeNext(input);

    // The invariant that matters: whatever comes back, resolving it can only
    // land on our own origin. Asserting this instead of an exact string keeps
    // the test honest as the implementation gets stricter.
    expect(result.startsWith('/')).toBe(true);
    expect(result.startsWith('//')).toBe(false);
    const resolved = new URL(result, 'https://nexa.app');
    expect(resolved.origin).toBe('https://nexa.app');
    expect(resolved.hostname).toBe('nexa.app');
  });

  it('rejects the obviously absolute ones outright', () => {
    expect(safeNext('https://nexa-falso.app')).toBe(DEFAULT_NEXT);
    expect(safeNext('//evil.test')).toBe(DEFAULT_NEXT);
    expect(safeNext('javascript:alert(1)')).toBe(DEFAULT_NEXT);
  });
});
