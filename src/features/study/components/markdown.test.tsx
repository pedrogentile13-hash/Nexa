import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from './markdown';

const html = (s: string) => renderToStaticMarkup(<Markdown source={s} />);

describe('Markdown (resumos e respostas da IA)', () => {
  it('LaTeX solto vira símbolo legível', () => {
    expect(html('Fórmula: \\Delta = b^2 - 4ac')).toContain('Δ = b² - 4ac');
    expect(html('A água é H_2O')).toContain('H₂O');
  });

  it('bloco \\[ ... \\] em várias linhas vira fórmula, não texto cru', () => {
    const out = html('\\[\n\\Delta = b^2 - 4ac\n\\]');
    expect(out).toContain('data-math');
    expect(out).not.toContain('\\[');
  });

  it('cruzamento com asterisco não vira itálico; *A* continua itálico', () => {
    expect(html('Cruzando Aa * Aa e Bb * Bb')).not.toContain('<em>');
    expect(html('O alelo *A* domina o *a*')).toContain('<em>A</em>');
  });

  it('desenha tabela com cabeçalho', () => {
    const out = html('| genótipo | fenótipo |\n|---|---|\n| AA | dominante |\n| aa | recessivo |');
    expect(out).toContain('<table');
    expect(out).toContain('<th');
    expect(out).toContain('recessivo');
    expect(out).not.toContain('|---|');
  });

  it('lista numerada vira <ol> e com marcador vira <ul>', () => {
    expect(html('1. um\n2. dois')).toContain('<ol');
    expect(html('- um\n- dois')).toContain('<ul');
  });

  it('dinheiro e texto comum continuam iguais', () => {
    expect(html('Custa R$ 5 e R$ 10.')).toContain('Custa R$ 5 e R$ 10.');
    expect(html('Genótipo A_ e aa')).toContain('Genótipo A_ e aa');
  });
});
