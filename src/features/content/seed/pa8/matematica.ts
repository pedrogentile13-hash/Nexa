import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA8 · Matemática (9º ano, módulos 19 a 37). Textos e números elaborados para os simulados.
 * Cada objetiva tem a certa + 4 erradas (5 alternativas), como na Prova Anglo.
 */

/* ------------------------------------------------------------ SIMULADO BASE (10) */

export const MATEMATICA_BASE: QuestaoG2[] = [
  o(
    'facil',
    'Uma camiseta custa R$ 200,00 e está com 15% de desconto. Qual é o preço com o desconto?',
    'R$ 170,00',
    ['R$ 185,00', 'R$ 215,00', 'R$ 30,00', 'R$ 175,00'],
    '15% de 200 = 30. O preço com desconto é 200 − 30 = 170.',
  ),
  o(
    'facil',
    'Um capital de R$ 1.000,00 foi aplicado a juros simples, à taxa de 2% ao mês, durante 5 meses. Qual foi o montante no fim do período?',
    'R$ 1.100,00',
    ['R$ 1.010,00', 'R$ 1.020,00', 'R$ 1.050,00', 'R$ 1.200,00'],
    'Juros simples: J = C · i · t = 1.000 · 0,02 · 5 = 100. Montante = 1.000 + 100 = 1.100.',
  ),
  o(
    'medio',
    'Quatro operários fazem uma obra em 12 dias. Mantendo o mesmo ritmo, em quantos dias 6 operários fariam a mesma obra?',
    '8 dias',
    ['18 dias', '6 dias', '9 dias', '10 dias'],
    'Mais operários, menos dias: grandezas inversamente proporcionais. 4 · 12 = 6 · x, logo x = 8.',
  ),
  o(
    'medio',
    'No plano cartesiano, os pontos A(1, 2) e B(4, 6) são vértices de um segmento. Qual é a distância entre A e B?',
    '5',
    ['7', '25', '3', '4'],
    'd² = (4 − 1)² + (6 − 2)² = 9 + 16 = 25, então d = 5.',
  ),
  o(
    'facil',
    'Os catetos de um triângulo retângulo medem 6 cm e 8 cm. Quanto mede a hipotenusa?',
    '10 cm',
    ['14 cm', '100 cm', '12 cm', '9 cm'],
    'Pitágoras: a² = 6² + 8² = 36 + 64 = 100, então a = 10.',
  ),
  o(
    'medio',
    'A equação x² − 7x + 10 = 0 tem duas raízes. Qual é a soma e qual é o produto delas?',
    'Soma 7 e produto 10',
    [
      'Soma −7 e produto 10',
      'Soma 7 e produto −10',
      'Soma 10 e produto 7',
      'Soma −10 e produto −7',
    ],
    'Para ax² + bx + c = 0: soma = −b/a = 7 e produto = c/a = 10 (as raízes são 2 e 5).',
  ),
  o(
    'facil',
    'Lançando-se um dado comum de 6 faces, qual é a probabilidade de sair um número primo?',
    '1/2',
    ['1/3', '2/3', '1/6', '5/6'],
    'Os primos de 1 a 6 são 2, 3 e 5: três casos favoráveis em seis possíveis, 3/6 = 1/2.',
  ),
  o(
    'facil',
    'Uma caixa em forma de prisma tem base retangular de 5 cm por 4 cm e altura de 3 cm. Qual é o seu volume?',
    '60 cm³',
    ['12 cm³', '20 cm³', '47 cm³', '120 cm³'],
    'V = área da base · altura = (5 · 4) · 3 = 60 cm³.',
  ),
  o(
    'medio',
    'Em um triângulo retângulo, a hipotenusa mede 12 cm e um dos ângulos agudos mede 60°. Quanto mede o cateto adjacente a esse ângulo? (cos 60° = 1/2)',
    '6 cm',
    ['12 cm', '24 cm', '4 cm', '8 cm'],
    'cos 60° = cateto adjacente / hipotenusa. Logo, cateto = 12 · 1/2 = 6 cm.',
  ),
  o(
    'medio',
    'Em uma circunferência, um arco de 80° é visto por um ângulo inscrito. Qual é a medida desse ângulo inscrito?',
    '40°',
    ['80°', '160°', '20°', '100°'],
    'O ângulo inscrito mede a metade do arco que ele enxerga: 80° ÷ 2 = 40°.',
  ),
];

/* ------------------------------------------------------------ SIMULADO NÍVEL PROVA (10) */

export const MATEMATICA_PROVA: QuestaoG2[] = [
  o(
    'medio',
    'Uma pessoa aplicou R$ 2.000,00 a juros compostos, à taxa de 10% ao ano. Qual será o montante após 2 anos?',
    'R$ 2.420,00',
    ['R$ 2.400,00', 'R$ 2.200,00', 'R$ 2.410,00', 'R$ 2.440,00'],
    'M = C · (1 + i)^t = 2.000 · 1,1² = 2.000 · 1,21 = 2.420. Nos juros compostos, o 2º ano rende sobre o montante do 1º.',
  ),
  o(
    'medio',
    'O preço de um produto sofreu um aumento de 20% e, depois, um desconto de 20% sobre o novo preço. Em relação ao preço inicial, o preço final é',
    '4% menor.',
    ['igual.', '4% maior.', '20% menor.', '2% menor.'],
    'Fator 1,2 · 0,8 = 0,96. O preço final é 96% do inicial, ou seja, 4% menor. Os 20% incidem sobre valores diferentes.',
  ),
  o(
    'dificil',
    'Cinco máquinas iguais produzem 200 peças em 4 horas. Mantendo o mesmo ritmo por máquina, quantas peças 10 máquinas produzirão em 6 horas?',
    '600 peças',
    ['300 peças', '400 peças', '500 peças', '800 peças'],
    'O dobro de máquinas (×2) e uma vez e meia o tempo (×1,5) multiplicam a produção por 3: 200 · 3 = 600. As duas grandezas são diretamente proporcionais à produção.',
  ),
  o(
    'medio',
    'Os pontos A(−2, 4) e B(6, −2) são as extremidades de um segmento. Quais são as coordenadas do ponto médio de AB?',
    '(2, 1)',
    ['(4, 2)', '(2, 3)', '(8, −6)', '(−2, 1)'],
    'Ponto médio: ((−2 + 6)/2 ; (4 + (−2))/2) = (2 ; 1).',
  ),
  o(
    'medio',
    `Em um triângulo retângulo, a altura relativa à hipotenusa a divide em dois segmentos: as projeções dos catetos medem 9 cm e 16 cm.

Nessas condições, a altura relativa à hipotenusa mede`,
    '12 cm',
    ['7 cm', '15 cm', '20 cm', '144 cm'],
    'Relação métrica: h² = m · n = 9 · 16 = 144, logo h = 12.',
  ),
  o(
    'dificil',
    'Para que a equação x² − 6x + k = 0 tenha duas raízes reais e iguais, o valor de k deve ser',
    '9',
    ['6', '12', '36', '3'],
    'Raízes iguais: discriminante nulo. Δ = (−6)² − 4 · 1 · k = 36 − 4k = 0, então k = 9.',
  ),
  o(
    'medio',
    'A equação x⁴ − 5x² + 4 = 0 é biquadrada. Quantas raízes reais distintas ela possui?',
    '4',
    ['2', '3', '0', '1'],
    'Com y = x²: y² − 5y + 4 = 0, então y = 1 ou y = 4. Daí x = ±1 ou x = ±2: quatro raízes reais.',
  ),
  o(
    'facil',
    'Um reservatório tem forma de cilindro com raio da base de 3 m e altura de 10 m. Qual é o seu volume?',
    '90π m³',
    ['30π m³', '60π m³', '180π m³', '900π m³'],
    'V = π · r² · h = π · 3² · 10 = 90π m³.',
  ),
  o(
    'dificil',
    'Uma urna tem 4 bolas vermelhas e 6 azuis. Retiram-se duas bolas, uma após a outra e sem reposição. Qual é a probabilidade de as duas serem vermelhas?',
    '2/15',
    ['4/25', '1/5', '4/15', '2/5'],
    'Eventos dependentes: 4/10 · 3/9 = 12/90 = 2/15. Com reposição seria 4/10 · 4/10 = 4/25.',
  ),
  o(
    'medio',
    'Uma rampa de 6 m de comprimento forma 30° com o chão plano. A que altura do chão fica o ponto mais alto da rampa? (sen 30° = 1/2)',
    '3 m',
    ['3√3 m', '6 m', '12 m', '2√3 m'],
    'A altura é o cateto oposto ao ângulo: sen 30° = h/6, então h = 6 · 1/2 = 3 m.',
  ),
];
