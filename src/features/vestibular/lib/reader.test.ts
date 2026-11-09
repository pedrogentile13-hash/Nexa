import { describe, expect, it } from 'vitest';
import { pairOf, readerEntries } from './reader';
import type { ExamFileItem } from '../server/queries';

const f = (id: string, kind: ExamFileItem['kind'], label: string): ExamFileItem => ({ id, editionId: 'e', kind, label, url: `https://x.test/${id}.pdf`, source: null });

const files = [
  f('1', 'caderno', '1º dia · Caderno 1'),
  f('2', 'gabarito', '1º dia · Caderno 1'),
  f('3', 'gabarito', '1º dia · Caderno 2'),
  f('4', 'caderno', '1º dia · Caderno 2'),
  f('5', 'pagina', 'Provas e gabaritos do INEP'),
];

describe('pairOf', () => {
  it('acha o caderno e o gabarito do mesmo rótulo', () => {
    const p = pairOf(files, files[0]!);
    expect(p.caderno?.id).toBe('1');
    expect(p.gabarito?.id).toBe('2');
  });
  it('ignora páginas e arquivos de outro rótulo', () => {
    expect(pairOf(files, files[4]!)).toEqual({ caderno: null, gabarito: null });
  });
});

describe('readerEntries', () => {
  it('uma entrada por caderno, preferindo o arquivo do caderno e sem as páginas', () => {
    const e = readerEntries(files);
    expect(e.map((x) => x.label)).toEqual(['1º dia · Caderno 1', '1º dia · Caderno 2']);
    expect(e[1]!.target.id).toBe('4');
  });
});
