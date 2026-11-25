import type { LicaoG3, TrilhaG3 } from './types';

/** Lição: título, minutos estimados e os itens (resumo g3-…, quiz/simulado g2-…), na ordem em que o aluno faz. */
const L = (titulo: string, minutos: number, ...itens: string[]): LicaoG3 => ({
  titulo,
  minutos,
  itens,
});

const mat = (serie: string, tema: string) => [
  `g2-matematica-${serie}-${tema}-quiz`,
  `g2-matematica-${serie}-${tema}-simulado`,
];

/** 26 trilhas: Fundamental, reforço do Médio, ENEM e vestibulares (planos de estudo), habilidades e carreiras. */
export const TRILHAS_G3: TrilhaG3[] = [
  // ------------------------------------------------------------ Fundamental
  {
    slug: 'trilha-mat-6',
    subject: 'matematica',
    categoria: 'fundamental',
    series: ['6º ano'],
    titulo: 'Matemática do 6º ano: das contas às áreas',
    descricao:
      'Expressões, MMC e MDC, frações, decimais e áreas, uma etapa por vez, com quiz e simulado.',
    secoes: [
      {
        titulo: 'Números',
        licoes: [
          L('Expressões, MMC e MDC', 25, 'g3-mat6-expressoes-mmc', ...mat('6-ano', 'expressoes')),
          L('Frações', 25, 'g3-mat6-fracoes', ...mat('6-ano', 'fracoes')),
          L('Decimais e dinheiro', 20, 'g3-mat6-decimais', ...mat('6-ano', 'decimais')),
        ],
      },
      {
        titulo: 'Geometria',
        licoes: [L('Perímetro e área', 25, 'g3-mat6-perimetro-area', ...mat('6-ano', 'areas'))],
      },
    ],
  },
  {
    slug: 'trilha-mat-7',
    subject: 'matematica',
    categoria: 'fundamental',
    series: ['7º ano'],
    titulo: 'Matemática do 7º ano: inteiros, equações e porcentagem',
    descricao:
      'Regras de sinais, equações do 1º grau, regra de três e porcentagem com situações do dia a dia.',
    secoes: [
      {
        titulo: 'Álgebra',
        licoes: [
          L('Números inteiros', 20, 'g3-mat7-inteiros', ...mat('7-ano', 'inteiros')),
          L('Equações do 1º grau', 25, 'g3-mat7-equacoes', ...mat('7-ano', 'equacoes')),
        ],
      },
      {
        titulo: 'Proporcionalidade',
        licoes: [
          L('Razão, proporção e regra de três', 25, 'g3-mat7-proporcao', ...mat('7-ano', 'razao')),
          L('Porcentagem', 25, 'g3-mat7-porcentagem', ...mat('7-ano', 'porcentagem')),
        ],
      },
    ],
  },
  {
    slug: 'trilha-mat-8',
    subject: 'matematica',
    categoria: 'fundamental',
    series: ['8º ano'],
    titulo: 'Matemática do 8º ano: potências, álgebra e estatística',
    descricao: 'Potências e notação científica, produtos notáveis, sistemas e probabilidade.',
    secoes: [
      {
        titulo: 'Álgebra',
        licoes: [
          L(
            'Potências e notação científica',
            25,
            'g3-mat8-potencias',
            ...mat('8-ano', 'potencias'),
          ),
          L('Produtos notáveis', 25, 'g3-mat8-produtos-notaveis', ...mat('8-ano', 'algebra')),
          L('Sistemas de equações', 25, 'g3-mat8-sistemas', ...mat('8-ano', 'sistemas')),
        ],
      },
      {
        titulo: 'Dados e chance',
        licoes: [
          L(
            'Probabilidade e estatística',
            25,
            'g3-mat8-estatistica',
            ...mat('8-ano', 'estatistica'),
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-mat-9',
    subject: 'matematica',
    categoria: 'fundamental',
    series: ['9º ano'],
    titulo: 'Matemática do 9º ano: rumo ao Ensino Médio',
    descricao: 'Equação do 2º grau, Pitágoras, trigonometria e juros: a base para o Médio.',
    secoes: [
      {
        titulo: 'Álgebra',
        licoes: [
          L('Equações do 2º grau', 30, 'g3-mat9-segundo-grau', ...mat('9-ano', 'segundo-grau')),
        ],
      },
      {
        titulo: 'Geometria',
        licoes: [
          L('Teorema de Pitágoras', 25, 'g3-mat9-pitagoras', ...mat('9-ano', 'pitagoras')),
          L(
            'Trigonometria no triângulo retângulo',
            25,
            'g3-mat9-trigonometria',
            ...mat('9-ano', 'trigonometria'),
          ),
        ],
      },
      {
        titulo: 'Matemática financeira',
        licoes: [L('Juros simples e compostos', 25, 'g3-mat9-juros', ...mat('9-ano', 'juros'))],
      },
    ],
  },
  {
    slug: 'trilha-port-fund',
    subject: 'lingua-portuguesa',
    categoria: 'fundamental',
    series: ['6º ano', '7º ano', '8º ano', '9º ano'],
    titulo: 'Português do Fundamental II: gramática que faz sentido',
    descricao: 'Classes de palavras, acentuação, sujeito, vozes verbais, conectivos e crase.',
    secoes: [
      {
        titulo: '6º e 7º ano',
        licoes: [
          L(
            'Classes de palavras e acentuação',
            30,
            'g3-port6-classes',
            'g3-port6-acentuacao',
            'g2-lingua-portuguesa-6-classes-quiz',
            'g2-lingua-portuguesa-6-classes-simulado',
          ),
          L(
            'Sujeito, predicado e pontuação',
            25,
            'g3-port7-sujeito-predicado',
            'g2-lingua-portuguesa-7-sujeito-quiz',
            'g2-lingua-portuguesa-7-sujeito-simulado',
          ),
        ],
      },
      {
        titulo: '8º e 9º ano',
        licoes: [
          L(
            'Vozes verbais e concordância',
            25,
            'g3-port8-vozes-verbais',
            'g2-lingua-portuguesa-8-vozes-quiz',
            'g2-lingua-portuguesa-8-vozes-simulado',
          ),
          L(
            'Conectivos, orações e crase',
            25,
            'g3-port9-conectivos-crase',
            'g2-lingua-portuguesa-9-oracoes-quiz',
            'g2-lingua-portuguesa-9-oracoes-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-ciencias-fund',
    subject: 'ciencias',
    categoria: 'fundamental',
    series: ['6º ano', '7º ano', '8º ano', '9º ano'],
    titulo: 'Ciências do Fundamental II: da célula ao universo',
    descricao: 'Célula e planeta, ecossistemas, saúde, corpo humano, hereditariedade e energia.',
    secoes: [
      {
        titulo: 'Vida e ambiente',
        licoes: [
          L(
            'Célula, rochas e movimentos da Terra',
            25,
            'g3-cie6-celula-terra',
            'g2-ciencias-6-celula-terra-quiz',
            'g2-ciencias-6-celula-terra-simulado',
          ),
          L(
            'Ecossistemas e saúde',
            30,
            'g3-cie7-ecossistemas',
            'g3-cie7-saude-vacinas',
            'g2-ciencias-7-ecossistemas-quiz',
            'g2-ciencias-7-ecossistemas-simulado',
          ),
        ],
      },
      {
        titulo: 'Corpo humano',
        licoes: [
          L(
            'Sistemas do corpo e adolescência',
            30,
            'g3-cie8-corpo-humano',
            'g3-cie8-reproducao-adolescencia',
            'g2-ciencias-8-corpo-quiz',
            'g2-ciencias-8-corpo-simulado',
          ),
        ],
      },
      {
        titulo: 'Matéria, energia e universo',
        licoes: [
          L(
            'Energia elétrica em casa',
            20,
            'g3-cie9-universo-energia',
            'g2-ciencias-8-ano-energia-em-casa-quiz',
            'g2-ciencias-8-ano-energia-em-casa-simulado',
          ),
          L(
            'Hereditariedade e evolução',
            25,
            'g3-cie9-hereditariedade-evolucao',
            'g2-ciencias-9-hereditariedade-quiz',
            'g2-ciencias-9-hereditariedade-simulado',
          ),
          L(
            'Densidade, misturas e movimento',
            20,
            'g2-ciencias-9-ano-materia-e-movimento-quiz',
            'g2-ciencias-9-ano-materia-e-movimento-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-historia-fund',
    subject: 'historia',
    categoria: 'fundamental',
    series: ['6º ano', '7º ano', '8º ano', '9º ano'],
    titulo: 'História do Fundamental II: da Pré-História à Era Vargas',
    descricao: 'Uma linha do tempo em quatro etapas, com resumo, quiz e simulado em cada uma.',
    secoes: [
      {
        titulo: 'Antiguidade e Idade Moderna',
        licoes: [
          L(
            'Pré-História e primeiras civilizações',
            25,
            'g3-his6-pre-historia',
            'g2-historia-6-pre-historia-quiz',
            'g2-historia-6-pre-historia-simulado',
          ),
          L(
            'Renascimento, Reforma e Navegações',
            25,
            'g3-his7-renascimento-navegacoes',
            'g2-historia-7-renascimento-quiz',
            'g2-historia-7-renascimento-simulado',
          ),
        ],
      },
      {
        titulo: 'Revoluções e Brasil República',
        licoes: [
          L(
            'Iluminismo e revoluções',
            25,
            'g3-his8-revolucoes',
            'g2-historia-8-revolucoes-quiz',
            'g2-historia-8-revolucoes-simulado',
          ),
          L(
            'Primeira República e Era Vargas',
            25,
            'g3-his9-republica-vargas',
            'g2-historia-9-republica-quiz',
            'g2-historia-9-republica-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-geografia-fund',
    subject: 'geografia',
    categoria: 'fundamental',
    series: ['6º ano', '7º ano', '8º ano', '9º ano'],
    titulo: 'Geografia do Fundamental II: do mapa ao mundo globalizado',
    descricao: 'Cartografia, Brasil, América e África, globalização, Europa e Ásia.',
    secoes: [
      {
        titulo: 'Brasil',
        licoes: [
          L(
            'Cartografia',
            20,
            'g3-geo6-cartografia',
            'g2-geografia-6-cartografia-quiz',
            'g2-geografia-6-cartografia-simulado',
          ),
          L(
            'Regiões, biomas e população',
            25,
            'g3-geo7-brasil-regioes-biomas',
            'g2-geografia-7-brasil-quiz',
            'g2-geografia-7-brasil-simulado',
          ),
        ],
      },
      {
        titulo: 'Mundo',
        licoes: [
          L(
            'América e África',
            25,
            'g3-geo8-america-africa',
            'g2-geografia-8-continentes-quiz',
            'g2-geografia-8-continentes-simulado',
          ),
          L(
            'Globalização, Europa e Ásia',
            25,
            'g3-geo9-globalizacao',
            'g2-geografia-9-globalizacao-quiz',
            'g2-geografia-9-globalizacao-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-ingles-fund',
    subject: 'ingles',
    categoria: 'fundamental',
    series: ['6º ano', '7º ano', '8º ano', '9º ano'],
    titulo: 'Inglês do Fundamental II: do verb to be ao futuro',
    descricao: 'Presente, passado e futuro, com leitura e vocabulário do dia a dia.',
    secoes: [
      {
        titulo: 'Presente',
        licoes: [
          L(
            'Verb to be e pronomes',
            20,
            'g3-ing6-to-be',
            'g2-ingles-6-to-be-quiz',
            'g2-ingles-6-to-be-simulado',
          ),
          L(
            'Simple present e rotina',
            20,
            'g3-ing7-simple-present',
            'g2-ingles-7-simple-present-quiz',
            'g2-ingles-7-simple-present-simulado',
          ),
        ],
      },
      {
        titulo: 'Passado e futuro',
        licoes: [
          L(
            'Simple past',
            20,
            'g3-ing8-simple-past',
            'g2-ingles-8-simple-past-quiz',
            'g2-ingles-8-simple-past-simulado',
          ),
          L('Futuro e comparativos', 20, 'g2-ingles-9-futuro-quiz', 'g2-ingles-9-futuro-simulado'),
        ],
      },
    ],
  },

  // ------------------------------------------------------------ Reforço do Médio
  {
    slug: 'trilha-mat-funcoes',
    subject: 'matematica',
    categoria: 'reforco',
    series: ['1ª série EM'],
    titulo: 'Funções do zero: afim, quadrática, exponencial e logaritmo',
    descricao: 'A Matemática da 1ª série do Médio em quatro etapas, com progressões no final.',
    secoes: [
      {
        titulo: 'Funções',
        licoes: [
          L('Função afim', 25, 'g3-mat1-funcao-afim', ...mat('1-serie-em', 'afim')),
          L(
            'Função quadrática',
            30,
            'g3-mat1-funcao-quadratica',
            ...mat('1-serie-em', 'quadratica'),
          ),
          L('Exponencial e logaritmo', 30, 'g3-mat1-exp-log', ...mat('1-serie-em', 'exp-log')),
        ],
      },
      {
        titulo: 'Sequências',
        licoes: [L('PA e PG', 25, 'g3-mat1-progressoes', ...mat('1-serie-em', 'progressoes'))],
      },
    ],
  },
  {
    slug: 'trilha-mat-medio-2-3',
    subject: 'matematica',
    categoria: 'reforco',
    series: ['2ª série EM', '3ª série EM'],
    titulo: 'Matemática do Médio: contagem, geometria e estatística',
    descricao:
      'Combinatória, probabilidade, matrizes, geometria espacial e analítica, estatística, complexos e polinômios.',
    secoes: [
      {
        titulo: '2ª série',
        licoes: [
          L(
            'Análise combinatória',
            25,
            'g3-mat2-combinatoria',
            ...mat('2-serie-em', 'combinatoria'),
          ),
          L('Probabilidade', 25, 'g3-mat2-probabilidade', ...mat('2-serie-em', 'probabilidade')),
          L('Matrizes e determinantes', 25, 'g3-mat2-matrizes', ...mat('2-serie-em', 'matrizes')),
          L(
            'Geometria espacial',
            25,
            'g3-mat2-geometria-espacial',
            ...mat('2-serie-em', 'espacial'),
          ),
        ],
      },
      {
        titulo: '3ª série',
        licoes: [
          L(
            'Geometria analítica',
            25,
            'g3-mat3-geometria-analitica',
            ...mat('3-serie-em', 'analitica'),
          ),
          L('Estatística', 25, 'g3-mat3-estatistica', ...mat('3-serie-em', 'estatistica')),
          L('Números complexos', 25, 'g3-mat3-complexos', ...mat('3-serie-em', 'complexos')),
          L('Polinômios', 25, 'g3-mat3-polinomios', ...mat('3-serie-em', 'polinomios')),
        ],
      },
    ],
  },
  {
    slug: 'trilha-fisica-medio',
    subject: 'fisica',
    categoria: 'reforco',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Física do Ensino Médio completa',
    descricao: 'Da cinemática à eletricidade: resumo, quiz e simulado em cada etapa.',
    secoes: [
      {
        titulo: 'Mecânica',
        licoes: [
          L(
            'Cinemática',
            30,
            'g3-fis1-cinematica',
            'g2-fisica-1-serie-em-cinematica-quiz',
            'g2-fisica-1-serie-em-cinematica-simulado',
          ),
          L(
            'Leis de Newton',
            30,
            'g3-fis1-leis-newton',
            'g2-fisica-1-serie-em-newton-quiz',
            'g2-fisica-1-serie-em-newton-simulado',
          ),
          L(
            'Trabalho, energia e potência',
            30,
            'g3-fis1-energia',
            'g3-fis1-impulso-gravitacao',
            'g2-fisica-1-serie-em-energia-quiz',
            'g2-fisica-1-serie-em-energia-simulado',
          ),
        ],
      },
      {
        titulo: 'Termologia e ondas',
        licoes: [
          L(
            'Temperatura e calor',
            25,
            'g3-fis2-termologia',
            'g2-fisica-2-serie-em-termologia-quiz',
            'g2-fisica-2-serie-em-termologia-simulado',
          ),
          L(
            'Ondas, som e óptica',
            25,
            'g3-fis2-ondas-optica',
            'g2-fisica-2-serie-em-ondas-quiz',
            'g2-fisica-2-serie-em-ondas-simulado',
          ),
        ],
      },
      {
        titulo: 'Eletricidade',
        licoes: [
          L(
            'Circuitos e Lei de Ohm',
            30,
            'g3-fis3-eletricidade',
            'g2-fisica-3-serie-em-circuitos-quiz',
            'g2-fisica-3-serie-em-circuitos-simulado',
          ),
          L(
            'Consumo, eletrostática e magnetismo',
            30,
            'g3-fis3-eletromagnetismo',
            'g2-fisica-3-serie-em-consumo-quiz',
            'g2-fisica-3-serie-em-consumo-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-quimica-medio',
    subject: 'quimica',
    categoria: 'reforco',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Química do Ensino Médio completa',
    descricao: 'Átomo, ligações, mol, soluções, pH, estequiometria, gases e orgânica.',
    secoes: [
      {
        titulo: 'Química geral',
        licoes: [
          L(
            'Átomo e tabela periódica',
            25,
            'g3-qui1-atomo-tabela',
            'g2-quimica-1-serie-em-atomistica-quiz',
            'g2-quimica-1-serie-em-atomistica-simulado',
          ),
          L('Ligações e funções inorgânicas', 20, 'g3-qui1-ligacoes-funcoes'),
          L(
            'Mol e massa molar',
            25,
            'g3-qui1-mol',
            'g2-quimica-1-serie-em-mol-quiz',
            'g2-quimica-1-serie-em-mol-simulado',
          ),
        ],
      },
      {
        titulo: 'Físico-química',
        licoes: [
          L(
            'Soluções e concentração',
            25,
            'g3-qui2-solucoes',
            'g2-quimica-2-serie-em-solucoes-quiz',
            'g2-quimica-2-serie-em-solucoes-simulado',
          ),
          L(
            'pH, ácidos e bases',
            25,
            'g3-qui2-ph-acidos-bases',
            'g2-quimica-2-serie-em-ph-quiz',
            'g2-quimica-2-serie-em-ph-simulado',
          ),
          L(
            'Estequiometria',
            30,
            'g3-qui3-estequiometria',
            'g2-quimica-3-serie-em-estequiometria-quiz',
            'g2-quimica-3-serie-em-estequiometria-simulado',
          ),
          L(
            'Gases',
            25,
            'g3-qui3-gases',
            'g2-quimica-3-serie-em-gases-quiz',
            'g2-quimica-3-serie-em-gases-simulado',
          ),
        ],
      },
      { titulo: 'Orgânica', licoes: [L('Química orgânica: o essencial', 20, 'g3-qui3-organica')] },
    ],
  },
  {
    slug: 'trilha-biologia-medio',
    subject: 'biologia',
    categoria: 'reforco',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Biologia do Ensino Médio completa',
    descricao: 'Célula, energia, ecologia, genética, biotecnologia, evolução e saúde.',
    secoes: [
      {
        titulo: 'Célula e energia',
        licoes: [
          L(
            'Citologia',
            25,
            'g3-bio1-citologia',
            'g2-biologia-1em-citologia-quiz',
            'g2-biologia-1em-citologia-simulado',
          ),
          L('Fotossíntese e respiração', 20, 'g3-bio1-fotossintese-respiracao'),
        ],
      },
      {
        titulo: 'Ecologia',
        licoes: [
          L(
            'Ecologia e problemas ambientais',
            30,
            'g3-bio1-ecologia',
            'g2-biologia-1em-ecologia-quiz',
            'g2-biologia-1em-ecologia-simulado',
          ),
        ],
      },
      {
        titulo: 'Genética e evolução',
        licoes: [
          L(
            'Genética e sistema ABO',
            30,
            'g3-bio2-genetica',
            'g3-bio2-dna-biotecnologia',
            'g2-biologia-2em-genetica-quiz',
            'g2-biologia-2em-genetica-simulado',
          ),
          L(
            'Evolução, fisiologia e saúde',
            30,
            'g3-bio3-evolucao',
            'g3-bio3-fisiologia-humana',
            'g3-bio3-doencas-saude',
            'g2-biologia-3em-evolucao-saude-quiz',
            'g2-biologia-3em-evolucao-saude-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-humanas-medio',
    subject: 'historia',
    categoria: 'reforco',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'História e Geografia do Ensino Médio',
    descricao: 'Antiguidade ao Brasil contemporâneo e a Geografia física e humana do Médio.',
    secoes: [
      {
        titulo: 'História',
        licoes: [
          L(
            'Antiguidade e Idade Média',
            25,
            'g3-his1-antiguidade-medieval',
            'g2-historia-1em-antiguidade-quiz',
            'g2-historia-1em-antiguidade-simulado',
          ),
          L(
            'Brasil Colônia e Império',
            30,
            'g3-his2-colonia-imperio',
            'g2-historia-2em-colonia-imperio-quiz',
            'g2-historia-2em-colonia-imperio-simulado',
          ),
          L(
            'Guerra Fria, ditadura e Brasil atual',
            30,
            'g3-his3-guerra-fria-ditadura',
            'g3-his3-brasil-contemporaneo',
            'g2-historia-3em-guerra-fria-quiz',
            'g2-historia-3em-guerra-fria-simulado',
          ),
        ],
      },
      {
        titulo: 'Geografia',
        licoes: [
          L(
            'Relevo, clima e fenômenos',
            25,
            'g3-geo1-geologia-clima',
            'g2-geografia-1em-natureza-quiz',
            'g2-geografia-1em-natureza-simulado',
          ),
          L(
            'Urbanização e agropecuária',
            25,
            'g3-geo2-urbanizacao-agro',
            'g2-geografia-2em-economia-quiz',
            'g2-geografia-2em-economia-simulado',
          ),
          L(
            'Energia, ambiente e população',
            30,
            'g3-geo3-energia-ambiente',
            'g3-geo3-populacao-demografia',
            'g2-geografia-3em-geopolitica-quiz',
            'g2-geografia-3em-geopolitica-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-filo-socio',
    subject: 'filosofia',
    categoria: 'reforco',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Filosofia e Sociologia sem mistério',
    descricao: 'Dos gregos à filosofia contemporânea, e dos clássicos da Sociologia à cidadania.',
    secoes: [
      {
        titulo: 'Filosofia',
        licoes: [
          L(
            'Filosofia grega',
            20,
            'g3-fil1-gregos',
            'g2-filosofia-1em-gregos-quiz',
            'g2-filosofia-1em-gregos-simulado',
          ),
          L(
            'Filosofia moderna e ética',
            25,
            'g3-fil2-moderna-etica',
            'g2-filosofia-2em-etica-quiz',
            'g2-filosofia-2em-etica-simulado',
          ),
          L(
            'Filosofia contemporânea e política',
            25,
            'g3-fil3-contemporanea',
            'g2-filosofia-3em-politica-quiz',
            'g2-filosofia-3em-politica-simulado',
          ),
        ],
      },
      {
        titulo: 'Sociologia',
        licoes: [
          L(
            'Clássicos da Sociologia',
            20,
            'g3-soc1-classicos',
            'g2-sociologia-1em-classicos-quiz',
            'g2-sociologia-1em-classicos-simulado',
          ),
          L(
            'Trabalho e desigualdade',
            20,
            'g3-soc2-trabalho-desigualdade',
            'g2-sociologia-2em-trabalho-quiz',
            'g2-sociologia-2em-trabalho-simulado',
          ),
          L(
            'Cidadania, Estado e mídia',
            20,
            'g3-soc3-cidadania-midia',
            'g2-sociologia-3em-cidadania-quiz',
            'g2-sociologia-3em-cidadania-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-literatura-linguagens',
    subject: 'literatura',
    categoria: 'reforco',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Literatura e Linguagens do Médio',
    descricao: 'Escolas literárias, figuras de linguagem, coesão e gêneros textuais.',
    secoes: [
      {
        titulo: 'Literatura',
        licoes: [
          L(
            'Trovadorismo, Quinhentismo e Barroco',
            25,
            'g3-lit1-origens-barroco',
            'g2-literatura-1em-origens-quiz',
            'g2-literatura-1em-origens-simulado',
          ),
          L(
            'Romantismo, Realismo e Naturalismo',
            30,
            'g3-lit2-romantismo',
            'g3-lit2-realismo-naturalismo',
            'g2-literatura-2em-romantismo-quiz',
            'g2-literatura-2em-romantismo-simulado',
          ),
          L(
            'Modernismo e literatura contemporânea',
            30,
            'g3-lit3-modernismo',
            'g3-lit3-literatura-contemporanea',
            'g2-literatura-3em-modernismo-quiz',
            'g2-literatura-3em-modernismo-simulado',
          ),
        ],
      },
      {
        titulo: 'Língua e texto',
        licoes: [
          L(
            'Figuras de linguagem',
            20,
            'g3-port1-figuras',
            'g2-lingua-portuguesa-1em-interpretacao-quiz',
            'g2-lingua-portuguesa-1em-interpretacao-simulado',
          ),
          L(
            'Coesão e coerência',
            20,
            'g3-port2-coesao-coerencia',
            'g2-lingua-portuguesa-2em-coesao-quiz',
            'g2-lingua-portuguesa-2em-coesao-simulado',
          ),
        ],
      },
    ],
  },

  // ------------------------------------------------------------ ENEM e vestibulares (planos de estudo)
  {
    slug: 'plano-enem-12-semanas',
    subject: 'matematica',
    categoria: 'enem',
    series: ['3ª série EM'],
    titulo: 'Plano ENEM 12 semanas',
    descricao:
      'Plano de estudo semana a semana: conteúdo por área, redação semanal, simulados a cada duas semanas e revisão de erros.',
    secoes: [
      {
        titulo: 'Semanas 1 e 2 · Matemática básica e redação',
        licoes: [
          L('Como funciona o plano', 10, 'g3-plano-enem-12-semanas', 'g3-vest-estrategia-prova'),
          L(
            'Porcentagem e proporção',
            40,
            'g3-mat7-porcentagem',
            'g3-mat7-proporcao',
            'g2-vest-enem-mat-1',
          ),
          L(
            'Estrutura da redação',
            40,
            'g3-vest-redacao-competencias',
            'g3-vest-redacao-estrutura',
            'g2-lingua-portuguesa-3em-redacao-quiz',
          ),
        ],
      },
      {
        titulo: 'Semanas 3 e 4 · Natureza',
        licoes: [
          L(
            'Ecologia e saúde',
            40,
            'g3-bio1-ecologia',
            'g3-bio3-doencas-saude',
            'g2-vest-enem-nat-1',
          ),
          L('Eletricidade e energia', 40, 'g3-fis3-eletricidade', 'g2-vest-enem-nat-calc'),
        ],
      },
      {
        titulo: 'Semanas 5 e 6 · Humanas',
        licoes: [
          L('Brasil Colônia ao Império', 40, 'g3-his2-colonia-imperio', 'g2-vest-enem-hum-1'),
          L(
            'Espaço geográfico e ambiente',
            40,
            'g3-geo2-urbanizacao-agro',
            'g3-geo3-energia-ambiente',
            'g2-vest-enem-hum-2',
          ),
        ],
      },
      {
        titulo: 'Semanas 7 e 8 · Linguagens',
        licoes: [
          L(
            'Interpretação e gêneros',
            40,
            'g3-port3-generos-interpretacao',
            'g3-port1-figuras',
            'g2-vest-enem-ling-1',
          ),
          L('Literatura e artes', 40, 'g3-lit3-modernismo', 'g2-vest-enem-ling-2'),
        ],
      },
      {
        titulo: 'Semanas 9 e 10 · Aprofundamento',
        licoes: [
          L(
            'Geometria e funções',
            45,
            'g3-mat2-geometria-espacial',
            'g3-mat1-funcao-afim',
            'g2-vest-enem-mat-2',
            'g2-vest-enem-mat-3',
          ),
          L(
            'Química do ENEM',
            40,
            'g3-qui2-solucoes',
            'g3-qui3-estequiometria',
            'g2-vest-enem-nat-2',
          ),
        ],
      },
      {
        titulo: 'Semanas 11 e 12 · Simulados e reta final',
        licoes: [
          L(
            'Simulados e revisão de erros',
            60,
            'g3-vest-erros-revisao',
            'g2-vest-enem-mat-4',
            'g2-vest-enem-hum-3',
            'g2-vest-enem-ling-3',
          ),
          L('Véspera: TRI e estratégia', 20, 'g3-vest-tri', 'g3-vest-estrategia-prova'),
        ],
      },
    ],
  },
  {
    slug: 'plano-enem-6-meses',
    subject: 'matematica',
    categoria: 'enem',
    series: ['2ª série EM', '3ª série EM'],
    titulo: 'Plano ENEM 6 meses',
    descricao:
      'Três fases (base, aprofundamento e reta final) com os temas que mais caem e simulados por área.',
    secoes: [
      {
        titulo: 'Fase 1 · Base (meses 1 e 2)',
        licoes: [
          L('Entenda o plano e a prova', 15, 'g3-plano-enem-6-meses', 'g3-vest-tri'),
          L(
            'O que mais cai em Matemática',
            45,
            'g3-vest-matematica-que-mais-cai',
            'g3-mat3-estatistica',
            'g2-vest-enem-mat-1',
          ),
          L(
            'O que mais cai em Natureza',
            45,
            'g3-vest-natureza-que-mais-cai',
            'g2-vest-enem-nat-1',
          ),
          L('O que mais cai em Humanas', 45, 'g3-vest-humanas-que-mais-cai', 'g2-vest-enem-hum-1'),
        ],
      },
      {
        titulo: 'Fase 2 · Aprofundamento (meses 3 e 4)',
        licoes: [
          L(
            'Redação: repertório e proposta',
            45,
            'g3-vest-redacao-repertorio',
            'g3-vest-redacao-estrutura',
            'g2-lingua-portuguesa-3em-redacao-simulado',
          ),
          L(
            'Matemática: funções e geometria',
            50,
            'g3-mat1-funcao-quadratica',
            'g3-mat2-geometria-espacial',
            'g2-vest-enem-mat-2',
            'g2-vest-enem-mat-3',
          ),
          L(
            'Linguagens e Humanas',
            50,
            'g3-port3-generos-interpretacao',
            'g3-soc3-cidadania-midia',
            'g2-vest-enem-ling-1',
            'g2-vest-enem-hum-3',
          ),
        ],
      },
      {
        titulo: 'Fase 3 · Reta final (meses 5 e 6)',
        licoes: [
          L(
            'Simulados completos',
            90,
            'g2-vest-enem-mat-4',
            'g2-vest-enem-nat-2',
            'g2-vest-enem-ling-2',
            'g2-vest-enem-hum-2',
          ),
          L(
            'Revisão de erros e estratégia',
            30,
            'g3-vest-erros-revisao',
            'g3-vest-estrategia-prova',
          ),
        ],
      },
    ],
  },
  {
    slug: 'plano-reta-final-30-dias',
    subject: 'lingua-portuguesa',
    categoria: 'enem',
    series: ['3ª série EM'],
    titulo: 'Reta final: 30 dias para a prova',
    descricao:
      'O último mês com simulados, revisão de erros, resumos que mais caem e descanso na véspera.',
    secoes: [
      {
        titulo: 'Semanas 1 e 2 · Simulados',
        licoes: [
          L('Plano da reta final', 10, 'g3-plano-reta-final-30-dias'),
          L('Simulados de Exatas', 60, 'g2-vest-enem-mat-1', 'g2-vest-enem-nat-calc'),
          L('Simulados de Humanas e Linguagens', 60, 'g2-vest-enem-hum-1', 'g2-vest-enem-ling-3'),
        ],
      },
      {
        titulo: 'Semana 3 · Revisão',
        licoes: [
          L(
            'O que mais cai',
            40,
            'g3-vest-matematica-que-mais-cai',
            'g3-vest-natureza-que-mais-cai',
            'g3-vest-humanas-que-mais-cai',
          ),
          L('Seus erros', 30, 'g3-vest-erros-revisao'),
        ],
      },
      {
        titulo: 'Semana 4 · Véspera',
        licoes: [
          L(
            'Redação e estratégia',
            30,
            'g3-vest-redacao-competencias',
            'g3-vest-estrategia-prova',
            'g3-vest-tri',
          ),
        ],
      },
    ],
  },
  {
    slug: 'plano-redacao-nota-alta',
    subject: 'lingua-portuguesa',
    categoria: 'enem',
    series: ['2ª série EM', '3ª série EM'],
    titulo: 'Redação nota alta em 6 etapas',
    descricao:
      'Competências, estrutura, repertório, coesão e proposta de intervenção, com prática no final.',
    secoes: [
      {
        titulo: 'Fundamentos',
        licoes: [
          L(
            'As 5 competências',
            20,
            'g3-vest-redacao-competencias',
            'g2-lingua-portuguesa-3em-redacao-quiz',
          ),
          L('Estrutura do texto', 20, 'g3-vest-redacao-estrutura'),
          L(
            'Coesão e coerência',
            20,
            'g3-port2-coesao-coerencia',
            'g2-lingua-portuguesa-2em-coesao-quiz',
          ),
        ],
      },
      {
        titulo: 'Argumentação',
        licoes: [
          L('Repertório sociocultural', 25, 'g3-vest-redacao-repertorio'),
          L('Outras bancas', 15, 'g3-vest-fuvest-unicamp-redacao'),
          L(
            'Prática com proposta de intervenção',
            30,
            'g2-lingua-portuguesa-3em-redacao-simulado',
            'g2-lingua-portuguesa-2em-coesao-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'plano-fuvest',
    subject: 'historia',
    categoria: 'enem',
    series: ['3ª série EM'],
    titulo: 'Plano Fuvest: 1ª e 2ª fase',
    descricao: 'Simulados de 1ª fase, discursivas da 2ª fase e redação no estilo Fuvest.',
    secoes: [
      {
        titulo: '1ª fase',
        licoes: [
          L('Entenda a prova e o plano', 15, 'g3-plano-fuvest'),
          L(
            'Humanas',
            50,
            'g3-his2-colonia-imperio',
            'g3-geo2-urbanizacao-agro',
            'g2-vest-fuvest-1f-1',
          ),
          L('Exatas', 50, 'g3-mat2-probabilidade', 'g3-fis1-cinematica', 'g2-vest-fuvest-1f-2'),
          L(
            'Biológicas e Linguagens',
            50,
            'g3-bio2-genetica',
            'g3-lit2-realismo-naturalismo',
            'g2-vest-fuvest-1f-3',
          ),
        ],
      },
      {
        titulo: '2ª fase',
        licoes: [
          L('Português e redação', 50, 'g3-vest-fuvest-unicamp-redacao', 'g2-vest-fuvest-2f-1'),
          L('Humanidades discursivas', 50, 'g3-his3-guerra-fria-ditadura', 'g2-vest-fuvest-2f-2'),
        ],
      },
    ],
  },
  {
    slug: 'plano-unicamp-unesp',
    subject: 'biologia',
    categoria: 'enem',
    series: ['3ª série EM'],
    titulo: 'Plano Unicamp e Unesp',
    descricao: '1ª fase interdisciplinar, 2ª fase discursiva e redação com gêneros variados.',
    secoes: [
      {
        titulo: 'Unicamp',
        licoes: [
          L('Entenda as provas', 15, 'g3-plano-unicamp-unesp', 'g3-vest-fuvest-unicamp-redacao'),
          L('1ª fase', 60, 'g2-vest-unicamp-1f-1', 'g2-vest-unicamp-1f-2'),
          L('2ª fase', 60, 'g2-vest-unicamp-2f-1', 'g2-vest-unicamp-2f-2'),
        ],
      },
      {
        titulo: 'Unesp',
        licoes: [
          L('1ª fase', 60, 'g2-vest-unesp-1f-1', 'g2-vest-unesp-1f-2'),
          L('2ª fase', 60, 'g2-vest-unesp-2f-1', 'g2-vest-unesp-2f-2'),
        ],
      },
    ],
  },

  // ------------------------------------------------------------ Carreiras e habilidades
  {
    slug: 'plano-ita-ime',
    subject: 'fisica',
    categoria: 'carreiras',
    series: ['2ª série EM', '3ª série EM'],
    titulo: 'Rumo ao ITA e IME: fundamentos de exatas',
    descricao:
      'Base sólida de Matemática, Física e Química e os primeiros simulados no estilo ITA e IME.',
    secoes: [
      {
        titulo: 'Base',
        licoes: [
          L('Plano e estratégia', 15, 'g3-plano-ita-ime'),
          L(
            'Matemática',
            60,
            'g3-mat3-complexos',
            'g3-mat3-polinomios',
            'g3-mat1-exp-log',
            'g2-vest-ita-mat',
          ),
          L(
            'Física',
            60,
            'g3-fis1-leis-newton',
            'g3-fis1-energia',
            'g3-fis3-eletricidade',
            'g2-vest-ita-fis',
          ),
          L('Química', 60, 'g3-qui3-estequiometria', 'g3-qui3-gases', 'g2-vest-ita-qui'),
        ],
      },
      {
        titulo: 'Simulados',
        licoes: [
          L('IME: objetivas e discursivas', 70, 'g2-vest-ime-mat', 'g2-vest-ime-fis-qui'),
          L('ITA: Português e Inglês', 40, 'g3-ing3-leitura-enem', 'g2-vest-ita-port-ing'),
        ],
      },
    ],
  },
  {
    slug: 'trilha-estudar-melhor',
    subject: 'lingua-portuguesa',
    categoria: 'habilidades',
    series: ['6º ano', '7º ano', '8º ano', '9º ano', '1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Como estudar melhor',
    descricao: 'O método que funciona: teste-se, espace as revisões e aprenda com os erros.',
    secoes: [
      {
        titulo: 'Método',
        licoes: [
          L('Estudar com método', 15, 'g3-metodo-estudar-melhor'),
          L('Usar os erros a seu favor', 15, 'g3-vest-erros-revisao'),
          L('Estratégia na hora da prova', 15, 'g3-vest-estrategia-prova'),
        ],
      },
    ],
  },
  {
    slug: 'trilha-financas',
    subject: 'educacao-financeira',
    categoria: 'habilidades',
    series: ['7º ano', '8º ano', '9º ano', '1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Educação financeira do zero',
    descricao: 'Orçamento, consumo consciente, juros, crédito, investimentos e golpes.',
    secoes: [
      {
        titulo: 'Dinheiro no dia a dia',
        licoes: [
          L(
            'Consumo consciente e orçamento',
            20,
            'g3-fin7-consumo',
            'g2-educacao-financeira-7-ano-consumo-quiz',
            'g2-educacao-financeira-7-ano-consumo-simulado',
          ),
          L(
            'Porcentagem na prática',
            20,
            'g3-mat7-porcentagem',
            'g2-matematica-7-ano-porcentagem-quiz',
          ),
        ],
      },
      {
        titulo: 'Crédito e investimento',
        licoes: [
          L(
            'Juros, crédito e dívidas',
            25,
            'g3-fin9-credito',
            'g3-mat9-juros',
            'g2-educacao-financeira-9-ano-credito-quiz',
            'g2-educacao-financeira-9-ano-credito-simulado',
          ),
          L(
            'Investimentos e inflação',
            25,
            'g3-fin1-investimentos',
            'g2-educacao-financeira-1-serie-em-investimentos-quiz',
            'g2-educacao-financeira-1-serie-em-investimentos-simulado',
          ),
          L(
            'Vida financeira adulta',
            20,
            'g2-educacao-financeira-3-serie-em-vida-adulta-quiz',
            'g2-educacao-financeira-3-serie-em-vida-adulta-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-computacao',
    subject: 'pensamento-computacional',
    categoria: 'carreiras',
    series: ['7º ano', '8º ano', '9º ano', '1ª série EM'],
    titulo: 'Primeiros passos em computação',
    descricao: 'Pensamento computacional, algoritmos, sistema binário e lógica de programação.',
    secoes: [
      {
        titulo: 'Fundamentos',
        licoes: [
          L(
            'Algoritmos e decomposição',
            20,
            'g3-pc7-algoritmos',
            'g2-pensamento-computacional-7-ano-algoritmos-quiz',
            'g2-pensamento-computacional-7-ano-algoritmos-simulado',
          ),
          L(
            'Sistema binário',
            20,
            'g3-pc9-binario',
            'g2-pensamento-computacional-9-ano-binario-quiz',
            'g2-pensamento-computacional-9-ano-binario-simulado',
          ),
          L(
            'Lógica booleana e programação',
            25,
            'g3-pc1-logica',
            'g2-pensamento-computacional-1-serie-em-logica-quiz',
            'g2-pensamento-computacional-1-serie-em-logica-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-linguas-medio',
    subject: 'ingles',
    categoria: 'habilidades',
    series: ['1ª série EM', '2ª série EM', '3ª série EM'],
    titulo: 'Inglês e Espanhol para o Médio e o ENEM',
    descricao:
      'Falsos cognatos, present perfect, leitura estratégica e conectores em inglês e espanhol.',
    secoes: [
      {
        titulo: 'Inglês',
        licoes: [
          L(
            'Falsos cognatos e present perfect',
            20,
            'g3-ing1-falsos-cognatos',
            'g2-ingles-1em-perfect-quiz',
            'g2-ingles-1em-perfect-simulado',
          ),
          L(
            'Leitura e conectivos',
            20,
            'g2-ingles-2em-leitura-quiz',
            'g2-ingles-2em-leitura-simulado',
          ),
          L(
            'Inglês no ENEM',
            20,
            'g3-ing3-leitura-enem',
            'g2-ingles-3em-enem-quiz',
            'g2-ingles-3em-enem-simulado',
          ),
        ],
      },
      {
        titulo: 'Espanhol',
        licoes: [
          L(
            'Falsos amigos',
            20,
            'g3-esp1-falsos-amigos',
            'g2-espanhol-1em-basico-quiz',
            'g2-espanhol-1em-basico-simulado',
          ),
          L('Verbos', 20, 'g2-espanhol-2em-verbos-quiz', 'g2-espanhol-2em-verbos-simulado'),
          L(
            'Leitura e conectores',
            20,
            'g3-esp3-conectores-leitura',
            'g2-espanhol-3em-leitura-quiz',
            'g2-espanhol-3em-leitura-simulado',
          ),
        ],
      },
    ],
  },
  {
    slug: 'trilha-artes',
    subject: 'artes',
    categoria: 'habilidades',
    series: ['7º ano', '8º ano', '9º ano', '1ª série EM'],
    titulo: 'Arte e cultura brasileira',
    descricao: 'Cores, movimentos artísticos, música e manifestações populares.',
    secoes: [
      {
        titulo: 'Arte',
        licoes: [
          L(
            'Cores e movimentos artísticos',
            20,
            'g3-art7-cores-movimentos',
            'g2-artes-7-elementos-quiz',
            'g2-artes-7-elementos-simulado',
          ),
          L(
            'Música e cultura popular',
            20,
            'g3-art1-cultura-popular',
            'g2-artes-1em-cultura-quiz',
            'g2-artes-1em-cultura-simulado',
          ),
        ],
      },
    ],
  },
];
