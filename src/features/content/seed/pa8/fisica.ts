import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA8 · Física (9º ano, Setor B de Ciências): Magnetismo, Eletromagnetismo, Ondas eletromagnéticas,
 * Sistemas de comunicação, Astronomia, Sistema Solar, Evolução estelar e o ser humano em outro planeta.
 */

/* ------------------------------------------------------------ SIMULADO BASE (10) */

export const FISICA_BASE: QuestaoG2[] = [
  o(
    'facil',
    'Ao partir um ímã em forma de barra ao meio, o que se obtém?',
    'Dois ímãs menores, cada um com polo norte e polo sul.',
    [
      'Um pedaço só com polo norte e outro só com polo sul.',
      'Dois pedaços sem propriedades magnéticas.',
      'Um ímã e um pedaço de ferro comum.',
      'Dois ímãs, ambos só com polo sul.',
    ],
    'Os polos de um ímã são inseparáveis (não existem monopolos magnéticos conhecidos). Cada pedaço vira um novo ímã completo.',
  ),
  o(
    'facil',
    'Aproximando-se o polo norte de um ímã do polo norte de outro ímã, ocorre',
    'repulsão, pois polos de mesmo nome se repelem.',
    [
      'atração, pois polos iguais se atraem.',
      'atração, pois polos opostos se atraem.',
      'nenhuma interação magnética.',
      'repulsão, pois polos diferentes se repelem.',
    ],
    'Polos iguais se repelem e polos diferentes se atraem.',
  ),
  o(
    'medio',
    'A agulha de uma bússola aponta para o norte geográfico da Terra porque, nessa região, está',
    'o polo sul magnético do planeta, que atrai o polo norte da agulha.',
    [
      'o polo norte magnético, que atrai o polo norte da agulha.',
      'o centro do planeta, que atrai qualquer metal.',
      'o Sol, que orienta todas as agulhas.',
      'uma grande quantidade de gelo, que atrai o ferro.',
    ],
    'A Terra se comporta como um grande ímã. O polo sul magnético fica perto do polo norte geográfico, e por isso atrai o polo norte da agulha.',
  ),
  o(
    'medio',
    'Em 1820, Oersted observou que uma agulha de bússola se desviava ao ser colocada perto de um fio percorrido por corrente elétrica. Esse experimento mostrou que',
    'uma corrente elétrica gera campo magnético à sua volta.',
    [
      'um ímã gera corrente elétrica em qualquer fio.',
      'a agulha da bússola gera corrente no fio.',
      'o fio se transforma em um ímã permanente.',
      'a corrente elétrica anula o campo magnético da Terra.',
    ],
    'Oersted relacionou eletricidade e magnetismo: corrente elétrica produz campo magnético, base do eletromagnetismo e dos eletroímãs.',
  ),
  o(
    'medio',
    'Movimentando-se um ímã para dentro e para fora de uma bobina ligada a um galvanômetro, o ponteiro do aparelho se move. Isso ocorre porque',
    'a variação do campo magnético na bobina induz uma corrente elétrica.',
    [
      'o ímã descarrega energia química no fio.',
      'o fio da bobina é feito de material radioativo.',
      'o ímã parado produz corrente contínua no fio.',
      'o galvanômetro cria o campo magnético sozinho.',
    ],
    'Pela indução eletromagnética (Faraday), a variação do fluxo magnético numa bobina induz corrente. Ímã parado não induz corrente.',
  ),
  o(
    'medio',
    'Os transformadores das redes elétricas só funcionam com corrente alternada porque',
    'dependem da variação do campo magnético para induzir tensão na segunda bobina.',
    [
      'a corrente contínua é mais perigosa para os ímãs.',
      'a corrente alternada não gera campo magnético.',
      'a corrente contínua não passa pelos fios.',
      'a corrente alternada tem sempre menor tensão.',
    ],
    'Na corrente alternada o campo magnético varia o tempo todo, induzindo tensão no secundário. Na contínua, o campo é constante e nada é induzido.',
  ),
  o(
    'facil',
    'No espectro eletromagnético, qual das radiações abaixo tem a maior frequência (e a maior energia)?',
    'Raios gama',
    ['Ondas de rádio', 'Micro-ondas', 'Luz visível', 'Infravermelho'],
    'Em ordem crescente de frequência: rádio, micro-ondas, infravermelho, luz visível, ultravioleta, raios X e raios gama.',
  ),
  o(
    'medio',
    'No vácuo, todas as ondas eletromagnéticas (luz, rádio, raios X…) se propagam',
    'com a mesma velocidade, de aproximadamente 300 000 km/s.',
    [
      'com velocidades diferentes, sendo a luz a mais lenta.',
      'com velocidade igual à do som.',
      'apenas se houver ar para transportá-las.',
      'com velocidade maior quanto menor a frequência.',
    ],
    'Ondas eletromagnéticas não precisam de meio material e, no vácuo, todas viajam a cerca de 3 × 10⁸ m/s.',
  ),
  o(
    'medio',
    'As fibras ópticas, usadas na internet de alta velocidade, transmitem informações por meio de',
    'pulsos de luz que viajam por reflexões dentro do cabo.',
    [
      'correntes elétricas muito intensas pelo cobre.',
      'ondas sonoras dentro de tubos de vidro.',
      'ímãs que giram dentro do cabo.',
      'pulsos de gás sob pressão.',
    ],
    'Na fibra óptica o sinal vai como luz, que sofre reflexão total e percorre longas distâncias com poucas perdas.',
  ),
  o(
    'facil',
    'O modelo que coloca o Sol no centro do sistema, com os planetas girando em torno dele, foi proposto por',
    'Nicolau Copérnico.',
    ['Cláudio Ptolomeu.', 'Aristóteles.', 'Isaac Newton.', 'Albert Einstein.'],
    'Copérnico propôs o heliocentrismo no século XVI, em oposição ao geocentrismo de Ptolomeu.',
  ),
];

/* ------------------------------------------------------------ SIMULADO NÍVEL PROVA (10) */

export const FISICA_PROVA: QuestaoG2[] = [
  o(
    'medio',
    `Leia o texto.

O campo magnético da Terra funciona como um escudo: ele desvia grande parte das partículas carregadas lançadas pelo Sol, o chamado vento solar. Algumas delas são guiadas até as regiões polares, onde interagem com gases da atmosfera e produzem as auroras.

Segundo o texto, o campo magnético terrestre`,
    'protege o planeta, desviando partículas solares, e explica por que as auroras aparecem perto dos polos.',
    [
      'é gerado pelo vento solar e desaparece à noite.',
      'atrai todas as partículas solares para o equador.',
      'impede qualquer radiação de chegar à Terra, inclusive a luz.',
      'produz as auroras no equador, onde o campo é mais fraco.',
    ],
    'O campo guia as partículas até as regiões polares, onde colidem com a atmosfera e geram as auroras. Ele não bloqueia a luz.',
  ),
  o(
    'medio',
    `Um estudante enrolou um fio de cobre em um prego de ferro e ligou as pontas do fio a uma pilha. O prego passou a atrair clipes metálicos.

Para aumentar a força de atração do eletroímã, ele pode`,
    'aumentar o número de voltas do fio no prego ou a corrente que passa por ele.',
    [
      'diminuir o número de voltas do fio e a corrente.',
      'trocar o prego de ferro por um de plástico.',
      'desligar a pilha e esperar o prego esfriar.',
      'inverter a pilha, que dobra o número de polos.',
    ],
    'O campo do eletroímã cresce com o número de espiras e com a intensidade da corrente. O núcleo de ferro o reforça; o plástico, não.',
  ),
  o(
    'medio',
    'Nas usinas hidrelétricas, a energia do movimento da água é transformada em energia elétrica. Isso acontece porque a água faz girar uma turbina ligada a um gerador, no qual',
    'ímãs e bobinas se movem uns em relação aos outros, induzindo corrente elétrica.',
    [
      'a água se transforma diretamente em eletricidade.',
      'a turbina produz corrente por atrito com o ar.',
      'os ímãs permanecem parados e as bobinas também.',
      'a água reage quimicamente com o cobre das bobinas.',
    ],
    'O gerador usa a indução eletromagnética: o movimento relativo entre ímã e bobina varia o fluxo magnético e induz corrente.',
  ),
  o(
    'dificil',
    'Um transformador tem 200 espiras no enrolamento primário, ligado a uma tomada de 220 V, e 20 espiras no secundário. Qual é a tensão no secundário?',
    '22 V',
    ['2 200 V', '220 V', '11 V', '44 V'],
    'Vp/Vs = Np/Ns, logo 220/Vs = 200/20 = 10, e Vs = 22 V. Menos espiras no secundário, tensão menor.',
  ),
  o(
    'dificil',
    'Uma emissora de rádio FM transmite em 100 MHz (1 × 10⁸ Hz). Sabendo que a velocidade das ondas de rádio é 3 × 10⁸ m/s, o comprimento de onda dessa transmissão é',
    '3 m',
    ['0,3 m', '30 m', '300 m', '3 × 10¹⁶ m'],
    'v = λ · f, então λ = v / f = 3 × 10⁸ / 1 × 10⁸ = 3 m.',
  ),
  o(
    'medio',
    'Os raios X são usados em exames de imagem porque',
    'atravessam com facilidade os tecidos moles, mas são mais absorvidos pelos ossos.',
    [
      'são absorvidos totalmente pela pele.',
      'não atravessam nenhum material.',
      'são ondas sonoras de alta frequência.',
      'são absorvidos mais pelos tecidos moles que pelos ossos.',
    ],
    'A diferença de absorção entre ossos e tecidos moles cria o contraste da chapa. São radiações ionizantes, por isso o uso é controlado.',
  ),
  o(
    'medio',
    'Uma vantagem do sinal digital sobre o analógico em sistemas de comunicação é que ele',
    'é representado por sequências de zeros e uns, o que o torna menos sujeito à degradação por ruído.',
    [
      'ocupa sempre menos energia que o analógico.',
      'não precisa de nenhum aparelho para ser recebido.',
      'não pode ser copiado nem armazenado.',
      'é transmitido apenas por fios de cobre.',
    ],
    'Como o sinal digital só precisa distinguir 0 de 1, o ruído tem menos efeito, e o sinal pode ser regenerado sem perdas de qualidade.',
  ),
  o(
    'dificil',
    `Leia o texto.

Em 1610, com sua luneta, Galileu observou que Vênus passava por fases, como a Lua, e que o seu tamanho aparente mudava bastante ao longo do tempo. No modelo geocêntrico de Ptolomeu, Vênus nunca poderia aparecer "cheio".

Essas observações foram importantes porque`,
    'apoiavam o modelo heliocêntrico, em que Vênus gira em torno do Sol.',
    [
      'provavam que a Terra era plana.',
      'mostravam que Vênus era uma estrela.',
      'confirmavam todas as ideias de Ptolomeu.',
      'demonstravam que o Sol girava em torno de Vênus.',
    ],
    'As fases completas de Vênus só são possíveis se ele orbitar o Sol. O dado empírico enfraqueceu o geocentrismo.',
  ),
  o(
    'dificil',
    'Se a Lua gira em torno da Terra, mas ocorre um eclipse solar só de vez em quando (e não todo mês), é porque',
    'a órbita da Lua é inclinada em relação à órbita da Terra, e só às vezes Sol, Lua e Terra ficam alinhados.',
    [
      'a Lua só fica entre a Terra e o Sol uma vez por ano.',
      'a Lua esfria e desaparece em alguns meses.',
      'a sombra da Terra sempre cobre o Sol.',
      'a Lua não gira em torno da Terra.',
    ],
    'A órbita lunar tem cerca de 5° de inclinação, então, na maioria das luas novas, a sombra da Lua passa acima ou abaixo da Terra.',
  ),
  o(
    'medio',
    'O Sol é uma estrela de massa média. Do ponto de vista da evolução estelar, o futuro mais provável dele é',
    'tornar-se uma gigante vermelha e, depois, uma anã branca.',
    [
      'explodir como supernova e virar buraco negro.',
      'virar uma estrela de nêutrons, de imediato.',
      'continuar igual para sempre.',
      'transformar-se em um planeta gasoso.',
    ],
    'Só estrelas de massa muito maior terminam como supernova. O Sol passará por gigante vermelha, expulsará suas camadas externas e deixará uma anã branca.',
  ),
];
