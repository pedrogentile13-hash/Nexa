import { BIOLOGIA } from './pacotes-biologia';
import { CIENCIAS } from './pacotes-ciencias';
import { FISICA } from './pacotes-fisica';
import { MATEMATICA } from './pacotes-matematica';
import { QUIMICA } from './pacotes-quimica';
import { LOTE2_EXATAS } from './pacotes-lote2-exatas';
import { LOTE4_GEOGRAFIA } from './pacotes-lote4-geografia';
import { LOTE4_HISTORIA } from './pacotes-lote4-historia';
import { LOTE4_PORTUGUES } from './pacotes-lote4-portugues';
import { LOTE3_BIO_FIS } from './pacotes-lote3-bio-fis';
import { LOTE3_CIENCIAS } from './pacotes-lote3-ciencias';
import { LOTE3_MAT_A } from './pacotes-lote3-mat-medio-a';
import { LOTE3_MAT_B } from './pacotes-lote3-mat-medio-b';
import { LOTE3_MAT_FUND } from './pacotes-lote3-mat-fund';
import { LOTE3_QUIMICA } from './pacotes-lote3-quimica';
import { LOTE2_MATEMATICA } from './pacotes-lote2-matematica';
import { LOTE2_NATUREZA } from './pacotes-lote2-natureza';
import type { PacoteSeed } from './helpers';
import { TOPICOS } from './topicos';

export { TOPICOS };
export type { PacoteSeed, QuestaoSeed } from './helpers';

/** Matéria de cada pacote, pelo slug do tópico. */
export const PACOTES: PacoteSeed[] = [...MATEMATICA, ...CIENCIAS, ...BIOLOGIA, ...FISICA, ...QUIMICA, ...LOTE2_MATEMATICA, ...LOTE2_NATUREZA, ...LOTE2_EXATAS, ...LOTE3_MAT_FUND, ...LOTE3_MAT_A, ...LOTE3_MAT_B, ...LOTE3_CIENCIAS, ...LOTE3_BIO_FIS, ...LOTE3_QUIMICA, ...LOTE4_PORTUGUES, ...LOTE4_HISTORIA, ...LOTE4_GEOGRAFIA];

/** Marca dos recursos carregados por aqui: serve para achar e publicar o pacote inicial de uma vez. */
export const SEED_TAG = 'pacote-nexa-v1';
