import { describe, expect, it } from 'vitest';
import { splitStatement } from './statement';

describe('splitStatement', () => {
  it('enunciado de um parágrafo continua inteiro', () => {
    expect(splitStatement('Quanto é 2 + 2?')).toEqual({ base: null, command: 'Quanto é 2 + 2?' });
  });
  it('separa o texto-base do comando (último parágrafo)', () => {
    const r = splitStatement('Texto I\n\nTexto II\n\nSegundo o texto, o autor defende:');
    expect(r.base).toBe('Texto I\n\nTexto II');
    expect(r.command).toBe('Segundo o texto, o autor defende:');
  });
  it('ignora espaços sobrando', () => {
    expect(splitStatement('  A\n \nB  ')).toEqual({ base: 'A', command: 'B' });
  });
});
