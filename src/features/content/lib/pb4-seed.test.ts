import { describe, expect, it } from 'vitest';
import { buildGrande2Seed } from './grande2-seed';
import { buildGrande3Seed } from './grande3-seed';
import { PACOTES_PB4, PB4_TAG, RESUMOS_PB4, TRILHA_PB4 } from '../seed/pb4';

const scope = 'school-teste';

describe('Português 4º bimestre (PB4)', () => {
  it('tem simulados e resumos com slugs únicos', () => {
    const slugs = PACOTES_PB4.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const resumos = RESUMOS_PB4.map((r) => r.slug);
    expect(new Set(resumos).size).toBe(resumos.length);
    expect(PACOTES_PB4.length).toBeGreaterThanOrEqual(5);
    expect(RESUMOS_PB4.length).toBeGreaterThanOrEqual(3);
  });

  it('todo item da trilha existe (simulado ou resumo)', () => {
    const conhecidos = new Set([
      ...PACOTES_PB4.map((p) => p.slug),
      ...RESUMOS_PB4.map((r) => r.slug),
    ]);
    const itens = TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens));
    expect(itens.length).toBeGreaterThan(0);
    for (const item of itens) expect(conhecidos.has(item), item).toBe(true);
  });

  it('cada lição da trilha tem pelo menos um item e o caminho desbloqueia em ordem', () => {
    const g2 = buildGrande2Seed(scope, PACOTES_PB4, PB4_TAG);
    const g3 = buildGrande3Seed(scope, RESUMOS_PB4, [TRILHA_PB4], PB4_TAG);
    const ids = new Set([...g2.resources, ...g3.resources].map((r) => r.id));
    for (const link of g3.lessonResources) expect(ids.has(link.resource_id)).toBe(true);
    const primeira = g3.lessons.filter((l) => l.unlock_after_lesson_id === null);
    expect(primeira).toHaveLength(1);
  });

  it('os conteúdos saem marcados com a tag do PB4 e na escola escolhida', () => {
    const g2 = buildGrande2Seed(scope, PACOTES_PB4, PB4_TAG);
    for (const r of g2.resources) {
      expect(r.tags).toContain(PB4_TAG);
      expect(r.school_id).toBe(scope);
    }
  });
});
