import { BIOLOGIA_MISTO } from './study-biologia';
import { FISICA_MISTO } from './study-fisica';
import { GEOGRAFIA_MISTO } from './study-geografia';
import { HISTORIA_MISTO } from './study-historia';
import { MATEMATICA_MISTO } from './study-matematica';
import { PORTUGUES_MISTO } from './study-portugues';
import { QUIMICA_MISTO } from './study-quimica';
import { SEGUNDA_FASE_MISTO } from './vestibular-segunda-fase';
import type { PacoteMisto } from './types';

export { MISTO_TAG } from './types';
export type { PacoteMisto, QuestaoDisc, QuestaoMista, QuestaoObj } from './types';

/** Nexa Study: sete matérias, cada uma com um quiz misto e um simulado misto (objetivas + discursivas). */
export const PACOTES_STUDY_MISTOS: PacoteMisto[] = [
  ...MATEMATICA_MISTO,
  ...FISICA_MISTO,
  ...QUIMICA_MISTO,
  ...BIOLOGIA_MISTO,
  ...HISTORIA_MISTO,
  ...GEOGRAFIA_MISTO,
  ...PORTUGUES_MISTO,
];

/** Nexa Vestibular: simulados de 2ª fase (Fuvest, Unicamp, Unesp). O ENEM continua só com simulados objetivos. */
export const PACOTES_VESTIBULAR_MISTOS: PacoteMisto[] = SEGUNDA_FASE_MISTO;

export const PACOTES_MISTOS: PacoteMisto[] = [
  ...PACOTES_STUDY_MISTOS,
  ...PACOTES_VESTIBULAR_MISTOS,
];
