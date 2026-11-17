import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA8 · Simulado FINAL no formato da prova do dia 2: 32 questões de múltipla escolha
 * (1 a 16 Matemática, 17 a 24 Física, 25 a 28 Química, 29 a 32 Biologia). Questões novas, diferentes
 * das dos simulados base e nível prova.
 */

const MATEMATICA_FINAL: QuestaoG2[] = [
  o(
    'medio',
    'Uma roda de bicicleta tem raio de 0,5 m. Quantos metros a bicicleta percorre quando a roda dá 100 voltas completas? (use π = 3,14)',
    '314 m',
    ['157 m', '31,4 m', '628 m', '3 140 m'],
    'Em cada volta a roda percorre o comprimento da circunferência: 2πr = 2 · 3,14 · 0,5 = 3,14 m. Em 100 voltas: 314 m.',
  ),
  o(
    'medio',
    'Qual é a medida de cada ângulo interno de um octógono regular?',
    '135°',
    ['120°', '108°', '150°', '144°'],
    'Soma dos ângulos internos: (8 − 2) · 180° = 1 080°. Cada ângulo: 1 080° ÷ 8 = 135°.',
  ),
  o(
    'medio',
    'Uma corrida de táxi custa uma bandeirada de R$ 5,00 mais R$ 2,00 por quilômetro rodado. Quanto custa uma corrida de 12 km?',
    'R$ 29,00',
    ['R$ 24,00', 'R$ 34,00', 'R$ 17,00', 'R$ 31,00'],
    'Função afim: f(x) = 2x + 5. Para x = 12: 2 · 12 + 5 = 29.',
  ),
  o(
    'medio',
    'O gráfico da função f(x) = −2x + 6 corta o eixo x no ponto de abscissa',
    '3',
    ['−3', '6', '2', '−6'],
    'Corta o eixo x onde f(x) = 0: −2x + 6 = 0, então x = 3.',
  ),
  o(
    'medio',
    'Qual é a solução da equação 1/x + 1/2 = 3/4?',
    'x = 4',
    ['x = 2', 'x = 1/4', 'x = −4', 'x = 6'],
    '1/x = 3/4 − 1/2 = 1/4. Logo, x = 4. (Condição: x ≠ 0.)',
  ),
  o(
    'medio',
    'Simplificando a fração algébrica (x² − 9)/(x − 3), com x ≠ 3, obtém-se',
    'x + 3',
    ['x − 3', 'x + 9', 'x² − 3', '3'],
    'x² − 9 = (x − 3)(x + 3). Cancelando (x − 3): resulta x + 3.',
  ),
  o(
    'medio',
    'Dois números x e y são tais que x + y = 10 e x − y = 4. Qual é o valor do produto x · y?',
    '21',
    ['24', '30', '40', '12'],
    'Somando as equações: 2x = 14, x = 7, e então y = 3. Produto: 7 · 3 = 21.',
  ),
  o(
    'dificil',
    'Se x + y = 5 e x · y = 6, qual é o valor de x² + y²?',
    '13',
    ['11', '25', '17', '37'],
    '(x + y)² = x² + 2xy + y². Então x² + y² = 25 − 2 · 6 = 13. (Os números são 2 e 3: 4 + 9 = 13.)',
  ),
  o(
    'medio',
    'Em um triângulo retângulo, a tangente de um ângulo agudo α vale 3/4 e o cateto oposto a esse ângulo mede 9 cm. Quanto mede o cateto adjacente?',
    '12 cm',
    ['6,75 cm', '15 cm', '7 cm', '27 cm'],
    'tg α = oposto/adjacente = 9/x = 3/4, então x = 12 cm.',
  ),
  o(
    'medio',
    'Lança-se uma moeda e um dado. Qual é a probabilidade de sair cara e um múltiplo de 3 no dado?',
    '1/6',
    ['1/2', '1/3', '1/12', '5/6'],
    'Eventos independentes: P(cara) = 1/2 e P(3 ou 6) = 2/6 = 1/3. Produto: 1/2 · 1/3 = 1/6.',
  ),
  o(
    'medio',
    'Um prisma reto tem como base um triângulo retângulo de catetos 3 cm e 4 cm e altura de 10 cm. Qual é o volume do prisma?',
    '60 cm³',
    ['120 cm³', '30 cm³', '70 cm³', '12 cm³'],
    'Área da base = (3 · 4)/2 = 6 cm². Volume = 6 · 10 = 60 cm³.',
  ),
  o(
    'medio',
    'Uma caixa-d’água tem a forma de um paralelepípedo de 2 m de comprimento, 1,5 m de largura e 1 m de altura. Sabendo que 1 m³ equivale a 1 000 litros, qual é a sua capacidade?',
    '3 000 litros',
    ['300 litros', '30 000 litros', '4 500 litros', '3 litros'],
    'V = 2 · 1,5 · 1 = 3 m³ = 3 000 litros.',
  ),
  o(
    'medio',
    'A diagonal de um quadrado de lado 6 cm mede',
    '6√2 cm',
    ['12 cm', '6√3 cm', '36 cm', '3√2 cm'],
    'Pitágoras: d² = 6² + 6² = 72, então d = 6√2 cm.',
  ),
  o(
    'dificil',
    'De um ponto P, traça-se uma tangente PT a uma circunferência de centro O (T é o ponto de tangência). Sabendo que PT = 12 cm e PO = 13 cm, o raio da circunferência mede',
    '5 cm',
    ['1 cm', '7 cm', '25 cm', '12 cm'],
    'A tangente é perpendicular ao raio no ponto T. No triângulo PTO: OT² = 13² − 12² = 169 − 144 = 25. Logo, OT = 5.',
  ),
  o(
    'facil',
    'Uma loja oferece 8% de desconto para pagamento à vista. Um aparelho custa R$ 250,00. Qual é o preço à vista?',
    'R$ 230,00',
    ['R$ 242,00', 'R$ 220,00', 'R$ 258,00', 'R$ 170,00'],
    '8% de 250 = 20. Preço à vista: 250 − 20 = 230.',
  ),
  o(
    'medio',
    'Em um mapa com escala 1 : 50 000, a distância entre duas cidades é de 4 cm. Qual é a distância real?',
    '2 km',
    ['200 m', '20 km', '12,5 km', '0,5 km'],
    'Cada 1 cm no mapa vale 50 000 cm no real. 4 cm · 50 000 = 200 000 cm = 2 000 m = 2 km.',
  ),
];

const FISICA_FINAL: QuestaoG2[] = [
  o(
    'facil',
    'Uma agulha imantada é colocada perto de um ímã em barra. O polo norte da agulha é',
    'atraído pelo polo sul do ímã e repelido pelo polo norte.',
    [
      'atraído por qualquer polo do ímã.',
      'repelido por qualquer polo do ímã.',
      'atraído pelo polo norte e repelido pelo sul.',
      'indiferente, pois a agulha não tem polos.',
    ],
    'Polos opostos se atraem e polos iguais se repelem.',
  ),
  o(
    'medio',
    'Um ímã é mantido parado dentro de uma bobina ligada a um amperímetro. O ponteiro do aparelho',
    'não indica corrente, pois não há variação do fluxo magnético.',
    [
      'indica corrente máxima, pois o ímã está dentro da bobina.',
      'indica corrente alternada, pois o ímã tem dois polos.',
      'indica corrente contínua, igual à de uma pilha.',
      'indica corrente apenas se a bobina estiver aquecida.',
    ],
    'Só a variação do fluxo (movimento relativo entre ímã e bobina) induz corrente. Parado, nada é induzido.',
  ),
  o(
    'medio',
    'Qual alternativa apresenta as radiações em ordem crescente de comprimento de onda?',
    'Raios gama, raios X, ultravioleta, luz visível, micro-ondas, ondas de rádio.',
    [
      'Ondas de rádio, micro-ondas, luz visível, ultravioleta, raios X, raios gama.',
      'Luz visível, raios gama, rádio, raios X, micro-ondas, ultravioleta.',
      'Micro-ondas, rádio, luz visível, raios gama, ultravioleta, raios X.',
      'Raios X, raios gama, rádio, ultravioleta, luz visível, micro-ondas.',
    ],
    'Quanto maior a frequência, menor o comprimento de onda (v = λ · f). Gama tem o menor comprimento de onda e as de rádio têm o maior.',
  ),
  o(
    'medio',
    'Os satélites geoestacionários, usados em transmissões de TV e telefonia, parecem "parados" no céu porque',
    'seu período de translação é igual ao da rotação da Terra, de 24 horas, sobre a linha do equador.',
    [
      'não sofrem a ação da gravidade.',
      'ficam fixos no espaço, sem se mover.',
      'giram em torno do Sol e não da Terra.',
      'estão presos por cabos a antenas na superfície.',
    ],
    'Ao orbitar com o mesmo período de rotação da Terra, o satélite acompanha o movimento do ponto abaixo dele, parecendo fixo.',
  ),
  o(
    'facil',
    'Quais são os planetas gigantes gasosos do Sistema Solar?',
    'Júpiter, Saturno, Urano e Netuno.',
    [
      'Mercúrio, Vênus, Terra e Marte.',
      'Terra, Marte, Júpiter e Saturno.',
      'Vênus, Júpiter, Urano e Plutão.',
      'Mercúrio, Marte, Saturno e Netuno.',
    ],
    'Os rochosos são Mercúrio, Vênus, Terra e Marte. Os planetas mais externos, grandes e de composição gasosa (ou de gelos) são Júpiter, Saturno, Urano e Netuno.',
  ),
  o(
    'medio',
    'A estrela mais próxima do Sol, Próxima Centauri, está a cerca de 4,2 anos-luz da Terra. Isso significa que',
    'a luz dessa estrela leva cerca de 4,2 anos para chegar até nós.',
    [
      'a estrela tem 4,2 anos de idade.',
      'a estrela tem brilho 4,2 vezes maior que o do Sol.',
      'a estrela gira em torno da Terra em 4,2 anos.',
      'a distância até ela é de 4,2 km.',
    ],
    'Ano-luz é unidade de distância (cerca de 9,5 trilhões de km). Ver a estrela é ver a luz que saiu dela há 4,2 anos.',
  ),
  o(
    'medio',
    'Um astronauta de 70 kg de massa vai a Marte, onde a gravidade é cerca de 38% da terrestre. Em Marte, ele terá',
    'a mesma massa (70 kg) e um peso menor que o da Terra.',
    [
      'massa menor e peso igual ao da Terra.',
      'massa e peso iguais aos da Terra.',
      'massa maior e peso menor que o da Terra.',
      'massa e peso maiores que os da Terra.',
    ],
    'A massa é a quantidade de matéria e não muda. O peso é a força gravitacional (P = m · g), que é menor onde g é menor.',
  ),
  o(
    'medio',
    'Estrelas com massa muito maior que a do Sol terminam sua vida, em geral,',
    'em uma explosão de supernova, deixando uma estrela de nêutrons ou um buraco negro.',
    [
      'virando planetas rochosos.',
      'tornando-se anãs brancas, como o Sol.',
      'sem nenhuma transformação.',
      'convertendo-se em cometas.',
    ],
    'Estrelas muito massivas fundem elementos até o ferro, colapsam e explodem como supernovas. O que sobra depende da massa do núcleo.',
  ),
];

const QUIMICA_FINAL: QuestaoG2[] = [
  o(
    'medio',
    'Um composto é formado por ametais, apresenta ligações em que os átomos compartilham pares de elétrons e é um gás à temperatura ambiente. É exemplo de composto desse tipo',
    'o gás carbônico (CO₂).',
    [
      'o cloreto de sódio (NaCl).',
      'o óxido de cálcio (CaO).',
      'o cobre metálico (Cu).',
      'o hidróxido de sódio (NaOH).',
    ],
    'CO₂ tem ligações covalentes entre ametais e é gasoso. NaCl, CaO e NaOH são iônicos; o cobre é um metal.',
  ),
  o(
    'medio',
    'Um estudante adiciona gotas de fenolftaleína a uma solução e ela fica rosa. A solução é',
    'básica, com excesso de íons OH⁻.',
    [
      'ácida, com excesso de íons H⁺.',
      'neutra, com pH igual a 7.',
      'um sal puro, sem íons.',
      'um gás dissolvido, sem pH.',
    ],
    'A fenolftaleína é incolor em meio ácido ou neutro e rosa em meio básico (pH acima de aproximadamente 8,3).',
  ),
  o(
    'medio',
    'A cal virgem (CaO), usada em argamassas, é classificada como',
    'óxido básico, pois reage com a água formando uma base.',
    [
      'óxido ácido, pois forma ácido com a água.',
      'ácido, pois libera H⁺.',
      'sal, pois contém metal e oxigênio.',
      'óxido neutro, pois não reage com a água.',
    ],
    'CaO + H₂O → Ca(OH)₂. Óxidos de metais alcalinos e alcalinoterrosos são básicos.',
  ),
  o(
    'medio',
    'A reação entre o ácido clorídrico (HCl) e o hidróxido de potássio (KOH) é uma neutralização que produz',
    'cloreto de potássio (KCl) e água.',
    [
      'sulfato de potássio e hidrogênio.',
      'óxido de potássio e cloro.',
      'cloreto de cálcio e água.',
      'apenas gás hidrogênio.',
    ],
    'Ácido + base → sal + água: HCl + KOH → KCl + H₂O.',
  ),
];

const BIOLOGIA_FINAL: QuestaoG2[] = [
  o(
    'medio',
    'Um homem heterozigoto (Aa) e uma mulher homozigota recessiva (aa) terão um filho. Qual é a probabilidade de a criança ser aa?',
    '1/2 (50%)',
    ['1/4 (25%)', '3/4 (75%)', '0%', '100%'],
    'Aa × aa dá 1/2 Aa e 1/2 aa.',
  ),
  o(
    'medio',
    'Uma planta de milho recebeu um gene de uma bactéria que a torna resistente a certas pragas. Ela é um exemplo de',
    'organismo transgênico, criado por engenharia genética.',
    [
      'clone, pois tem o mesmo DNA do milho original.',
      'híbrido natural entre duas espécies de milho.',
      'mutante surgido por acaso, sem intervenção humana.',
      'organismo sem DNA.',
    ],
    'A inserção de um gene de outra espécie, por técnicas de DNA recombinante, resulta em um organismo transgênico.',
  ),
  o(
    'medio',
    'Em uma população de insetos, alguns indivíduos têm cor mais parecida com a da vegetação e são menos vistos pelas aves. Depois de várias gerações, a maior parte da população tem essa cor. Esse processo exemplifica',
    'a seleção natural, que favorece os indivíduos mais bem camuflados.',
    [
      'a herança de caracteres adquiridos.',
      'o desejo dos insetos de mudar de cor.',
      'a clonagem natural.',
      'a ausência de variação genética.',
    ],
    'Havia variação de cor. Os mais camuflados sobreviveram e deixaram mais descendentes, e a característica se tornou mais frequente.',
  ),
  o(
    'medio',
    'Uma Área de Proteção Ambiental (APA) é uma Unidade de Conservação de uso sustentável. Isso significa que, nela,',
    'pode haver propriedades privadas e atividades humanas, desde que com regras de uso para proteger o ambiente.',
    [
      'é proibida a presença de qualquer pessoa.',
      'só é permitida a pesquisa científica.',
      'é permitida a caça livre.',
      'toda a vegetação deve ser retirada.',
    ],
    'Nas UCs de uso sustentável há ocupação humana ordenada. Nas de proteção integral, o uso é restrito a atividades indiretas.',
  ),
];

/** 16 de Matemática + 8 de Física + 4 de Química + 4 de Biologia. */
export const SIMULADO_FINAL_PA8: QuestaoG2[] = [
  ...MATEMATICA_FINAL,
  ...FISICA_FINAL,
  ...QUIMICA_FINAL,
  ...BIOLOGIA_FINAL,
];
