import { pacotesDaSerie } from './gerador';
import { EXATAS_G2 } from './exatas';
import { GEOGRAFIA_G2 } from './geografia';
import { HISTORIA_G2 } from './historia';
import { HUMANAS_G2 } from './humanas';
import { LINGUAS_G2 } from './linguas';
import { MATEMATICA_G2 } from './matematica';
import { NATUREZA_G2 } from './natureza';
import { PORTUGUES_G2 } from './portugues';
import { blocoParaPacotes, type PacoteG2 } from './types';
import { VESTIBULAR_G2 } from './vestibular';

export { G2_TAG } from './types';
export type { BancaG2, PacoteG2, QuestaoG2 } from './types';

/** Blocos escritos à mão (Português, Literatura, Inglês, Espanhol, Artes, Ciências, Biologia, História, Geografia, Filosofia, Sociologia). */
const BLOCOS = [
  ...PORTUGUES_G2,
  ...LINGUAS_G2,
  ...NATUREZA_G2,
  ...HISTORIA_G2,
  ...GEOGRAFIA_G2,
  ...HUMANAS_G2,
];

/** Nexa Study: quizzes e simulados de todas as séries (6º ano ao 3º EM). */
export const PACOTES_G2_STUDY: PacoteG2[] = [
  ...[...MATEMATICA_G2, ...EXATAS_G2].flatMap(pacotesDaSerie),
  ...BLOCOS.flatMap(blocoParaPacotes),
];

/** Nexa Vestibular: simulados de ENEM, Fuvest, Unicamp, Unesp, ITA e IME. */
export const PACOTES_G2_VESTIBULAR: PacoteG2[] = VESTIBULAR_G2;

export const PACOTES_G2: PacoteG2[] = [...PACOTES_G2_STUDY, ...PACOTES_G2_VESTIBULAR];
