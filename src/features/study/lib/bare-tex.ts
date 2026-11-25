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
  // gregas que faltavam (física: ν frequência, η rendimento, Φ fluxo, ψ função de onda…)
  nu: 'ν',
  eta: 'η',
  kappa: 'κ',
  xi: 'ξ',
  zeta: 'ζ',
  psi: 'ψ',
  chi: 'χ',
  iota: 'ι',
  upsilon: 'υ',
  varphi: 'φ',
  vartheta: 'ϑ',
  varrho: 'ρ',
  varsigma: 'ς',
  Phi: 'Φ',
  Psi: 'Ψ',
  Lambda: 'Λ',
  Theta: 'Θ',
  Pi: 'Π',
  Xi: 'Ξ',
  Upsilon: 'Υ',
  // física e cálculo
  hbar: 'ħ',
  ell: 'ℓ',
  nabla: '∇',
  partial: '∂',
  propto: '∝',
  sim: '∼',
  simeq: '≃',
  cong: '≅',
  ll: '≪',
  gg: '≫',
  sum: '∑',
  prod: '∏',
  int: '∫',
  oint: '∮',
  AA: 'Å',
  prime: '′',
  uparrow: '↑',
  downarrow: '↓',
  Uparrow: '⇑',
  Downarrow: '⇓',
  Leftarrow: '⇐',
  longrightarrow: '⟶',
  Longrightarrow: '⟹',
  mapsto: '↦',
  rightharpoonup: '⇀',
  // lógica e conjuntos
  neg: '¬',
  lnot: '¬',
  land: '∧',
  wedge: '∧',
  lor: '∨',
  vee: '∨',
  oplus: '⊕',
  otimes: '⊗',
  odot: '⊙',
  bullet: '•',
  ast: '∗',
  star: '⋆',
  dagger: '†',
  triangle: '△',
  square: '□',
  mid: '|',
  setminus: '∖',
  supset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  ni: '∋',
  aleph: 'ℵ',
  vdots: '⋮',
  dots: '…',
};

// funções escritas como comando (\sin x, \log_2 8): viram o nome normal.
const FUNCS = new Set([
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'sen',
  'tg',
  'cotg',
  'arcsin',
  'arccos',
  'arctan',
  'sinh',
  'cosh',
  'tanh',
  'log',
  'ln',
  'lg',
  'exp',
  'lim',
  'max',
  'min',
  'det',
  'mod',
  'gcd',
  'deg',
]);

const BB: Record<string, string> = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', I: '𝕀' };

// letras que existem como índice em Unicode (xₘₐₓ, vₘ…)
const SUB_LETTERS: Record<string, string> = {
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
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
  ...SUB_LETTERS,
};

const toSup = (s: string) =>
  [...s].every((c) => SUP[c]) ? [...s].map((c) => SUP[c]).join('') : null;
const toSub = (s: string) =>
  [...s].every((c) => SUB[c]) ? [...s].map((c) => SUB[c]).join('') : null;

const SCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ₀₁₂₃₄₅₆₇₈₉₊₋ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ′';
const simple = (x: string) => new RegExp(`^(\\p{L}[${SCRIPT}]*|\\p{N}+[${SCRIPT}]*)$`, 'u').test(x);

// acento sobre letra: \vec{F} → F⃗, \hat{x} → x̂, \bar{x} → x̄, \overline{AB} → A̅B̅
const ACCENTS: Record<string, string> = {
  vec: '\u20D7',
  overrightarrow: '\u20D7',
  hat: '\u0302',
  widehat: '\u0302',
  bar: '\u0304',
  overline: '\u0305',
  dot: '\u0307',
  ddot: '\u0308',
  tilde: '\u0303',
};
const accent = (name: string, body: string) =>
  name === 'overline' || name === 'overrightarrow' || [...body].length === 1
    ? [...body].map((c) => c + ACCENTS[name]).join('')
    : `${body}${ACCENTS[name]}`;

export function prettifyBareTex(text: string): string {
  if (!/[\\^_]/.test(text)) return text;
  let out = text
    // espaços e escapes de um caractere: 10\,\Omega, 10\%, \{ \}
    .replace(/\\[,;:!> ]/g, (m) => (m === '\\!' ? '' : ' '))
    .replace(/\\([%&#{}_])/g, '$1')
    .replace(/\\mathbb\{([A-Z])\}/g, (whole, l: string) => BB[l] ?? whole);
  // 1) símbolos (\Delta, \times, \rightarrow…) e funções (\sin, \log). \sqrt, \frac e acentos ficam para o passo 3.
  out = out.replace(/\\([A-Za-z]+)(?![A-Za-z])( ?)/g, (whole, name: string, sp: string) => {
    if (FUNCS.has(name)) return `${name} `;
    const sym = SYMBOLS[name];
    return sym === undefined ? whole : sym + sp;
  });
  // 2) expoentes e índices: b^2 → b², x^{10} → x¹⁰, 30^\circ → 30°, H_2O → H₂O, θ_1 → θ₁, x_{max} → xₘₐₓ. "A_" (genética) fica.
  out = out
    .replace(/\^\{?°\}?/g, '°')
    .replace(/\^\{?′\}?/g, '′')
    .replace(
      /\^\{([0-9+\-−n]+)\}|\^([0-9]+|[+\-−n])(?![0-9A-Za-z])/g,
      (whole, a?: string, b?: string) => toSup(a ?? b ?? '') ?? whole,
    )
    .replace(
      /(?<=[\p{L})\]′])_\{([0-9a-z+-]+)\}|(?<=[\p{L})\]])_([0-9]+|[aehijklmnoprstuvx](?![A-Za-z]))/gu,
      (whole, a?: string, b?: string) => toSub(a ?? b ?? '') ?? whole,
    );
  // 3) de dentro para fora: \text{…}, acentos, \sqrt{x} → √x, \frac{a}{b} → a/b (até estabilizar).
  for (let i = 0; i < 4; i++) {
    const before = out;
    out = out
      .replace(
        /\\(?:text|mathrm|mathbf|mathit|mathsf|mathcal|textbf|textit|boldsymbol|operatorname)\{([^{}]*)\}/g,
        '$1',
      )
      .replace(
        /\\(vec|overrightarrow|hat|widehat|bar|overline|dot|ddot|tilde)\{([^{}]+)\}/g,
        (_, n: string, a: string) => accent(n, a),
      )
      .replace(/\\(vec|hat|bar|dot|tilde) ?([A-Za-z])(?![A-Za-z])/g, (_, n: string, a: string) =>
        accent(n, a),
      )
      .replace(/\\sqrt\{([^{}]+)\}/g, (_, a: string) => (simple(a) ? `√${a}` : `√(${a})`))
      .replace(
        /\\[dt]?frac\{([^{}]+)\}\{([^{}]+)\}/g,
        (_, a: string, b: string) => `${simple(a) ? a : `(${a})`}/${simple(b) ? b : `(${b})`}`,
      );
    if (out === before) break;
  }
  return out
    .replace(/\\sqrt(?![A-Za-z{])/g, '√')
    .replace(/\\left|\\right/g, '')
    .replace(/(sin|cos|tan|sen|tg|log|ln) (?=[(\d])/g, '$1');
}
