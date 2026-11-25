import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Física (9º ano, Prof.ª "Dé"): Magnetismo e Eletromagnetismo (AP 3) e Astronomia (AP 4). Prova só de teoria.
 * Três simulados: (1) idêntico à lista de exercícios da professora (as 9 questões, com os mesmos enunciados e
 * alternativas; as figuras viram descrição em texto); (2) perto da prova, no estilo das VAs; (3) objetivo de revisão.
 * REGRA DE ESCRITA do objetivo de revisão: a certa nunca se reconhece pelo tamanho. O simulado 1 é cópia fiel
 * da lista e por isso não segue essa regra.
 */

const MATERIA = 'fisica';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · IDÊNTICO À LISTA DA PROFESSORA (9 objetivas) */

const S1: QuestaoG2[] = [
  o(
    'facil',
    '1. Separação de ímãs. Um ímã de barra, com polos Norte (N) e Sul (S), foi quebrado em três partes, conforme a figura. [Figura: o ímã inteiro tem N na esquerda e S na direita. Depois de quebrado, o pedaço da esquerda tem o N na ponta livre e a extremidade A na outra ponta; o pedaço do meio vai da extremidade B à extremidade C; o pedaço da direita vai da extremidade D até o S da ponta livre.] As polaridades magnéticas corretas para A, B, C e D são, respectivamente:',
    'S, N, S, N.',
    ['S, N, N, S.', 'N, S, N, S.', 'N, S, S, N.'],
    'Cada pedaço quebrado vira um novo ímã, com N e S, e mantém a orientação do ímã original (N à esquerda, S à direita). Então o pedaço da esquerda termina em S (A), o do meio vai de N (B) a S (C), e o da direita começa em N (D). Resposta: S, N, S, N.',
  ),
  o(
    'facil',
    '2. Força magnética. Os trens Maglev utilizam ímãs para se manterem levitados, sem contato direto com os trilhos, como representa a figura (vista frontal). [Figura: os ímãs do trem, com o polo N voltado para baixo, ficam sobre os ímãs do trilho, com o polo N voltado para cima; setas para cima indicam a força.] A levitação do trem ocorre porque há:',
    'repulsão entre polos de mesma polaridade.',
    [
      'atração entre polos de mesma polaridade.',
      'atração entre polos de polaridades opostas.',
      'anulação do campo magnético entre o trem e o trilho.',
    ],
    'Os polos que ficam frente a frente são iguais (N com N), e polos iguais se repelem. A força de repulsão sustenta o trem no ar.',
  ),
  o(
    'medio',
    '3. Campo magnético e bússolas. A figura mostra um ímã de barra e três bússolas (1, 2 e 3) posicionadas ao seu redor. [Figura: o ímã tem o polo N à esquerda e o polo S à direita, com linhas de campo tracejadas saindo do N e entrando no S. A bússola 1 fica à esquerda do polo N, a bússola 2 fica acima do ímã e a bússola 3 fica à direita do polo S. As agulhas ainda não estão desenhadas.] A orientação correta das agulhas, representando o polo Norte (vermelho) de cada bússola, é:',
    'A bússola 1 aponta para a esquerda, a 2 aponta para a direita e a 3 aponta para a esquerda.',
    [
      'A bússola 1 aponta para a direita, a 2 aponta para a direita e a 3 aponta para baixo.',
      'A bússola 1 aponta para a direita, a 2 aponta para a direita e a 3 aponta para cima.',
      'A bússola 1 aponta para a esquerda, a 2 aponta para a esquerda e a 3 aponta para baixo.',
    ],
    'A ponta norte da agulha acompanha o sentido da linha de campo, que sai do N e entra no S. À esquerda do N, a linha aponta para a esquerda; acima do ímã, vai do N para o S, ou seja, para a direita; à direita do S, a linha entra no polo S, apontando para a esquerda.',
  ),
  o(
    'medio',
    '4. Eletromagnetismo e Lei de Faraday no cotidiano. Os dínamos são geradores de energia elétrica utilizados em bicicletas para acender uma pequena lâmpada. Para isso, é necessário que a parte móvel esteja em contato com o pneu da bicicleta e, quando ela entra em movimento, é gerada energia elétrica para acender a lâmpada. Dentro desse gerador, encontram-se um ímã e uma bobina. Perceba-se que, caso a roda não gire, a lâmpada não acende, ou seja, só ter o ímã presente não se faz suficiente para existir a energia elétrica. O princípio de funcionamento desse equipamento é explicado pelo fato de que a',
    'corrente elétrica é gerada em circuito fechado quando há variação do campo magnético.',
    [
      'corrente elétrica no circuito fechado gera um campo magnético nessa região.',
      'bobina imersa no campo magnético em circuito fechado gera uma corrente elétrica.',
      'bobina em atrito com o campo magnético no circuito fechado gera uma corrente elétrica.',
      'corrente elétrica é gerada em circuito fechado por causa da presença do campo magnético.',
    ],
    'Pela Lei de Faraday, é a variação do campo magnético que induz corrente em um circuito fechado. Só a presença do ímã não basta: com a roda parada, não há variação e a lâmpada não acende.',
  ),
  o(
    'medio',
    '5. Magnetismo nas tecnologias. A magnetohipertermia é um procedimento terapêutico que se baseia na elevação da temperatura das células de uma região específica do corpo que estejam afetadas por um tumor. Nesse tipo de tratamento, nanopartículas magnéticas são fagocitadas (digeridas) pelas células tumorais, e um campo magnético alternado externo é utilizado para promover a agitação das nanopartículas e consequente aquecimento da célula. A partir da descrição do texto, podemos concluir que as células do tumor irão morrer pois:',
    'o campo magnético alternado faz as nanopartículas girarem, transferindo calor por atrito entre as nanopartículas, causando o aquecimento da célula.',
    [
      'o campo magnético gerado pela oscilação das nanopartículas é absorvido pelo tumor.',
      'as nanopartículas interagem magneticamente com as células do corpo, sendo atraídas pela diferença de temperatura das regiões do corpo.',
      'o campo magnético alternado fornece calor para as nanopartículas que o transfere às células do corpo.',
      'as nanopartículas são aceleradas em um único sentido, fazendo-as colidir com as células e transferir calor.',
    ],
    'O campo alternado agita (faz girar) as nanopartículas, e o atrito entre elas aquece a célula tumoral. O campo magnético não fornece calor diretamente, e as partículas não são aceleradas em um só sentido.',
  ),
  o(
    'medio',
    '6. Campo magnético entre ímãs. Ao observar as linhas de campo formadas em torno dos ímãs próximos das figuras nas duas situações abaixo (A e B), podemos concluir que: [Figura A: dois ímãs de barra alinhados, com as linhas de campo se afastando umas das outras na região entre eles, sem ligar um ímã ao outro. Figura B: dois ímãs de barra alinhados, com as linhas de campo saindo de um ímã e entrando no outro, ligando os dois.]',
    'Na situação A ocorrerá repulsão dos ímãs, e na situação B ocorrerá atração.',
    [
      'Na situação A ocorrerá atração dos ímãs, e na situação B ocorrerá repulsão.',
      'Em ambas as situações ocorrerão atração dos ímãs.',
      'Em ambas as situações ocorrerão repulsão dos ímãs.',
      'Só é possível uma conclusão sobre a atração ou repulsão dos ímãs com uma bússola.',
    ],
    'Na atração, as linhas saem do N de um ímã e entram no S do outro, ligando os dois (situação B). Na repulsão, as linhas se afastam e não se ligam (situação A).',
  ),
  o(
    'medio',
    '7. Eletromagnetismo e Lei de Faraday nas tecnologias. Os motores elétricos presentes em ventiladores, brinquedos e diversos eletrodomésticos funcionam baseados no princípio do eletromagnetismo: a interação entre campos magnéticos e correntes elétricas. Quando uma corrente elétrica atravessa um fio dentro de um campo magnético, surge uma força que pode produzir movimento. O primeiro motor elétrico foi construído em 1821 pelo cientista Michael Faraday. Ele demonstrou que um fio conduzindo corrente pode girar continuamente ao redor de um ímã, explorando o fato de que a corrente elétrica cria um campo magnético capaz de interagir com o campo de um ímã. Essa experiência marcou o início da ideia de converter energia elétrica em movimento de forma contínua. Com base nessas informações, qual alternativa descreve corretamente o princípio de funcionamento de um motor elétrico?',
    'O motor elétrico funciona pela interação entre o campo magnético produzido por uma corrente elétrica e o campo magnético de um ímã, gerando uma força que causa movimento.',
    [
      'O motor elétrico funciona ao transformar energia mecânica em energia térmica, utilizando atrito entre ímãs e bobinas.',
      'O motor elétrico funciona porque a corrente elétrica aquece os fios, e o calor faz as peças se moverem.',
      'O motor elétrico funciona devido à atração eletrostática entre cargas positivas e negativas, fazendo o eixo girar.',
      'O motor elétrico funciona porque a energia química da bateria se transforma diretamente em movimento sem intermediários.',
    ],
    'No motor, a corrente cria um campo magnético que interage com o do ímã e produz uma força, que gera o movimento. É energia elétrica virando movimento, sem passar por calor nem por atração eletrostática.',
  ),
  o(
    'medio',
    '8. Magnetismo e bússolas na natureza. A bússola é um dos instrumentos de navegação mais importantes inventados pela humanidade: ela remonta de 1180 a.C. pelos chineses, e é um ímã que sofre influência do campo magnético terrestre para se orientar. [Figura: a Terra como um grande ímã, com as linhas de campo magnético saindo e entrando nas regiões polares.] Sobre o assunto, podemos concluir que:',
    'O polo norte da agulha (ponta) é atraído pelo polo sul magnético, que coincide com o polo norte geográfico.',
    [
      'O polo norte da agulha (ponta) é atraído pelo polo norte magnético, que coincide com o polo sul magnético.',
      'O polo norte da agulha (ponta) é atraído pelo polo norte geográfico, que coincide com o polo norte magnético.',
      'O polo norte da agulha (ponta) é atraído pelo polo sul magnético, que coincide com o polo sul geográfico.',
      'O polo sul da agulha (ponta) é atraído pelo polo sul magnético, que coincide com o polo norte geográfico.',
    ],
    'A ponta norte da agulha é atraída pelo polo sul magnético da Terra, que fica perto do polo norte geográfico. Polos opostos se atraem.',
  ),
  o(
    'dificil',
    '9. Magnetismo e eletromagnetismo na natureza. O fenômeno das auroras polares é um espetáculo da natureza: fenômenos luminosos intensos que ocorrem próximos aos polos do planeta. Um viajante no hemisfério Norte viajava próximo ao polo quando observou tal fenômeno. Assinale a alternativa INCORRETA:',
    'Se este viajante olhar para o céu, poderá se guiar pelo Cruzeiro do Sul.',
    [
      'O fenômeno ocorre próximo aos polos pois é onde o campo magnético terrestre é mais intenso, e o choque das partículas atraídas com os gases atmosféricos liberam as luzes coloridas do fenômeno.',
      'Ao se aproximar do polo Norte geográfico, o viajante está se aproximando do polo sul magnético.',
      'A aurora boreal será observada pelo viajante, visto que só ocorre no hemisfério Norte.',
      'A aurora austral não será observada pelo viajante, já que só ocorre no hemisfério Sul.',
    ],
    'A incorreta é a que fala do Cruzeiro do Sul: ele só é visível no hemisfério Sul, então não serve de guia para quem está no hemisfério Norte. As demais estão corretas.',
  ),
];

/* ============================================================ SIMULADO 2 · PERTO DA PROVA (dissertativas, estilo VA) */

const S2: QuestaoG2[] = [
  dq(
    'dificil',
    '1. (Estilo da VA de Magnetismo) Dois ímãs de barra estão alinhados, com os polos próximos de nomes opostos, e a limalha de ferro se espalhou formando linhas de campo entre eles e ao redor. Há uma bússola em perfeito funcionamento à esquerda do ímã da esquerda, com a ponta da agulha (norte) apontada para a direita, em direção ao ímã. a) Indique os polos N e S das extremidades de cada ímã, usando a bússola. b) Indique o sentido do campo magnético entre os ímãs e fora deles. c) Diga para onde apontaria a ponta da agulha de uma bússola colocada acima do ímã da esquerda, entre os dois ímãs e à direita do ímã da direita.',
    'a) A ponta norte da agulha é atraída por um polo sul, então a extremidade esquerda do ímã da esquerda é S e a direita é N. Como os polos próximos são opostos, a extremidade esquerda do ímã da direita é S e a direita é N. b) As linhas saem do polo N e entram no S: entre os ímãs vão do N do ímã da esquerda para o S do ímã da direita (para a direita); por fora, saem do N e curvam de volta para o S, passando acima e abaixo dos ímãs (para a esquerda). c) Acima do ímã da esquerda, a agulha aponta para a esquerda; entre os ímãs, para a direita; à direita do ímã da direita, para a direita (para longe do ímã).',
    [
      'Usa o polo da bússola para deduzir os polos (norte da agulha atraído por um polo sul)',
      'Conclui que os polos próximos dos ímãs são opostos',
      'Indica que as linhas saem do N e entram no S',
      'Desenha as agulhas tangentes às linhas, com a ponta no sentido do campo',
    ],
  ),
  dq(
    'medio',
    '2. Explique por que a lâmpada de um dínamo de bicicleta só acende quando a roda gira, mesmo havendo um ímã dentro do dínamo. Indique o princípio físico envolvido e diga o que aconteceria com um ímã parado perto da bobina.',
    'O princípio é a indução eletromagnética (Lei de Faraday): é preciso haver variação do campo magnético em uma bobina de um circuito fechado para induzir corrente elétrica. Com a roda girando, o ímã se move em relação à bobina e o campo varia, gerando corrente que acende a lâmpada. Só ter o ímã presente não basta: parado, não há variação do campo e, portanto, não há corrente.',
    [
      'Cita a indução eletromagnética (Faraday)',
      'Explica que a corrente aparece quando há variação do campo magnético (movimento relativo ímã-bobina)',
      'Conclui que ímã parado não gera corrente',
    ],
  ),
  dq(
    'medio',
    '3. Compare o eletroímã (experimento do prego) e o motor elétrico (experimento da bobina): em cada um, o que aparece primeiro, corrente ou campo magnético? Cite a conversão de energia do motor e duas tecnologias que usam o eletroímã ou o motor.',
    'No eletroímã e no motor, a corrente elétrica gera o campo magnético. No eletroímã, um fio enrolado em um prego ligado a uma pilha vira um ímã, e o efeito acaba quando a corrente é desligada. No motor, a corrente numa bobina entre ímãs gera um campo que interage com o campo do ímã, produzindo força e giro: energia elétrica vira movimento. Exemplos: campainha, alto-falante, guindaste eletromagnético, ventilador, carro elétrico, eletrodomésticos.',
    [
      'Diz que nos dois casos a corrente cria o campo magnético',
      'Descreve o eletroímã (fio no prego, pilha, campo some sem corrente)',
      'Explica o motor (interação entre campos, força, giro) e a conversão elétrica em movimento',
      'Cita duas tecnologias',
    ],
  ),
  dq(
    'medio',
    '4. Explique como uma usina hidrelétrica transforma o movimento da água em corrente elétrica, usando o princípio da indução eletromagnética. Em seguida, cite duas outras tecnologias que usam campo magnético variável para gerar corrente ou calor.',
    'A água em queda move a turbina, que gira ímãs perto de bobinas (ou bobinas dentro de um campo), e a variação do campo magnético nas bobinas induz corrente elétrica (indução eletromagnética). Outras tecnologias: fogão de indução (campo variável induz corrente na panela, que esquenta), carregador de celular sem fio, transformadores, geradores eólicos e termelétricos.',
    [
      'Liga a água à turbina e ao movimento relativo ímã-bobina',
      'Explica que a variação do campo induz a corrente',
      'Cita duas tecnologias (fogão de indução, carregador sem fio, gerador eólico, entre outras)',
    ],
  ),
  dq(
    'medio',
    '5. Explique como funciona uma bússola e por que a ponta norte da agulha aponta para o norte geográfico. Em seguida, explique o que são a aurora boreal e a aurora austral e por que acontecem apenas perto dos polos.',
    'A bússola é um pequeno ímã que se alinha tangente às linhas do campo magnético terrestre. A Terra é um grande ímã cujo polo sul magnético fica perto do polo norte geográfico, e polos opostos se atraem: a ponta norte da agulha é atraída por ele e aponta para o norte geográfico. As auroras são fenômenos luminosos em que partículas vindas do espaço são guiadas pelas linhas de campo até os polos, onde o campo é mais intenso, e colidem com os gases da atmosfera, emitindo luz. A boreal ocorre perto do polo Norte e a austral, perto do polo Sul.',
    [
      'Explica que a agulha se alinha às linhas de campo, tangente a elas',
      'Diz que o polo norte geográfico coincide com o polo sul magnético',
      'Explica a aurora: partículas do espaço guiadas aos polos, colisão com a atmosfera, emissão de luz',
      'Distingue boreal (Norte) e austral (Sul)',
    ],
  ),
  dq(
    'medio',
    '6. (Estilo da VA de Astronomia) A etnoastronomia estuda como diferentes povos observam e interpretam os astros. O texto cita a estrela vermelha Betelgeuse, uma supergigante vermelha visível a olho nu. Vênus, conhecido como "Estrela D\'alva", também é visível a olho nu, ao amanhecer e ao entardecer. a) Cite duas características que permitem diferenciar uma estrela de um planeta. b) Cite duas importâncias da astronomia para a civilização.',
    'a) A estrela tem luz própria (produzida pela fusão nuclear), enquanto o planeta só reflete a luz do Sol; a estrela é muito mais distante e cintila, e o planeta brilha com luz mais fixa e se move em relação às estrelas ao longo das noites. b) A astronomia permitiu criar calendários e marcar as estações (agricultura), orientar a navegação, desenvolver a ciência e a tecnologia, e está presente na cultura e nos mitos dos povos (etnoastronomia).',
    [
      'Cita duas diferenças entre estrela e planeta (luz própria x refletida, cintilação, movimento)',
      'Cita duas importâncias da astronomia (calendário, navegação, ciência, cultura)',
    ],
  ),
  dq(
    'medio',
    '7. (Estilo da VA de Astronomia) a) Complete, para o modelo cosmológico com a Terra no centro: astro central, formulador da teoria (nome do físico) e geometria da órbita dos planetas. Depois, faça o mesmo para o modelo heliocêntrico. b) Nomeie os astros: (1) planeta rochoso com a metade do diâmetro da Terra, duas luas (Fobos e Deimos), óxido de ferro na superfície e o Monte Olimpo (25 km); (2) astro batizado em homenagem a Edmund Halley, de 76 anos de órbita, visto em 1986 e de volta em 2061, com núcleo de gelo e cauda luminosa.',
    'a) Geocêntrico: astro central Terra; formulador Cláudio Ptolomeu (também Aristóteles); órbitas circulares (com epiciclos). Heliocêntrico: astro central Sol; formulador Nicolau Copérnico (Galileu e Kepler o reforçaram); órbitas circulares em Copérnico e elípticas em Kepler. b) (1) Marte. (2) O cometa Halley.',
    [
      'Geocêntrico: Terra, Ptolomeu, órbitas circulares',
      'Heliocêntrico: Sol, Copérnico, órbitas circulares (elípticas em Kepler)',
      'Nomeia Marte',
      'Nomeia o cometa Halley',
    ],
  ),
  dq(
    'dificil',
    '8. a) Cite duas evidências de que a Terra é esférica. b) Diferencie meteoroide, meteoro e meteorito e explique por que a expressão "estrela cadente" tem um erro científico. c) Explique, em poucas palavras, a teoria do Big Bang.',
    'a) A sombra da Terra na Lua durante um eclipse lunar é sempre circular; os navios somem no horizonte pelo casco; as constelações visíveis mudam com a latitude; as fotos de satélite e a circunavegação. b) Meteoroide é o fragmento rochoso no espaço; meteoro é o rastro luminoso quando ele entra na atmosfera; meteorito é o que chega ao solo. "Estrela cadente" está errado porque é um meteoro, e não uma estrela. c) O Universo surgiu há cerca de 13,8 bilhões de anos, de um estado muito quente e denso, e está em expansão.',
    [
      'Cita duas evidências da esfericidade',
      'Diferencia meteoroide, meteoro e meteorito',
      'Explica o erro de "estrela cadente" (é um meteoro)',
      'Explica o Big Bang (início quente e denso, expansão, cerca de 13,8 bilhões de anos)',
    ],
  ),
];

/* ============================================================ SIMULADO 3 · OBJETIVO DE REVISÃO (21 questões) */

const S3: QuestaoG2[] = [
  o(
    'facil',
    'O que acontece quando um ímã de barra é quebrado ao meio?',
    'Cada pedaço continua sendo um ímã com polos N e S',
    [
      'Cada pedaço fica com um só polo, norte ou sul',
      'Um pedaço fica com polo norte e o outro com polo sul',
      'Os pedaços perdem o magnetismo ao serem separados',
      'Só o pedaço do meio mantém os dois polos do ímã',
    ],
    'Os polos de um ímã são inseparáveis: cada pedaço vira um novo ímã completo, com N e S.',
  ),
  o(
    'facil',
    'Como são as linhas de campo magnético por fora de um ímã?',
    'Saem do polo norte e entram no polo sul',
    [
      'Saem do polo sul e entram no polo norte',
      'Saem dos dois polos e nunca se encontram',
      'Entram nos dois polos e saem pelo centro',
      'Formam retas paralelas que não voltam ao ímã',
    ],
    'Por convenção, o campo sai do polo norte e entra no polo sul, formando linhas que se fecham.',
  ),
  o(
    'medio',
    'Por que a ponta norte da agulha de uma bússola aponta para o norte geográfico?',
    'Porque ali fica o polo sul magnético da Terra, que a atrai',
    [
      'Porque ali fica o polo norte magnético, que a atrai',
      'Porque o norte geográfico é sempre mais frio e denso',
      'Porque a agulha é atraída pelo Sol ao amanhecer, no leste',
      'Porque o campo magnético da Terra não tem polos definidos',
    ],
    'O polo norte geográfico coincide com o polo sul magnético, e polos opostos se atraem.',
  ),
  o(
    'medio',
    'O que são as auroras polares?',
    'Partículas do espaço guiadas aos polos colidem com a atmosfera',
    [
      'Reflexos da luz do Sol nas calotas de gelo dos polos terrestres',
      'Relâmpagos gerados por nuvens de chuva sobre os polos do planeta',
      'Brilho da Lua refletido por cristais de gelo da atmosfera polar',
      'Explosões de gás em vulcões ativos das regiões próximas aos polos',
    ],
    'Partículas do vento solar seguem as linhas do campo magnético até os polos e, ao colidir com os gases da atmosfera, emitem luz.',
  ),
  o(
    'medio',
    'Qual é a conversão de energia em um motor elétrico?',
    'Energia elétrica em movimento, por forças magnéticas',
    [
      'Energia térmica em energia elétrica, por atrito',
      'Energia química em energia sonora, por vibração',
      'Movimento em energia elétrica, por indução magnética',
      'Energia luminosa em movimento, por reflexão do ímã',
    ],
    'A corrente cria um campo que interage com o do ímã e gera força: energia elétrica vira movimento. O contrário (movimento em energia elétrica) é o gerador.',
  ),
  o(
    'medio',
    'Um ímã está parado perto de um fio ligado a uma lâmpada. O que acontece?',
    'A lâmpada não acende, pois não há variação de campo',
    [
      'A lâmpada acende, pois o campo magnético é intenso',
      'A lâmpada acende fraca, pois o ímã cria corrente',
      'A lâmpada pisca, pois o fio se aquece com o ímã',
      'A lâmpada acende, pois o ímã é de ferro e conduz',
    ],
    'Sem aproximação ou afastamento do ímã, o campo não varia no fio e não há corrente induzida.',
  ),
  o(
    'facil',
    'Qual afirmação sobre estrelas e planetas está correta?',
    'A estrela tem luz própria, e o planeta reflete a luz do Sol',
    [
      'O planeta tem luz própria, e a estrela reflete a luz do Sol',
      'A estrela é sempre menor que o planeta mais próximo da Terra',
      'O planeta cintila muito, e a estrela brilha com luz fixa',
      'A estrela gira em torno do planeta, e não ao contrário',
    ],
    'Corpos luminosos têm luz própria (estrelas); corpos iluminados só refletem luz (planetas, luas). A estrela cintila e o planeta brilha fixo.',
  ),
  o(
    'medio',
    'Por que Vênus é chamado de "Estrela D\'alva", mesmo sendo um planeta?',
    'Por brilhar muito perto do Sol, no amanhecer e no entardecer',
    [
      'Por ter luz própria, produzida pela fusão do hidrogênio',
      'Por ser a estrela mais próxima da Terra depois do Sol',
      'Por ser visível somente nas noites sem Lua, no verão',
      'Por ser o maior corpo brilhante de todo o Sistema Solar',
    ],
    'Vênus é um planeta e só reflete a luz do Sol. Aparece bem brilhante perto do Sol, antes do amanhecer ou depois do pôr do sol.',
  ),
  o(
    'medio',
    'Qual alternativa descreve corretamente o modelo geocêntrico?',
    'Terra no centro, com órbitas circulares dos astros, por Ptolomeu',
    [
      'Sol no centro, com órbitas circulares dos planetas, por Copérnico',
      'Terra no centro, com órbitas elípticas dos astros, por Kepler',
      'Sol no centro, com órbitas elípticas dos planetas, por Newton',
      'Lua no centro, com órbitas circulares dos astros, por Galileu',
    ],
    'Ptolomeu formalizou o modelo com a Terra imóvel no centro. O heliocêntrico, de Copérnico, põe o Sol no centro, e Kepler mostrou que as órbitas são elípticas.',
  ),
  o(
    'medio',
    'Qual cientista usou o telescópio para observar as luas de Júpiter?',
    'Galileu Galilei',
    ['Cláudio Ptolomeu', 'Nicolau Copérnico', 'Isaac Newton', 'Johannes Kepler'],
    'Galileu observou as luas de Júpiter e as fases de Vênus, evidências a favor do heliocentrismo.',
  ),
  o(
    'medio',
    'Qual é a forma das órbitas dos planetas, segundo Kepler?',
    'Elípticas, com o Sol em um dos focos',
    [
      'Circulares, com a Terra no centro',
      'Circulares, com o Sol no centro exato',
      'Retas, com o Sol deslocando-se por elas',
      'Espirais, com o Sol no centro do giro',
    ],
    'Kepler mostrou que as órbitas são elipses, e o Sol ocupa um dos focos, e não o centro.',
  ),
  o(
    'medio',
    'Qual é uma evidência da esfericidade da Terra?',
    'A sombra circular da Terra na Lua durante os eclipses lunares',
    [
      'A cor azul dos oceanos vista do topo de uma alta montanha',
      'O horizonte plano visto de uma praia em dias de céu limpo',
      'A mesma posição das constelações em todos os países do mundo',
      'O tamanho constante da Lua durante todo o ano terrestre',
    ],
    'Em todo eclipse lunar a sombra da Terra é circular, o que só acontece com um corpo esférico. Os navios também somem no horizonte pelo casco, e as constelações mudam com a latitude.',
  ),
  o(
    'medio',
    'Qual afirmação sobre constelações está correta?',
    'O Cruzeiro do Sul é visível no hemisfério Sul',
    [
      'O Cruzeiro do Sul é visível no hemisfério Norte',
      'A Ursa Maior é visível só no hemisfério Sul',
      'Órion é visível apenas no hemisfério Norte',
      'O Cruzeiro do Sul é visível nos dois hemisférios',
    ],
    'Algumas constelações, como o Cruzeiro do Sul, só podem ser vistas de um hemisfério, e isso muda conforme a latitude.',
  ),
  o(
    'facil',
    'Quais são os planetas rochosos do Sistema Solar?',
    'Mercúrio, Vênus, Terra e Marte',
    [
      'Júpiter, Saturno, Urano e Netuno',
      'Mercúrio, Vênus, Júpiter e Marte',
      'Terra, Marte, Saturno e Netuno',
      'Vênus, Terra, Urano e Plutão',
    ],
    'Os quatro planetas mais próximos do Sol são rochosos. Júpiter e Saturno são gasosos; Urano e Netuno são gelados.',
  ),
  o(
    'facil',
    'Qual planeta tem o Monte Olimpo, o maior vulcão do Sistema Solar?',
    'Marte',
    ['Vênus', 'Júpiter', 'Mercúrio', 'Saturno'],
    'Marte, o "planeta vermelho", tem o Monte Olimpo (cerca de 25 km de altura) e duas luas, Fobos e Deimos.',
  ),
  o(
    'medio',
    'O que define um planeta anão?',
    'Orbita o Sol, é esférico, mas não limpou sua órbita',
    [
      'Orbita um planeta, é esférico e já limpou sua órbita',
      'Tem luz própria, é esférico e não orbita nenhum astro',
      'Orbita o Sol, tem forma irregular e uma longa cauda',
      'Orbita o Sol, é esférico e tem mais luas que a Terra',
    ],
    'Planeta anão (como Plutão) orbita o Sol e é esférico, mas não limpou a vizinhança da sua órbita, ao contrário dos planetas.',
  ),
  o(
    'medio',
    'Como é um cometa, como o Halley?',
    'Núcleo de gelo e rochas, que forma cauda perto do Sol',
    [
      'Corpo rochoso do cinturão entre Marte e Júpiter',
      'Fragmento que se queima ao entrar na atmosfera',
      'Astro de luz própria, que gira em torno de um planeta',
      'Satélite natural coberto por gelo e gases densos',
    ],
    'O cometa tem núcleo de gelo, rochas e compostos orgânicos; ao se aquecer perto do Sol, libera gases e forma a cauda luminosa. O Halley passa a cada 76 anos.',
  ),
  o(
    'dificil',
    'Qual alternativa define corretamente meteorito?',
    'É o fragmento que chega à superfície da Terra',
    [
      'É o fragmento que gira em torno de um planeta',
      'É o rastro luminoso visto no céu da noite',
      'É o fragmento que ainda viaja pelo espaço',
      'É o astro com luz própria visto no céu noturno',
    ],
    'Meteoroide é o fragmento no espaço; meteoro é o rastro de luz quando ele entra na atmosfera; meteorito é o que chega ao solo.',
  ),
  o(
    'medio',
    'O que a teoria do Big Bang propõe sobre a origem do Universo?',
    'Um início quente e denso, há cerca de 13,8 bilhões de anos',
    [
      'Uma explosão do Sol, há cerca de 4,6 bilhões de anos',
      'Uma colisão entre galáxias, há cerca de 10 mil anos',
      'Um congelamento do espaço, há cerca de 2 bilhões de anos',
      'Um colapso da Via Láctea, há cerca de 100 mil anos atrás',
    ],
    'O Universo teria surgido de um estado extremamente quente e denso e está em expansão desde então, há cerca de 13,8 bilhões de anos.',
  ),
  o(
    'medio',
    'Como o Sistema Solar se formou?',
    'Pelo colapso de uma nuvem de gás e poeira, há 4,6 bilhões de anos',
    [
      'Pelo choque de duas estrelas gigantes, há 13,8 bilhões de anos',
      'Pela explosão do núcleo da Via Láctea, há 100 milhões de anos',
      'Pela captura de planetas errantes pelo Sol, há 10 mil anos',
      'Pela fusão de vários cometas gigantes, há 2 bilhões de anos',
    ],
    'Uma nuvem de gás e poeira colapsou, formando o Sol e um disco ao redor, de onde nasceram os planetas, há cerca de 4,6 bilhões de anos.',
  ),
  o(
    'facil',
    'O que estuda a etnoastronomia?',
    'Como povos e culturas interpretam o céu',
    [
      'A composição química das estrelas distantes',
      'A origem do Universo por meio do Big Bang',
      'A estrutura interna dos planetas rochosos',
      'Apenas os mitos gregos sobre as constelações',
    ],
    'A etnoastronomia estuda como diferentes povos, como os Tupi-Guarani, observam, interpretam e usam os astros em sua cultura.',
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

export const PACOTES_FISICA_PB4: PacoteG2[] = [
  pacote(
    'pb4-fis-s1-lista',
    'Simulado 1 · Idêntico à lista da professora (PB4 Física)',
    'As 9 questões da lista de Magnetismo e Eletromagnetismo, com o gabarito',
    'A mesma lista de exercícios da professora, com os mesmos enunciados e alternativas (as figuras viraram descrição em texto). Gabarito original: 1 A, 2 B, 3 D, 4 E, 5 B, 6 B, 7 C, 8 C, 9 E. Aqui as alternativas são embaralhadas.',
    30,
    S1,
  ),
  pacote(
    'pb4-fis-s2-prova',
    'Simulado 2 · Perto da prova (PB4 Física)',
    '8 questões dissertativas no estilo das VAs de Magnetismo e Astronomia',
    'Prova só de teoria, sem cálculos. Responda explicando o princípio físico. A IA corrige com o gabarito e os critérios.',
    60,
    S2,
  ),
  pacote(
    'pb4-fis-s3-objetivo',
    'Simulado 3 · Objetivo de revisão (PB4 Física)',
    '21 questões objetivas: magnetismo, eletromagnetismo e astronomia',
    'Revisão geral dos módulos 11, 12, 15 e 16. Cada erro vem com a explicação.',
    45,
    S3,
  ),
];
