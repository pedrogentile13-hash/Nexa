import { RESUMOS_HUMANAS } from './humanas';
import { RESUMOS_LINGUAGENS } from './linguagens';
import { RESUMOS_MATEMATICA } from './matematica';
import { RESUMOS_NATUREZA } from './natureza';
import { TRILHAS_G3 } from './trilhas';
import type { ResumoG3, TrilhaG3 } from './types';
import { RESUMOS_HABILIDADES, RESUMOS_VESTIBULAR } from './vestibular';

export { G3_TAG } from './types';
export type { ResumoG3, TrilhaG3 } from './types';

/** Resumos do Nexa Study (todas as séries) e da Biblioteca do Vestibular (redação, estratégia e planos de estudo). */
export const RESUMOS_G3: ResumoG3[] = [
  ...RESUMOS_MATEMATICA,
  ...RESUMOS_LINGUAGENS,
  ...RESUMOS_NATUREZA,
  ...RESUMOS_HUMANAS,
  ...RESUMOS_HABILIDADES,
  ...RESUMOS_VESTIBULAR,
];

/** Trilhas que juntam os resumos com os quizzes e simulados da Grande criação 2 (inclui os planos de estudo do vestibular). */
export const TRILHAS: TrilhaG3[] = TRILHAS_G3;
