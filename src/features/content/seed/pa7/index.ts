import type { PacoteG2 } from '../grande2/types';
import type { TrilhaG3 } from '../grande3/types';
import { GEOGRAFIA_BASE, GEOGRAFIA_PROVA } from './geografia';
import { HISTORIA_BASE, HISTORIA_PROVA } from './historia';
import { PORTUGUES_BASE, PORTUGUES_PROVA } from './portugues';
import { SIMULADO_FINAL } from './final';

export { RESUMOS_PA7 } from './resumos';

/**
 * PA7 · Prova Anglo 7 (9º ano, 2026): o 4º bimestre inteiro (Português 34 a 41, História 13 a 16, Geografia 11 e 12
 * e Produção de Texto). Simulados BASE (10 questões, um pouco abaixo do nível da prova), simulados NÍVEL PROVA
 * (10 questões, no estilo de cobrança da P-1 e da P-3), e o simulado FINAL (32 questões + redação).
 */
export const PA7_TAG = 'pa7-prova-anglo';

const SERIE = '9º ano' as const;

const pacote = (
  slug: string,
  subject: string,
  title: string,
  subtitle: string,
  description: string,
  minutes: number,
  questoes: PacoteG2['questoes'],
): PacoteG2 => ({
  slug,
  kind: 'simulado',
  context: 'study',
  subject,
  grade: SERIE,
  title,
  subtitle,
  description,
  minutes,
  questoes,
});

export const PACOTES_PA7: PacoteG2[] = [
  pacote(
    'pa7-base-portugues',
    'lingua-portuguesa',
    'Simulado base · Português (PA7)',
    'Módulos 34 a 41: 10 questões objetivas, um degrau abaixo da prova',
    'Para começar: escuta e oralidade, regência, da narração à argumentação, conto policial, efeitos de sentido do verbo, texto didático e verbos de ligação.',
    30,
    PORTUGUES_BASE,
  ),
  pacote(
    'pa7-base-historia',
    'historia',
    'Simulado base · História (PA7)',
    'Módulos 13 a 16: 10 questões objetivas, um degrau abaixo da prova',
    'Para começar: AI-5 e anos de chumbo, milagre econômico, cultura e censura, anistia, Diretas Já, Constituição de 1988 e história recente do Brasil.',
    30,
    HISTORIA_BASE,
  ),
  pacote(
    'pa7-base-geografia',
    'geografia',
    'Simulado base · Geografia (PA7)',
    'Módulos 11 e 12: 10 questões objetivas, um degrau abaixo da prova',
    'Para começar: Japão (relevo, economia, urbanização e população) e Oceania (Austrália, Nova Zelândia, povos originários e meio ambiente).',
    30,
    GEOGRAFIA_BASE,
  ),
  pacote(
    'pa7-prova-portugues',
    'lingua-portuguesa',
    'Simulado nível prova · Português (PA7)',
    'Módulos 34 a 41: 10 questões no estilo da Prova Anglo',
    'Mesmo estilo de cobrança da P-1 e da P-3: texto-base, enunciado interpretativo e cinco alternativas com distratores próximos.',
    40,
    PORTUGUES_PROVA,
  ),
  pacote(
    'pa7-prova-historia',
    'historia',
    'Simulado nível prova · História (PA7)',
    'Módulos 13 a 16: 10 questões no estilo da Prova Anglo',
    'Mesmo estilo de cobrança da P-1 e da P-3: textos e documentos para ler, comparar e interpretar.',
    40,
    HISTORIA_PROVA,
  ),
  pacote(
    'pa7-prova-geografia',
    'geografia',
    'Simulado nível prova · Geografia (PA7)',
    'Módulos 11 e 12: 10 questões no estilo da Prova Anglo',
    'Mesmo estilo de cobrança da P-1 e da P-3: textos de apoio, análise de situações e alternativas que exigem interpretação.',
    40,
    GEOGRAFIA_PROVA,
  ),
  pacote(
    'pa7-final',
    'lingua-portuguesa',
    'Simulado FINAL · Prova Anglo PA7',
    '32 questões (16 de Português, 8 de História e 8 de Geografia) e a redação',
    'Idêntico ao formato da prova: 32 questões de múltipla escolha e uma proposta de Produção de Texto (artigo de opinião). A redação é corrigida pela IA, na própria questão, com nota de 0 a 1.',
    150,
    SIMULADO_FINAL,
  ),
];

const L = (titulo: string, minutos: number, ...itens: string[]) => ({ titulo, minutos, itens });
const R = (id: string) => `g3-pa7-${id}`;

/** Uma seção por matéria (cada uma já abre livre); o simulado final fica no fim. */
export const TRILHA_PA7: TrilhaG3 = {
  slug: 'pa7-prova-anglo',
  subject: 'lingua-portuguesa',
  titulo: 'PA7 · Prova Anglo 7 (9º ano, 2026)',
  descricao:
    'Tudo para a Prova Anglo do 4º bimestre: micro resumos por módulo, simulados base, simulados no nível da prova e o simulado final com 32 questões e a redação. Cada matéria abre livre, na ordem que você preferir.',
  categoria: 'fundamental',
  series: [SERIE],
  secoes: [
    {
      titulo: 'Língua Portuguesa (módulos 34 a 41)',
      licoes: [
        L('Módulo 34: escuta e reprodução oral', 8, R('pt-34')),
        L('Módulo 35: regências', 10, R('pt-35')),
        L('Módulo 36: da narração à argumentação', 8, R('pt-36')),
        L('Módulo 37: um conto policial', 8, R('pt-37')),
        L('Módulo 38: efeitos de sentido do verbo', 10, R('pt-38')),
        L('Módulo 39: narrativa policial', 8, R('pt-39')),
        L('Módulo 40: texto didático', 8, R('pt-40')),
        L('Módulo 41: verbo de ligação', 8, R('pt-41')),
        L('Simulado base de Português', 30, 'pa7-base-portugues'),
        L('Simulado nível prova de Português', 40, 'pa7-prova-portugues'),
      ],
    },
    {
      titulo: 'História (módulos 13 a 16)',
      licoes: [
        L('Módulo 13: os anos de chumbo', 10, R('hi-13')),
        L('Módulo 14: cultura nos anos 1960 e 1970', 10, R('hi-14')),
        L('Módulo 15: a redemocratização', 10, R('hi-15')),
        L('Módulo 16: a história recente do Brasil', 10, R('hi-16')),
        L('Simulado base de História', 30, 'pa7-base-historia'),
        L('Simulado nível prova de História', 40, 'pa7-prova-historia'),
      ],
    },
    {
      titulo: 'Geografia (módulos 11 e 12)',
      licoes: [
        L('Módulo 11: Japão', 10, R('ge-11')),
        L('Módulo 12: Oceania', 10, R('ge-12')),
        L('Simulado base de Geografia', 30, 'pa7-base-geografia'),
        L('Simulado nível prova de Geografia', 40, 'pa7-prova-geografia'),
      ],
    },
    {
      titulo: 'Simulado final',
      licoes: [L('Simulado FINAL: 32 questões e redação', 150, 'pa7-final')],
    },
  ],
};
