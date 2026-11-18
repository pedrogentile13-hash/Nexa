import { q, type PacoteSeed } from './helpers';

export const LOTE3_MAT_FUND: PacoteSeed[] = [
  {
    topic: 'sistema-de-numeracao', grade: '6º ano', title: 'Sistema de numeração e números naturais', subtitle: 'Valor posicional, ordens, sucessor e números romanos',
    resumo: String.raw`## Sistema decimal
Usamos 10 algarismos (0 a 9) e o **valor posicional**: o valor de um algarismo depende da posição. Em $4\,372$: 4 milhares, 3 centenas, 7 dezenas e 2 unidades. O algarismo 3 vale $300$.

## Decomposição
$5\,208=5\cdot1000+2\cdot100+0\cdot10+8=5000+200+8$.

## Sucessor e antecessor
Sucessor é o número seguinte (+1); antecessor, o anterior (−1). O sucessor de 999 é 1 000. Entre 15 e 25 (sem contar os extremos) há 9 números.

## Pares e ímpares
Pares terminam em 0, 2, 4, 6, 8; ímpares, em 1, 3, 5, 7, 9.

## Números romanos
I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Letras menores **antes** de maiores subtraem (IV = 4, IX = 9). XIV = 14; 2024 = MMXXIV.

## Erros comuns
- Confundir o **algarismo** com o **valor** que ele tem na posição.
- Contar os extremos ao dizer "entre".
- Repetir uma letra mais de três vezes em romanos.`,
    questoes: [
      q('facil', 'No número 4 372, qual é o valor posicional do algarismo 3?', ['3', '30', '300', '3 000'], 2, 'O 3 ocupa a casa das centenas, então vale 3 × 100 = 300.'),
      q('facil', 'Qual é o sucessor de 999?', ['998', '1 000', '9 991', '1 001'], 1, 'O sucessor é o número seguinte: 999 + 1 = 1 000.'),
      q('facil', 'Qual número é representado por XIV em algarismos romanos?', ['4', '14', '16', '24'], 1, 'X vale 10 e IV vale 4: 10 + 4 = 14.'),
      q('medio', 'A decomposição correta de 5 208 é:', ['5 000 + 200 + 8', '5 000 + 20 + 8', '500 + 200 + 8', '5 000 + 2 000 + 8'], 0, 'O 5 está nos milhares, o 2 nas centenas (200), o 0 nas dezenas e o 8 nas unidades.'),
      q('medio', 'Usando os algarismos 3, 8, 1 e 6 uma vez cada, qual é o maior número de 4 algarismos que se forma?', ['8 613', '8 631', '8 361', '1 368'], 1, 'Os algarismos maiores ficam nas ordens mais altas: 8, 6, 3, 1, ou seja, 8 631.'),
      q('medio', 'Quantos números naturais existem entre 15 e 25 (sem contar o 15 e o 25)?', ['8', '9', '10', '11'], 1, 'São os números de 16 a 24: 24 − 16 + 1 = 9.'),
      q('dificil', 'Qual é a representação romana de 2024?', ['MMXXIV', 'MMXIV', 'MXXIV', 'MMXXIIII'], 0, '2000 = MM, 20 = XX, 4 = IV. Logo, MMXXIV. MMXIV é 2014.'),
      q('dificil', 'Qual é o antecessor do maior número natural de três algarismos?', ['998', '1 000', '899', '100'], 0, 'O maior de três algarismos é 999 e o antecessor dele é 998.'),
    ],
  },
  {
    topic: 'mmc-e-mdc', grade: '6º ano', title: 'Múltiplos, divisores, MMC e MDC', subtitle: 'Números primos, critérios de divisibilidade e problemas',
    resumo: String.raw`## Múltiplos e divisores
Múltiplos de 6: 6, 12, 18, 24... Divisores de 12: 1, 2, 3, 4, 6 e 12 (são 6 divisores).

## Números primos
Têm exatamente dois divisores: 1 e ele mesmo (2, 3, 5, 7, 11, 13...). O 1 não é primo.

## Critérios de divisibilidade
- Por 2: termina em número par. Por 5: termina em 0 ou 5. Por 10: termina em 0.
- Por 3: a soma dos algarismos é múltipla de 3. Por 9: a soma é múltipla de 9.

## MMC e MDC
**MMC** é o menor múltiplo comum: $\text{MMC}(4,6)=12$. Serve para eventos que **se repetem juntos**.
**MDC** é o maior divisor comum: $\text{MDC}(12,18)=6$. Serve para **dividir em partes iguais**, as maiores possíveis.

## Exemplos
- Sinais que piscam a cada 6 s e a cada 8 s coincidem de novo após $\text{MMC}(6,8)=24$ s.
- Tiras de 24 cm e 36 cm cortadas em pedaços iguais e o maior possível: $\text{MDC}(24,36)=12$ cm.

## Erros comuns
- Trocar MMC por MDC no problema.
- Achar que 1 é primo ou que todo ímpar é primo (9 e 15 não são).`,
    questoes: [
      q('facil', 'Qual dos números a seguir é múltiplo de 6?', ['32', '42', '46', '52'], 1, '42 = 6 × 7. Os outros não são divisíveis por 6.'),
      q('facil', 'Quantos divisores naturais tem o número 12?', ['4', '5', '6', '12'], 2, 'Os divisores de 12 são 1, 2, 3, 4, 6 e 12: seis divisores.'),
      q('facil', 'Qual destes números é primo?', ['9', '15', '13', '21'], 2, '13 só é divisível por 1 e por 13. Os outros têm divisores como 3.'),
      q('medio', 'Qual é o MMC de 4 e 6?', ['2', '10', '12', '24'], 2, 'Múltiplos de 4: 4, 8, 12... Múltiplos de 6: 6, 12... O menor comum é 12.'),
      q('medio', 'Qual é o MDC de 12 e 18?', ['3', '6', '36', '216'], 1, 'Divisores de 12: 1, 2, 3, 4, 6, 12. Divisores de 18: 1, 2, 3, 6, 9, 18. O maior comum é 6.'),
      q('medio', 'Qual destes números é divisível por 3?', ['4 521', '4 522', '4 523', '4 525'], 0, 'Soma dos algarismos de 4 521: 4 + 5 + 2 + 1 = 12, múltiplo de 3. As somas dos outros são 13, 14 e 16.'),
      q('dificil', 'Um sinal pisca a cada 6 segundos e outro a cada 8 segundos. Eles piscaram juntos agora. Daqui a quanto tempo piscarão juntos de novo?', ['2 s', '14 s', '24 s', '48 s'], 2, 'É o MMC(6, 8) = 24 segundos.'),
      q('dificil', 'Duas tiras de 24 cm e 36 cm serão cortadas em pedaços iguais, os maiores possíveis, sem sobras. Quanto mede cada pedaço?', ['6 cm', '12 cm', '72 cm', '144 cm'], 1, 'É o MDC(24, 36) = 12 cm.'),
    ],
  },
  {
    topic: 'numeros-decimais', grade: '6º ano', title: 'Números decimais', subtitle: 'Comparação e as quatro operações com decimais',
    resumo: String.raw`## O que são
Números com vírgula representam frações de denominador 10, 100, 1000...: $0{,}5=\frac{5}{10}=\frac{1}{2}$ e $0{,}25=\frac{25}{100}=\frac{1}{4}$.

## Comparar
Compare primeiro a parte inteira; se igual, compare décimos, centésimos... Entre $0{,}9$ e $0{,}45$, o maior é $0{,}9$. Cuidado: $0{,}5>0{,}45$ mesmo com menos algarismos.

## Soma e subtração
Alinhe a **vírgula** embaixo da vírgula: $3{,}40+2{,}15=5{,}55$.

## Multiplicação
Multiplique como inteiros e depois some as casas decimais. $2{,}5\times1{,}2=3{,}00=3$. Multiplicar por 10 desloca a vírgula uma casa para a direita: $4{,}2\times10=42$.

## Divisão
Iguale as casas decimais e divida: $7{,}5\div2{,}5=75\div25=3$.

## Problema
Pagando R$ 21,15 de compras com R$ 50,00, o troco é $50{,}00-21{,}15=28{,}85$.

## Erros comuns
- Não alinhar a vírgula na soma.
- Achar que mais algarismos significa número maior.`,
    questoes: [
      q('facil', 'Qual fração é equivalente a 0,5?', ['1/5', '1/2', '1/20', '2/5'], 1, '0,5 = 5/10, que simplifica para 1/2.'),
      q('facil', 'Qual é o maior número?', ['0,09', '0,9', '0,19', '0,099'], 1, '0,9 tem 9 décimos, mais que os outros: 0,19 tem 1 décimo, e 0,09 e 0,099 têm 0.'),
      q('facil', 'Quanto é 3,4 + 2,15?', ['5,19', '5,55', '5,65', '2,49'], 1, 'Alinhando a vírgula: 3,40 + 2,15 = 5,55.'),
      q('medio', 'Quanto é 4,2 × 10?', ['0,42', '4,20', '42', '420'], 2, 'Multiplicar por 10 desloca a vírgula uma casa para a direita: 42.'),
      q('medio', 'Quanto é 2,5 × 1,2?', ['3', '2,6', '3,7', '30'], 0, '25 × 12 = 300 e há duas casas decimais, então o resultado é 3,00 = 3.'),
      q('medio', 'Quanto é 7,5 ÷ 2,5?', ['3', '0,3', '30', '18,75'], 0, 'Multiplicando os dois por 10: 75 ÷ 25 = 3.'),
      q('dificil', 'Marcos comprou itens de R$ 12,75 e R$ 8,40 e pagou com uma nota de R$ 50,00. Quanto recebeu de troco?', ['R$ 28,85', 'R$ 29,85', 'R$ 21,15', 'R$ 38,85'], 0, 'Gastou 12,75 + 8,40 = 21,15. Troco: 50,00 − 21,15 = 28,85. R$ 21,15 é o total gasto, e não o troco.'),
      q('dificil', 'Um litro de leite custa R$ 4,80. Quanto custam 2,5 litros?', ['R$ 9,60', 'R$ 12,00', 'R$ 14,40', 'R$ 7,30'], 1, '4,80 × 2,5 = 12,00. Metade de 4,80 é 2,40, e 4,80 × 2 = 9,60; somando, 9,60 + 2,40 = 12,00.'),
    ],
  },
  {
    topic: 'angulos-e-poligonos', grade: '6º ano', title: 'Ângulos e polígonos', subtitle: 'Tipos de ângulo, complementares, suplementares e soma dos ângulos internos',
    resumo: String.raw`## Tipos de ângulo
- **Agudo:** menor que $90^\circ$. **Reto:** exatamente $90^\circ$. **Obtuso:** entre $90^\circ$ e $180^\circ$. **Raso:** $180^\circ$.

## Complementares e suplementares
- **Complementares:** somam $90^\circ$. O complemento de $35^\circ$ é $55^\circ$.
- **Suplementares:** somam $180^\circ$. O suplemento de $120^\circ$ é $60^\circ$.

## Polígonos
Figuras fechadas formadas por segmentos. Nomes: triângulo (3 lados), quadrilátero (4), pentágono (5), hexágono (6), heptágono (7), octógono (8).

## Soma dos ângulos internos
$$S=(n-2)\cdot180^\circ$$
Triângulo: $180^\circ$. Quadrilátero: $360^\circ$. Hexágono: $(6-2)\cdot180=720^\circ$.

## Exemplo
Dois ângulos complementares, um o dobro do outro: $x+2x=90\Rightarrow x=30^\circ$ e $60^\circ$.

## Erros comuns
- Trocar complementar (90°) por suplementar (180°).
- Usar $n\cdot180$ em vez de $(n-2)\cdot180$.`,
    questoes: [
      q('facil', 'Um ângulo de exatamente 90° é chamado de:', ['agudo', 'reto', 'obtuso', 'raso'], 1, 'Ângulo de 90° é reto. Agudo é menor que 90°; obtuso, entre 90° e 180°.'),
      q('facil', 'Como se chama o polígono de 5 lados?', ['Hexágono', 'Pentágono', 'Octógono', 'Quadrilátero'], 1, 'Pentágono tem 5 lados.'),
      q('facil', 'Qual é a soma dos ângulos internos de um triângulo?', ['90°', '180°', '270°', '360°'], 1, 'Em qualquer triângulo, a soma dos ângulos internos é 180°.'),
      q('medio', 'Qual é o complemento de um ângulo de 35°?', ['55°', '145°', '65°', '35°'], 0, 'Complementares somam 90°: 90° − 35° = 55°. O número 145° é o suplemento.'),
      q('medio', 'Qual é o suplemento de um ângulo de 120°?', ['60°', '30°', '240°', '70°'], 0, 'Suplementares somam 180°: 180° − 120° = 60°.'),
      q('medio', 'Qual é a soma dos ângulos internos de um quadrilátero?', ['180°', '270°', '360°', '540°'], 2, '(4 − 2) × 180° = 360°.'),
      q('dificil', 'Qual é a soma dos ângulos internos de um hexágono?', ['540°', '720°', '900°', '1 080°'], 1, '(6 − 2) × 180° = 4 × 180° = 720°.'),
      q('dificil', 'Dois ângulos são complementares e um é o dobro do outro. Quanto mede o menor?', ['20°', '30°', '45°', '60°'], 1, 'x + 2x = 90°, então 3x = 90° e x = 30°. O maior mede 60°.'),
    ],
  },
  {
    topic: 'perimetro-e-area', grade: '6º ano', title: 'Perímetro e área', subtitle: 'Contorno e superfície de quadrados, retângulos e triângulos',
    resumo: String.raw`## Perímetro
É a **soma dos lados** (o contorno), medido em unidades de comprimento (cm, m).
- Quadrado de lado $\ell$: $P=4\ell$. Lado 5: $P=20$.
- Retângulo $b\times h$: $P=2(b+h)$. Lados 8 e 3: $P=22$.

## Área
É a medida da **superfície**, em unidades quadradas (cm², m²).
- Retângulo: $A=b\cdot h$. Lados 6 e 4: $A=24$.
- Quadrado: $A=\ell^2$. Lado 7: $A=49$.
- Triângulo: $A=\frac{b\cdot h}{2}$. Base 10 e altura 6: $A=30$.

## Problemas
Uma sala de 5 m por 4 m, com lajotas de 1 m², precisa de $5\cdot4=20$ lajotas.

Retângulo de perímetro 30 e largura 5: $2(c+5)=30\Rightarrow c=10$.

Quadrado de área 81: lado 9 e perímetro 36.

## Erros comuns
- Confundir perímetro (soma dos lados) com área (superfície).
- Esquecer de dividir por 2 na área do triângulo.
- Misturar unidades (cm com m).`,
    questoes: [
      q('facil', 'Qual é o perímetro de um quadrado de lado 5 cm?', ['10 cm', '20 cm', '25 cm', '15 cm'], 1, 'O perímetro é a soma dos 4 lados: 4 × 5 = 20 cm. O valor 25 é a área.'),
      q('facil', 'Qual é a área de um retângulo de 6 m por 4 m?', ['10 m²', '20 m²', '24 m²', '48 m²'], 2, 'A = base × altura = 6 × 4 = 24 m².'),
      q('facil', 'Qual é a área de um quadrado de lado 7 cm?', ['14 cm²', '28 cm²', '49 cm²', '77 cm²'], 2, 'A = lado × lado = 7 × 7 = 49 cm².'),
      q('medio', 'Qual é o perímetro de um retângulo com lados de 8 cm e 3 cm?', ['11 cm', '22 cm', '24 cm', '16 cm'], 1, 'P = 2 × (8 + 3) = 22 cm. O valor 24 é a área.'),
      q('medio', 'Qual é a área de um triângulo de base 10 cm e altura 6 cm?', ['60 cm²', '30 cm²', '16 cm²', '36 cm²'], 1, 'A = (10 × 6) / 2 = 30 cm². O valor 60 esquece de dividir por 2.'),
      q('medio', 'Uma sala retangular de 5 m por 4 m será coberta com lajotas quadradas de 1 m². Quantas lajotas serão usadas?', ['9', '18', '20', '40'], 2, 'A área é 5 × 4 = 20 m², e cada lajota cobre 1 m²: 20 lajotas.'),
      q('dificil', 'Um retângulo tem perímetro 30 cm e largura 5 cm. Qual é o comprimento?', ['10 cm', '15 cm', '20 cm', '25 cm'], 0, '2 × (c + 5) = 30, então c + 5 = 15 e c = 10 cm.'),
      q('dificil', 'Um quadrado tem área de 81 cm². Qual é o seu perímetro?', ['18 cm', '36 cm', '81 cm', '27 cm'], 1, 'O lado é 9 cm, pois 9² = 81. Perímetro: 4 × 9 = 36 cm.'),
    ],
  },
  {
    topic: 'numeros-inteiros', grade: '7º ano', title: 'Números inteiros', subtitle: 'Reta numérica, módulo e operações com sinais',
    resumo: String.raw`## O conjunto dos inteiros
$\mathbb{Z}=\{\ldots,-2,-1,0,1,2,\ldots\}$. Os negativos ficam à esquerda do zero na reta numérica. Quanto mais à direita, maior: $-1>-5$.

## Módulo
É a distância até o zero: $|-8|=8$ e $|8|=8$.

## Soma e subtração
- Sinais iguais: soma e mantém o sinal. $(-3)+(-5)=-8$.
- Sinais diferentes: subtrai e fica o sinal do maior módulo. $7+(-10)=-3$.
- Subtrair é somar o oposto: $5-(-3)=5+3=8$.

## Multiplicação e divisão (regra dos sinais)
Sinais iguais dão **positivo**; sinais diferentes dão **negativo**.
$(-4)(-6)=24$ e $(-20)\div5=-4$.

## Potências
$(-2)^3=-8$ (expoente ímpar mantém o negativo) e $(-2)^2=4$.

## Problema
Termômetro em $-3^\circ\text{C}$, sobe 8 e depois cai 10: $-3+8-10=-5^\circ\text{C}$.

## Erros comuns
- Achar que $-5>-1$ porque 5 é maior que 1.
- Esquecer o sinal ao subtrair um número negativo.`,
    questoes: [
      q('facil', 'Qual é o módulo de −8?', ['−8', '8', '0', '−1/8'], 1, 'O módulo é a distância até o zero, sempre positiva: |−8| = 8.'),
      q('facil', 'Quanto é (−3) + (−5)?', ['8', '−2', '−8', '2'], 2, 'Sinais iguais: somam-se os módulos e mantém-se o sinal: −8.'),
      q('facil', 'Quanto é 7 + (−10)?', ['3', '−3', '17', '−17'], 1, 'Sinais diferentes: 10 − 7 = 3, com o sinal do maior módulo (negativo): −3.'),
      q('medio', 'Quanto é (−4) × (−6)?', ['−24', '24', '−10', '10'], 1, 'Dois sinais iguais (negativos) dão produto positivo: 24.'),
      q('medio', 'Quanto é (−20) ÷ 5?', ['4', '−4', '−15', '−100'], 1, 'Sinais diferentes dão resultado negativo: −4.'),
      q('medio', 'Quanto é 5 − (−3)?', ['2', '−2', '8', '−8'], 2, 'Subtrair um negativo é somar o oposto: 5 + 3 = 8.'),
      q('dificil', 'A temperatura de uma cidade era de −3 °C, subiu 8 °C e depois caiu 10 °C. Qual é a temperatura final?', ['5 °C', '−5 °C', '−1 °C', '15 °C'], 1, '−3 + 8 = 5 e 5 − 10 = −5 °C.'),
      q('dificil', 'Quanto é (−2)³?', ['−6', '6', '−8', '8'], 2, '(−2) × (−2) × (−2) = 4 × (−2) = −8.'),
    ],
  },
  {
    topic: 'numeros-racionais', grade: '7º ano', title: 'Números racionais', subtitle: 'Frações e decimais, positivos e negativos, e operações',
    resumo: String.raw`## Definição
Racional é todo número que se escreve como fração $\frac{a}{b}$, com $a$ e $b$ inteiros e $b\neq0$. Inclui inteiros, decimais exatos ($0{,}75=\frac{3}{4}$) e dízimas periódicas ($0{,}333\ldots=\frac{1}{3}$).

## Conversões
$\frac{1}{4}=0{,}25$ e $-\frac{3}{4}=-0{,}75$. Fração geratriz de $0{,}333\ldots$ é $\frac{1}{3}$.

## Comparar e ordenar
Na reta, o maior fica à direita. Entre números negativos, **o menor módulo é o maior número**: $-\frac{1}{3}>-\frac{1}{2}$.

Ordem crescente: $-1{,}5<-\frac{2}{3}<0$.

## Operações
- $-\frac{1}{2}+\frac{3}{4}=-\frac{2}{4}+\frac{3}{4}=\frac{1}{4}$.
- $\left(-\frac{2}{3}\right)\cdot\frac{9}{4}=-\frac{18}{12}=-\frac{3}{2}$.
- $0{,}2+\frac{1}{4}=0{,}2+0{,}25=0{,}45$.

## Erros comuns
- Achar que $-\frac{1}{2}>-\frac{1}{3}$.
- Somar frações com denominadores diferentes sem igualar os denominadores.`,
    questoes: [
      q('facil', 'Qual é a representação decimal de 1/4?', ['0,14', '0,25', '0,4', '2,5'], 1, 'Dividindo 1 por 4 obtém-se 0,25, que equivale a 25/100.'),
      q('facil', 'Qual decimal corresponde a −3/4?', ['−0,34', '−0,75', '−1,33', '0,75'], 1, '3 ÷ 4 = 0,75, e o sinal negativo se mantém: −0,75.'),
      q('facil', 'Qual é o maior número: −1/2 ou −1/3?', ['−1/2', '−1/3', 'São iguais', 'Não é possível comparar'], 1, '−1/3 ≈ −0,33 e −1/2 = −0,5. Entre negativos, o de menor módulo é maior: −1/3.'),
      q('medio', 'Qual é a fração geratriz da dízima 0,333...?', ['3/10', '1/3', '33/100', '1/30'], 1, 'A dízima 0,333... é igual a 1/3.'),
      q('medio', 'Qual das sequências está em ordem crescente?', ['−1,5; −2/3; 0', '0; −2/3; −1,5', '−2/3; −1,5; 0', '−1,5; 0; −2/3'], 0, 'O mais à esquerda na reta é o menor: −1,5 < −2/3 ≈ −0,67 < 0.'),
      q('medio', 'Quanto é −1/2 + 3/4?', ['1/4', '5/4', '−1/4', '2/6'], 0, '−1/2 = −2/4. Então −2/4 + 3/4 = 1/4.'),
      q('dificil', 'Quanto é (−2/3) × (9/4)?', ['3/2', '−3/2', '−11/12', '18/7'], 1, 'Multiplicando: −18/12 = −3/2. Sinais diferentes dão resultado negativo.'),
      q('dificil', 'Quanto é 0,2 + 1/4?', ['0,45', '0,6', '0,3', '1,25'], 0, '1/4 = 0,25. Então 0,2 + 0,25 = 0,45.'),
    ],
  },
  {
    topic: 'triangulos', grade: '7º ano', title: 'Triângulos e seus ângulos', subtitle: 'Classificação, desigualdade triangular e ângulo externo',
    resumo: String.raw`## Classificação pelos lados
- **Equilátero:** 3 lados iguais. **Isósceles:** 2 lados iguais. **Escaleno:** 3 lados diferentes.

## Classificação pelos ângulos
- **Acutângulo:** 3 ângulos agudos. **Retângulo:** um ângulo de $90^\circ$. **Obtusângulo:** um ângulo obtuso.

## Soma dos ângulos internos
Sempre $180^\circ$. Se dois ângulos são $50^\circ$ e $60^\circ$, o terceiro é $70^\circ$.

## Isósceles
Os ângulos da base são iguais. Com ângulo do vértice de $40^\circ$, os da base medem $\frac{180-40}{2}=70^\circ$ cada.

## Desigualdade triangular
Cada lado é **menor que a soma** dos outros dois. Lados 3, 4 e 8 **não** formam triângulo, pois $3+4<8$.

Com lados 7 e 10, o terceiro $x$ satisfaz $3<x<17$. O maior valor inteiro é 16.

## Ângulo externo
É igual à **soma dos dois internos não adjacentes**. Se o externo é $120^\circ$ e um interno não adjacente é $80^\circ$, o outro mede $40^\circ$.

## Erros comuns
- Esquecer a desigualdade triangular.
- Não dividir por 2 ao achar os ângulos da base.`,
    questoes: [
      q('facil', 'Como se chama o triângulo que tem os três lados iguais?', ['Escaleno', 'Isósceles', 'Equilátero', 'Retângulo'], 2, 'Equilátero: três lados (e três ângulos de 60°) iguais.'),
      q('facil', 'Qual é a soma dos ângulos internos de qualquer triângulo?', ['90°', '180°', '270°', '360°'], 1, 'Em qualquer triângulo, os três ângulos internos somam sempre 180°.'),
      q('facil', 'Um triângulo com um ângulo de 90° é chamado de:', ['acutângulo', 'obtusângulo', 'retângulo', 'equilátero'], 2, 'Triângulo retângulo tem um ângulo reto.'),
      q('medio', 'Dois ângulos de um triângulo medem 50° e 60°. Quanto mede o terceiro?', ['60°', '70°', '80°', '110°'], 1, '180° − 50° − 60° = 70°.'),
      q('medio', 'É possível formar um triângulo com lados 3 cm, 4 cm e 8 cm?', ['Sim, pois todos são positivos', 'Não, pois 3 + 4 < 8', 'Sim, pois 8 < 3 · 4', 'Não, pois os lados são diferentes'], 1, 'A soma dos dois menores (7) precisa ser maior que o maior lado (8). Como 7 < 8, não forma triângulo.'),
      q('medio', 'Em um triângulo isósceles, o ângulo do vértice mede 40°. Quanto mede cada ângulo da base?', ['40°', '70°', '80°', '140°'], 1, 'Restam 180° − 40° = 140°, divididos igualmente nos dois ângulos da base: 70° cada.'),
      q('dificil', 'Um ângulo externo de um triângulo mede 120° e um dos ângulos internos não adjacentes mede 80°. Quanto mede o outro interno não adjacente?', ['30°', '40°', '60°', '80°'], 1, 'O externo é a soma dos dois internos não adjacentes: 120° = 80° + x, então x = 40°.'),
      q('dificil', 'Dois lados de um triângulo medem 7 cm e 10 cm. Qual é o maior valor inteiro possível para o terceiro lado?', ['3 cm', '16 cm', '17 cm', '18 cm'], 1, 'O terceiro lado deve ser menor que 7 + 10 = 17, então o maior inteiro é 16 cm.'),
    ],
  },
  {
    topic: 'produtos-notaveis', grade: '8º ano', title: 'Cálculo algébrico e produtos notáveis', subtitle: 'Quadrado da soma e da diferença, diferença de quadrados e fatoração',
    resumo: String.raw`## Produtos notáveis
$$(a+b)^2=a^2+2ab+b^2$$
$$(a-b)^2=a^2-2ab+b^2$$
$$(a+b)(a-b)=a^2-b^2$$

Exemplos: $(x+3)^2=x^2+6x+9$ e $(x-5)^2=x^2-10x+25$.

**Atenção:** $(a+b)^2\neq a^2+b^2$. Falta o termo do meio, $2ab$.

## Fatoração
- **Fator comum:** $3x+6=3(x+2)$.
- **Diferença de quadrados:** $x^2-16=(x+4)(x-4)$.

## Cálculo mental
$99^2=(100-1)^2=10000-200+1=9801$.

## Outros casos
$(2x+1)^2=4x^2+4x+1$.

Se $x+y=10$ e $x-y=2$, então $x^2-y^2=(x+y)(x-y)=20$.

## Por que funciona
Pense em um quadrado de lado $a+b$: ele se divide em um quadrado $a^2$, um quadrado $b^2$ e dois retângulos $ab$. Por isso a área total é $a^2+2ab+b^2$.

## Erros comuns
- Esquecer o termo $2ab$.
- Errar o sinal do termo do meio em $(a-b)^2$.`,
    questoes: [
      q('facil', 'Qual é o resultado de (x + 3)²?', ['x² + 9', 'x² + 6x + 9', 'x² + 3x + 9', 'x² + 6x + 6'], 1, '(x + 3)² = x² + 2·x·3 + 3² = x² + 6x + 9. A opção x² + 9 esquece o termo do meio.'),
      q('facil', 'O produto (a − b)(a + b) é igual a:', ['a² + b²', 'a² − b²', 'a² − 2ab + b²', '2a'], 1, 'É a diferença de quadrados: a² − b².'),
      q('facil', 'Como se fatora 3x + 6?', ['3(x + 2)', '3(x + 6)', 'x(3 + 6)', '9x'], 0, 'O fator comum é 3: 3x + 6 = 3(x + 2).'),
      q('medio', 'Qual é o resultado de (x − 5)²?', ['x² − 25', 'x² − 10x + 25', 'x² + 10x + 25', 'x² − 5x + 25'], 1, '(x − 5)² = x² − 2·5·x + 25 = x² − 10x + 25.'),
      q('medio', 'Como se fatora x² − 16?', ['(x − 4)²', '(x + 4)(x − 4)', '(x − 8)(x + 2)', 'x(x − 16)'], 1, 'É uma diferença de quadrados: x² − 4² = (x + 4)(x − 4).'),
      q('medio', 'Usando (100 − 1)², quanto é 99²?', ['9 701', '9 801', '9 901', '9 999'], 1, '(100 − 1)² = 10 000 − 200 + 1 = 9 801.'),
      q('dificil', 'Qual é o desenvolvimento de (2x + 1)²?', ['4x² + 1', '4x² + 2x + 1', '4x² + 4x + 1', '2x² + 4x + 1'], 2, '(2x)² + 2·2x·1 + 1² = 4x² + 4x + 1.'),
      q('dificil', 'Se x + y = 10 e x − y = 2, quanto vale x² − y²?', ['8', '12', '20', '100'], 2, 'x² − y² = (x + y)(x − y) = 10 · 2 = 20.'),
    ],
  },
  {
    topic: 'sistemas-de-equacoes', grade: '8º ano', title: 'Sistemas de equações do 1º grau', subtitle: 'Métodos da adição e da substituição e problemas',
    resumo: String.raw`## O que é
Um sistema de duas equações com duas incógnitas pede valores de $x$ e $y$ que satisfaçam as **duas** ao mesmo tempo.

## Método da adição
$$\begin{cases}x+y=10\\x-y=2\end{cases}$$
Somando: $2x=12\Rightarrow x=6$. Depois $y=10-6=4$. Solução $(6,4)$.

## Método da substituição
$$\begin{cases}y=2x\\x+y=27\end{cases}$$
Substitua: $x+2x=27\Rightarrow x=9$ e $y=18$.

## Conferir
Sempre teste na outra equação. $(2,1)$ é solução de $x+y=3$ e $x-y=1$: $2+1=3$ e $2-1=1$. ✔

## Problema
Em um estacionamento há 20 veículos, entre carros (4 rodas) e motos (2 rodas), com 56 rodas no total.
$c+m=20$ e $4c+2m=56$. Da primeira, $m=20-c$: $4c+40-2c=56\Rightarrow c=8$ carros e $m=12$ motos.

## Erros comuns
- Resolver só uma equação e esquecer a outra.
- Errar o sinal ao subtrair equações.
- Não verificar a solução.`,
    questoes: [
      q('facil', 'Qual é a solução do sistema x + y = 10 e x − y = 2?', ['(5, 5)', '(6, 4)', '(4, 6)', '(8, 2)'], 1, 'Somando: 2x = 12, então x = 6 e y = 4. Conferindo: 6 + 4 = 10 e 6 − 4 = 2.'),
      q('facil', 'Se x = 3 na equação x + y = 7, qual é o valor de y?', ['3', '4', '10', '21'], 1, 'Substituindo x = 3: 3 + y = 7, então y = 7 − 3 = 4.'),
      q('facil', 'O par (2, 1) é solução do sistema x + y = 3 e x − y = 1?', ['Sim, pois satisfaz as duas equações', 'Não, pois só satisfaz a primeira', 'Não, pois só satisfaz a segunda', 'Não, pois não satisfaz nenhuma'], 0, '2 + 1 = 3 e 2 − 1 = 1. As duas são verdadeiras.'),
      q('medio', 'Resolvendo x + y = 12 e 2x + y = 20, obtém-se:', ['x = 8 e y = 4', 'x = 4 e y = 8', 'x = 10 e y = 2', 'x = 6 e y = 6'], 0, 'Subtraindo a primeira da segunda: x = 8. Então y = 12 − 8 = 4.'),
      q('medio', 'A soma de dois números é 30 e a diferença entre eles é 6. Qual é o maior?', ['12', '15', '18', '24'], 2, 'x + y = 30 e x − y = 6. Somando: 2x = 36, então x = 18 (e y = 12).'),
      q('medio', 'Se y = 2x e x + y = 27, qual é o valor de x?', ['9', '13,5', '18', '27'], 0, 'Substituindo: x + 2x = 27, logo 3x = 27 e x = 9.'),
      q('dificil', 'Em um estacionamento há 20 veículos, entre carros (4 rodas) e motos (2 rodas), com 56 rodas no total. Quantos são os carros?', ['8', '12', '16', '18'], 0, 'c + m = 20 e 4c + 2m = 56. Substituindo m = 20 − c: 2c + 40 = 56, então c = 8 (e m = 12).'),
      q('dificil', 'Foram vendidos 15 ingressos, entre adultos (R$ 20) e crianças (R$ 10), somando R$ 230. Quantos ingressos de adulto foram vendidos?', ['5', '7', '8', '10'], 2, 'a + c = 15 e 20a + 10c = 230. Então 10a + 150 = 230, logo a = 8 (e c = 7).'),
    ],
  },
  {
    topic: 'volume-de-prismas-e-cilindros', grade: '8º ano', title: 'Volume de prismas e cilindros', subtitle: 'Volume, capacidade e conversão de unidades',
    resumo: String.raw`## Ideia geral
O volume de um prisma ou de um cilindro é a **área da base** vezes a **altura**:
$$V=A_b\cdot h$$

## Cubo e bloco retangular
- Cubo de aresta $a$: $V=a^3$. Aresta 3: $V=27$.
- Bloco $a\times b\times c$: $V=a\cdot b\cdot c$. $2\times3\times4=24$.

## Cilindro
$$V=\pi r^2h$$
Com $r=3$, $h=10$ e $\pi\approx3$: $V=3\cdot9\cdot10=270$.

## Unidades
$1\ \text{dm}^3=1\ \text{L}$ e $1\ \text{m}^3=1000\ \text{L}$. Um reservatório de $2\ \text{m}^3$ comporta $2000$ litros.

## Relações
Se a aresta de um cubo **dobra**, o volume fica **8 vezes** maior ($2^3=8$).

## Aplicação
Reservatório cilíndrico de $r=1$ m e $h=2$ m, com $\pi\approx3{,}14$: $V=3{,}14\cdot1\cdot2=6{,}28\ \text{m}^3$, ou $6\,280$ litros.

## Erros comuns
- Confundir volume ($\text{cm}^3$) com área ($\text{cm}^2$).
- Esquecer de elevar o raio ao quadrado.
- Converter errado entre $\text{m}^3$ e litros.`,
    questoes: [
      q('facil', 'Qual é o volume de um cubo de aresta 3 cm?', ['9 cm³', '18 cm³', '27 cm³', '81 cm³'], 2, 'V = a³ = 3 × 3 × 3 = 27 cm³.'),
      q('facil', 'Qual é o volume de um bloco retangular de 2 cm × 3 cm × 4 cm?', ['9 cm³', '12 cm³', '24 cm³', '48 cm³'], 2, 'V = 2 × 3 × 4 = 24 cm³.'),
      q('facil', '1 dm³ corresponde a quantos litros?', ['1 mililitro', '1 litro', '10 litros', '100 litros'], 1, '1 decímetro cúbico equivale a 1 litro.'),
      q('medio', 'Uma caixa-d\'água em forma de bloco mede 2 m × 1 m × 1 m. Quantos litros ela comporta?', ['200 L', '2 000 L', '20 000 L', '2 L'], 1, 'V = 2 m³, e 1 m³ = 1 000 L, então 2 000 L.'),
      q('medio', 'Um prisma tem base de área 12 cm² e altura 5 cm. Qual é o volume?', ['17 cm³', '60 cm³', '120 cm³', '30 cm³'], 1, 'V = área da base × altura = 12 × 5 = 60 cm³.'),
      q('medio', 'Qual é o volume de um cilindro de raio 3 cm e altura 10 cm, usando π = 3?', ['90 cm³', '180 cm³', '270 cm³', '900 cm³'], 2, 'V = π · r² · h = 3 · 9 · 10 = 270 cm³.'),
      q('dificil', 'Se a aresta de um cubo dobra, o volume fica:', ['2 vezes maior', '4 vezes maior', '6 vezes maior', '8 vezes maior'], 3, 'O volume depende da aresta ao cubo: 2³ = 8 vezes maior.'),
      q('dificil', 'Um reservatório cilíndrico tem raio 1 m e altura 2 m. Usando π = 3,14, quantos litros ele comporta?', ['628 L', '6 280 L', '62 800 L', '12 560 L'], 1, 'V = 3,14 · 1² · 2 = 6,28 m³, que são 6 280 L.'),
    ],
  },
  {
    topic: 'probabilidade-e-estatistica-8', grade: '8º ano', title: 'Probabilidade e estatística', subtitle: 'Média, mediana, moda, amplitude e probabilidade simples',
    resumo: String.raw`## Medidas de tendência central
- **Média:** soma dos valores dividida pela quantidade. Média de 4, 6 e 8: $\frac{18}{3}=6$.
- **Mediana:** valor do meio, com os dados **em ordem**. De 1, 3, 5 é 3. Com quantidade par, é a média dos dois centrais: de 2, 4, 6, 10 é $\frac{4+6}{2}=5$.
- **Moda:** o valor que **mais se repete**. De 2, 3, 3, 5, 7 é 3.

## Amplitude
Maior valor menos menor valor. De 3, 12, 7, 20, 9: $20-3=17$.

## Probabilidade simples
$$P=\frac{\text{casos favoráveis}}{\text{casos possíveis}}$$
Dado de 6 faces, número maior que 4 (5 ou 6): $\frac{2}{6}=\frac{1}{3}$.

## Usando a média
Notas 6, 7, 8 e 9: $\frac{30}{4}=7{,}5$.

Se 5 números têm média 8 (soma 40) e retira-se o 10, a soma passa a 30 e a média dos 4 restantes é $7{,}5$.

## Erros comuns
- Achar a mediana sem ordenar os dados.
- Dividir pela quantidade errada.`,
    questoes: [
      q('facil', 'Qual é a média dos números 4, 6 e 8?', ['5', '6', '7', '18'], 1, '(4 + 6 + 8) / 3 = 18 / 3 = 6.'),
      q('facil', 'Qual é a moda do conjunto 2, 3, 3, 5, 7?', ['2', '3', '5', '7'], 1, 'A moda é o valor que mais aparece: o 3, duas vezes.'),
      q('facil', 'Qual é a mediana do conjunto 1, 3, 5?', ['1', '3', '5', '9'], 1, 'Com os dados em ordem, o valor central é 3.'),
      q('medio', 'Qual é a mediana de 2, 4, 6 e 10?', ['4', '5', '6', '10'], 1, 'Com quantidade par de dados, é a média dos dois centrais: (4 + 6) / 2 = 5.'),
      q('medio', 'Um aluno tirou 6, 7, 8 e 9. Qual é a média das notas?', ['7', '7,5', '8', '30'], 1, '(6 + 7 + 8 + 9) / 4 = 30 / 4 = 7,5.'),
      q('medio', 'Ao lançar um dado de 6 faces, qual é a probabilidade de sair um número maior que 4?', ['1/6', '1/3', '1/2', '2/3'], 1, 'Os favoráveis são 5 e 6 (2 casos) entre 6: 2/6 = 1/3.'),
      q('dificil', 'A média de 5 números é 8. Retirando o número 10, qual passa a ser a média dos 4 restantes?', ['7', '7,5', '8', '6,25'], 1, 'A soma era 5 × 8 = 40. Sem o 10 fica 30, e 30 / 4 = 7,5.'),
      q('dificil', 'Qual é a amplitude do conjunto 3, 12, 7, 20, 9?', ['17', '20', '9', '11'], 0, 'Amplitude = maior − menor = 20 − 3 = 17.'),
    ],
  },
];
