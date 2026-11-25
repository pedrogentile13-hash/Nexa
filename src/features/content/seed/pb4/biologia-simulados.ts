import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Biologia (9º ano, Prof.ª Daiane Marin): Módulo 8 (genética, ABO, biotecnologia) e Módulo 9 (doenças
 * genéticas e aconselhamento). Três simulados objetivos e um dissertativo no estilo da professora (comando em
 * destaque: explique, determine, calcule, identifique, argumente).
 * REGRA DE ESCRITA: a alternativa certa nunca pode ser reconhecida pelo tamanho (ver `balanco-alternativas.ts`).
 */

const MATERIA = 'biologia';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · GENÉTICA E SISTEMA ABO (12) */

const S1: QuestaoG2[] = [
  o(
    'facil',
    'O que é um gene?',
    'Um segmento de DNA com informação para um produto',
    [
      'Cada versão diferente de um mesmo segmento de DNA',
      'Uma proteína que envolve o DNA no cromossomo',
      'O local ocupado por um alelo em um cromossomo',
      'Um par de cromossomos de origem materna e paterna',
    ],
    'Gene é um segmento de DNA ligado à produção de um RNA ou de um produto funcional. As versões de um gene são os alelos, e a posição dele é o lócus.',
  ),
  o(
    'facil',
    'O que são alelos?',
    'Versões diferentes de um mesmo gene',
    [
      'Locais dos genes no cromossomo',
      'Cromossomos com a mesma origem familiar',
      'Cópias duplicadas de um mesmo cromossomo',
      'Pares de genes que só existem no homem',
    ],
    'Alelos são as versões de um gene, como A e a. A posição do gene no cromossomo é o lócus, e as cópias de um cromossomo duplicado são cromátides.',
  ),
  o(
    'medio',
    'O que é o lócus gênico?',
    'A posição que um gene ocupa no cromossomo',
    [
      'Cada versão diferente de um mesmo gene',
      'O par de cromossomos, um de cada genitor',
      'A combinação de alelos de um indivíduo',
      'A característica observável do organismo',
    ],
    'Lócus é o "endereço" do gene no cromossomo. Nos homólogos, os mesmos loci abrigam os mesmos genes.',
  ),
  o(
    'facil',
    'Qual destes genótipos é heterozigoto?',
    'Aa',
    ['AA', 'aa', 'BB', 'bb'],
    'Heterozigoto tem dois alelos diferentes (Aa). AA e aa são homozigotos.',
  ),
  o(
    'facil',
    'O que é o fenótipo?',
    'A característica observável do organismo',
    [
      'A combinação de alelos de um indivíduo',
      'A posição que um gene ocupa no cromossomo',
      'O conjunto de cromossomos de uma célula',
      'A versão dominante de um gene qualquer',
    ],
    'Fenótipo é a característica que se observa, influenciada pelo genótipo e, às vezes, pelo ambiente. A combinação de alelos é o genótipo.',
  ),
  o(
    'medio',
    'Em Aa × Aa (dominância completa), qual é a proporção de genótipos nos filhos?',
    '25% AA, 50% Aa e 25% aa',
    [
      '50% AA, 25% Aa e 25% aa',
      '25% AA, 25% Aa e 50% aa',
      '75% AA, 0% Aa e 25% aa',
      '100% Aa, sem outros genótipos',
    ],
    'Os gametas A e a se combinam em AA, Aa, Aa e aa: 25% AA, 50% Aa e 25% aa.',
  ),
  o(
    'medio',
    'No cruzamento Aa × Aa, com A totalmente dominante, qual é a proporção de fenótipos?',
    '75% dominante e 25% recessivo',
    [
      '50% dominante e 50% recessivo',
      '25% dominante e 75% recessivo',
      '100% dominante, sem recessivos',
      '66% dominante e 34% recessivo',
    ],
    'AA e Aa (75%) mostram o fenótipo dominante, e só aa (25%) mostra o recessivo.',
  ),
  o(
    'medio',
    'Quais alelos determinam o sistema sanguíneo ABO?',
    'IA, IB e i, com IA e IB codominantes',
    [
      'A, B e O, com A e B ambos recessivos',
      'IA, IB e i, com i dominante sobre IA',
      'IA e IB, ambos recessivos em relação a i',
      'A, B, AB e O, todos codominantes',
    ],
    'São três alelos: IA e IB são codominantes entre si e dominam sobre i.',
  ),
  o(
    'medio',
    'Do cruzamento IAi × IBi, quais filhos são possíveis?',
    'A, B, AB e O, com 25% cada',
    [
      'Só A e B, com 50% cada',
      'Só AB e O, com 50% cada',
      'A, B e AB, com 33% cada',
      'Só O e AB, com 25% e 75%',
    ],
    'Os gametas IA, i, IB e i formam IAIB (AB), IAi (A), IBi (B) e ii (O), 25% cada.',
  ),
  o(
    'medio',
    'Quais genótipos podem produzir o grupo sanguíneo A?',
    'IAIA ou IAi',
    ['IBIB ou IBi', 'IAIB', 'IAIB ou ii', 'IAIA ou IBi'],
    'O grupo A pode ser IAIA ou IAi. IAIB é o grupo AB, e ii é o grupo O.',
  ),
  o(
    'medio',
    'Que antígenos as hemácias do grupo sanguíneo O possuem?',
    'Nenhum antígeno A ou B',
    [
      'Antígenos A e B, juntos',
      'Apenas o antígeno A',
      'Apenas o antígeno B',
      'O antígeno O, exclusivo',
    ],
    'O grupo O (genótipo ii) não tem antígenos A nem B nas hemácias.',
  ),
  o(
    'dificil',
    'O que são cromossomos homólogos?',
    'Par de cromossomos, um materno e outro paterno',
    [
      'Duas cópias idênticas de um cromossomo duplicado',
      'Cromossomos que só existem nas células sexuais',
      'Qualquer par de genes que tenha o mesmo alelo',
      'Cromossomos com genes diferentes nos mesmos locais',
    ],
    'Homólogos têm os mesmos genes nos mesmos loci, e um vem da mãe e o outro do pai. As cópias de um cromossomo duplicado são cromátides-irmãs.',
  ),
];

/* ============================================================ SIMULADO 2 · BIOTECNOLOGIA, VACINAS E ÉTICA (12) */

const S2: QuestaoG2[] = [
  o(
    'facil',
    'Qual é a ação de uma vacina?',
    'Estimula o organismo a produzir sua própria defesa',
    [
      'Entrega anticorpos prontos contra um agente ou toxina',
      'Dá proteção imediata, mas que dura pouco tempo',
      'Fornece anticorpos maternos durante a amamentação',
      'Destrói o agente infeccioso por ação química direta',
    ],
    'A vacina apresenta antígenos (ou instruções para produzi-los), e o corpo faz sua própria resposta imune, com possível memória.',
  ),
  o(
    'facil',
    'O que o soro antiofídico fornece?',
    'Anticorpos prontos contra o veneno',
    [
      'Antígenos para treinar a defesa',
      'Células de defesa vivas do doador',
      'Remédio que mata a cobra no corpo',
      'Vitaminas que fortalecem a imunidade',
    ],
    'O soro entrega anticorpos já prontos, com efeito rápido e temporário e sem memória imunológica.',
  ),
  o(
    'medio',
    'Qual é o tipo de imunização conferida pela vacina?',
    'Ativa artificial',
    ['Passiva artificial', 'Ativa natural', 'Passiva natural', 'Imediata natural'],
    'Na vacina, o próprio organismo produz a defesa (ativa), e a aplicação é feita pelo homem (artificial).',
  ),
  o(
    'medio',
    'Qual é o tipo de imunização conferida pelo soro?',
    'Passiva artificial',
    ['Ativa artificial', 'Ativa natural', 'Passiva natural', 'Ativa e permanente'],
    'No soro, os anticorpos vêm prontos (passiva) e são aplicados pelo homem (artificial).',
  ),
  o(
    'medio',
    'Qual exemplo é de imunização passiva natural?',
    'Anticorpos da mãe passados ao bebê',
    [
      'Infecção que gera defesa própria',
      'Vacina contra o sarampo no posto',
      'Soro antiofídico depois de uma picada',
      'Vacinação em campanha nas escolas',
    ],
    'Os anticorpos maternos, que passam pela placenta ou pelo leite, são passiva natural. A infecção é ativa natural.',
  ),
  o(
    'medio',
    'Como funciona o CRISPR-Cas9?',
    'Edita o DNA, guiando a Cas9 por um RNA-guia ao alvo',
    [
      'Produz insulina em bactérias, inserindo genes humanos',
      'Transforma células-tronco em vacinas, por cultivo',
      'Separa os cromossomos, durante a divisão das células',
      'Mede o número de cromossomos, no cariótipo humano',
    ],
    'O RNA-guia leva a Cas9 ao trecho-alvo do DNA, que é cortado; alterações podem ocorrer durante o reparo.',
  ),
  o(
    'medio',
    'O que é a terapia gênica?',
    'Tratar condições introduzindo ou alterando genes nas células',
    [
      'Tratar infecções com anticorpos prontos retirados de outro animal',
      'Prevenir doenças com antígenos de agentes inativados',
      'Selecionar embriões com as melhores características físicas',
      'Substituir órgãos doentes por órgãos de doadores vivos',
    ],
    'A terapia gênica busca tratar uma condição introduzindo, alterando ou regulando material genético nas células.',
  ),
  o(
    'medio',
    'O que são as células-tronco?',
    'Se autorrenovam e se diferenciam em vários tipos celulares',
    [
      'Só produzem células iguais a elas, sem diferenciação',
      'Existem apenas em embriões, sumindo no corpo adulto humano',
      'Servem apenas para produzir anticorpos contra vírus',
      'Produzem insulina por meio do gene de microrganismos',
    ],
    'As células-tronco se renovam e podem se diferenciar em diversos tipos celulares, e por isso são estudadas em medicina regenerativa.',
  ),
  o(
    'dificil',
    'Qual afirmação sobre OGM e transgênico está correta?',
    'Todo transgênico é OGM, mas nem todo OGM é transgênico',
    [
      'Todo OGM é transgênico, mas nem todo transgênico é OGM',
      'OGM e transgênico são sempre exatamente a mesma coisa',
      'Transgênico nunca é OGM, pois não altera o seu DNA',
      'Todo OGM recebe genes de outra espécie, sem exceção',
    ],
    'OGM é qualquer organismo com material genético modificado por engenharia genética. Transgênico é o OGM que recebeu gene de outra espécie.',
  ),
  o(
    'medio',
    'Como a insulina humana é produzida por microrganismos transgênicos?',
    'Gene humano inserido em um microrganismo que a produz',
    [
      'Células do pâncreas retiradas de porcos e purificadas',
      'Vírus modificados que são injetados no pâncreas do paciente',
      'Bactérias mortas misturadas com hormônios do paciente',
      'Células-tronco do paciente cultivadas em laboratório',
    ],
    'O gene humano da insulina é inserido em microrganismos, que passam a produzir a proteína; depois ela é purificada.',
  ),
  o(
    'medio',
    'O que é eugenia?',
    'Tentativa de selecionar características hereditárias',
    [
      'Técnica de cortar trechos de DNA com a proteína Cas9',
      'Tratamento que usa anticorpos prontos contra toxinas',
      'Estudo da herança dos grupos sanguíneos do sistema ABO',
      'Cultivo de células capazes de gerar diversos tecidos',
    ],
    'Eugenia é a tentativa de selecionar ou restringir características hereditárias de populações humanas, historicamente ligada a discriminação e violação de direitos.',
  ),
  o(
    'dificil',
    'Qual é uma preocupação ética da manipulação genética?',
    'Efeitos não previstos e acesso desigual aos tratamentos',
    [
      'Perda total do DNA em todas as células do paciente',
      'Proibição de qualquer pesquisa científica com seres vivos',
      'Transmissão das doenças genéticas por contato direto',
      'Excesso de vacinas disponíveis para toda a população',
    ],
    'Entre os debates éticos estão os riscos e efeitos não previstos, o consentimento, o acesso desigual e o risco de eugenia.',
  ),
];

/* ============================================================ SIMULADO 3 · DOENÇAS GENÉTICAS, CROMOSSOMOS E REVISÃO (14) */

const S3: QuestaoG2[] = [
  o(
    'facil',
    'O que é uma mutação?',
    'Alteração na sequência do DNA',
    [
      'Cópia exata do DNA na divisão',
      'União de gametas na fecundação',
      'Perda de uma proteína do sangue',
      'Troca de genes entre espécies',
    ],
    'Mutação é uma alteração na sequência do DNA, espontânea ou causada por agentes mutagênicos.',
  ),
  o(
    'medio',
    'Quais são exemplos de agentes mutagênicos?',
    'Radiação UV e certas substâncias químicas',
    [
      'Vitaminas e sais minerais da alimentação',
      'Vacinas e soros de uso preventivo comum',
      'Exercício físico e sono em excesso diário',
      'Água potável e luz de lâmpadas fracas',
    ],
    'A radiação ultravioleta ou ionizante e algumas substâncias químicas podem causar mutações.',
  ),
  o(
    'medio',
    'Qual afirmação sobre mutações está correta?',
    'Nem toda mutação causa doença ou é herdada',
    [
      'Toda mutação causa doença e é herdada',
      'Toda mutação ocorre só em células germinativas',
      'Nenhuma mutação pode ser herdada pelos filhos',
      'Mutações só surgem por radiação ionizante',
    ],
    'Muitas mutações não causam doença, e só as de células germinativas podem ser herdadas.',
  ),
  o(
    'medio',
    'O que caracteriza uma doença monogênica?',
    'Alteração principalmente em um gene',
    [
      'Interação de muitos genes e do ambiente',
      'Alteração no número de cromossomos',
      'Influência de muitos genes pequenos',
      'Doença causada por vírus e bactérias',
    ],
    'Monogênica (mendeliana) vem principalmente da alteração de um gene, com herança dominante, recessiva ou ligada ao sexo.',
  ),
  o(
    'medio',
    'O que caracteriza uma condição multifatorial?',
    'Genes em interação com fatores do ambiente',
    [
      'Um só gene, com herança dominante e simples',
      'Um cromossomo extra em todas as células',
      'Perda de um grande trecho do cromossomo',
      'Infecção por um agente que muda de forma',
    ],
    'Na multifatorial, variantes genéticas interagem com fatores ambientais. Na poligênica, muitos genes contribuem.',
  ),
  o(
    'medio',
    'Quem é o portador de uma condição recessiva?',
    'Heterozigoto com alelo que não manifesta a doença',
    [
      'Homozigoto recessivo, que manifesta a doença',
      'Homozigoto dominante, sem nenhum alelo da doença',
      'Indivíduo que transmite a doença por contato',
      'Heterozigoto que manifesta a doença desde o nascimento',
    ],
    'O portador (Aa) tem o alelo da condição, pode transmiti-lo, mas não manifesta a doença. O afetado é aa.',
  ),
  o(
    'medio',
    'Pais Aa × Aa (condição recessiva): qual é a probabilidade de um filho afetado (aa)?',
    '25%',
    ['50%', '75%', '100%', '0%'],
    'Dos quatro cruzamentos possíveis (AA, Aa, Aa, aa), apenas um é aa: 25%.',
  ),
  o(
    'medio',
    'Pais Aa × Aa (condição recessiva): qual é a probabilidade de um filho portador (Aa)?',
    '50%',
    ['25%', '75%', '100%', '0%'],
    'Dois dos quatro cruzamentos possíveis são Aa: 50% de chance de ser portador.',
  ),
  o(
    'facil',
    'Em geral, o que é a síndrome de Down?',
    'Três cópias do cromossomo 21',
    [
      'Uma só cópia do cromossomo 21',
      'Três cópias do cromossomo X',
      'Deleção de um trecho do 21',
      'Infecção por vírus no pré-natal',
    ],
    'A síndrome de Down é, em geral, a trissomia do cromossomo 21, uma alteração numérica.',
  ),
  o(
    'medio',
    'Qual afirmação sobre a síndrome de Down está correta?',
    'É uma condição genética, não contagiosa',
    [
      'É uma doença contagiosa, transmitida pelo ar',
      'É uma infecção causada por bactérias do solo',
      'É uma alergia causada por produtos químicos',
      'É um tipo de câncer ligado à radiação UV',
    ],
    'A trissomia do 21 é uma condição genética e não é transmitida por contágio.',
  ),
  o(
    'medio',
    'Qual é a diferença entre alteração numérica e estrutural?',
    'Numérica muda a quantidade; estrutural muda a forma',
    [
      'Numérica muda a forma; estrutural muda a quantidade',
      'As duas mudam apenas o número de cromossomos',
      'As duas mudam apenas a estrutura dos cromossomos',
      'Numérica só ocorre em vírus; estrutural, em animais',
    ],
    'Numérica altera a quantidade de cromossomos (trissomia). Estrutural altera a estrutura (deleção, duplicação, inversão, translocação).',
  ),
  o(
    'medio',
    'Qual é a função do aconselhamento genético?',
    'Orientar sobre riscos, sem decidir pela família',
    [
      'Escolher o sexo do bebê antes da gestação',
      'Curar doenças genéticas com edição do DNA',
      'Impedir casamentos entre pessoas portadoras',
      'Aplicar vacinas durante o acompanhamento pré-natal',
    ],
    'O aconselhamento orienta sobre histórico familiar, probabilidades e exames, para decisões informadas. Não determina as escolhas das famílias.',
  ),
  o(
    'medio',
    'O que é o acompanhamento pré-natal?',
    'Cuidados e exames na gestação, da mãe e do feto',
    [
      'Vacinas aplicadas ao bebê depois do nascimento',
      'Edição do DNA do embrião na primeira semana',
      'Seleção das características dos futuros filhos',
      'Terapia gênica feita em todas as gestantes',
    ],
    'O pré-natal reúne cuidados e exames durante a gestação para acompanhar a saúde materna e fetal e identificar riscos.',
  ),
  o(
    'dificil',
    'O que significa um alelo ser dominante?',
    'Que o alelo se manifesta mesmo em heterozigose',
    [
      'Que o alelo é sempre o mais comum na população',
      'Que o alelo só se manifesta em homozigotos puros',
      'Que o alelo desaparece depois de duas gerações',
      'Que o alelo está sempre em cromossomos sexuais',
    ],
    'Dominante se manifesta em AA e Aa. Isso não tem relação com ser mais frequente na população.',
  ),
];

/* ============================================================ SIMULADO 4 · DISSERTATIVO NO ESTILO DA PROFESSORA */

const PROVA: QuestaoG2[] = [
  dq(
    'medio',
    '1) A polidactilia (dedos extras) pode ser determinada por um alelo dominante, representado por P, enquanto o alelo p corresponde ao número típico de dedos. Calcule a probabilidade de um homem heterozigoto, casado com uma mulher sem essa condição, ter uma criança com a condição. Mostre o raciocínio (quadro de cruzamento) e escreva a resposta em texto.',
    'O homem é Pp e a mulher, que não tem a condição, é pp. Os gametas dele são P e p; os dela são p e p. Os filhos possíveis são Pp, Pp, pp e pp: 50% Pp (com a condição) e 50% pp (sem a condição). A probabilidade de uma criança com polidactilia é de 50% (1/2) em cada gestação.',
    [
      'Identifica os genótipos dos pais (Pp e pp)',
      'Mostra os gametas e o cruzamento (Pp, Pp, pp, pp)',
      'Calcula 50% (ou 1/2) para a condição',
      'Escreve a resposta em texto, com a probabilidade para cada gestação',
    ],
  ),
  dq(
    'medio',
    '2) Um homem do grupo sanguíneo AB e uma mulher do grupo O querem saber que grupos sanguíneos os filhos podem ter. Determine os genótipos dos pais, os grupos possíveis dos filhos e a probabilidade de cada um, e explique o que é a codominância.',
    'O homem AB é IAIB e a mulher O é ii. Os filhos recebem IA ou IB do pai e i da mãe: IAi (grupo A) e IBi (grupo B), 50% cada. Não podem ser AB nem O. A codominância ocorre quando os dois alelos (IA e IB) se manifestam juntos no heterozigoto, e por isso o genótipo IAIB produz o grupo AB, com antígenos A e B.',
    [
      'Dá os genótipos IAIB e ii',
      'Indica os filhos A (IAi) e B (IBi), 50% cada, sem AB e O',
      'Explica a codominância (os dois alelos se expressam juntos)',
    ],
  ),
  dq(
    'medio',
    '3) Uma pessoa foi picada por uma cobra venenosa e outra pessoa vai viajar para uma região com risco de uma doença infecciosa. Explique qual tratamento (vacina ou soro) cada uma deve receber, justifique e indique o tipo de imunização de cada um.',
    'A pessoa picada deve receber o soro antiofídico, porque ele fornece anticorpos prontos contra o veneno, com efeito rápido, mas temporário e sem memória: imunização passiva artificial. A pessoa que vai viajar deve se vacinar, porque a vacina apresenta antígenos (ou instruções para produzi-los) e estimula o organismo a produzir sua própria defesa, com possível memória: imunização ativa artificial.',
    [
      'Indica o soro para a picada e a vacina para a viagem',
      'Explica que o soro entrega anticorpos prontos e a vacina estimula a defesa própria',
      'Classifica o soro como passiva artificial e a vacina como ativa artificial',
      'Cita efeito rápido e temporário do soro e a memória possível da vacina',
    ],
  ),
  dq(
    'dificil',
    '4) A insulina humana usada no tratamento do diabetes é produzida por microrganismos transgênicos. a) Explique como isso é feito. b) Diferencie OGM de transgênico. c) Cite um aspecto ético ou um risco da manipulação genética.',
    'a) O gene humano da insulina é inserido em microrganismos, como bactérias, que passam a produzir a proteína; depois ela é purificada. b) OGM é o organismo cujo material genético foi modificado por engenharia genética; transgênico é o tipo de OGM que recebeu material genético de outra espécie. Todo transgênico é OGM, mas nem todo OGM é transgênico. c) Exemplos: possíveis efeitos não previstos, consentimento, acesso desigual aos tratamentos e o risco de eugenia (seleção de características hereditárias humanas, associada à discriminação).',
    [
      'Descreve a inserção do gene humano no microrganismo, a produção e a purificação',
      'Diferencia OGM de transgênico (transgênico é um tipo de OGM)',
      'Cita um aspecto ético ou risco',
    ],
  ),
  dq(
    'dificil',
    '5) Leia: "A síndrome de Down é uma doença contagiosa, causada por um vírus, e todas as pessoas com a condição são filhas de pais com a mesma doença." a) Identifique o equívoco conceitual do trecho. b) Explique o que é a síndrome de Down e que tipo de alteração cromossômica ela representa. c) Explique o papel do aconselhamento genético e do pré-natal.',
    'a) A síndrome de Down não é doença contagiosa, nem é causada por vírus. É uma condição genética, e o trecho erra também ao dizer que os pais têm a mesma doença. b) Em geral, é a trissomia do cromossomo 21: a pessoa tem três cópias do cromossomo 21. É uma alteração cromossômica numérica (mudança na quantidade de cromossomos). c) O aconselhamento genético orienta sobre histórico familiar, probabilidades e exames para decisões informadas, sem determinar as escolhas da família; o pré-natal reúne cuidados e exames na gestação para acompanhar a saúde materna e fetal e identificar riscos ou condições.',
    [
      'Identifica o equívoco (não é contagiosa nem causada por vírus)',
      'Explica a trissomia do 21 como alteração numérica',
      'Explica o aconselhamento genético (orienta, não decide pela família)',
      'Explica o pré-natal (cuidados e exames na gestação)',
    ],
  ),
];

/* ============================================================ pacotes */

const pacote = (
  slug: string,
  title: string,
  subtitle: string,
  description: string,
  minutes: number,
  questoes: QuestaoG2[],
): PacoteG2 => ({
  slug,
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title,
  subtitle,
  description,
  minutes,
  questoes,
});

export const PACOTES_BIOLOGIA_PB4: PacoteG2[] = [
  pacote(
    'pb4-bio-s1-genetica-abo',
    'Simulado 1 · Genética e sistema ABO (PB4 Biologia)',
    '12 questões objetivas: gene, alelo, genótipo, cruzamentos e grupos sanguíneos',
    'Módulo 8, parte 1: DNA, cromossomos, alelos, lócus, homozigose, dominância e herança do sistema ABO.',
    30,
    S1,
  ),
  pacote(
    'pb4-bio-s2-biotecnologia',
    'Simulado 2 · Biotecnologia, vacinas e ética (PB4 Biologia)',
    '12 questões objetivas: vacina x soro, CRISPR, terapia gênica, OGM e eugenia',
    'Módulo 8, parte 2: imunização, edição genética, células-tronco, insulina transgênica e aspectos éticos.',
    30,
    S2,
  ),
  pacote(
    'pb4-bio-s3-doencas-geneticas',
    'Simulado 3 · Doenças genéticas e cromossomos (PB4 Biologia)',
    '14 questões objetivas: mutação, portador, trissomia, aconselhamento e revisão',
    'Módulo 9: mutações, doenças monogênicas e multifatoriais, portador x afetado, síndrome de Down e pré-natal.',
    35,
    S3,
  ),
  pacote(
    'pb4-bio-s4-prova',
    'Simulado 4 · Dissertativo no estilo da professora (PB4 Biologia)',
    '5 questões dissertativas, com cálculo e raciocínio à mostra',
    'Como a Prof.ª Daiane cobra: comando em destaque (calcule, determine, explique, identifique), raciocínio completo e resposta em parágrafo. A IA corrige com o gabarito e os critérios.',
    60,
    PROVA,
  ),
];
