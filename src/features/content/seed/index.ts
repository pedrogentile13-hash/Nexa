import { BIOLOGIA } from './pacotes-biologia';
import { CIENCIAS } from './pacotes-ciencias';
import { FISICA } from './pacotes-fisica';
import { MATEMATICA } from './pacotes-matematica';
import { QUIMICA } from './pacotes-quimica';
import type { PacoteSeed } from './helpers';
import { TOPICOS } from './topicos';

export { TOPICOS };
export type { PacoteSeed, QuestaoSeed } from './helpers';

/** Matéria de cada pacote, pelo slug do tópico. */
export const PACOTES: PacoteSeed[] = [...MATEMATICA, ...CIENCIAS, ...BIOLOGIA, ...FISICA, ...QUIMICA];

/** Marca dos recursos carregados por aqui: serve para achar e publicar o pacote inicial de uma vez. */
export const SEED_TAG = 'pacote-nexa-v1';
