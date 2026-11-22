import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Matemática (9º ano, Prof.ª Andréia Escabin): volume de prisma e cilindro, trigonometria, equações
 * (irracionais, biquadradas, literais, redutíveis ao 2º grau), frações algébricas e funções.
 * Modelado na lista de estudos e nas VA 1 a 6. Números e contas conferidos um a um.
 * REGRA DE ESCRITA: a alternativa certa nunca pode ser reconhecida pelo tamanho (ver `balanco-alternativas.ts`).
 */

const MATERIA = 'matematica';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · VOLUME (10 objetivas) */

const S1: QuestaoG2[] = [
  o(
    'facil',
    'Qual é o volume de um cubo de aresta 5 cm?',
    '125 cm³',
    ['25 cm³', '75 cm³', '15 cm³', '250 cm³'],
    'V = Aᵦ · h = 5² · 5 = 125 cm³. O volume de um cubo é a aresta ao cubo.',
  ),
  o(
    'facil',
    'Um prisma tem base quadrada de lado 5 cm e altura 15 cm. Qual é o volume dele?',
    '375 cm³',
    ['75 cm³', '225 cm³', '125 cm³', '300 cm³'],
    'Aᵦ = 5 · 5 = 25 cm². V = 25 · 15 = 375 cm³.',
  ),
  o(
    'medio',
    'Um prisma hexagonal regular tem aresta da base 4 cm e altura 13 cm. Qual é o volume dele?',
    '312√3 cm³',
    ['156√3 cm³', '208√3 cm³', '52√3 cm³', '624√3 cm³'],
    'Aᵦ = 6 · 4² · √3 / 4 = 24√3 cm². V = 24√3 · 13 = 312√3 cm³ (≈ 540 cm³).',
  ),
  o(
    'facil',
    'Qual é o volume de um cilindro de raio 1,2 cm e altura 2 cm?',
    '2,88π cm³',
    ['1,44π cm³', '4,8π cm³', '11,52π cm³', '2,4π cm³'],
    'V = π · r² · h = π · 1,44 · 2 = 2,88π cm³. Esquecer de elevar o raio ao quadrado dá 4,8π; usar o diâmetro no lugar do raio dá 11,52π.',
  ),
  o(
    'medio',
    'Uma embalagem em forma de paralelepípedo reto-retângulo tem base de área 144 cm² e altura 15 cm. Qual é o volume dela?',
    '2 160 cm³',
    ['159 cm³', '1 440 cm³', '2 400 cm³', '216 cm³'],
    'V = área da base · altura = 144 · 15 = 2 160 cm³.',
  ),
  o(
    'dificil',
    'Um cilindro de diâmetro 12 cm tem o mesmo volume de um prisma de base 144 cm² e altura 15 cm. Qual é a altura do cilindro?',
    'h = 60/π cm',
    ['h = 15/π cm', 'h = 60π cm', 'h = 15π cm', 'h = 30/π cm'],
    'O prisma tem V = 144 · 15 = 2 160. O cilindro tem raio 6: V = π · 36 · h. Igualando, 36πh = 2 160, então h = 60/π cm (≈ 19,1 cm).',
  ),
  o(
    'medio',
    'Se o raio da base de um cilindro dobra e a altura não muda, o volume do cilindro',
    'quadruplica',
    ['dobra', 'triplica', 'fica igual', 'octuplica'],
    'O raio está ao quadrado em V = πr²h. Com 2r, o volume vira π(2r)²h = 4πr²h.',
  ),
  o(
    'facil',
    'Uma caixa em forma de bloco retangular mede 20 cm, 10 cm e 5 cm. Qual é a capacidade dela?',
    '1 L',
    ['10 L', '0,1 L', '100 L', '2 L'],
    'V = 20 · 10 · 5 = 1 000 cm³. Como 1 000 cm³ = 1 dm³ = 1 L, a caixa leva 1 litro.',
  ),
  o(
    'medio',
    'Um reservatório cilíndrico tem raio 1 m e altura 3 m. Usando π ≈ 3, quantos litros ele comporta?',
    '9 000 litros',
    ['900 litros', '90 litros', '9 litros', '90 000 litros'],
    'V = π · 1² · 3 ≈ 9 m³. Como 1 m³ = 1 000 L, a capacidade é 9 000 litros.',
  ),
  o(
    'facil',
    'Um prisma retangular de volume 240 cm³ tem base de 8 cm por 5 cm. Qual é a altura dele?',
    '6 cm',
    ['4 cm', '8 cm', '48 cm', '30 cm'],
    'Aᵦ = 8 · 5 = 40 cm². V = Aᵦ · h → 240 = 40 · h → h = 6 cm.',
  ),
];

/* ============================================================ SIMULADO 2 · TRIGONOMETRIA (10 objetivas) */

const S2: QuestaoG2[] = [
  o(
    'facil',
    'Qual é o valor de sen 30°?',
    '1/2',
    ['√3/2', '√2/2', '√3/3', '1'],
    'Pela tabela dos ângulos notáveis, sen 30° = 1/2 (e cos 60° também vale 1/2).',
  ),
  o(
    'facil',
    'Qual é o valor de tg 45°?',
    '1',
    ['√3', '√3/3', '1/2', '√2/2'],
    'Em 45° os catetos são iguais, então tg 45° = oposto/adjacente = 1.',
  ),
  o(
    'medio',
    'Qual é o valor de sen 30° + cos 60°?',
    '1',
    ['1/2', '√3/2', '2', '√3'],
    'sen 30° = 1/2 e cos 60° = 1/2. A soma é 1/2 + 1/2 = 1.',
  ),
  o(
    'facil',
    'Uma rampa de 10 m de comprimento forma 30° com o chão. Qual é a altura que ela atinge?',
    '5 m',
    ['10 m', '5√3 m', '10√3 m', '20 m'],
    'A altura é o cateto oposto: sen 30° = h/10 → h = 10 · 1/2 = 5 m.',
  ),
  o(
    'medio',
    'Uma escada de 6 m, apoiada em uma parede, forma 60° com o chão. A que distância da parede está o pé da escada?',
    '3 m',
    ['6 m', '3√3 m', '2√3 m', '12 m'],
    'A distância é o cateto adjacente: cos 60° = d/6 → d = 6 · 1/2 = 3 m. (3√3 m é a altura que a escada atinge na parede.)',
  ),
  o(
    'medio',
    'Quando o Sol está a 45° de elevação, um poste projeta uma sombra de 10 m. Qual é a altura do poste?',
    '10 m',
    ['5 m', '10√2 m', '20 m', '5√2 m'],
    'tg 45° = altura/sombra = 1, então a altura é igual à sombra: 10 m.',
  ),
  o(
    'medio',
    'Em um triângulo retângulo, um ângulo agudo α tem sen α = 0,6. Qual é o cos α?',
    '0,8',
    ['0,4', '0,6', '1,6', '0,64'],
    'Como sen² α + cos² α = 1, cos² α = 1 − 0,36 = 0,64, então cos α = 0,8.',
  ),
  o(
    'medio',
    'Um triângulo retângulo tem catetos 5 e 12 e hipotenusa 13. Qual é a tangente do ângulo oposto ao cateto 5?',
    '5/12',
    ['5/13', '12/13', '12/5', '13/5'],
    'tg = cateto oposto / cateto adjacente = 5/12. Com a hipotenusa teríamos o seno (5/13) ou o cosseno (12/13).',
  ),
  o(
    'medio',
    'Uma torre de 12 m é vista sob um ângulo de 30°. Dado tg 30° ≈ 0,58, qual é a distância x do observador à base da torre?',
    '20,7 m',
    ['6,96 m', '7,0 m', '12,58 m', '69,6 m'],
    'tg 30° = 12/x → x = 12/0,58 ≈ 20,7 m. Multiplicar (12 · 0,58 = 6,96) é o erro mais comum.',
  ),
  o(
    'dificil',
    'Um observador enxerga um balão sob ângulo de elevação de 60°, a 30 m da vertical do balão. Qual é a altura do balão em relação aos olhos do observador?',
    '30√3 m',
    ['15√3 m', '30 m', '10√3 m', '60 m'],
    'tg 60° = h/30, com tg 60° = √3. Logo h = 30√3 m (≈ 52 m).',
  ),
];

/* ============================================================ SIMULADO 3 · EQUAÇÕES (14 objetivas) */

const S3: QuestaoG2[] = [
  o(
    'medio',
    'Qual é o conjunto solução (em ℝ) da equação √(3x + 16) − x = 2?',
    'S = {3}',
    ['S = {−4}', 'S = {3, −4}', 'S = {4}', 'S = {2}'],
    'Isolando: √(3x + 16) = x + 2 → 3x + 16 = x² + 4x + 4 → x² + x − 12 = 0 → x = 3 ou x = −4. Verificando, x = −4 dá 6 ≠ 2 (raiz falsa). S = {3}.',
  ),
  o(
    'medio',
    'Qual é o conjunto solução da equação 5 + 3√(x − 1) = x?',
    'S = {17}',
    ['S = {2}', 'S = {2, 17}', 'S = {−17}', 'S = {19}'],
    '3√(x − 1) = x − 5 → 9(x − 1) = x² − 10x + 25 → x² − 19x + 34 = 0 → x = 17 ou x = 2. x = 2 dá 8 ≠ 2 (falsa). S = {17}.',
  ),
  o(
    'medio',
    'Qual é o conjunto solução da equação √(5x + 1) + 1 = x?',
    'S = {7}',
    ['S = {0}', 'S = {0, 7}', 'S = {−7}', 'S = {1}'],
    '√(5x + 1) = x − 1 → 5x + 1 = x² − 2x + 1 → x² − 7x = 0 → x = 0 ou 7. x = 0 dá 2 ≠ 0 (falsa). S = {7}.',
  ),
  o(
    'medio',
    'Qual é o conjunto solução da equação √(4a + 5) = a?',
    'S = {5}',
    ['S = {−1}', 'S = {−1, 5}', 'S = {1}', 'S = {25}'],
    '4a + 5 = a² → a² − 4a − 5 = 0 → a = 5 ou a = −1. Uma raiz quadrada não pode ser igual a −1, então S = {5}.',
  ),
  o(
    'facil',
    'Qual é o valor de y na equação √(y + 10) − √(2y − 5) = 0?',
    'y = 15',
    ['y = 5', 'y = −15', 'y = 25', 'y = 3'],
    'As duas raízes são iguais: y + 10 = 2y − 5 → y = 15. Confere: √25 − √25 = 0.',
  ),
  o(
    'medio',
    'Qual é o conjunto solução (em ℝ) da equação m⁴ − 3m² − 4 = 0?',
    'S = {−2, 2}',
    ['S = {4}', 'S = {−1, 4}', 'S = {2}', 'S = {1, 4}'],
    'Com t = m²: t² − 3t − 4 = 0 → t = 4 ou t = −1. Só t = 4 serve, então m = ±2.',
  ),
  o(
    'medio',
    'Quantas raízes reais tem a equação y⁴ − 20y² + 36 = 0?',
    '4 raízes reais',
    ['2 raízes reais', '1 raiz real', 'nenhuma raiz real', '3 raízes reais'],
    'Com t = y²: t² − 20t + 36 = 0 → t = 18 ou t = 2, ambos positivos. Cada t gera duas raízes: ±3√2 e ±√2. São 4 raízes.',
  ),
  o(
    'dificil',
    'Qual é o conjunto solução (em ℝ) da equação 16x⁴ + 9 = 40x²?',
    'S = {±3/2, ±1/2}',
    ['S = {9/4, 1/4}', 'S = {±9/4, ±1/4}', 'S = {±3/4, ±1/2}', 'S = {±3/2}'],
    '16t² − 40t + 9 = 0 → Δ = 1 024 → t = (40 ± 32)/32 = 9/4 ou 1/4. Voltando: x = ±3/2 ou x = ±1/2.',
  ),
  o(
    'dificil',
    'Qual é o conjunto solução da equação x²(x² − 2x + 1) = −x(2x² − 2x)?',
    'S = {−1, 0, 1}',
    ['S = {−1, 1}', 'S = {0, 1}', 'S = {0}', 'S = {−1, 0}'],
    'x⁴ − 2x³ + x² = −2x³ + 2x² → x⁴ − x² = 0 → x²(x² − 1) = 0 → x = 0, x = 1 ou x = −1.',
  ),
  o(
    'medio',
    'Qual é o conjunto solução da equação 3x²(x² − 5) = 5 − x²?',
    'S = {−√5, √5}',
    ['S = {5}', 'S = {−1/3, 5}', 'S = {−5, 5}', 'S = {√5}'],
    '3x⁴ − 15x² + x² − 5 = 0 → 3x⁴ − 14x² − 5 = 0 → 3t² − 14t − 5 = 0 → t = 5 ou t = −1/3. Só t = 5 serve: x = ±√5.',
  ),
  o(
    'medio',
    'Resolvendo x² − 3ax + 2a² = 0 em x (com a letra a como número fixo), obtém-se',
    'x = a ou x = 2a',
    ['x = −a ou x = −2a', 'x = 3a ou x = 2a', 'x = a ou x = 3a', 'x = 2a ou x = −a'],
    'Δ = 9a² − 8a² = a². x = (3a ± a)/2, ou seja, x = 2a ou x = a. Por fatoração: (x − a)(x − 2a) = 0.',
  ),
  o(
    'medio',
    'Resolvendo mx − 1 = nx + 1 em x, com m ≠ n, obtém-se',
    'x = 2/(m − n)',
    ['x = 2(m − n)', 'x = 2/(m + n)', 'x = (m − n)/2', 'x = −2/(m − n)'],
    'mx − nx = 1 + 1 → (m − n)x = 2 → x = 2/(m − n). A condição m ≠ n evita dividir por zero.',
  ),
  o(
    'dificil',
    'Qual é o conjunto solução da equação (x² + 6)² − 17(x² + 6) + 70 = 0?',
    'S = {−2, −1, 1, 2}',
    ['S = {−10, −7, 7, 10}', 'S = {−2, −1, 1}', 'S = {1, 4, 7, 10}', 'S = {−4, −1, 1, 4}'],
    'Com y = x² + 6: y² − 17y + 70 = 0 → y = 10 ou y = 7. Então x² = 4 (x = ±2) ou x² = 1 (x = ±1).',
  ),
  o(
    'dificil',
    'Qual é o conjunto solução da equação √(2x² + 3x + 5) = x + 3?',
    'S = {−1, 4}',
    ['S = {4}', 'S = {−1}', 'S = {1, 4}', 'S = {−4, 1}'],
    '2x² + 3x + 5 = x² + 6x + 9 → x² − 3x − 4 = 0 → x = 4 ou x = −1. Os dois servem: x = 4 dá 7 = 7; x = −1 dá 2 = 2.',
  ),
];

/* ============================================================ SIMULADO 4 · FRAÇÕES ALGÉBRICAS (10 objetivas) */

const S4: QuestaoG2[] = [
  o(
    'facil',
    'Simplificando 121x²y³z / 77x⁴y³, obtém-se',
    '11z/(7x²)',
    ['11z/(7x)', '121z/(77x²)', '11x²z/7', '7z/(11x²)'],
    '121/77 = 11/7; x²/x⁴ = 1/x²; y³ se cancela; z fica no numerador. Resultado: 11z/(7x²).',
  ),
  o(
    'medio',
    'Simplificando (x² + 5x + 6)/(x² − 9), obtém-se',
    '(x + 2)/(x − 3)',
    ['(x + 2)/(x + 3)', '(x + 3)/(x − 3)', '(x + 2)/3', '(x + 2)/(x − 9)'],
    'Numerador: (x + 2)(x + 3). Denominador: (x − 3)(x + 3). Cortando (x + 3): (x + 2)/(x − 3).',
  ),
  o(
    'medio',
    'Simplificando (x² − 9y²)/(ax − 3ay + bx − 3by), obtém-se',
    '(x + 3y)/(a + b)',
    ['(x − 3y)/(a + b)', '(x + 3y)/(a − b)', '(x + 3y)/(a + 3b)', '(x − 3y)/(a − b)'],
    'Numerador: (x − 3y)(x + 3y). Denominador, por agrupamento: (x − 3y)(a + b). Cortando (x − 3y): (x + 3y)/(a + b).',
  ),
  o(
    'medio',
    'Simplificando (ax² − ay²)/(x² − 2xy + y²), obtém-se',
    'a(x + y)/(x − y)',
    ['a(x − y)/(x + y)', 'a(x + y)/(x + y)', '(x + y)/(x − y)', 'a(x + y)/(x − y)²'],
    'Numerador: a(x − y)(x + y). Denominador: (x − y)². Cortando um (x − y): a(x + y)/(x − y).',
  ),
  o(
    'dificil',
    'A soma (−x² + 4x − 1)/(x² − 1) + (x − 2)/(x + 1) é igual a',
    '1/(x − 1)',
    ['1/(x + 1)', '(x − 1)/(x + 1)', '1/(x² − 1)', 'x/(x − 1)'],
    '(x − 2)/(x + 1) = (x − 2)(x − 1)/(x² − 1). Numerador total: −x² + 4x − 1 + x² − 3x + 2 = x + 1. Então (x + 1)/(x² − 1) = 1/(x − 1).',
  ),
  o(
    'dificil',
    'Simplificando a fração composta [1/(x + 1)] ÷ [(x + 2)/(x² − 1)], obtém-se',
    '(x − 1)/(x + 2)',
    ['(x + 1)/(x + 2)', '(x − 1)/(x + 1)', '(x² − 1)/(x + 2)', '1/(x + 2)'],
    'Dividir é multiplicar pelo inverso: 1/(x + 1) · (x² − 1)/(x + 2) = (x − 1)(x + 1)/[(x + 1)(x + 2)] = (x − 1)/(x + 2).',
  ),
  o(
    'dificil',
    'A expressão (p + q)/(p − q) + (p − q)/(p + q) − 4pq/(p² − q²) é igual a',
    '2(p − q)/(p + q)',
    ['2(p + q)/(p − q)', '(p − q)/(p + q)', '2p/(p + q)', '2(p − q)²/(p + q)'],
    'Denominador comum p² − q². Numerador: (p + q)² + (p − q)² − 4pq = 2p² − 4pq + 2q² = 2(p − q)². Então 2(p − q)²/[(p + q)(p − q)] = 2(p − q)/(p + q).',
  ),
  o(
    'facil',
    'Quais valores de x NÃO podem ser usados na fração 3x/(x² − 16)?',
    'x ≠ 4 e x ≠ −4',
    ['x ≠ 0 e x ≠ 4', 'x ≠ 2 e x ≠ 0', 'x ≠ 0 e x ≠ −4', 'x ≠ 8 e x ≠ −8'],
    'O denominador não pode ser zero: x² − 16 = 0 → x = 4 ou x = −4. O numerador não restringe nada.',
  ),
  o(
    'medio',
    'Simplificando (x² − 1)/(x² + 2x + 1), obtém-se',
    '(x − 1)/(x + 1)',
    ['(x + 1)/(x − 1)', '−1/(2x + 1)', '(x − 1)/(2x + 1)', '1/(x + 1)'],
    '(x − 1)(x + 1)/(x + 1)² = (x − 1)/(x + 1). Cortar x² com x² (como se fossem fatores) é erro: são parcelas.',
  ),
  o(
    'medio',
    'Simplificando (6x + 12)/(3x), obtém-se',
    '2(x + 2)/x',
    ['2 + 12/x', '6 + 4/x', '2x + 4', 'x + 2'],
    'Fatorando: (6x + 12) = 6(x + 2). Então 6(x + 2)/(3x) = 2(x + 2)/x. Não se corta o 3x com parcelas soltas.',
  ),
];

/* ============================================================ SIMULADO 5 · FUNÇÕES (10 objetivas) */

const S5: QuestaoG2[] = [
  o(
    'facil',
    'Se f(x) = 3x − 2, qual é o valor de f(4)?',
    '10',
    ['12', '14', '5', '−10'],
    'f(4) = 3 · 4 − 2 = 12 − 2 = 10.',
  ),
  o(
    'facil',
    'Quais são as raízes da função f(x) = x² − 5x + 6?',
    '2 e 3',
    ['−2 e −3', '1 e 6', '−1 e −6', '5 e 6'],
    'Soma das raízes = 5 e produto = 6, então as raízes são 2 e 3. (Δ = 1 e x = (5 ± 1)/2.)',
  ),
  o(
    'medio',
    'A reta que passa pelos pontos (0, 3) e (2, 7) é o gráfico da função',
    'f(x) = 2x + 3',
    ['f(x) = 3x + 2', 'f(x) = 4x + 3', 'f(x) = 2x + 7', 'f(x) = x + 3'],
    'Em (0, 3): b = 3. Inclinação a = (7 − 3)/(2 − 0) = 2. Logo f(x) = 2x + 3.',
  ),
  o(
    'facil',
    'Qual é a raiz da função f(x) = 2x − 8?',
    'x = 4',
    ['x = −4', 'x = 8', 'x = −8', 'x = 2'],
    'f(x) = 0 → 2x − 8 = 0 → x = 4. Também vale −b/a = 8/2.',
  ),
  o(
    'medio',
    'Qual é o vértice da parábola de f(x) = x² − 4x + 3?',
    '(2, −1)',
    ['(2, 1)', '(−2, −1)', '(4, 3)', '(1, 0)'],
    'xᵥ = −b/2a = 4/2 = 2. yᵥ = f(2) = 4 − 8 + 3 = −1. Vértice (2, −1).',
  ),
  o(
    'medio',
    'Qual é o valor máximo de f(x) = −x² + 6x?',
    '9',
    ['3', '6', '18', '−9'],
    'a < 0, então há valor máximo. xᵥ = −6/(−2) = 3 e yᵥ = f(3) = −9 + 18 = 9.',
  ),
  o(
    'facil',
    'Qual é o domínio de f(x) = 1/(x − 2) (valores de x permitidos)?',
    'x ≠ 2',
    ['x ≠ −2', 'x ≠ 0', 'x ≠ 1', 'x > 2'],
    'O denominador não pode ser zero: x − 2 = 0 em x = 2. Todos os outros reais servem.',
  ),
  o(
    'medio',
    'Um táxi cobra bandeirada de R$ 5,00 mais R$ 2,00 por quilômetro (f(x) = 5 + 2x). Quanto custa uma corrida de 12 km?',
    'R$ 29,00',
    ['R$ 24,00', 'R$ 17,00', 'R$ 34,00', 'R$ 19,00'],
    'f(12) = 5 + 2 · 12 = 5 + 24 = 29. R$ 24,00 esquece a bandeirada.',
  ),
  o(
    'facil',
    'Se f(x) = x² − 3x + 1, qual é o valor de f(−2)?',
    '11',
    ['−9', '−1', '3', '9'],
    'f(−2) = (−2)² − 3 · (−2) + 1 = 4 + 6 + 1 = 11.',
  ),
  o(
    'medio',
    'Em que ponto o gráfico de f(x) = x² − 6x + 5 corta o eixo y?',
    '(0, 5)',
    ['(0, −6)', '(0, 1)', '(5, 0)', '(0, 0)'],
    'No eixo y, x = 0: f(0) = c = 5. O ponto é (0, 5). As raízes (1 e 5) é que ficam no eixo x.',
  ),
];

/* ============================================================ SIMULADO 6 · MISTO 70/30 (7 objetivas + 3 dissertativas) */

const S6: QuestaoG2[] = [
  o(
    'medio',
    'Um prisma reto tem como base um triângulo retângulo de catetos 3 cm e 4 cm e altura 10 cm. Qual é o volume dele?',
    '60 cm³',
    ['30 cm³', '120 cm³', '84 cm³', '70 cm³'],
    'Aᵦ = (3 · 4)/2 = 6 cm². V = 6 · 10 = 60 cm³. Esquecer de dividir por 2 dá 120.',
  ),
  o(
    'medio',
    'Um prisma de base triangular equilátera de lado 4 cm tem altura 5 cm. Qual é o volume dele?',
    '20√3 cm³',
    ['10√3 cm³', '40√3 cm³', '16√3 cm³', '80 cm³'],
    'Aᵦ = ℓ²√3/4 = 16√3/4 = 4√3 cm². V = 4√3 · 5 = 20√3 cm³.',
  ),
  o(
    'medio',
    'Em um triângulo retângulo, um ângulo agudo α tem sen α = 5/13. Qual é o cos α?',
    '12/13',
    ['5/12', '13/12', '8/13', '12/5'],
    'cos² α = 1 − (5/13)² = 144/169, então cos α = 12/13 (triângulo 5, 12, 13).',
  ),
  o(
    'medio',
    'Qual é o conjunto solução da equação x⁴ − 13x² + 36 = 0?',
    'S = {−3, −2, 2, 3}',
    ['S = {−9, −4, 4, 9}', 'S = {−3, −2, 2}', 'S = {−6, −1, 1, 6}', 'S = {−3, −2, 3}'],
    'Com t = x²: t² − 13t + 36 = 0 → t = 9 ou t = 4. Voltando: x = ±3 ou x = ±2.',
  ),
  o(
    'medio',
    'Qual é o conjunto solução da equação √(x + 6) = x?',
    'S = {3}',
    ['S = {−2, 3}', 'S = {−2}', 'S = {6}', 'S = {9}'],
    'x + 6 = x² → x² − x − 6 = 0 → x = 3 ou x = −2. x = −2 dá √4 = 2 ≠ −2 (raiz falsa). S = {3}.',
  ),
  o(
    'facil',
    'Qual é a raiz da função f(x) = −2x + 6?',
    '3',
    ['−3', '6', '−6', '2'],
    'f(x) = 0 → −2x + 6 = 0 → x = 3.',
  ),
  o(
    'facil',
    'Simplificando (x² − 4)/(x − 2), obtém-se',
    'x + 2',
    ['x − 2', 'x + 4', 'x − 4', '2'],
    'x² − 4 = (x − 2)(x + 2). Cortando (x − 2): x + 2 (com x ≠ 2).',
  ),
  dq(
    'medio',
    'Resolva a equação irracional √(2x + 3) = x e verifique se as raízes encontradas servem.',
    'Elevando ao quadrado: 2x + 3 = x², então x² − 2x − 3 = 0 e x = 3 ou x = −1. Verificação: x = 3 → √9 = 3 ✓. x = −1 → √1 = 1 ≠ −1 ✗ (raiz falsa). S = {3}.',
    [
      'Eleva os dois lados ao quadrado corretamente',
      'Chega a x² − 2x − 3 = 0 e acha x = 3 e x = −1',
      'Verifica as raízes na equação original',
      'Descarta x = −1 e conclui S = {3}',
    ],
  ),
  dq(
    'medio',
    'Uma rampa tem ângulo de 30° com o chão e sobe 3 m de altura. Qual é o comprimento da rampa? Mostre o raciocínio.',
    'A altura é o cateto oposto a 30° e a rampa é a hipotenusa: sen 30° = 3/c. Como sen 30° = 1/2, c = 3 · 2 = 6 m.',
    [
      'Identifica altura como cateto oposto e rampa como hipotenusa',
      'Usa sen 30° = 1/2',
      'Monta 1/2 = 3/c e resolve',
      'Responde 6 m',
    ],
  ),
  dq(
    'dificil',
    'Um cilindro tem raio 3 cm e altura 10 cm. Calcule o volume (use π ≈ 3,14) em cm³ e diga quantos mililitros de água ele comporta.',
    'Aᵦ = π · 3² = 9π. V = 9π · 10 = 90π ≈ 90 · 3,14 = 282,6 cm³. Como 1 cm³ = 1 mL, comporta 282,6 mL.',
    [
      'Calcula a área da base com π r² (r elevado ao quadrado)',
      'Multiplica pela altura e obtém 90π',
      'Substitui π ≈ 3,14 e acha 282,6 cm³',
      'Converte 1 cm³ = 1 mL e responde 282,6 mL',
    ],
  ),
];

/* ============================================================ SIMULADO 7 · SÓ DISSERTATIVO (a lista de estudos e as VAs) */

const S7: QuestaoG2[] = [
  dq(
    'dificil',
    'Um bombom é vendido em duas embalagens de volumes iguais. A embalagem A é um paralelepípedo reto-retângulo de altura 15 cm, com base quadrada de área 144 cm². A embalagem B é um cilindro cujo diâmetro da base é igual ao lado da base de A. Calcule: a) o lado x da base de A; b) o volume de A; c) a altura h de B.',
    'a) x² = 144, então x = 12 cm. b) V = 144 · 15 = 2 160 cm³. c) O cilindro tem diâmetro 12, então raio 6: 36π · h = 2 160, logo h = 60/π cm (≈ 19,1 cm).',
    [
      'Acha x = 12 cm tirando a raiz de 144',
      'Calcula o volume de A: 2 160 cm³',
      'Usa o raio 6 (e não o diâmetro) na fórmula do cilindro',
      'Iguala os volumes e chega a h = 60/π cm',
    ],
  ),
  dq(
    'medio',
    'Em um triângulo retângulo, a hipotenusa mede 8 cm e um ângulo agudo mede 40°. Sabendo que cos 40° ≈ 0,77 e sen 40° ≈ 0,64, calcule os catetos x (adjacente a 40°) e y (oposto a 40°). Depois complete a tabela de sen, cos e tg dos ângulos de 30°, 45° e 60°.',
    'x = 8 · cos 40° ≈ 8 · 0,77 ≈ 6,2 cm e y = 8 · sen 40° ≈ 8 · 0,64 ≈ 5,1 cm. Tabela: 30° → sen 1/2, cos √3/2, tg √3/3; 45° → sen √2/2, cos √2/2, tg 1; 60° → sen √3/2, cos 1/2, tg √3.',
    [
      'Usa cos = adjacente/hipotenusa para x',
      'Usa sen = oposto/hipotenusa para y',
      'Obtém valores próximos de 6,2 e 5,1',
      'Completa a tabela dos 3 ângulos sem erro',
    ],
  ),
  dq(
    'medio',
    'Resolva as equações irracionais em ℝ: a) √(5x + 1) + 1 = x; b) √(y + 10) − √(2y − 5) = 0; c) √(4a + 5) = a. Verifique as raízes.',
    'a) √(5x + 1) = x − 1 → x² − 7x = 0 → x = 0 ou 7; só x = 7 serve. S = {7}. b) y + 10 = 2y − 5 → y = 15 (confere). S = {15}. c) a² − 4a − 5 = 0 → a = 5 ou −1; só a = 5 serve. S = {5}.',
    [
      'Isola a raiz e eleva ao quadrado corretamente',
      'Resolve as equações do 2º grau obtidas',
      'Verifica e descarta x = 0 e a = −1',
      'Escreve S = {7}, S = {15} e S = {5}',
    ],
  ),
  dq(
    'medio',
    'Simplifique: a) (x² − 9y²)/(ax − 3ay + bx − 3by); b) (ax² − ay²)/(x² − 2xy + y²); c) a soma (−x² + 4x − 1)/(x² − 1) + (x − 2)/(x + 1).',
    'a) (x − 3y)(x + 3y)/[(x − 3y)(a + b)] = (x + 3y)/(a + b). b) a(x − y)(x + y)/(x − y)² = a(x + y)/(x − y). c) O numerador total é −x² + 4x − 1 + (x − 2)(x − 1) = x + 1, então (x + 1)/(x² − 1) = 1/(x − 1).',
    [
      'Fatora por agrupamento e por diferença de quadrados',
      'Corta só fatores iguais (nunca parcelas)',
      'No item c, usa o denominador comum x² − 1',
      'Chega a (x + 3y)/(a + b), a(x + y)/(x − y) e 1/(x − 1)',
    ],
  ),
  dq(
    'medio',
    'Uma torre vertical de 12 m é vista sob um ângulo de 30° por uma pessoa no mesmo plano horizontal da base. Dado tg 30° = 0,58, determine a distância x da pessoa até a torre. Depois, calcule a altura de um prédio visto sob 30° por quem está a 60 m da base (use √3 ≈ 1,73).',
    'Torre: tg 30° = 12/x → x = 12/0,58 ≈ 20,7 m. Prédio: h = 60 · tg 30° = 60 · √3/3 = 20√3 ≈ 34,6 m.',
    [
      'Escolhe a tangente (cateto oposto e adjacente)',
      'Monta 0,58 = 12/x e chega a x ≈ 20,7 m',
      'Usa tg 30° = √3/3 no prédio',
      'Chega a 20√3 ≈ 34,6 m',
    ],
  ),
  dq(
    'dificil',
    'Resolva em ℝ as equações: a) 2x² + 5 = (x² + 1)²; b) x²(x² − 2x + 1) = −x(2x² − 2x); c) 16x⁴ + 9 = 40x²; d) m⁴ − 3m² − 4 = 0; e) y⁴ − 20y² + 36 = 0; f) √(a² + 3) = 2a².',
    'a) x⁴ − 4 = 0 → S = {−√2, √2}. b) x⁴ − x² = 0 → S = {−1, 0, 1}. c) t = x²: 16t² − 40t + 9 = 0 → t = 9/4 ou 1/4 → S = {±3/2, ±1/2}. d) t² − 3t − 4 = 0 → t = 4 → S = {−2, 2}. e) t² − 20t + 36 = 0 → t = 18 ou 2 → S = {±3√2, ±√2}. f) a² + 3 = 4a⁴ → 4t² − t − 3 = 0 → t = 1 → S = {−1, 1}.',
    [
      'Desenvolve parênteses e leva a equação à forma geral',
      'Usa a substituição x² = t e resolve a de 2º grau',
      'Volta para a incógnita original com ±',
      'Descarta t negativo e confere a equação irracional do item f',
    ],
  ),
  dq(
    'medio',
    'Resolva em x (as outras letras são números fixos): a) x² − 3ax + 2a² = 0; b) mx − 1 = nx + 1 (m ≠ n).',
    'a) Δ = 9a² − 8a² = a², x = (3a ± a)/2, então x = a ou x = 2a. b) (m − n)x = 2, logo x = 2/(m − n).',
    [
      'Calcula Δ com letras (9a² − 8a² = a²)',
      'Acha x = a e x = 2a',
      'Fatora (m − n)x = 2 no item b',
      'Escreve x = 2/(m − n) e cita m ≠ n',
    ],
  ),
  dq(
    'dificil',
    'Resolva: a) (x² + 6)² − 17(x² + 6) + 70 = 0; b) √(2x² + 3x + 5) = x + 3; c) x² − 4nx + 3n² = 0.',
    'a) y = x² + 6: y² − 17y + 70 = 0 → y = 10 ou 7 → x = ±2 ou ±1. S = {−2, −1, 1, 2}. b) x² − 3x − 4 = 0 → x = 4 ou −1; os dois servem. S = {−1, 4}. c) Δ = 4n², x = (4n ± 2n)/2 → x = n ou x = 3n.',
    [
      'Troca a expressão repetida por uma letra (y = x² + 6)',
      'Volta para x depois de achar y',
      'Verifica as raízes da equação irracional',
      'Resolve a literal com Δ = 4n² e acha n e 3n',
    ],
  ),
];

/* ============================================================ SUPER SIMULADO · PROVA PB4 DE MATEMÁTICA (10 dissertativas) */

const SUPER: QuestaoG2[] = [
  dq(
    'medio',
    'a) Calcule o volume de um prisma de base quadrada com lado 6 cm e altura 10 cm. b) Calcule o volume de um cilindro de raio 2 cm e altura 5 cm (deixe em função de π).',
    'a) Aᵦ = 6 · 6 = 36 cm²; V = 36 · 10 = 360 cm³. b) Aᵦ = π · 2² = 4π; V = 4π · 5 = 20π cm³.',
    [
      'Usa V = Aᵦ · h nos dois itens',
      'Acha 360 cm³ no prisma',
      'Eleva o raio ao quadrado no cilindro',
      'Acha 20π cm³',
    ],
  ),
  dq(
    'medio',
    'a) Complete: sen 60° = ___, cos 45° = ___, tg 30° = ___. b) No triângulo retângulo de hipotenusa 10 cm e ângulo agudo de 30°, calcule o cateto oposto a esse ângulo.',
    'a) sen 60° = √3/2; cos 45° = √2/2; tg 30° = √3/3. b) sen 30° = c/10 → c = 10 · 1/2 = 5 cm.',
    [
      'Acerta os três valores da tabela',
      'Escolhe o seno para o cateto oposto com a hipotenusa',
      'Usa sen 30° = 1/2',
      'Responde 5 cm',
    ],
  ),
  dq(
    'medio',
    'Uma escada de 8 m, apoiada em uma parede, forma 60° com o chão. a) A que altura da parede ela chega? b) A que distância da parede está o pé da escada? (Use √3 ≈ 1,73.)',
    'a) A altura é o cateto oposto: sen 60° = h/8 → h = 8 · √3/2 = 4√3 ≈ 6,9 m. b) A distância é o cateto adjacente: cos 60° = d/8 → d = 8 · 1/2 = 4 m.',
    [
      'Usa seno para a altura e cosseno para a distância',
      'Aplica sen 60° = √3/2 e cos 60° = 1/2',
      'Chega a 4√3 ≈ 6,9 m',
      'Chega a 4 m',
    ],
  ),
  dq(
    'medio',
    'Resolva √(x + 7) = x − 5 e verifique as raízes.',
    'x + 7 = x² − 10x + 25 → x² − 11x + 18 = 0 → x = 9 ou x = 2. Verificação: x = 9 → √16 = 4 = 9 − 5 ✓. x = 2 → √9 = 3 ≠ −3 ✗. S = {9}.',
    [
      'Eleva os dois lados ao quadrado e desenvolve (x − 5)²',
      'Acha x = 9 e x = 2',
      'Verifica as duas raízes na equação original',
      'Conclui S = {9}',
    ],
  ),
  dq(
    'medio',
    'Resolva em ℝ: a) 4x⁴ − 37x² + 9 = 0; b) x⁴ − 10x² + 9 = 0.',
    'a) t = x²: 4t² − 37t + 9 = 0 → Δ = 1 225 → t = 9 ou t = 1/4 → S = {±3, ±1/2}. b) t² − 10t + 9 = 0 → t = 9 ou t = 1 → S = {±3, ±1}.',
    [
      'Usa x² = t e resolve a equação do 2º grau',
      'Calcula Δ = 1 225 no item a',
      'Volta para x com ±',
      'Escreve os conjuntos com 4 raízes',
    ],
  ),
  dq(
    'medio',
    'Resolva em x (as outras letras são números fixos): a) x² − 5ax + 6a² = 0; b) ax − 3 = bx + 5 (a ≠ b).',
    'a) Δ = 25a² − 24a² = a²; x = (5a ± a)/2 → x = 3a ou x = 2a. b) (a − b)x = 8, então x = 8/(a − b).',
    [
      'Calcula Δ = a² no item a',
      'Acha x = 2a e x = 3a',
      'Isola x no item b',
      'Escreve x = 8/(a − b) com a ≠ b',
    ],
  ),
  dq(
    'dificil',
    'Resolva (x² − 1)² − 5(x² − 1) + 4 = 0.',
    'Com y = x² − 1: y² − 5y + 4 = 0 → y = 4 ou y = 1. Então x² − 1 = 4 → x² = 5 → x = ±√5; x² − 1 = 1 → x² = 2 → x = ±√2. S = {±√5, ±√2}.',
    [
      'Faz a troca y = x² − 1',
      'Acha y = 4 e y = 1',
      'Volta para x nos dois casos',
      'Escreve S = {±√5, ±√2}',
    ],
  ),
  dq(
    'medio',
    'Simplifique: a) (x² − 16)/(x² − 8x + 16); b) 1/(x − 2) − 1/(x + 2).',
    'a) (x − 4)(x + 4)/(x − 4)² = (x + 4)/(x − 4). b) Denominador comum x² − 4: [(x + 2) − (x − 2)]/(x² − 4) = 4/(x² − 4).',
    [
      'Fatora diferença de quadrados e quadrado perfeito',
      'Corta só o fator (x − 4)',
      'Usa o denominador comum no item b',
      'Cuida do sinal ao subtrair (x − 2) e chega a 4/(x² − 4)',
    ],
  ),
  dq(
    'dificil',
    'Dada f(x) = x² − 6x + 5, determine: a) as raízes; b) o vértice da parábola; c) onde o gráfico corta o eixo y. Diga se a parábola tem concavidade para cima ou para baixo.',
    'a) Δ = 36 − 20 = 16; x = (6 ± 4)/2 → x = 5 ou x = 1. b) xᵥ = 6/2 = 3; yᵥ = 9 − 18 + 5 = −4; vértice (3, −4). c) f(0) = 5, ponto (0, 5). Como a = 1 > 0, a concavidade é para cima.',
    [
      'Acha as raízes 1 e 5',
      'Calcula o vértice (3, −4) com −b/2a',
      'Acha o ponto (0, 5)',
      'Relaciona a > 0 com concavidade para cima',
    ],
  ),
  dq(
    'medio',
    'Um táxi cobra bandeirada de R$ 6,00 mais R$ 2,50 por quilômetro rodado. a) Escreva a função que dá o preço f(x) em função dos km x. b) Quanto custa uma corrida de 8 km? c) Quantos km se rodam com R$ 31,00?',
    'a) f(x) = 6 + 2,5x. b) f(8) = 6 + 20 = R$ 26,00. c) 6 + 2,5x = 31 → 2,5x = 25 → x = 10 km.',
    [
      'Escreve f(x) = 6 + 2,5x (bandeirada + variável)',
      'Calcula f(8) = R$ 26,00',
      'Monta 6 + 2,5x = 31',
      'Chega a 10 km',
    ],
  ),
];

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

export const PACOTES_MATEMATICA_PB4: PacoteG2[] = [
  pacote(
    'pb4-mat-s1-volume',
    'Simulado 1 · Volume de prisma e cilindro (PB4 Matemática)',
    '10 questões objetivas: V = Aᵦ · h em cubo, prismas, hexágono e cilindro',
    'VA 1 e lista de estudos: volume de prismas e cilindros, embalagens de mesmo volume e conversão de unidades.',
    30,
    S1,
  ),
  pacote(
    'pb4-mat-s2-trigonometria',
    'Simulado 2 · Trigonometria no triângulo retângulo (PB4 Matemática)',
    '10 questões objetivas: seno, cosseno, tangente e problemas de altura',
    'Lista de estudos: razões trigonométricas, ângulos notáveis de 30°, 45° e 60°, rampas, escadas, torres e prédios.',
    30,
    S2,
  ),
  pacote(
    'pb4-mat-s3-equacoes',
    'Simulado 3 · Equações: irracionais, biquadradas, literais e redução (PB4 Matemática)',
    '14 questões objetivas das VA 2, 3, 4 e 5',
    'Equações irracionais (com verificação), biquadradas, literais e as que se reduzem ao 2º grau, com as contas das VAs e da lista.',
    45,
    S3,
  ),
  pacote(
    'pb4-mat-s4-fracoes',
    'Simulado 4 · Frações algébricas (PB4 Matemática)',
    '10 questões objetivas: simplificar, somar, dividir e condição de existência',
    'VA 6 e lista de estudos: fatoração, simplificação, soma e fração composta.',
    35,
    S4,
  ),
  pacote(
    'pb4-mat-s5-funcoes',
    'Simulado 5 · Funções afim e quadrática (PB4 Matemática)',
    '10 questões objetivas: valor de f(x), raízes, vértice e problemas',
    'Funções do caderno e da Apostila 4: valor numérico, raiz, reta, parábola, vértice e situação-problema.',
    30,
    S5,
  ),
  pacote(
    'pb4-mat-s6-misto',
    'Simulado 6 · Volume, trigonometria, equações e funções (70/30)',
    '10 questões: 7 objetivas e 3 dissertativas',
    '70% objetivas e 30% dissertativas com correção da IA, misturando todos os assuntos do bimestre.',
    45,
    S6,
  ),
  pacote(
    'pb4-mat-s7-dissertativo',
    'Simulado 7 · Só dissertativo: a lista de estudos e as VAs (PB4 Matemática)',
    '8 questões dissertativas, como na lista da Prof.ª Andréia',
    'Resolva com as contas completas, como a professora exige. A IA corrige com o gabarito e os critérios.',
    80,
    S7,
  ),
  pacote(
    'pb4-mat-super',
    'Super simulado · Prova PB4 de Matemática',
    '10 questões dissertativas de todo o conteúdo do bimestre',
    'Volume, trigonometria, equações, frações algébricas e funções, no estilo da prova. Faça sem calculadora e mostre as contas.',
    90,
    SUPER,
  ),
];
