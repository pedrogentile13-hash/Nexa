import { describe, expect, it } from 'vitest';
import { prettifyBareTex } from './bare-tex';

describe('prettifyBareTex', () => {
  it('converte símbolos e expoentes soltos (Bhaskara)', () => {
    expect(prettifyBareTex('\\Delta = b^2 - 4ac')).toBe('Δ = b² - 4ac');
    expect(prettifyBareTex('x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}')).toBe('x = (-b ± √Δ)/(2a)');
    expect(prettifyBareTex('\\Delta > 0 \\Rightarrow duas raízes')).toBe('Δ > 0 ⇒ duas raízes');
  });
  it('química e física', () => {
    expect(prettifyBareTex('H_2O e CO_2')).toBe('H₂O e CO₂');
    expect(prettifyBareTex('10^{-3} m e 6 \\times 10^{23}')).toBe('10⁻³ m e 6 × 10²³');
    expect(prettifyBareTex('2 H_2 + O_2 \\rightarrow 2 H_2O')).toBe('2 H₂ + O₂ → 2 H₂O');
  });
  it('não estraga genética nem texto comum', () => {
    expect(prettifyBareTex('Genótipo A_ (dominante) e aa')).toBe('Genótipo A_ (dominante) e aa');
    expect(prettifyBareTex('Aa × Aa → 1 AA : 2 Aa : 1 aa')).toBe('Aa × Aa → 1 AA : 2 Aa : 1 aa');
    expect(prettifyBareTex('nome_do_arquivo e R$ 10')).toBe('nome_do_arquivo e R$ 10');
    expect(prettifyBareTex('\\comandoinventado fica')).toBe('\\comandoinventado fica');
  });
});
