import { describe, expect, it } from 'vitest';
import { SUBJECT_COLORS, SUBJECT_COLOR_TOKENS, subjectColor } from './subject-colors';

/**
 * A paleta de matérias é escolhida por pessoas e usada por milhares. Estes
 * testes fixam as duas promessas que ela faz e que o olho não confere sozinho.
 */

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channel = (index: number) => {
    const c = parseInt(value.slice(index, index + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('paleta de matérias', () => {
  it('cobre todos os tokens declarados', () => {
    for (const token of SUBJECT_COLOR_TOKENS) {
      expect(SUBJECT_COLORS[token]).toBeDefined();
    }
  });

  it('`deep` sustenta texto branco em 4,5:1 — é fundo de cabeçalho', () => {
    // O guia de desktop põe o nome da matéria em branco sobre a cor dela. Com
    // `base` isso reprovaria: o laranja mede 3,56:1, abaixo até do critério de
    // texto grande, e o aluno de Física leria um título apagado.
    for (const token of SUBJECT_COLOR_TOKENS) {
      const ratio = contrast(SUBJECT_COLORS[token].deep, '#ffffff');
      expect(
        ratio,
        `${token} (${SUBJECT_COLORS[token].deep}) contra branco`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('o par soft/onSoft continua legível nos dois temas', () => {
    for (const token of SUBJECT_COLOR_TOKENS) {
      const c = SUBJECT_COLORS[token];
      expect(contrast(c.light.soft, c.light.onSoft), `${token} claro`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.dark.soft, c.dark.onSoft), `${token} escuro`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('cai no azul para qualquer valor inesperado vindo do banco', () => {
    expect(subjectColor(null).token).toBe('blue');
    expect(subjectColor('cor-que-nao-existe').token).toBe('blue');
  });
});
