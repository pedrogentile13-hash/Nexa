/**
 * Cores da escola, com trava de contraste.
 *
 * O app foi ajustado para acessibilidade (texto pequeno em `--brand-text`,
 * botão com texto branco sobre `--brand`). Uma escola escolhendo um amarelo
 * claro não pode desfazer isso, então cada cor só entra se passar:
 *   - `brand`      → texto BRANCO por cima precisa de 4,5:1 (botões)
 *   - `brand_text` → texto pequeno sobre fundo branco precisa de 4,5:1
 *   - `brand_soft` → fundo suave: o `brand_text` precisa ler sobre ele com 4,5:1
 * Se qualquer uma falhar, a escola usa só o nome e o logo e o resto do tema
 * continua o do Nexa — melhor ficar neutro do que ilegível.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export interface SchoolBrandColors {
  brand: string | null;
  brand_text: string | null;
  brand_soft: string | null;
}

const WHITE = '#ffffff';

/** Variáveis CSS a injetar, ou `null` se as cores não passam na trava. */
export function safeBrandVars(colors: SchoolBrandColors): Record<string, string> | null {
  const { brand, brand_text: text, brand_soft: soft } = colors;
  if (!brand || !text || !soft) return null;
  if (![brand, text, soft].every((c) => HEX.test(c))) return null;

  if (contrastRatio(brand, WHITE) < 4.5) return null;
  if (contrastRatio(text, WHITE) < 4.5) return null;
  if (contrastRatio(text, soft) < 4.5) return null;

  return { '--brand': brand, '--brand-text': text, '--brand-soft': soft, '--brand-fg': WHITE };
}
