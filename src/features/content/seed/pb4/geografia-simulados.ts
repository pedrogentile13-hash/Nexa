import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Geografia (9º ano, Prof.ª Ana Carla): Japão (Módulo 11), Oceania (Módulo 12) e ONU (Módulo 13).
 * Simulados objetivos e a simulação real da prova (dissertativa, com perguntas em a e b, como na prova bimestral).
 * REGRA DE ESCRITA: a alternativa certa nunca pode ser reconhecida pelo tamanho (ver `balanco-alternativas.ts`).
 */

const MATERIA = 'geografia';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · JAPÃO: TERRITÓRIO E HISTÓRIA */

const S1: QuestaoG2[] = [
  o(
    'facil',
    'Qual conjunto reúne as quatro principais ilhas do arquipélago japonês?',
    'Hokkaido, Honshu, Shikoku e Kyushu',
    [
      'Honshu, Okinawa, Taiwan e Kyushu',
      'Hokkaido, Honshu, Sacalina e Kyushu',
      'Shikoku, Kyushu, Okinawa e Taiwan',
      'Hokkaido, Kyushu, Sacalina e Okinawa',
    ],
    'As quatro ilhas principais são Hokkaido, Honshu (a maior), Shikoku e Kyushu. Okinawa é um grupo de ilhas ao sul, Taiwan é outro território e Sacalina é russa.',
  ),
  o(
    'facil',
    'Por que o Japão sofre com terremotos, vulcões e tsunamis com tanta frequência?',
    'Fica numa zona de encontro de placas tectônicas',
    [
      'Tem um clima desértico em todo o território',
      'Está sobre uma planície de rochas muito antigas',
      'Fica no centro de um continente muito grande',
      'Tem montanhas formadas somente pelo vento',
    ],
    'O Japão está no Círculo de Fogo do Pacífico, onde várias placas tectônicas se encontram, o que gera abalos sísmicos, vulcões e tsunamis.',
  ),
  o(
    'medio',
    'Qual característica do território japonês ajuda a explicar a concentração da população no litoral?',
    'O relevo é muito montanhoso, com poucas planícies',
    [
      'O interior tem grandes desertos, sem água nenhuma',
      'Só o litoral guarda minérios, e a população o segue',
      'As montanhas são baixas e fáceis de ocupar por todos',
      'O interior tem clima equatorial, quente e muito úmido',
    ],
    'Cerca de três quartos do território são montanhas. As poucas planícies ficam no litoral, e é nelas que estão as grandes cidades e a maior parte da população.',
  ),
  o(
    'medio',
    'Qual é uma consequência da escassez de recursos naturais para a economia do Japão?',
    'O país importa matérias-primas e energia para a indústria',
    [
      'O país exporta petróleo e minério de ferro em grande escala',
      'A indústria japonesa depende apenas de madeira nacional',
      'A economia se baseia na mineração e na pecuária extensiva',
      'O país evita comprar produtos de outras nações do mundo',
    ],
    'Sem petróleo, gás e minérios suficientes, o Japão compra matérias-primas e energia no exterior, transforma esses insumos em produtos de alto valor e os exporta.',
  ),
  o(
    'facil',
    'Qual acontecimento de 1853 forçou o Japão a abrir seus portos ao comércio exterior?',
    'A chegada da esquadra do comodoro americano Perry',
    [
      'A invasão do país pelas tropas do Império Russo',
      'A assinatura de um tratado de paz com a China',
      'A destruição dos portos por um grande terremoto',
      'A visita de uma missão comercial do Reino Unido',
    ],
    'Em 1853, os navios de guerra do comodoro Matthew Perry, dos EUA, pressionaram o Japão a acabar com o isolamento e a abrir os portos.',
  ),
  o(
    'medio',
    'O que foi a Era Meiji, iniciada em 1868?',
    'Uma fase de modernização do país, dirigida pelo Estado',
    [
      'Um período de fechamento total do Japão para o mundo',
      'Uma fase em que o país foi governado por tropas dos EUA',
      'Uma etapa em que o Japão abandonou as ferrovias e a indústria',
      'Um tempo em que o país foi dividido em feudos independentes',
    ],
    'Na Era Meiji, o imperador retomou o poder e o Estado liderou a modernização: educação, ferrovias, fábricas, exército moderno e centralização política.',
  ),
  o(
    'medio',
    'Qual foi um fator externo que ajudou a recuperação industrial do Japão depois de 1945?',
    'O apoio dos EUA e as encomendas da Guerra da Coreia',
    [
      'A cobrança de indenizações pagas pela China ao Japão',
      'A venda de petróleo japonês para toda a Europa',
      'A entrada do país na Guerra Fria ao lado da URSS',
      'O fim do comércio com os países vizinhos da Ásia oriental',
    ],
    'Na Guerra Fria, os EUA quiseram um aliado forte na Ásia. A ajuda financeira, a abertura de mercado e as encomendas da Guerra da Coreia reativaram a indústria japonesa.',
  ),
  o(
    'medio',
    'Qual era o papel do MITI no "milagre japonês"?',
    'Planejar e apoiar os setores industriais estratégicos',
    [
      'Comandar as Forças Armadas do Japão no pós-guerra',
      'Administrar a ocupação americana durante os anos 1940',
      'Controlar a imigração de trabalhadores estrangeiros',
      'Fiscalizar o preço do arroz e dos produtos agrícolas',
    ],
    'O MITI (Ministério do Comércio Internacional e da Indústria) escolhia setores estratégicos, como aço, automóveis e eletrônicos, e oferecia crédito e proteção a eles.',
  ),
  o(
    'medio',
    'Qual medida interna ajudou a financiar a indústria no pós-guerra do Japão?',
    'Os gastos militares baixos e a alta poupança interna',
    [
      'Um grande gasto do governo com exércitos e armas',
      'A importação em massa de produtos industrializados',
      'O fim do investimento em educação e tecnologia',
      'A proibição de exportar produtos para outros países',
    ],
    'A Constituição de 1947 limitou as forças armadas, o que liberou recursos para a indústria. Somou-se a isso uma poupança interna alta, que financiava os investimentos.',
  ),
  o(
    'facil',
    'O que ficou conhecido como "milagre japonês"?',
    'O crescimento econômico acelerado de cerca de 1950 a 1973',
    [
      'A recuperação do país logo depois do terremoto de 2011',
      'A vitória do Japão na Guerra Russo-Japonesa de 1905',
      'A queda da natalidade registrada na década de 1990 no país',
      'A fuga de empresas estrangeiras do país nos anos 1980',
    ],
    'Entre os anos 1950 e o início dos anos 1970, o Japão cresceu em média cerca de 10% ao ano e se tornou uma das maiores economias do mundo.',
  ),
  o(
    'dificil',
    'O que marcou a economia japonesa nos anos 1990, a chamada "década perdida"?',
    'O estouro da bolha financeira e imobiliária, com estagnação',
    [
      'Uma explosão de crescimento, puxada pela alta de preços',
      'A perda do Japão para os EUA numa guerra comercial total',
      'O fim das exportações de automóveis e de eletrônicos',
      'A divisão do país entre um bloco capitalista e outro comunista',
    ],
    'Em 1991, os preços inflados de imóveis e ações despencaram. A crise levou a anos de crescimento muito baixo e deflação, a "década perdida".',
  ),
  o(
    'dificil',
    'Qual evento de 2011 levou o Japão a rever o uso da energia nuclear?',
    'Um terremoto e um tsunami que atingiram Fukushima',
    [
      'A explosão de uma bomba atômica sobre Nagasaki, em 1945',
      'A queda de um grande avião sobre uma usina de Tóquio',
      'Um grande vazamento de petróleo no litoral de Hokkaido',
      'Um ataque militar contra as usinas do litoral japonês',
    ],
    'O terremoto e o tsunami de Tohoku (2011) danificaram a usina de Fukushima, causando um grave acidente nuclear e a revisão da matriz energética do país.',
  ),
];

/* ============================================================ SIMULADO 2 · JAPÃO: POPULAÇÃO E ECONOMIA */

const S2: QuestaoG2[] = [
  o(
    'facil',
    'Como se chama o formato da pirâmide etária do Japão atual, com base estreita e topo largo?',
    'Formato de urna, típico de população idosa',
    [
      'Formato de triângulo, típico de população jovem',
      'Formato de losango, típico de população rural',
      'Formato de pirâmide, típico de países pobres',
      'Formato de cone, típico de população imigrante',
    ],
    'Poucos nascimentos e muitos idosos deixam a base estreita e o topo largo, formando uma "urna", típica de países com população envelhecida.',
  ),
  o(
    'facil',
    'Qual fator ajuda a explicar o envelhecimento da população japonesa?',
    'A baixa natalidade somada à alta expectativa de vida',
    [
      'A alta natalidade, junto da alta mortalidade infantil',
      'A chegada de muitos imigrantes jovens e adultos ao país',
      'A baixa expectativa de vida dos idosos do Japão atual',
      'O baixo investimento do Estado em saúde e em saneamento',
    ],
    'Com poucos nascimentos e uma das maiores expectativas de vida do mundo (cerca de 84 anos), a proporção de idosos cresce em relação à de jovens.',
  ),
  o(
    'medio',
    'Qual alternativa apresenta uma causa da baixa natalidade no Japão?',
    'O custo de vida alto e a jornada de trabalho longa',
    [
      'A proibição de que as mulheres trabalhem fora de casa',
      'A falta de cidades e de serviços nas áreas urbanas',
      'O incentivo do governo para que se tenham muitos filhos',
      'A baixa escolaridade da população em geral do país',
    ],
    'Moradia e educação caras, trabalho em longas jornadas e a dificuldade de conciliar a carreira com a maternidade levam as famílias a ter poucos filhos.',
  ),
  o(
    'medio',
    'Qual é um desafio do envelhecimento populacional para o Japão?',
    'A pressão sobre a previdência e o sistema de saúde',
    [
      'O excesso de mão de obra jovem, sem emprego nas cidades',
      'O aumento rápido da população economicamente ativa',
      'A falta de aposentados para consumir os produtos do país',
      'O crescimento da natalidade nas cidades grandes',
    ],
    'Mais aposentados e menos trabalhadores contribuindo significam gastos crescentes com aposentadoria e saúde, o que sobrecarrega o Estado.',
  ),
  o(
    'medio',
    'O que significa PEA na análise da população de um país?',
    'População que trabalha ou procura trabalho',
    [
      'Produção econômica anual medida em dólares',
      'Previsão de envelhecimento feita pelo governo',
      'Plano de expansão agrícola voltado ao campo',
      'Programa de estímulo ao ensino nas escolas',
    ],
    'PEA é a parcela da população em idade de trabalhar que está empregada ou procurando trabalho. No Japão, ela diminui com o envelhecimento.',
  ),
  o(
    'dificil',
    'Qual é uma resposta japonesa à falta de trabalhadores causada pelo envelhecimento?',
    'O uso crescente de automação e de robôs na produção',
    [
      'A proibição de que os idosos continuem trabalhando',
      'O fechamento total das fronteiras a estrangeiros',
      'A redução do investimento em tecnologia e em pesquisa',
      'O fim dos incentivos ao trabalho de mulheres jovens',
    ],
    'O Japão aposta em robótica e automação para compensar a queda da PEA, além de estimular o trabalho de mulheres e idosos e, aos poucos, a entrada de estrangeiros.',
  ),
  o(
    'facil',
    'Qual setor da economia responde pela maior parte do PIB japonês?',
    'O terciário, formado por comércio e serviços',
    [
      'O primário, formado por agricultura e pesca',
      'O secundário, formado só por indústrias pesadas',
      'O extrativismo, formado por minas e florestas',
      'O informal, formado por pequenas feiras livres',
    ],
    'Como em outros países desenvolvidos, o setor terciário é o maior da economia do Japão, com cerca de 70% do PIB.',
  ),
  o(
    'medio',
    'Por que a agricultura japonesa é pequena diante do tamanho da população?',
    'Há pouca terra plana e o relevo é montanhoso',
    [
      'O clima do país é desértico e muito seco em geral',
      'O governo proíbe o cultivo de alimentos no país',
      'O solo é fértil, mas ninguém quer plantar nele',
      'As terras agrícolas estão nas mãos de estrangeiros',
    ],
    'Apenas uma pequena parte do território é agricultável. Por isso o Japão cultiva sobretudo arroz, chá e hortaliças, pesca bastante e importa grande parte dos alimentos.',
  ),
  o(
    'medio',
    'Qual alternativa mostra corretamente a relação entre território, população e economia do Japão?',
    'Relevo montanhoso leva à concentração urbana e à economia de serviços',
    [
      'Relevo plano leva à dispersão rural e à economia de mineração',
      'Relevo montanhoso leva à vida rural e à economia de plantation',
      'Território pequeno leva à imigração e à exportação de petróleo',
      'Território instável leva ao êxodo urbano e à economia de subsistência',
    ],
    'O relevo montanhoso e a pouca terra plana concentram a população no litoral e nas cidades. A falta de recursos naturais empurra a economia para a tecnologia e os serviços.',
  ),
  o(
    'medio',
    'Qual alternativa cita empresas japonesas de destaque mundial?',
    'Toyota, Sony e Panasonic',
    [
      'Samsung, Huawei e Alibaba',
      'Apple, Google e Amazon',
      'Volkswagen, Siemens e Nokia',
      'Petrobras, Vale e Embraer',
    ],
    'Toyota (automóveis), Sony (eletrônicos e jogos) e Panasonic (eletrônicos) são grandes empresas japonesas. Samsung é sul-coreana e Huawei e Alibaba são chinesas.',
  ),
  o(
    'dificil',
    'Qual país tem uma disputa territorial com o Japão por causa das ilhas Senkaku (Diaoyu)?',
    'A China',
    ['A Rússia', 'A Índia', 'A Tailândia', 'A Mongólia'],
    'As ilhas Senkaku/Diaoyu são disputadas por China e Japão. Com a Rússia a disputa é pelas Curilas do Sul, e com a Coreia do Sul, por Dokdo/Takeshima.',
  ),
  o(
    'dificil',
    'O que determina a Constituição japonesa de 1947, em seu artigo 9?',
    'A renúncia à guerra para resolver conflitos',
    [
      'A obrigação de manter um grande exército nacional',
      'A divisão do país entre os EUA e a URSS',
      'A proibição de qualquer relação com outros países',
      'A criação de uma monarquia absoluta no Japão',
    ],
    'A Constituição de 1947, escrita sob a ocupação americana, renuncia à guerra. O país mantém apenas as Forças de Autodefesa e a aliança de segurança com os EUA.',
  ),
];

/* ============================================================ SIMULADO 3 · OCEANIA */

const S3: QuestaoG2[] = [
  o(
    'facil',
    'Qual alternativa lista corretamente as regiões da Oceania?',
    'Austrália e Nova Zelândia, Melanésia, Micronésia e Polinésia',
    [
      'Austrália, Antártida, Melanésia, Micronésia e Polinésia',
      'Austrália, Indonésia, Nova Zelândia, Micronésia e Polinésia',
      'Nova Zelândia, Japão, Filipinas, Melanésia e Micronésia',
      'Austrália, Papua, Nova Zelândia, Sibéria, Havaí e Fiji',
    ],
    'A Oceania reúne a Austrália e a Nova Zelândia e as ilhas da Melanésia, da Micronésia e da Polinésia. A Antártida não faz parte do continente.',
  ),
  o(
    'facil',
    'Qual é a capital da Austrália?',
    'Camberra',
    ['Sydney', 'Melbourne', 'Perth', 'Brisbane'],
    'A capital é Camberra, cidade planejada. Sydney e Melbourne são as maiores cidades, mas não são a capital.',
  ),
  o(
    'medio',
    'Por que a maioria dos australianos vive no litoral leste e sudeste?',
    'O interior é árido e semiárido, o chamado Outback',
    [
      'O interior é coberto por geleiras e neve o ano todo',
      'O interior tem florestas equatoriais muito densas',
      'O litoral é a única parte do país com minérios',
      'O governo proíbe o povoamento do interior desde 1950',
    ],
    'Grande parte do território australiano é deserto ou semideserto. Com pouca água, a população se concentra nas cidades do litoral, como Sydney e Melbourne.',
  ),
  o(
    'medio',
    'O que é a Grande Barreira de Corais?',
    'A maior estrutura viva do planeta, no nordeste australiano',
    [
      'Uma longa cadeia de montanhas no sul da Nova Zelândia',
      'Uma grande ilha vulcânica no centro do Oceano Pacífico',
      'Um muro construído pelo governo para evitar as ondas do mar',
      'Um deserto de sal na costa oeste do continente australiano',
    ],
    'A Grande Barreira de Corais, em Queensland, tem mais de 2 mil quilômetros e é ameaçada pelo branqueamento dos corais, ligado ao aquecimento dos oceanos.',
  ),
  o(
    'medio',
    'Qual é a principal atividade da economia australiana nas exportações?',
    'A mineração, com minério de ferro e carvão',
    [
      'A pesca industrial, com atum e salmão',
      'A indústria têxtil, com roupas de algodão',
      'O extrativismo vegetal, com a borracha',
      'A pecuária leiteira, com o queijo e a manteiga',
    ],
    'A Austrália é uma grande exportadora de minério de ferro, carvão, ouro e gás, principalmente para a China e outros países da Ásia.',
  ),
  o(
    'medio',
    'Qual atividade se destaca na economia da Nova Zelândia?',
    'A pecuária de ovinos e os laticínios',
    [
      'A mineração de carvão e de ferro',
      'O cultivo de arroz irrigado e de chá',
      'A indústria pesada de automóveis',
      'A exploração de petróleo em alto-mar',
    ],
    'O clima temperado e as pastagens favorecem a criação de ovelhas e de gado leiteiro. Lã, carne e laticínios têm grande peso nas exportações neozelandesas.',
  ),
  o(
    'medio',
    'Quem são os povos originários da Austrália e da Nova Zelândia?',
    'Aborígenes e maoris',
    [
      'Incas e astecas antigos',
      'Inuítes e lapões do norte',
      'Tuaregues e berberes',
      'Curdos e pashtuns afegãos',
    ],
    'Os aborígenes são os povos originários da Austrália e os maoris, da Nova Zelândia. Ambos perderam terras na colonização britânica.',
  ),
  o(
    'medio',
    'Como começou a colonização britânica da Austrália, em 1788?',
    'Com uma colônia penal, para presos vindos da Inglaterra',
    [
      'Com uma colônia agrícola, formada por camponeses livres',
      'Com um posto militar, criado para vigiar o comércio da China',
      'Com uma missão religiosa, chefiada por padres católicos',
      'Com um porto livre, aberto ao comércio de especiarias',
    ],
    'A primeira colônia britânica, em Sydney, recebeu condenados enviados da Inglaterra. Os povos aborígenes foram expulsos de suas terras e muitos morreram.',
  ),
  o(
    'dificil',
    'Qual ameaça climática é mais grave para países-ilha como Tuvalu e Kiribati?',
    'A elevação do nível do mar, que cobre os atóis',
    [
      'A falta de chuvas em áreas de floresta tropical',
      'A formação de geleiras sobre as ilhas do Pacífico',
      'A expansão dos desertos em direção ao litoral',
      'O aumento das nevascas durante o verão do Pacífico',
    ],
    'Muitos atóis do Pacífico têm poucos metros de altitude. Com o aquecimento global e o avanço do mar, essas ilhas correm o risco de ficar inabitáveis.',
  ),
  o(
    'dificil',
    'O que é o AUKUS, firmado em 2021?',
    'Um pacto de defesa entre Austrália, Reino Unido e EUA',
    [
      'Um bloco comercial entre Austrália, China e Japão',
      'Uma grande aliança ambiental entre as ilhas do Pacífico',
      'Um acordo de cultura entre Austrália e Nova Zelândia',
      'Um tratado de paz entre a Austrália, a Rússia e a Coreia',
    ],
    'O AUKUS é uma aliança militar que inclui, entre outros pontos, a venda de submarinos de propulsão nuclear à Austrália. Faz parte da disputa entre EUA e China no Pacífico.',
  ),
  o(
    'dificil',
    'Qual característica da fauna australiana se explica pelo longo isolamento do continente?',
    'Marsupiais endêmicos, como o canguru e o coala',
    [
      'Grandes felinos, como o leão e o tigre-de-bengala',
      'Elefantes e girafas vivendo nas savanas centrais',
      'Ausência total de animais nativos no continente',
      'Ursos-polares vivendo nas áreas desérticas do centro',
    ],
    'Isolada por milhões de anos, a Austrália desenvolveu espécies que só existem lá, como os marsupiais (canguru, coala) e o ornitorrinco.',
  ),
  o(
    'dificil',
    'Como a China influencia a economia da Austrália?',
    'É a principal compradora do minério e do carvão',
    [
      'É a principal vendedora de petróleo ao país',
      'É a dona de todas as minas do território australiano',
      'É a única origem dos imigrantes que chegam ao país',
      'É a maior concorrente na exportação de lã e de leite',
    ],
    'A China compra grande parte do minério de ferro, do carvão e do gás australianos. Por isso a Austrália equilibra o comércio com a China e a segurança com os EUA.',
  ),
];

/* ============================================================ SIMULADO 4 · ONU */

const S4: QuestaoG2[] = [
  o(
    'facil',
    'Em que ano e por que a ONU foi criada?',
    'Em 1945, para manter a paz depois da 2ª Guerra Mundial',
    [
      'Em 1919, para encerrar os combates da 1ª Guerra Mundial',
      'Em 1989, para encerrar a Guerra Fria entre as potências',
      'Em 1914, para dividir as colônias da África entre si',
      'Em 1991, para acompanhar o fim da União Soviética',
    ],
    'A ONU nasceu em 24 de outubro de 1945, em São Francisco, ao fim da 2ª Guerra, com o objetivo de manter a paz e a segurança e promover a cooperação.',
  ),
  o(
    'medio',
    'Que organização internacional antecedeu a ONU e falhou em evitar a 2ª Guerra Mundial?',
    'A Liga das Nações',
    ['A Cruz Vermelha', 'A União Europeia', 'O Pacto de Varsóvia', 'O Conselho da Europa'],
    'A Liga das Nações, criada em 1919, não tinha meios de impor suas decisões nem contava com todas as potências, e não impediu a 2ª Guerra Mundial.',
  ),
  o(
    'facil',
    'Quantos Estados são membros da ONU atualmente?',
    '193',
    ['51', '120', '150', '210'],
    'A ONU tem 193 Estados-membros. Foi fundada por 51 países, e o mais novo é o Sudão do Sul, desde 2011.',
  ),
  o(
    'facil',
    'Quais países são membros permanentes do Conselho de Segurança?',
    'EUA, Rússia, China, Reino Unido e França',
    [
      'EUA, Brasil, China, Alemanha e Japão',
      'EUA, Rússia, Índia, Reino Unido e Itália',
      'EUA, Rússia, Japão, Alemanha e França',
      'China, Brasil, Índia, Reino Unido e França',
    ],
    'Os cinco membros permanentes, vencedores da 2ª Guerra, são EUA, Rússia (herdeira da URSS), China, Reino Unido e França.',
  ),
  o(
    'medio',
    'O que significa o direito de veto no Conselho de Segurança?',
    'Qualquer membro permanente pode barrar uma resolução',
    [
      'Qualquer membro pode obrigar os outros a votar sim',
      'Qualquer país pode expulsar outro da organização',
      'Somente a Assembleia Geral pode cancelar uma votação',
      'Somente os membros rotativos podem rejeitar resoluções',
    ],
    'Se um dos cinco membros permanentes votar contra, a resolução não é aprovada, mesmo que os outros 14 concordem.',
  ),
  o(
    'medio',
    'Qual é a principal diferença entre a Assembleia Geral e o Conselho de Segurança?',
    'A Assembleia recomenda e o Conselho toma decisões obrigatórias',
    [
      'A Assembleia aplica sanções aos países e o Conselho apenas aconselha',
      'A Assembleia tem 15 membros e o Conselho tem 193 membros',
      'A Assembleia só reúne as potências, e o Conselho, os pobres',
      'A Assembleia julga os Estados e o Conselho vota o orçamento',
    ],
    'Na Assembleia Geral, os 193 membros têm um voto cada e decidem por recomendação. Só as resoluções do Conselho de Segurança são obrigatórias.',
  ),
  o(
    'medio',
    'Qual órgão da ONU, com sede em Haia, julga disputas entre Estados?',
    'A Corte Internacional de Justiça',
    [
      'O Conselho de Segurança da ONU',
      'O Conselho Econômico e Social',
      'A Assembleia Geral das Nações Unidas',
      'O Secretariado das Nações Unidas',
    ],
    'A Corte Internacional de Justiça fica em Haia, nos Países Baixos, e julga conflitos jurídicos entre países.',
  ),
  o(
    'medio',
    'Quem são os "capacetes azuis"?',
    'Soldados cedidos pelos países para as missões de paz',
    [
      'Funcionários que trabalham na sede, em Nova York',
      'Juízes que atuam no tribunal de Haia, nos Países Baixos',
      'Diplomatas que votam as recomendações da Assembleia Geral',
      'Médicos que combatem as grandes pandemias pelo mundo',
    ],
    'Os capacetes azuis são tropas e policiais de vários países que atuam em missões de paz, com autorização do Conselho de Segurança.',
  ),
  o(
    'medio',
    'Que missão de paz da ONU foi liderada pelo Brasil, entre 2004 e 2017?',
    'A MINUSTAH, no Haiti',
    [
      'A UNIFIL, no Líbano',
      'A UNAMID, em Darfur',
      'A UNPROFOR, na Bósnia',
      'A UNTAET, no Timor-Leste',
    ],
    'O Brasil comandou o componente militar da MINUSTAH, a missão de estabilização no Haiti.',
  ),
  o(
    'medio',
    'Que documento da ONU, de 1948, define direitos básicos de todas as pessoas?',
    'A Declaração Universal dos Direitos Humanos',
    [
      'A Carta de criação da Liga das Nações',
      'O Tratado de Versalhes assinado em 1919',
      'O Acordo de Paris sobre o clima mundial',
      'A Agenda 2030 do desenvolvimento global',
    ],
    'A Declaração Universal dos Direitos Humanos (1948) afirma que todos nascem livres e iguais em dignidade e direitos.',
  ),
  o(
    'medio',
    'Qual agência da ONU cuida da saúde mundial?',
    'A OMS',
    ['A FAO', 'A UNESCO', 'O ACNUR', 'A OIT'],
    'A OMS (Organização Mundial da Saúde) coordena a saúde no mundo. A FAO cuida da alimentação e da agricultura, a UNESCO, da educação e da cultura, e o ACNUR, dos refugiados.',
  ),
  o(
    'dificil',
    'O que é a Agenda 2030 da ONU?',
    'Um plano com 17 objetivos de desenvolvimento sustentável',
    [
      'Um acordo militar com 17 países do Conselho de Segurança',
      'Um tribunal criado para julgar crimes cometidos até 2030',
      'Uma moeda única que seria adotada por todos os países',
      'Uma força de paz com 17 mil soldados em ação mundial',
    ],
    'A Agenda 2030, de 2015, reúne 17 Objetivos de Desenvolvimento Sustentável: pobreza, fome, educação, saúde, igualdade, clima e outros.',
  ),
  o(
    'dificil',
    'Qual crítica é feita ao funcionamento do Conselho de Segurança?',
    'O veto das potências pode travar decisões importantes',
    [
      'O Conselho tem membros demais para decidir com rapidez',
      'O Conselho só reúne países pobres, sem nenhum poder real',
      'O Conselho decide por sorteio quais países podem vetar',
      'O Conselho não pode votar nenhuma resolução importante',
    ],
    'Quando os interesses das potências entram em choque, o veto trava as decisões, como se viu em conflitos como Síria e Ucrânia.',
  ),
  o(
    'dificil',
    'O que defende o G4 (Brasil, Alemanha, Índia e Japão) na ONU?',
    'A reforma do Conselho, com novos assentos permanentes',
    [
      'O fim da Assembleia Geral e de todos os seus 193 votos',
      'A saída dos EUA e da Rússia da organização mundial',
      'A criação de um exército mundial e permanente da ONU',
      'A mudança da sede da ONU para um país do Hemisfério Sul',
    ],
    'O G4 pede um Conselho de Segurança mais representativo, com assentos permanentes para seus integrantes, já que o desenho atual reflete o mundo de 1945.',
  ),
];

/* ============================================================ SIMULADO 5 · MISTO (JAPÃO, OCEANIA, ONU E CHINA) */

const S5: QuestaoG2[] = [
  o(
    'facil',
    'O que são as Zonas Econômicas Especiais (ZEEs) da China?',
    'Áreas costeiras com incentivos a empresas estrangeiras',
    [
      'Áreas de preservação, fechadas a qualquer empresa',
      'Regiões militares, proibidas aos turistas e aos estrangeiros',
      'Terras do interior, reservadas à agricultura de subsistência',
      'Zonas de livre circulação, criadas pela ONU na Ásia',
    ],
    'As ZEEs, como Shenzhen, oferecem isenção de impostos, infraestrutura e mão de obra barata para atrair multinacionais, o que impulsionou as exportações chinesas.',
  ),
  o(
    'medio',
    'Qual é o objetivo principal da Nova Rota da Seda, projeto da China?',
    'Ligar a Ásia, a Europa e a África por ferrovias e portos',
    [
      'Fechar as fronteiras chinesas ao comércio com a Europa',
      'Substituir o petróleo pela seda como produto de exportação',
      'Impedir que os produtos chineses cheguem à América',
      'Reduzir a presença da China nos mares do Oriente Médio',
    ],
    'A iniciativa investe em infraestrutura para reduzir o tempo e o custo de exportar, aumentando a influência chinesa na economia mundial.',
  ),
  o(
    'medio',
    'Como o modelo econômico chinês se diferencia do modelo dos EUA?',
    'Na China o Estado dirige a economia, e nos EUA lideram as empresas',
    [
      'Na China as empresas privadas dirigem tudo, e nos EUA o Estado planeja',
      'Na China não há comércio exterior, e nos EUA há muito comércio',
      'Na China a economia é só agrícola, e nos EUA é só industrial',
      'Na China o Estado é mínimo, e nos EUA é um Estado totalitário',
    ],
    'O "socialismo de mercado" chinês combina partido único e planejamento do Estado com mercado, enquanto nos EUA as empresas privadas lideram e o mercado é mais livre.',
  ),
  o(
    'medio',
    'Qual foi uma reação recente dos EUA ao crescimento do poder econômico da China?',
    'A criação de tarifas sobre produtos chineses',
    [
      'A suspensão de tarifas sobre produtos chineses',
      'A venda de empresas americanas ao governo chinês',
      'A transferência de todas as fábricas para a China',
      'A entrada no bloco comercial liderado pela China',
    ],
    'Os EUA adotaram tarifas, restrições a empresas e tecnologias chinesas e incentivos para trazer fábricas de volta ao país.',
  ),
  o(
    'facil',
    'Qual tipo de relevo predomina no território do Japão?',
    'Montanhoso, com poucas planícies no litoral',
    [
      'Plano, com extensas planícies no interior',
      'Desértico, com dunas em quase todo o país',
      'Planaltos antigos, sem atividade vulcânica',
      'Depressões, com áreas abaixo do nível do mar',
    ],
    'Cerca de três quartos do território japonês são montanhosos, e as poucas planícies ficam no litoral.',
  ),
  o(
    'medio',
    'Qual alternativa relaciona corretamente a Era Meiji e o milagre japonês?',
    'Em ambos, o Estado teve papel central na industrialização',
    [
      'Em ambos, o país ficou fechado ao comércio mundial',
      'Em ambos, o país foi administrado por tropas estrangeiras',
      'Em ambos, o crescimento veio da agricultura extensiva',
      'Em ambos, o governo se afastou da economia do país',
    ],
    'Na Era Meiji, o Estado criou a base industrial. No milagre, o MITI planejou e protegeu setores estratégicos. O Estado foi central nas duas fases.',
  ),
  o(
    'medio',
    'Qual alternativa descreve a demografia atual do Japão?',
    'Baixa natalidade, longevidade e população em queda',
    [
      'Alta natalidade, baixa longevidade e população em alta',
      'Baixa natalidade, baixa longevidade e muita imigração',
      'Alta natalidade, alta longevidade e população estável',
      'Média natalidade, média longevidade e êxodo rural',
    ],
    'O Japão tem menos de 1,3 filho por mulher, expectativa de vida de cerca de 84 anos e população em declínio desde o fim dos anos 2000.',
  ),
  o(
    'dificil',
    'Qual alternativa liga o envelhecimento da população japonesa à economia do país?',
    'Menos trabalhadores e mais idosos pesam na previdência',
    [
      'Mais trabalhadores e menos aposentados reduzem o consumo',
      'Mais jovens e menos idosos aumentam os gastos com saúde',
      'Mais nascimentos e menos mortes diminuem a mão de obra',
      'Mais imigrantes e menos idosos elevam os custos do país',
    ],
    'Com a queda da PEA e o aumento do número de idosos, cai a arrecadação e crescem as despesas com aposentadoria e saúde.',
  ),
  o(
    'facil',
    'Qual alternativa cita corretamente a capital da Nova Zelândia?',
    'Wellington',
    ['Auckland', 'Sydney', 'Camberra', 'Christchurch'],
    'A capital da Nova Zelândia é Wellington. Auckland é a maior cidade, e Camberra é a capital da Austrália.',
  ),
  o(
    'medio',
    'Por que as ilhas do Pacífico se interessam por ação climática na ONU?',
    'Porque o mar em elevação ameaça o território das ilhas',
    [
      'Porque o clima é frio demais para a agricultura das ilhas',
      'Porque a ONU paga um imposto sobre as chuvas nas ilhas',
      'Porque o aquecimento do planeta secaria os rios das ilhas',
      'Porque as ilhas são grandes poluidoras de carbono no mundo',
    ],
    'Países-ilha de baixa altitude usam a ONU e as conferências do clima (COP) para exigir redução das emissões e apoio financeiro diante da elevação do nível do mar.',
  ),
  o(
    'medio',
    'Qual é o direito exclusivo dos cinco membros permanentes do Conselho de Segurança?',
    'O poder de veto sobre qualquer resolução',
    [
      'O comando de todas as tropas da ONU',
      'A indicação do Secretário-Geral sozinhos',
      'A escolha dos juízes da Corte de Haia',
      'O controle do orçamento de toda a ONU',
    ],
    'O veto é o poder exclusivo dos EUA, da Rússia, da China, do Reino Unido e da França: um voto contrário barra a resolução.',
  ),
  o(
    'medio',
    'Qual destes países é membro permanente do Conselho de Segurança e criou Zonas Econômicas Especiais?',
    'A China',
    ['O Japão', 'A Austrália', 'O Brasil', 'A Índia'],
    'A China é membro permanente do Conselho de Segurança e criou as ZEEs a partir de 1980. O Japão e o Brasil disputam um assento permanente.',
  ),
  o(
    'dificil',
    'Qual alternativa diferencia corretamente as agências da ONU?',
    'A FAO combate a fome e a UNESCO atua em educação e cultura',
    [
      'A FAO cuida da saúde e a UNESCO vigia a energia atômica',
      'A FAO julga disputas e a UNESCO protege os refugiados',
      'A FAO calcula o IDH e a UNESCO controla o comércio mundial',
      'A FAO organiza as tropas e a UNESCO financia os países',
    ],
    'A FAO trata de alimentação e agricultura, e a UNESCO, de educação, ciência e cultura. A saúde é da OMS, os refugiados são do ACNUR e a energia atômica é da AIEA.',
  ),
  o(
    'dificil',
    'Que decisão da Constituição japonesa pesa na geopolítica do país?',
    'A renúncia à guerra, com apoio à defesa dado pelos EUA',
    [
      'A obrigação de ter armas nucleares, com apoio da China',
      'A proibição de qualquer aliança, com neutralidade total',
      'A criação de bases militares, com apoio da Rússia',
      'A conquista de territórios, com apoio da Coreia do Sul',
    ],
    'O artigo 9 renuncia à guerra, e o Japão se apoia na aliança de segurança com os EUA e em forças de autodefesa.',
  ),
  o(
    'dificil',
    'O que a Austrália e o Japão têm em comum, segundo o conteúdo do bimestre?',
    'Ambos são economias desenvolvidas e aliadas dos EUA',
    [
      'Ambos são ilhas montanhosas, sem nenhum deserto',
      'Ambos são membros permanentes do Conselho de Segurança',
      'Ambos são comunistas e planejam a economia pelo Estado',
      'Ambos dependem da pesca como principal atividade',
    ],
    'Austrália e Japão têm alto IDH, economias de mercado e acordos de segurança com os EUA. Nenhum dos dois é membro permanente do Conselho de Segurança.',
  ),
];

/* ============================================================ SIMULAÇÃO REAL DA PROVA (dissertativa) */

const PROVA: QuestaoG2[] = [
  dq(
    'medio',
    '1. Sobre o Japão, responda: a) Explique como as características do território japonês (relevo e natureza) se relacionam com a distribuição da população e com a economia do país. b) Explique duas características da população japonesa ligadas à baixa natalidade e ao envelhecimento e dois desafios que o envelhecimento traz ao país.',
    'a) O território é formado por ilhas montanhosas, com poucas planícies, e sofre com terremotos e tsunamis. A população se concentra nas planícies do litoral e nas cidades (cerca de 90% urbana), e a falta de terra para a agricultura e de recursos naturais levou a economia a se basear na indústria de tecnologia e nos serviços, com importação de matérias-primas e energia. b) A população tem baixa natalidade (menos de 1,3 filho por mulher) e alta expectativa de vida (cerca de 84 anos), por isso a pirâmide fica em forma de urna e há muitos idosos. Desafios: pressão sobre a previdência e a saúde; queda da PEA e falta de mão de obra (também menor consumo, necessidade de imigração ou de robôs).',
    [
      'Relaciona relevo montanhoso à concentração da população no litoral e nas cidades',
      'Liga a falta de terras e de recursos à economia de tecnologia, serviços e importação',
      'Explica duas características: baixa natalidade e longevidade (pirâmide em urna)',
      'Explica dois desafios: previdência e saúde, falta de mão de obra (PEA)',
      'Escreve em parágrafos, sem abreviações, com ponto final',
    ],
  ),
  dq(
    'dificil',
    '2. Sobre a industrialização do Japão, responda: a) Com suas palavras, explique como o Japão se industrializou desde a Era Meiji até o "milagre japonês". b) Destaque os fatores externos que influenciaram o crescimento e as principais medidas internas adotadas pelo governo japonês.',
    'a) Em 1853, a pressão dos EUA abriu os portos japoneses. Em 1868, a Era Meiji reuniu o poder no imperador e o Estado modernizou o país de cima para baixo: educação, ferrovias, fábricas estatais (depois entregues aos zaibatsus) e exército. Depois da derrota na 2ª Guerra (1945), o país foi ocupado pelos EUA, passou por reformas e, de 1950 a 1973, viveu o milagre, com crescimento de cerca de 10% ao ano. b) Fatores externos: ajuda e proteção dos EUA na Guerra Fria, encomendas da Guerra da Coreia, mercado consumidor americano, tecnologia importada e petróleo barato. Medidas internas: planejamento do MITI, crédito e proteção aos setores estratégicos, reforma agrária, keiretsus, investimento em educação e tecnologia, alta poupança, gasto militar baixo, exportação e produção enxuta (toyotismo).',
    [
      'Cita a abertura forçada dos portos (Perry, 1853) e a Era Meiji (1868)',
      'Explica a modernização feita pelo Estado na Era Meiji',
      'Cita a derrota em 1945, a ocupação dos EUA e o crescimento de 1950 a 1973',
      'Aponta pelo menos dois fatores externos (EUA, Guerra Fria, Guerra da Coreia, mercado)',
      'Aponta pelo menos duas medidas internas (MITI, educação, poupança, keiretsus, gasto militar baixo)',
    ],
  ),
  dq(
    'medio',
    '3. Sobre a Oceania, responda: a) Explique por que a maior parte da população australiana vive no litoral, e cite duas características naturais da Austrália. b) Cite dois setores da economia da Austrália ou da Nova Zelândia e explique um problema ambiental que ameaça a região.',
    'a) Grande parte da Austrália é árida e semiárida (o Outback), com pouca água, então a população se concentra nas cidades do litoral leste e sudeste (Sydney, Melbourne). Características: deserto central, Grande Barreira de Corais, fauna endêmica de marsupiais (canguru, coala), Grande Cordilheira Divisória. b) Setores: mineração (minério de ferro, carvão, ouro), pecuária de ovinos e bovinos, laticínios (Nova Zelândia), turismo e serviços. Problemas: elevação do nível do mar (Tuvalu, Kiribati), branqueamento dos corais, queimadas e secas na Austrália, dependência do carvão.',
    [
      'Liga o interior árido (Outback) à concentração no litoral',
      'Cita duas características naturais da Austrália',
      'Cita dois setores econômicos com exemplos de produtos',
      'Explica um problema ambiental (nível do mar, corais, queimadas)',
      'Escreve em parágrafos, sem abreviações',
    ],
  ),
  dq(
    'medio',
    '4. Sobre a ONU, responda: a) Explique em que contexto a ONU foi criada e quais são seus principais objetivos. b) Explique como o Conselho de Segurança funciona (membros, veto, poder de decisão) e cite uma crítica a esse funcionamento.',
    'a) A ONU foi criada em 1945, ao fim da 2ª Guerra Mundial, para substituir a Liga das Nações, que falhou em evitar o conflito. Seus objetivos são manter a paz e a segurança internacionais, promover a cooperação entre os países, defender os direitos humanos e o desenvolvimento. b) O Conselho tem 15 membros: cinco permanentes com direito de veto (EUA, Rússia, China, Reino Unido e França) e dez rotativos, eleitos por dois anos. Suas decisões são obrigatórias: pode aplicar sanções e enviar missões de paz. Crítica: o veto paralisa decisões quando as potências discordam (Síria, Ucrânia, Gaza), e o Conselho reflete o mundo de 1945, sem membros permanentes da África e da América Latina.',
    [
      'Situa a criação em 1945, depois da 2ª Guerra, e a Liga das Nações',
      'Cita pelo menos dois objetivos (paz e segurança, cooperação, direitos humanos)',
      'Explica a composição: 5 permanentes com veto e 10 rotativos',
      'Explica que as decisões do Conselho são obrigatórias (sanções, missões de paz)',
      'Apresenta uma crítica (veto, falta de representatividade)',
    ],
  ),
  dq(
    'dificil',
    '5. Sobre a China e o cenário mundial, responda: a) Explique como as ZEEs, a Nova Rota da Seda e o comércio eletrônico se ligam ao aumento da importância da China na economia mundial. b) Cite uma reação recente dos EUA ao crescimento do poder econômico da China e relacione a ONU à disputa entre as duas potências.',
    'a) As ZEEs atraíram multinacionais com isenção de impostos e mão de obra barata, e a China virou a fábrica do mundo, com crescimento de dois dígitos. A Nova Rota da Seda (ferrovias, portos e estradas ligando Ásia, Europa e África) reduz o tempo e o custo das exportações e amplia a influência chinesa. O e-commerce (Alibaba, por exemplo) fortalece o mercado interno e a venda direta ao mundo. b) Reação dos EUA: tarifas de importação sobre produtos chineses (guerra comercial), restrições a empresas e tecnologias chinesas e estímulo ao retorno de fábricas. Na ONU, EUA e China são membros permanentes do Conselho de Segurança, com veto, e a disputa entre eles pode bloquear decisões.',
    [
      'Explica a função das ZEEs (isenções, mão de obra barata, multinacionais)',
      'Explica a Nova Rota da Seda como infraestrutura e influência',
      'Relaciona o e-commerce ao fortalecimento da economia chinesa',
      'Cita uma reação dos EUA (tarifas, restrições, volta de fábricas)',
      'Relaciona EUA e China ao veto no Conselho de Segurança',
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

export const PACOTES_GEOGRAFIA_PB4: PacoteG2[] = [
  pacote(
    'pb4-geo-s1-japao-territorio-historia',
    'Simulado 1 · Japão: território e história (PB4 Geografia)',
    '12 questões objetivas: ilhas, relevo, Era Meiji, pós-guerra e milagre japonês',
    'Território, natureza, Era Meiji, fatores externos e medidas internas do milagre japonês. Cada erro vem com a explicação.',
    25,
    S1,
  ),
  pacote(
    'pb4-geo-s2-japao-populacao-economia',
    'Simulado 2 · Japão: população e economia (PB4 Geografia)',
    '12 questões objetivas: natalidade, envelhecimento, PEA, setores e geopolítica',
    'Pirâmide etária, causas e desafios do envelhecimento, setores da economia e disputas territoriais do Japão.',
    25,
    S2,
  ),
  pacote(
    'pb4-geo-s3-oceania',
    'Simulado 3 · Oceania (PB4 Geografia)',
    '12 questões objetivas: Austrália, Nova Zelândia, ilhas, economia e geopolítica',
    'Regiões, natureza, povos originários, economia, mudanças climáticas e disputas de influência no Pacífico.',
    25,
    S3,
  ),
  pacote(
    'pb4-geo-s4-onu',
    'Simulado 4 · ONU (PB4 Geografia)',
    '14 questões objetivas: origem, órgãos, Conselho de Segurança, missões de paz e reforma',
    'Criação em 1945, órgãos principais, veto, missões de paz, agências, Agenda 2030 e críticas à ONU.',
    30,
    S4,
  ),
  pacote(
    'pb4-geo-s5-misto',
    'Simulado 5 · Misto: Japão, Oceania, ONU e China (PB4 Geografia)',
    '15 questões objetivas de todo o conteúdo do bimestre',
    'Revisão geral, com ligações entre Japão, China, Oceania e ONU, no estilo de cobrança da professora.',
    35,
    S5,
  ),
  pacote(
    'pb4-geo-prova',
    'Simulação real · Prova PB4 de Geografia',
    '5 questões dissertativas, cada uma com letras a e b, como na prova bimestral',
    'Responda em parágrafos, sem abreviações, com letra maiúscula no começo e ponto final (erros de ortografia descontam até 0,5). A IA corrige com o gabarito e os critérios. Faça sem consultar o material, a caneta, como na prova.',
    90,
    PROVA,
  ),
];
