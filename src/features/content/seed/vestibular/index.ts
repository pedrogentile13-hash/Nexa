import { ENEM_LINGUAGENS, ENEM_MATEMATICA } from './enem-linguagens-matematica';
import { ENEM_HUMANAS, ENEM_NATUREZA } from './enem-natureza-humanas';
import { FUVEST_EXATAS, FUVEST_HUMANAS } from './fuvest';
import { UNICAMP, UNESP } from './unicamp-unesp';
import type { SimuladoVest } from './types';

export { BANCA_LABEL, VEST_TAG } from './types';
export type { Banca, QuestaoVest, SimuladoVest } from './types';

export const SIMULADOS_VESTIBULAR: SimuladoVest[] = [ENEM_LINGUAGENS, ENEM_MATEMATICA, ENEM_NATUREZA, ENEM_HUMANAS, FUVEST_HUMANAS, FUVEST_EXATAS, UNICAMP, UNESP];
