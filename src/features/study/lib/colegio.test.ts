import { describe, expect, it } from 'vitest';
import {
  buildColegioView,
  findColegio,
  pickYear,
  sortColegioItems,
  TODAS_AS_MATERIAS,
  COLEGIOS,
  type ColegioItem,
} from './colegio';
import { PB4_TAG } from '@/features/content/seed/pb4';
import { PA7_TAG } from '@/features/content/seed/pa7';

const item = (over: Partial<ColegioItem>): ColegioItem => ({
  id: Math.random().toString(36).slice(2),
  kind: 'simulado',
  title: 'Simulado',
  subjectName: 'História',
  subjectColor: '#C2410C',
  questionCount: 10,
  durationSeconds: null,
  progressPercent: 0,
  tags: [],
  ...over,
});

const anglo = COLEGIOS[0]!;

describe('Biblioteca do colégio', () => {
  it('reconhece o Anglo Morumbi pelo nome e ignora outras escolas', () => {
    expect(findColegio('Colégio Anglo Morumbi')?.short).toBe('Anglo Morumbi');
    expect(findColegio('colegio ANGLO  morumbi')).not.toBeNull();
    expect(findColegio('Colégio Modelo')).toBeNull();
    expect(findColegio(null)).toBeNull();
  });

  it('as tags do cadastro são as mesmas que o carregador grava', () => {
    expect(anglo.blocks.find((b) => b.code === 'PB4')?.tag).toBe(PB4_TAG);
    expect(anglo.blocks.find((b) => b.code === 'PA7')?.tag).toBe(PA7_TAG);
  });

  it('agrupa por matéria e por prova, com o simulado final em "Todas as matérias"', () => {
    const itens = [
      item({
        title: 'Resumo PB4',
        kind: 'resumo',
        subjectName: 'Língua Portuguesa',
        tags: [PB4_TAG],
      }),
      item({ title: 'Base · História', tags: [PA7_TAG] }),
      item({ title: 'Resumo 13', kind: 'resumo', tags: [PA7_TAG] }),
      item({
        title: 'Simulado FINAL · Prova Anglo PA7',
        subjectName: 'Língua Portuguesa',
        tags: [PA7_TAG],
      }),
      item({ title: 'De outra prova', tags: ['outra-tag'] }),
    ];
    const v = buildColegioView(anglo, itens, 2026);
    expect(v.subjects.map((s) => s.name)).toEqual([
      TODAS_AS_MATERIAS,
      'História',
      'Língua Portuguesa',
    ]);
    const hist = v.subjects.find((s) => s.name === 'História')!;
    expect(hist.tiles).toHaveLength(1);
    expect(hist.tiles[0]!.block.code).toBe('PA7');
    expect(hist.tiles[0]!.items.map((i) => i.title)).toEqual(['Resumo 13', 'Base · História']);
    const pt = v.subjects.find((s) => s.name === 'Língua Portuguesa')!;
    expect(pt.tiles.map((t) => t.block.code)).toEqual(['PB4']);
  });

  it('um ano sem prova fica vazio, sem quebrar', () => {
    const v = buildColegioView(anglo, [item({ tags: [PA7_TAG] })], 2025);
    expect(v.subjects).toEqual([]);
    expect(v.years).toContain(2025);
  });

  it('escolhe o ano pedido ou o mais novo com conteúdo', () => {
    expect(pickYear(anglo, '2025')).toBe(2025);
    expect(pickYear(anglo, 'lixo')).toBe(2026);
    expect(pickYear(anglo, null)).toBe(2026);
  });

  it('ordena resumos antes de simulados', () => {
    const s = sortColegioItems([
      item({ title: 'B', kind: 'simulado' }),
      item({ title: 'A', kind: 'resumo' }),
    ]);
    expect(s.map((i) => i.title)).toEqual(['A', 'B']);
  });
});
