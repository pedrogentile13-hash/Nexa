import { describe, expect, it } from 'vitest';
import { SERIES, findSerie, matchesSerie, serieOptionLabel } from './serie';

describe('séries', () => {
  it('cobre do 6º ano ao 3º EM, com idades crescentes de 11 a 17', () => {
    expect(SERIES.map((s) => s.age)).toEqual([11, 12, 13, 14, 15, 16, 17]);
  });
  it('rótulo traz a idade aproximada', () => {
    expect(serieOptionLabel(SERIES[0]!)).toBe('6º ano · ~11 anos');
    expect(serieOptionLabel(findSerie('2ª série EM')!)).toBe('2º ano do Médio · ~16 anos');
  });
  it('conteúdo sem série vale para todas; com série, só para ela', () => {
    expect(matchesSerie([], '7º ano')).toBe(true);
    expect(matchesSerie(['7º ano', '8º ano'], '8º ano')).toBe(true);
    expect(matchesSerie(['9º ano'], '7º ano')).toBe(false);
  });
  it('série desconhecida não quebra', () => {
    expect(findSerie('qualquer')).toBeNull();
    expect(findSerie(null)).toBeNull();
  });
});
