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

import {
  buildPa7Rows,
  buildPa8Rows,
  buildPb4Rows,
  pb4TrackInsertRow,
  TRACK_COLUMNS,
} from './pb4-seed';
import { PACOTES_PA7, RESUMOS_PA7, TRILHA_PA7 } from '../seed/pa7';
import { PACOTES_PA8, RESUMOS_PA8, TRILHA_PA8 } from '../seed/pa8';

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

describe('PA8 · Prova Anglo 8 (Matemática e Ciências)', () => {
  const por = (slug: string) => PACOTES_PA8.find((p) => p.slug === slug)!;

  it('tem 4 simulados base e 4 de nível prova, todos objetivos e com 10 questões', () => {
    for (const m of ['matematica', 'fisica', 'quimica', 'biologia']) {
      for (const t of ['base', 'prova']) {
        const qs = por(`pa8-${t}-${m}`).questoes;
        expect(qs, `${t}-${m}`).toHaveLength(10);
        expect(qs.every((q) => q.k === 'o')).toBe(true);
      }
    }
  });

  it('o simulado final tem 32 objetivas: 16 de Matemática e 16 de Ciências (8 + 4 + 4)', () => {
    const qs = por('pa8-final').questoes;
    expect(qs).toHaveLength(32);
    expect(qs.every((q) => q.k === 'o')).toBe(true);
  });

  it('toda objetiva tem 5 alternativas distintas e uma explicação, sem alternativas no enunciado', () => {
    for (const p of PACOTES_PA8) {
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const todas = [q.ok, ...q.wrong];
        expect(todas, `${p.slug}: ${q.s.slice(0, 40)}`).toHaveLength(5);
        expect(new Set(todas).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(5);
        expect(q.e.length).toBeGreaterThan(20);
        expect(q.s, `${p.slug}: ${q.s.slice(0, 40)}`).not.toMatch(/^[A-E]\) /m);
      }
    }
  });

  it('há um micro resumo por módulo: 19 de Matemática, 8 de Física, 3 de Química e 6 de Biologia', () => {
    const n = (m: string) => RESUMOS_PA8.filter((r) => r.subject === m).length;
    expect([n('matematica'), n('fisica'), n('quimica'), n('biologia')]).toEqual([19, 8, 3, 6]);
  });

  it('todo item da trilha existe e cada matéria abre livre', () => {
    const conhecidos = new Set([
      ...PACOTES_PA8.map((p) => p.slug),
      ...RESUMOS_PA8.map((r) => r.slug),
    ]);
    for (const s of TRILHA_PA8.secoes)
      for (const l of s.licoes) for (const i of l.itens) expect(conhecidos.has(i), i).toBe(true);
    const rows = buildPa8Rows('11111111-2222-4333-8444-555555555555');
    const livres = rows.lessons.filter((l) => l.unlock_after_lesson_id === null);
    expect(livres).toHaveLength(TRILHA_PA8.secoes.length);
    const ids = new Set([...rows.resumos, ...rows.simulados.resources].map((r) => r.id));
    for (const link of rows.lessonResources) expect(ids.has(link.resource_id)).toBe(true);
  });

  it('sai com a tag da prova e ids diferentes dos do PA7', () => {
    const escola = '11111111-2222-4333-8444-555555555555';
    const pa8 = buildPa8Rows(escola);
    for (const r of pa8.simulados.resources) expect(r.tags).toContain('pa8-prova-anglo');
    expect(pa8.track.id).not.toBe(buildPa7Rows(escola).track.id);
  });
});

describe('PB4: Química e Produção de Texto', () => {
  const por = (slug: string) => PACOTES_PB4.find((p) => p.slug === slug)!;
  const conta = (slug: string) => {
    const qs = por(slug).questoes;
    return {
      obj: qs.filter((q) => q.k === 'o').length,
      disc: qs.filter((q) => q.k === 'd').length,
    };
  };

  it('Química: 3 simulados só objetivos, 2 com ~70% objetivas e 1 só dissertativo', () => {
    for (const s of ['s1-acidos', 's2-bases-sais', 's3-oxidos'])
      expect(conta(`pb4-quimica-${s}`).disc).toBe(0);
    expect(conta('pb4-quimica-s4-misto')).toEqual({ obj: 7, disc: 3 });
    expect(conta('pb4-quimica-s5-misto')).toEqual({ obj: 10, disc: 4 });
    expect(conta('pb4-quimica-s6-dissertativo').obj).toBe(0);
    expect(conta('pb4-quimica-s6-dissertativo').disc).toBeGreaterThanOrEqual(6);
  });

  it('o super simulado da prova de Química é dissertativo, com itens a) e b)', () => {
    const { obj, disc } = conta('pb4-quimica-super');
    expect(obj).toBe(0);
    expect(disc).toBe(10);
  });

  it('Produção de Texto: simulado de teoria, treino por parágrafo (4) e redação completa (1)', () => {
    expect(conta('pb4-redacao-s1-teoria').disc).toBe(0);
    expect(conta('pb4-redacao-s2-paragrafos').disc).toBe(4);
    expect(conta('pb4-redacao-s3-completa').disc).toBe(1);
  });

  it('há 11 resumos de Química e 7 de Produção de Texto, todos na trilha', () => {
    const qui = RESUMOS_PB4.filter((r) => r.slug.startsWith('g3-pb4-qui-'));
    const red = RESUMOS_PB4.filter((r) => r.slug.startsWith('g3-pb4-red-'));
    expect([qui.length, red.length]).toEqual([11, 7]);
    const itens = new Set(TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens)));
    for (const r of [...qui, ...red]) expect(itens.has(r.slug), r.slug).toBe(true);
    for (const p of PACOTES_PB4.filter((x) => /quimica|redacao/.test(x.slug)))
      expect(itens.has(p.slug), p.slug).toBe(true);
  });

  it('toda objetiva nova tem 5 alternativas distintas e nenhuma alternativa dentro do enunciado', () => {
    for (const p of PACOTES_PB4.filter((x) => /quimica|redacao/.test(x.slug)))
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const todas = [q.ok, ...q.wrong];
        expect(todas, p.slug).toHaveLength(5);
        expect(new Set(todas).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(5);
        expect(q.s).not.toMatch(/^[A-E]\) /m);
      }
  });
});

describe('PB4: Matemática', () => {
  const por = (slug: string) => PACOTES_PB4.find((p) => p.slug === slug)!;
  const conta = (slug: string) => {
    const qs = por(slug).questoes;
    return {
      obj: qs.filter((q) => q.k === 'o').length,
      disc: qs.filter((q) => q.k === 'd').length,
    };
  };
  const matematica = () => PACOTES_PB4.filter((x) => x.slug.startsWith('pb4-mat-'));

  it('5 simulados objetivos, 1 misto 70/30, 1 só dissertativo e o super simulado', () => {
    expect(conta('pb4-mat-s1-volume')).toEqual({ obj: 10, disc: 0 });
    expect(conta('pb4-mat-s2-trigonometria')).toEqual({ obj: 10, disc: 0 });
    expect(conta('pb4-mat-s3-equacoes')).toEqual({ obj: 14, disc: 0 });
    expect(conta('pb4-mat-s4-fracoes')).toEqual({ obj: 10, disc: 0 });
    expect(conta('pb4-mat-s5-funcoes')).toEqual({ obj: 10, disc: 0 });
    expect(conta('pb4-mat-s6-misto')).toEqual({ obj: 7, disc: 3 });
    expect(conta('pb4-mat-s7-dissertativo')).toEqual({ obj: 0, disc: 8 });
    expect(conta('pb4-mat-super')).toEqual({ obj: 0, disc: 10 });
    expect(conta('pb4-mat-lista')).toEqual({ obj: 0, disc: 10 });
    expect(matematica()).toHaveLength(9);
  });

  it('há 11 resumos de Matemática (10 + a lista da Andréia), todos na trilha junto com os simulados', () => {
    const mat = RESUMOS_PB4.filter((r) => r.slug.startsWith('g3-pb4-mat-'));
    expect(mat).toHaveLength(11);
    expect(mat.some((r) => r.slug === 'g3-pb4-mat-lista')).toBe(true);
    const itens = new Set(TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens)));
    for (const r of mat) expect(itens.has(r.slug), r.slug).toBe(true);
    for (const p of matematica()) expect(itens.has(p.slug), p.slug).toBe(true);
  });

  it('toda objetiva tem 5 alternativas distintas, explicação e nenhuma alternativa no enunciado', () => {
    for (const p of matematica())
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const todas = [q.ok, ...q.wrong];
        expect(todas, p.slug).toHaveLength(5);
        expect(new Set(todas).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(5);
        expect(q.e.length).toBeGreaterThan(20);
        expect(q.s).not.toMatch(/^[A-E]\) /m);
      }
  });

  it('toda dissertativa tem resposta esperada e pelo menos 3 critérios', () => {
    for (const p of matematica())
      for (const q of p.questoes) {
        if (q.k !== 'd') continue;
        expect(q.ref.length, p.slug).toBeGreaterThan(30);
        expect(q.crit.split('\n').length, p.slug).toBeGreaterThanOrEqual(3);
      }
  });
});

describe('PB4: Geografia', () => {
  const por = (slug: string) => PACOTES_PB4.find((p) => p.slug === slug)!;
  const conta = (slug: string) => {
    const qs = por(slug).questoes;
    return {
      obj: qs.filter((q) => q.k === 'o').length,
      disc: qs.filter((q) => q.k === 'd').length,
    };
  };
  const geografia = () => PACOTES_PB4.filter((x) => x.slug.startsWith('pb4-geo-'));

  it('5 simulados objetivos e a simulação real da prova, dissertativa', () => {
    expect(conta('pb4-geo-s1-japao-territorio-historia')).toEqual({ obj: 12, disc: 0 });
    expect(conta('pb4-geo-s2-japao-populacao-economia')).toEqual({ obj: 12, disc: 0 });
    expect(conta('pb4-geo-s3-oceania')).toEqual({ obj: 12, disc: 0 });
    expect(conta('pb4-geo-s4-onu')).toEqual({ obj: 14, disc: 0 });
    expect(conta('pb4-geo-s5-misto')).toEqual({ obj: 15, disc: 0 });
    expect(conta('pb4-geo-prova')).toEqual({ obj: 0, disc: 5 });
    expect(geografia()).toHaveLength(6);
  });

  it('há 13 resumos de Geografia, todos na trilha junto com os simulados', () => {
    const geo = RESUMOS_PB4.filter((r) => r.slug.startsWith('g3-pb4-geo-'));
    expect(geo).toHaveLength(13);
    const itens = new Set(TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens)));
    for (const r of geo) expect(itens.has(r.slug), r.slug).toBe(true);
    for (const p of geografia()) expect(itens.has(p.slug), p.slug).toBe(true);
  });

  it('toda objetiva tem 5 alternativas distintas, explicação e nenhuma alternativa no enunciado', () => {
    for (const p of geografia())
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const todas = [q.ok, ...q.wrong];
        expect(todas, p.slug).toHaveLength(5);
        expect(new Set(todas).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(5);
        expect(q.e.length).toBeGreaterThan(20);
        expect(q.s).not.toMatch(/^[A-E]\) /m);
      }
  });

  it('a prova real tem 5 dissertativas com gabarito e pelo menos 4 critérios', () => {
    for (const q of por('pb4-geo-prova').questoes) {
      if (q.k !== 'd') continue;
      expect(q.ref.length).toBeGreaterThan(200);
      expect(q.crit.split('\n').length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('PB4: História e Física', () => {
  const por = (slug: string) => PACOTES_PB4.find((p) => p.slug === slug)!;
  const conta = (slug: string) => {
    const qs = por(slug).questoes;
    return {
      obj: qs.filter((q) => q.k === 'o').length,
      disc: qs.filter((q) => q.k === 'd').length,
    };
  };
  const itensTrilha = () =>
    new Set(TRILHA_PB4.secoes.flatMap((s) => s.licoes.flatMap((l) => l.itens)));

  it('História: o do professor tem as 25 questões do roteiro, mais um perto da prova e um objetivo', () => {
    expect(conta('pb4-his-s1-professor')).toEqual({ obj: 0, disc: 25 });
    expect(conta('pb4-his-s2-prova')).toEqual({ obj: 0, disc: 7 });
    expect(conta('pb4-his-s3-objetivo')).toEqual({ obj: 20, disc: 0 });
  });

  it('Física: a lista da professora tem as 9 objetivas, 8 dissertativas perto da prova e 21 objetivas', () => {
    expect(conta('pb4-fis-s1-lista')).toEqual({ obj: 9, disc: 0 });
    expect(conta('pb4-fis-s2-prova')).toEqual({ obj: 0, disc: 8 });
    expect(conta('pb4-fis-s3-objetivo')).toEqual({ obj: 21, disc: 0 });
  });

  it('só 3 simulados por matéria e poucos resumos, todos na trilha', () => {
    const his = PACOTES_PB4.filter((p) => p.slug.startsWith('pb4-his-'));
    const fis = PACOTES_PB4.filter((p) => p.slug.startsWith('pb4-fis-'));
    expect(his).toHaveLength(3);
    expect(fis).toHaveLength(3);
    const rHis = RESUMOS_PB4.filter((r) => r.slug.startsWith('g3-pb4-his-'));
    const rFis = RESUMOS_PB4.filter((r) => r.slug.startsWith('g3-pb4-fis-'));
    expect(rHis).toHaveLength(3);
    expect(rFis).toHaveLength(3);
    expect(rFis.some((r) => r.slug === 'g3-pb4-fis-pedro')).toBe(true);
    const itens = itensTrilha();
    for (const x of [...his, ...fis, ...rHis, ...rFis])
      expect(itens.has(x.slug), x.slug).toBe(true);
  });

  it('o resumo do Pedro de História está publicado com o título do Pedro', () => {
    const r = RESUMOS_PB4.find((x) => x.slug === 'g3-pb4-his-pedro')!;
    expect(r.title).toMatch(/Pedro/);
  });

  it('a lista da professora mantém a ordem e o gabarito original (a certa varia de posição no site)', () => {
    const qs = por('pb4-fis-s1-lista').questoes;
    expect(qs).toHaveLength(9);
    const alts = qs.map((q) => (q.k === 'o' ? q.wrong.length + 1 : 0));
    expect(alts).toEqual([4, 4, 4, 5, 5, 5, 5, 5, 5]);
  });

  it('toda objetiva tem alternativas distintas, explicação e nenhuma letra dentro das alternativas', () => {
    const todos = [...PACOTES_PB4.filter((p) => /^pb4-(his|fis)-/.test(p.slug))];
    for (const p of todos)
      for (const q of p.questoes) {
        if (q.k !== 'o') continue;
        const alt = [q.ok, ...q.wrong];
        expect(new Set(alt).size, `${p.slug}: ${q.s.slice(0, 40)}`).toBe(alt.length);
        expect(q.e.length).toBeGreaterThan(20);
        for (const a of alt) expect(a, p.slug).not.toMatch(/^[A-Ea-e]\) /);
      }
  });
});
