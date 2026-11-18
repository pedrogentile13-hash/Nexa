/**
 * Siglas da biblioteca (B01, B02…). O aluno escreve "crie um simulado com o B01"
 * e a NexaAI precisa achar de qual material ele fala.
 */

/** "B1", "b01", "B 02", "(B003)" → ["B01", "B02", "B03"], sem repetir e na ordem em que aparecem. */
export function findDocCodes(text: string): string[] {
  const seen = new Set<string>();
  for (const match of text.matchAll(/(?<![A-Za-z0-9])b\s?0*(\d{1,3})(?![A-Za-z0-9])/gi)) {
    const n = Number(match[1]);
    if (n >= 1) seen.add(`B${String(n).padStart(2, '0')}`);
  }
  return [...seen].slice(0, 3);
}

export interface DocRef {
  code: string;
  title: string;
  content: string;
}

const PER_DOC = 14_000;
const TOTAL = 40_000;

/** Bloco que entra no prompt: cada material com a sigla e o título, cortado para caber. */
export function docsContextBlock(docs: DocRef[]): string {
  if (docs.length === 0) return '';
  let budget = TOTAL;
  const parts: string[] = [];
  for (const d of docs) {
    const take = Math.min(PER_DOC, budget);
    if (take <= 0) break;
    parts.push(`[${d.code}] ${d.title}\n<<<MATERIAL\n${d.content.slice(0, take)}\nMATERIAL>>>`);
    budget -= take;
  }
  return `MATERIAIS DA BIBLIOTECA DO ALUNO (ele os chama pela sigla):\n${parts.join('\n\n')}`;
}
