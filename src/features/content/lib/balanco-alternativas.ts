import type { PacoteG2, QuestaoG2 } from '../seed/grande2/types';

/**
 * Regra do "simulado": a alternativa certa NÃO pode ser reconhecida pelo tamanho. As erradas ficam com
 * tamanho parecido com o da certa (±MARGEM) e a certa não é a mais longa na maioria das questões.
 */
export const MARGEM = 0.12;
/** Abaixo deste tamanho (ex.: fórmulas, números) o limite é em caracteres, não em porcentagem. */
export const CURTA = 25;
export const DIF_CURTA = 7;
/** No máximo esta fração das questões de um simulado pode ter a certa como a MAIS longa. */
export const MAX_CERTA_MAIS_LONGA = 0.3;

export interface ProblemaTamanho {
  pacote: string;
  questao: string;
  motivo: string;
}

export function problemasDeTamanho(pacote: PacoteG2): ProblemaTamanho[] {
  const out: ProblemaTamanho[] = [];
  let objetivas = 0;
  let certaMaisLonga = 0;
  for (const q of pacote.questoes) {
    if (q.k !== 'o') continue;
    objetivas++;
    const ok = q.ok.length;
    const tamanhos = q.wrong.map((w) => w.length);
    if (ok > Math.max(...tamanhos)) certaMaisLonga++;
    for (const [i, w] of q.wrong.entries()) {
      const dif = Math.abs(w.length - ok);
      const limite = ok < CURTA ? DIF_CURTA : Math.ceil(ok * MARGEM);
      if (dif > limite)
        out.push({
          pacote: pacote.slug,
          questao: q.s.slice(0, 50),
          motivo: `errada ${i + 1} tem ${w.length} caracteres e a certa tem ${ok} (limite ±${limite})`,
        });
    }
  }
  if (objetivas >= 5 && certaMaisLonga / objetivas > MAX_CERTA_MAIS_LONGA)
    out.push({
      pacote: pacote.slug,
      questao: '(simulado inteiro)',
      motivo: `a certa é a mais longa em ${certaMaisLonga} de ${objetivas} questões`,
    });
  return out;
}

export type { QuestaoG2 };
