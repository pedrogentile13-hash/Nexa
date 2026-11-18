/**
 * Identidade visual de cada prova para as "capas de caderno" do Banco de provas.
 *
 * Capas DESENHADAS pelo Nexa (cor, sigla e ano), não digitalizações das capas
 * oficiais: a imagem da capa é da instituição. Quando a Nexa tiver autorização
 * para usar a capa oficial, a imagem entra por `cover_url` (coluna em `exams`)
 * e substitui a capa desenhada sem mudar mais nada.
 */

export interface ExamBrand {
  /** Cor de fundo da capa. */
  bg: string;
  /** Cor do detalhe (faixa e sigla). */
  accent: string;
  /** Cor do texto sobre o fundo. */
  fg: string;
  /** Sigla curta mostrada na capa. */
  short: string;
}

const BRANDS: { match: RegExp; brand: ExamBrand }[] = [
  { match: /enem/i, brand: { bg: '#1E4FA0', accent: '#F5C400', fg: '#FFFFFF', short: 'ENEM' } },
  { match: /fuvest/i, brand: { bg: '#0A2A5E', accent: '#E8EEF8', fg: '#FFFFFF', short: 'FUVEST' } },
  { match: /unicamp|comvest/i, brand: { bg: '#B3122A', accent: '#FFFFFF', fg: '#FFFFFF', short: 'UNICAMP' } },
  { match: /unesp|vunesp/i, brand: { bg: '#123A7A', accent: '#7DD3FC', fg: '#FFFFFF', short: 'UNESP' } },
  { match: /\bita\b/i, brand: { bg: '#2A2F36', accent: '#FB923C', fg: '#FFFFFF', short: 'ITA' } },
  { match: /\bime\b/i, brand: { bg: '#34502D', accent: '#E5C158', fg: '#FFFFFF', short: 'IME' } },
];

const FALLBACK: ExamBrand = { bg: '#6D28D9', accent: '#DDD6FE', fg: '#FFFFFF', short: 'SIMULADO' };

export function examBrand(examName: string | null | undefined): ExamBrand {
  if (!examName) return FALLBACK;
  const found = BRANDS.find((b) => b.match.test(examName));
  if (found) return found.brand;
  return { ...FALLBACK, short: examName.slice(0, 10).toUpperCase() };
}

/** Cores dos eixos de tema de redação (capa do Banco de temas). */
export const AXIS_BRAND: Record<string, { bg: string; fg: string; label: string }> = {
  educacao: { bg: '#2563EB', fg: '#FFFFFF', label: 'Educação' },
  'meio-ambiente': { bg: '#15803D', fg: '#FFFFFF', label: 'Meio ambiente' },
  saude: { bg: '#DB2777', fg: '#FFFFFF', label: 'Saúde' },
  tecnologia: { bg: '#7C3AED', fg: '#FFFFFF', label: 'Tecnologia' },
  trabalho: { bg: '#B45309', fg: '#FFFFFF', label: 'Trabalho' },
  cidadania: { bg: '#0F766E', fg: '#FFFFFF', label: 'Cidadania' },
  cultura: { bg: '#C2410C', fg: '#FFFFFF', label: 'Cultura' },
  sociedade: { bg: '#4338CA', fg: '#FFFFFF', label: 'Sociedade' },
};
