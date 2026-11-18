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
  it('ondas, óptica e outras fórmulas de física', () => {
    expect(prettifyBareTex('v = \\lambda \\cdot f e E = h\\nu')).toBe('v = λ · f e E = hν');
    expect(prettifyBareTex('n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2')).toBe(
      'n₁ sin θ₁ = n₂ sin θ₂',
    );
    expect(prettifyBareTex('\\eta = 1 - \\frac{T_2}{T_1}')).toBe('η = 1 - T₂/T₁');
    expect(prettifyBareTex('R = 10\\,\\Omega e 30^\\circ e 25^{\\circ}C')).toBe(
      'R = 10 Ω e 30° e 25°C',
    );
    expect(prettifyBareTex('\\vec{F} = m\\vec{a}')).toBe('F⃗ = ma⃗');
    expect(prettifyBareTex('F \\propto \\frac{1}{d^2}, \\mu_0, x_{max}')).toBe(
      'F ∝ 1/d², μ₀, xₘₐₓ',
    );
    expect(prettifyBareTex('\\Phi, \\Psi, \\hbar, \\nabla, \\partial, 10\\%')).toBe(
      'Φ, Ψ, ħ, ∇, ∂, 10%',
    );
  });
  it('não estraga genética nem texto comum', () => {
    expect(prettifyBareTex('Genótipo A_ (dominante) e aa')).toBe('Genótipo A_ (dominante) e aa');
    expect(prettifyBareTex('Aa × Aa → 1 AA : 2 Aa : 1 aa')).toBe('Aa × Aa → 1 AA : 2 Aa : 1 aa');
    expect(prettifyBareTex('nome_do_arquivo e R$ 10')).toBe('nome_do_arquivo e R$ 10');
    expect(prettifyBareTex('\\comandoinventado fica')).toBe('\\comandoinventado fica');
  });
});
