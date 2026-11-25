import { describe, expect, it } from 'vitest';
import { hideEmptyQuizzes } from './question-count';

const read = (r: { kind: string; count: number }) => r;

describe('hideEmptyQuizzes', () => {
  it('esconde quiz e simulado vazios quando a contagem funciona (há algum com questões)', () => {
    const rows = [
      { id: 'a', kind: 'quiz', count: 10 },
      { id: 'b', kind: 'quiz', count: 0 },
      { id: 'c', kind: 'simulado', count: 0 },
      { id: 'd', kind: 'resumo', count: 0 },
    ];
    expect(hideEmptyQuizzes(rows, read).map((r) => r.id)).toEqual(['a', 'd']);
  });

  it('não esconde nada quando TODO quiz/simulado vem com 0 (aluno não lê as questões)', () => {
    const rows = [
      { id: 'a', kind: 'quiz', count: 0 },
      { id: 'b', kind: 'simulado', count: 0 },
      { id: 'c', kind: 'resumo', count: 0 },
    ];
    expect(hideEmptyQuizzes(rows, read).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('resumo e vídeo nunca dependem da contagem', () => {
    const rows = [
      { id: 'a', kind: 'quiz', count: 5 },
      { id: 'b', kind: 'video', count: 0 },
      { id: 'c', kind: 'resumo', count: 0 },
    ];
    expect(hideEmptyQuizzes(rows, read)).toHaveLength(3);
  });

  it('lista vazia continua vazia', () => {
    expect(hideEmptyQuizzes([], read)).toEqual([]);
  });
});
