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

import { buildPb4Rows, pb4TrackInsertRow, TRACK_COLUMNS } from './pb4-seed';

describe('PB4: visibilidade (resumos públicos, simulados e trilha da escola)', () => {
  const escola = '11111111-2222-4333-8444-555555555555';
  const rows = buildPb4Rows(escola);

  it('resumos são públicos (sem escola) e os simulados são da escola', () => {
    for (const r of rows.resumos) expect(r.school_id).toBeNull();
    for (const r of rows.simulados.resources) expect(r.school_id).toBe(escola);
  });

  it('a trilha é da escola e todo item aponta para um recurso que existe', () => {
    expect(rows.track.school_id).toBe(escola);
    const ids = new Set([...rows.resumos, ...rows.simulados.resources].map((r) => r.id));
    for (const link of rows.lessonResources) expect(ids.has(link.resource_id)).toBe(true);
  });
});

describe('pb4TrackInsertRow', () => {
  it('só envia colunas que existem em `tracks` (nada de published_at, que é só de `resources`)', () => {
    const rows = buildPb4Rows('11111111-1111-4111-8111-111111111111');
    const row = pb4TrackInsertRow(rows.track, 'subject-id', 'user-id');
    expect(Object.keys(row).sort()).toEqual([...TRACK_COLUMNS].sort());
    expect(row).not.toHaveProperty('published_at');
    expect(row.is_published).toBe(true);
    expect(row.created_by).toBe('user-id');
    expect(row.subject_catalog_id).toBe('subject-id');
  });
});
