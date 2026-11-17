import type { PacoteG2 } from '../grande2/types';
import type { TrilhaG3 } from '../grande3/types';
import { SIMULADO_FINAL_PA8 } from './final';
import { FISICA_BASE, FISICA_PROVA } from './fisica';
import { MATEMATICA_BASE, MATEMATICA_PROVA } from './matematica';
import { BIOLOGIA_BASE, BIOLOGIA_PROVA, QUIMICA_BASE, QUIMICA_PROVA } from './quimica-biologia';
import { RESUMOS_PA8_CIENCIAS } from './resumos-ciencias';
import { RESUMOS_PA8_MATEMATICA } from './resumos-matematica';

/**
 * PA8 · Prova Anglo 8 (9º ano, 2026), dia 2: Matemática (módulos 19 a 37) e Ciências (Física, Química e
 * Biologia). Simulados BASE (10 questões, um degrau abaixo da prova), simulados NÍVEL PROVA (10 questões, no
 * estilo de cobrança do Anglo) e o simulado FINAL (32 questões: 16 de Matemática, 8 de Física, 4 de Química e
 * 4 de Biologia).
 */
export const PA8_TAG = 'pa8-prova-anglo';

export const RESUMOS_PA8 = [...RESUMOS_PA8_MATEMATICA, ...RESUMOS_PA8_CIENCIAS];

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

const BASE = 'um degrau abaixo da prova';

export const PACOTES_PA8: PacoteG2[] = [
  pacote(
    'pa8-base-matematica',
    'matematica',
    'Simulado base · Matemática (PA8)',
    `Módulos 19 a 37: 10 questões objetivas, ${BASE}`,
    'Para começar: matemática financeira, proporcionalidade, plano cartesiano, relações métricas, circunferência, equação do 2º grau, probabilidade, volume e trigonometria.',
    30,
    MATEMATICA_BASE,
  ),
  pacote(
    'pa8-base-fisica',
    'fisica',
    'Simulado base · Física (PA8)',
    `Magnetismo a Astronomia: 10 questões objetivas, ${BASE}`,
    'Para começar: ímãs, eletromagnetismo, espectro eletromagnético, fibra óptica e heliocentrismo.',
    30,
    FISICA_BASE,
  ),
  pacote(
    'pa8-base-quimica',
    'quimica',
    'Simulado base · Química (PA8)',
    `Ligações, ácidos, bases, sais e óxidos: 10 questões objetivas, ${BASE}`,
    'Para começar: ligação iônica, covalente e metálica, ácidos, bases, sais, neutralização e óxidos.',
    30,
    QUIMICA_BASE,
  ),
  pacote(
    'pa8-base-biologia',
    'biologia',
    'Simulado base · Biologia (PA8)',
    `Genética, evolução e sustentabilidade: 10 questões objetivas, ${BASE}`,
    'Para começar: genótipo e fenótipo, cruzamentos, DNA, transgênicos, seleção natural, sustentabilidade e Unidades de Conservação.',
    30,
    BIOLOGIA_BASE,
  ),
  pacote(
    'pa8-prova-matematica',
    'matematica',
    'Simulado nível prova · Matemática (PA8)',
    'Módulos 19 a 37: 10 questões no estilo da Prova Anglo',
    'Situações-problema com mais de uma etapa e alternativas com distratores próximos.',
    40,
    MATEMATICA_PROVA,
  ),
  pacote(
    'pa8-prova-fisica',
    'fisica',
    'Simulado nível prova · Física (PA8)',
    '10 questões no estilo da Prova Anglo',
    'Textos de apoio, cálculo simples e interpretação de situações de eletromagnetismo, ondas e Astronomia.',
    40,
    FISICA_PROVA,
  ),
  pacote(
    'pa8-prova-quimica',
    'quimica',
    'Simulado nível prova · Química (PA8)',
    '10 questões no estilo da Prova Anglo',
    'Propriedades das substâncias, reações de neutralização, nomenclatura e óxidos em situações do cotidiano.',
    40,
    QUIMICA_PROVA,
  ),
  pacote(
    'pa8-prova-biologia',
    'biologia',
    'Simulado nível prova · Biologia (PA8)',
    '10 questões no estilo da Prova Anglo',
    'Probabilidade em genética, biotecnologia, evolução e Unidades de Conservação a partir de textos.',
    40,
    BIOLOGIA_PROVA,
  ),
  pacote(
    'pa8-final',
    'matematica',
    'Simulado FINAL · Prova Anglo PA8',
    '32 questões: 16 de Matemática, 8 de Física, 4 de Química e 4 de Biologia',
    'Formato da prova do dia 2: 32 questões de múltipla escolha, 16 de Matemática e 16 de Ciências (8 de Física, 4 de Química e 4 de Biologia).',
    120,
    SIMULADO_FINAL_PA8,
  ),
];

const L = (titulo: string, minutos: number, ...itens: string[]) => ({ titulo, minutos, itens });
const R = (id: string) => `g3-pa8-${id}`;

/** Uma seção por matéria (cada uma já abre livre); o simulado final fica no fim. */
export const TRILHA_PA8: TrilhaG3 = {
  slug: 'pa8-prova-anglo',
  subject: 'matematica',
  titulo: 'PA8 · Prova Anglo 8 (9º ano, 2026)',
  descricao:
    'Tudo para a Prova Anglo do dia 2 (Matemática e Ciências): micro resumos por módulo, simulados base, simulados no nível da prova e o simulado final com 32 questões. Cada matéria abre livre, na ordem que você preferir.',
  categoria: 'fundamental',
  series: [SERIE],
  secoes: [
    {
      titulo: 'Matemática (módulos 19 a 37)',
      licoes: [
        L('Módulo 19: Matemática Financeira', 10, R('mat-19')),
        L('Módulo 20: Proporcionalidade', 8, R('mat-20')),
        L('Módulo 21: Explorações no plano cartesiano', 8, R('mat-21')),
        L('Módulo 22: Relações métricas no triângulo retângulo', 8, R('mat-22')),
        L('Módulo 23: Estudo da circunferência', 8, R('mat-23')),
        L('Módulo 24: Raízes da equação do 2º grau', 8, R('mat-24')),
        L('Módulo 25: Sistemas de equações', 8, R('mat-25')),
        L('Módulo 26: Polígonos regulares', 8, R('mat-26')),
        L('Módulo 27: Funções: dependência entre variáveis', 8, R('mat-27')),
        L('Módulo 28: Resolução de problemas', 8, R('mat-28')),
        L('Módulo 29: Volume de prismas e cilindros', 8, R('mat-29')),
        L('Módulo 30: Probabilidade', 8, R('mat-30')),
        L('Módulo 31: Equações redutíveis a equações do 2º grau', 8, R('mat-31')),
        L('Módulo 32: Frações algébricas e equações fracionárias', 8, R('mat-32')),
        L('Módulo 33: Razões trigonométricas no triângulo retângulo', 8, R('mat-33')),
        L('Módulo 34: Representação de funções', 8, R('mat-34')),
        L('Módulo 35: Vistas e perspectivas', 8, R('mat-35')),
        L('Módulo 36: Organização de dados de pesquisa', 8, R('mat-36')),
        L('Módulo 37: Investigações matemáticas e resolução de problemas', 8, R('mat-37')),
        L('Simulado base de Matemática', 30, 'pa8-base-matematica'),
        L('Simulado nível prova de Matemática', 40, 'pa8-prova-matematica'),
      ],
    },
    {
      titulo: 'Física (Setor B, módulos 11 a 18)',
      licoes: [
        L('Módulo 11: Magnetismo', 8, R('fi-11')),
        L('Módulo 12: Eletromagnetismo', 8, R('fi-12')),
        L('Módulo 13: Ondas eletromagnéticas e suas aplicações', 8, R('fi-13')),
        L('Módulo 14: Sistemas de comunicação', 8, R('fi-14')),
        L('Módulo 15: O nascimento da Astronomia', 8, R('fi-15')),
        L('Módulo 16: O Sistema Solar', 8, R('fi-16')),
        L('Módulo 17: Evolução estelar', 8, R('fi-17')),
        L('Módulo 18: Ser humano em outro planeta?', 8, R('fi-18')),
        L('Simulado base de Física', 30, 'pa8-base-fisica'),
        L('Simulado nível prova de Física', 40, 'pa8-prova-fisica'),
      ],
    },
    {
      titulo: 'Química (Setor C, módulos 7 a 9)',
      licoes: [
        L('Módulo 7: Ligações químicas', 8, R('qu-7')),
        L('Módulo 8: Funções inorgânicas: ácidos, bases e sais', 8, R('qu-8')),
        L('Módulo 9: Funções inorgânicas: óxidos', 8, R('qu-9')),
        L('Simulado base de Química', 30, 'pa8-base-quimica'),
        L('Simulado nível prova de Química', 40, 'pa8-prova-quimica'),
      ],
    },
    {
      titulo: 'Biologia (Setor A e Setor C)',
      licoes: [
        L('Módulo 7: Hereditariedade', 8, R('bi-7')),
        L('Módulo 8: Genes e Biotecnologia', 8, R('bi-8')),
        L('Módulo 9: Doenças genéticas e aconselhamento genético', 8, R('bi-9')),
        L('Módulo 10: Evolução é transformação', 8, R('bi-10')),
        L('Sustentabilidade', 8, R('bi-sust')),
        L('Unidades de Conservação', 8, R('bi-uc')),
        L('Simulado base de Biologia', 30, 'pa8-base-biologia'),
        L('Simulado nível prova de Biologia', 40, 'pa8-prova-biologia'),
      ],
    },
    {
      titulo: 'Simulado final',
      licoes: [L('Simulado FINAL: 32 questões', 120, 'pa8-final')],
    },
  ],
};
