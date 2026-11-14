import { describe, expect, it } from 'vitest';
import { buildPlanSummaryMessages, MAX_PLAN_CHARS } from './prompt';

describe('buildPlanSummaryMessages', () => {
  it('obriga a IA a usar só o material e inclui o texto do professor', () => {
    const [system, user] = buildPlanSummaryMessages('Revolução Francesa', 'Causas: crise financeira e iluminismo.');
    expect(system!.content).toMatch(/EXCLUSIVAMENTE/);
    expect(user!.content).toContain('Revolução Francesa');
    expect(user!.content).toContain('Causas: crise financeira e iluminismo.');
    expect(user!.content).toMatch(/Para fixar/);
  });

  it('corta material gigante para não estourar o pedido', () => {
    const [, user] = buildPlanSummaryMessages('x', 'a'.repeat(MAX_PLAN_CHARS + 5000));
    expect((user!.content.match(/a/g) ?? []).length).toBeLessThan(MAX_PLAN_CHARS + 500);
  });
});
