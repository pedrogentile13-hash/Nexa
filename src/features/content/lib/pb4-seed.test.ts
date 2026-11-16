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

import { buildPa7Rows, buildPb4Rows, pb4TrackInsertRow, TRACK_COLUMNS } from './pb4-seed';
import { PACOTES_PA7, RESUMOS_PA7, TRILHA_PA7 } from '../seed/pa7';

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

describe('PB4: TCs online e simulados extras', () => {
  const por = (slug: string) => PACOTES_PB4.find((p) => p.slug === slug)!;
  const conta = (slug: string) => {
    const qs = por(slug).questoes;
    return {
      total: qs.length,
      obj: qs.filter((q) => q.k === 'o').length,
      disc: qs.filter((q) => q.k === 'd').length,
    };
  };

  it('os dois simulados extras têm 15 questões: 13 objetivas e 2 dissertativas', () => {
    for (const slug of ['pb4-verbos-e-ligacao-15', 'pb4-rua-morgue-15']) {
      expect(conta(slug)).toEqual({ total: 15, obj: 13, disc: 2 });
    }
  });

  it('há um simulado por módulo (38, 40 e 41) e eles entram na trilha', () => {
    const itens = TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens));
    for (const slug of [
      'pb4-tc-modulo-38-verbos',
      'pb4-tc-modulo-40-texto-didatico',
      'pb4-tc-modulo-41-verbos-ligacao',
    ]) {
      expect(conta(slug).total).toBeGreaterThan(0);
      expect(itens).toContain(slug);
    }
  });

  it('os extras e o resumo geral estão na trilha', () => {
    const itens = TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens));
    expect(itens).toContain('pb4-verbos-e-ligacao-15');
    expect(itens).toContain('pb4-rua-morgue-15');
    expect(itens).toContain('g3-pb4-resumo-geral');
  });

  it('toda objetiva tem uma única resposta certa distinta das erradas', () => {
    const novos = PACOTES_PB4.filter((p) => /tc-modulo|-15$/.test(p.slug));
    expect(novos).toHaveLength(5);
    for (const p of novos) {
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const todas = [q.ok, ...q.wrong];
        expect(new Set(todas).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(todas.length);
        expect([3, 4], `${p.slug}: ${q.s.slice(0, 50)}`).toContain(q.wrong.length);
      }
    }
  });
});

describe('PA7 · Prova Anglo 7', () => {
  const por = (slug: string) => PACOTES_PA7.find((p) => p.slug === slug)!;
  const conta = (slug: string) => {
    const qs = por(slug).questoes;
    return {
      total: qs.length,
      obj: qs.filter((q) => q.k === 'o').length,
      disc: qs.filter((q) => q.k === 'd').length,
    };
  };

  it('tem 3 simulados base e 3 de nível prova, todos objetivos e com 10 questões', () => {
    for (const m of ['portugues', 'historia', 'geografia']) {
      expect(conta(`pa7-base-${m}`)).toEqual({ total: 10, obj: 10, disc: 0 });
      expect(conta(`pa7-prova-${m}`)).toEqual({ total: 10, obj: 10, disc: 0 });
    }
  });

  it('o simulado final tem 32 objetivas (16 + 8 + 8) e a redação', () => {
    expect(conta('pa7-final')).toEqual({ total: 33, obj: 32, disc: 1 });
    const qs = por('pa7-final').questoes;
    expect(qs[32]?.k).toBe('d');
  });

  it('toda objetiva tem 5 alternativas distintas e uma explicação', () => {
    for (const p of PACOTES_PA7) {
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const todas = [q.ok, ...q.wrong];
        expect(todas, `${p.slug}: ${q.s.slice(0, 40)}`).toHaveLength(5);
        expect(new Set(todas).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(5);
        expect(q.e.length).toBeGreaterThan(20);
        // As alternativas ficam nas opções, nunca coladas no enunciado.
        expect(q.s, `${p.slug}: ${q.s.slice(0, 40)}`).not.toMatch(/^[A-E]\) /m);
      }
    }
  });

  it('há um micro resumo por módulo (8 de Português, 4 de História, 2 de Geografia)', () => {
    expect(RESUMOS_PA7.filter((r) => r.subject === 'lingua-portuguesa')).toHaveLength(8);
    expect(RESUMOS_PA7.filter((r) => r.subject === 'historia')).toHaveLength(4);
    expect(RESUMOS_PA7.filter((r) => r.subject === 'geografia')).toHaveLength(2);
  });

  it('todo item da trilha existe e cada matéria abre livre (1ª lição de cada seção sem trava)', () => {
    const conhecidos = new Set([
      ...PACOTES_PA7.map((p) => p.slug),
      ...RESUMOS_PA7.map((r) => r.slug),
    ]);
    for (const s of TRILHA_PA7.secoes)
      for (const l of s.licoes) for (const i of l.itens) expect(conhecidos.has(i), i).toBe(true);
    const rows = buildPa7Rows('11111111-2222-4333-8444-555555555555');
    const livres = rows.lessons.filter((l) => l.unlock_after_lesson_id === null);
    expect(livres).toHaveLength(TRILHA_PA7.secoes.length);
    const ids = new Set([...rows.resumos, ...rows.simulados.resources].map((r) => r.id));
    for (const link of rows.lessonResources) expect(ids.has(link.resource_id)).toBe(true);
  });

  it('os conteúdos saem com a tag da prova e ids diferentes dos do PB4', () => {
    const escola = '11111111-2222-4333-8444-555555555555';
    const pa7 = buildPa7Rows(escola);
    const pb4 = buildPb4Rows(escola);
    for (const r of pa7.simulados.resources) expect(r.tags).toContain('pa7-prova-anglo');
    expect(pa7.track.id).not.toBe(pb4.track.id);
    const idsPb4 = new Set(pb4.simulados.resources.map((r) => r.id));
    for (const r of pa7.simulados.resources) expect(idsPb4.has(r.id)).toBe(false);
  });
});
