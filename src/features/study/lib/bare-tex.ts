/**
 * Conserta LaTeX "solto" — fora dos cifrões — que a IA às vezes escreve (`\Delta = b^2 - 4ac`, `H_2O`, `x \times y`).
 * Sem isto o aluno via o código cru na tela. Só converte o que é inequívoco; o resto do texto fica como está.
 * Roda apenas em trechos de texto comum (nunca dentro de fórmula entre cifrões ou de `código`).
 */

const SYMBOLS: Record<string, string> = {
  Delta: 'Δ',
  delta: 'δ',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  Gamma: 'Γ',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  Sigma: 'Σ',
  tau: 'τ',
  phi: 'φ',
  omega: 'ω',
  Omega: 'Ω',
  epsilon: 'ε',
  varepsilon: 'ε',
  times: '×',
  cdot: '·',
  div: '÷',
  pm: '±',
  mp: '∓',
  leq: '≤',
  le: '≤',
  geq: '≥',
  ge: '≥',
  neq: '≠',
  ne: '≠',
  approx: '≈',
  equiv: '≡',
  infty: '∞',
  rightarrow: '→',
  to: '→',
  leftarrow: '←',
  Rightarrow: '⇒',
  Leftrightarrow: '⇔',
  leftrightarrow: '↔',
  rightleftharpoons: '⇌',
  degree: '°',
  circ: '°',
  angle: '∠',
  perp: '⊥',
  parallel: '∥',
  in: '∈',
  notin: '∉',
  subset: '⊂',
  cup: '∪',
  cap: '∩',
  emptyset: '∅',
  forall: '∀',
  exists: '∃',
  therefore: '∴',
  ldots: '…',
  cdots: '⋯',
  quad: ' ',
  qquad: '  ',
};

const SUP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '−': '⁻',
  n: 'ⁿ',
};
const SUB: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
};

const toSup = (s: string) =>
  [...s].every((c) => SUP[c]) ? [...s].map((c) => SUP[c]).join('') : null;
const toSub = (s: string) =>
  [...s].every((c) => SUB[c]) ? [...s].map((c) => SUB[c]).join('') : null;

const simple = (x: string) => /^(\p{L}|\p{N}+)$/u.test(x);

export function prettifyBareTex(text: string): string {
  if (!/[\\^_]/.test(text)) return text;
  // 1) símbolos (\Delta, \times, \rightarrow…) — \sqrt, \frac e \text ficam para o passo 2, que precisa das chaves.
  let out = text.replace(/\\([A-Za-z]+)(?![A-Za-z])/g, (whole, name: string) =>
    name === 'sqrt' || name === 'frac' || name === 'dfrac' || name === 'tfrac'
      ? whole
      : (SYMBOLS[name] ?? whole),
  );
  // 2) de dentro para fora: \text{…}, \sqrt{x} → √x, \frac{a}{b} → a/b (até estabilizar).
  for (let i = 0; i < 4; i++) {
    const before = out;
    out = out
      .replace(/\\(?:text|mathrm|mathbf|textbf|operatorname)\{([^{}]*)\}/g, '$1')
      .replace(/\\sqrt\{([^{}]+)\}/g, (_, a: string) => (simple(a) ? `√${a}` : `√(${a})`))
      .replace(
        /\\[dt]?frac\{([^{}]+)\}\{([^{}]+)\}/g,
        (_, a: string, b: string) => `${simple(a) ? a : `(${a})`}/${simple(b) ? b : `(${b})`}`,
      );
    if (out === before) break;
  }
  return (
    out
      .replace(/\\sqrt(?![A-Za-z{])/g, '√')
      // expoentes e índices só de dígitos/sinais: b^2 → b², x^{10} → x¹⁰, H_2O → H₂O. "A_" (genética) fica.
      .replace(
        /\^\{([0-9+\-−n]+)\}|\^([0-9]+|[+\-−n])(?![0-9A-Za-z])/g,
        (whole, a?: string, b?: string) => toSup(a ?? b ?? '') ?? whole,
      )
      .replace(
        /(?<=[A-Za-z)\]])_\{([0-9+-]+)\}|(?<=[A-Za-z)\]])_([0-9]+)/g,
        (whole, a?: string, b?: string) => toSub(a ?? b ?? '') ?? whole,
      )
      .replace(/\\left|\\right/g, '')
  );
}
