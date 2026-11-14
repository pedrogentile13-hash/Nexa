import { q, type PacoteSeed } from './helpers';

export const MATEMATICA: PacoteSeed[] = [
  {
    topic: 'fracoes', grade: '6º ano', title: 'Frações: conceito e operações', subtitle: 'Parte, todo e como somar, multiplicar e dividir frações',
    resumo: String.raw`## O que é uma fração
Uma fração $\frac{a}{b}$ representa **a** partes de um todo dividido em **b** partes iguais. O número de baixo (denominador) diz em quantas partes o todo foi dividido; o de cima (numerador) diz quantas partes foram tomadas.

**Frações equivalentes** representam a mesma quantidade: $\frac{1}{2}=\frac{2}{4}=\frac{3}{6}$. Para obter uma, multiplique (ou divida) numerador e denominador pelo mesmo número.

## Operações
- **Soma e subtração com o mesmo denominador:** mantém o denominador e opera os numeradores. $\frac{1}{5}+\frac{2}{5}=\frac{3}{5}$.
- **Denominadores diferentes:** reduza ao mesmo denominador (use o MMC). $\frac{1}{2}+\frac{1}{3}=\frac{3}{6}+\frac{2}{6}=\frac{5}{6}$.
- **Multiplicação:** numerador com numerador, denominador com denominador. $\frac{3}{4}\times\frac{2}{5}=\frac{6}{20}=\frac{3}{10}$.
- **Divisão:** multiplique pelo **inverso** da segunda fração. $\frac{2}{3}\div\frac{4}{9}=\frac{2}{3}\times\frac{9}{4}=\frac{18}{12}=\frac{3}{2}$.

## Exemplo resolvido
Quanto é $\frac{3}{4}$ de 20? Divida 20 em 4 partes (5) e tome 3: $3\times5=15$.

## Erros comuns
- Somar denominadores: $\frac{1}{2}+\frac{1}{3}\neq\frac{2}{5}$.
- Esquecer de **simplificar** o resultado no final.
- Na divisão, inverter a primeira fração em vez da segunda.`,
    questoes: [
      q('facil', 'Qual fração representa 3 pedaços de uma pizza dividida em 8 pedaços iguais?', ['3/8', '8/3', '3/5', '5/8'], 0, 'O numerador é a quantidade de pedaços tomados (3) e o denominador é o total de partes (8): 3/8.'),
      q('facil', 'Qual fração é equivalente a 2/3?', ['3/4', '4/6', '2/6', '4/9'], 1, 'Multiplicando numerador e denominador de 2/3 por 2, obtém-se 4/6. As outras mudam o valor da fração.'),
      q('facil', 'Quanto é 1/5 + 2/5?', ['3/10', '2/5', '3/5', '3/25'], 2, 'Com o mesmo denominador, mantém-se o 5 e somam-se os numeradores: 1 + 2 = 3, ou seja, 3/5.'),
      q('medio', 'Quanto é 1/2 + 1/3?', ['2/5', '1/6', '2/6', '5/6'], 3, 'O MMC de 2 e 3 é 6. Então 1/2 = 3/6 e 1/3 = 2/6, e a soma é 5/6. Somar os denominadores (2/5) é o erro mais comum.'),
      q('medio', 'Quanto é 3/4 × 2/5, na forma mais simples?', ['3/10', '5/9', '6/9', '3/20'], 0, 'Multiplicam-se os numeradores (3 × 2 = 6) e os denominadores (4 × 5 = 20): 6/20. Simplificando por 2, resulta 3/10.'),
      q('medio', 'Quanto é 2/3 ÷ 4/9?', ['8/27', '3/2', '1/3', '2/9'], 1, 'Divisão é multiplicação pelo inverso: 2/3 × 9/4 = 18/12 = 3/2. Inverter a primeira fração dá outro resultado.'),
      q('dificil', 'João comeu 1/4 de uma barra de chocolate e Maria comeu 1/3 da mesma barra. Que fração da barra restou?', ['5/12', '7/12', '2/7', '1/12'], 0, 'Juntos comeram 1/4 + 1/3 = 3/12 + 4/12 = 7/12. Restaram 1 − 7/12 = 5/12. A alternativa 7/12 é o que foi comido, não o que restou.'),
      q('dificil', 'Uma torneira enche 1/6 de um tanque por hora. Em quantas horas ela enche 3/4 do tanque?', ['2 horas', '4,5 horas', '6 horas', '9 horas'], 1, 'Tempo = quantidade ÷ ritmo = (3/4) ÷ (1/6) = 3/4 × 6 = 18/4 = 4,5 horas.'),
    ],
  },
  {
    topic: 'equacoes-do-1o-grau', grade: '7º ano', title: 'Equações do 1º grau', subtitle: 'Como isolar a incógnita sem errar o sinal',
    resumo: String.raw`## Ideia central
Uma equação é uma igualdade com um valor desconhecido (a **incógnita**). Resolver é descobrir o valor que torna a igualdade verdadeira. A equação funciona como uma **balança em equilíbrio**: tudo o que se faz de um lado precisa ser feito do outro.

## Passo a passo
1. Reúna os termos com $x$ de um lado e os números do outro (trocar de lado = inverter a operação).
2. Reduza os termos semelhantes.
3. Divida pelo coeficiente de $x$.
4. **Confira** substituindo o valor na equação original.

## Exemplo resolvido
$5x+3=2x+18$
$5x-2x=18-3$
$3x=15 \Rightarrow x=5$

Conferindo: $5\cdot5+3=28$ e $2\cdot5+18=28$. ✔

## Com parênteses
$3(x-2)=12 \Rightarrow 3x-6=12 \Rightarrow 3x=18 \Rightarrow x=6$. Aplique a **propriedade distributiva** antes de isolar $x$.

## Problemas com texto
Dê um nome ao que não se sabe (por exemplo, $x$ = o número), traduza a frase em equação e resolva. "O dobro de um número mais 5" vira $2x+5$.

## Erros comuns
- Mudar de lado sem trocar o sinal.
- Esquecer de multiplicar **todos** os termos do parêntese.
- Não conferir o resultado.`,
    questoes: [
      q('facil', 'Qual é a solução de x + 7 = 12?', ['19', '5', '7', '12'], 1, 'Subtrai-se 7 dos dois lados: x = 12 − 7 = 5.'),
      q('facil', 'Qual é a solução de 3x = 18?', ['15', '21', '6', '54'], 2, 'Divide-se os dois lados por 3: x = 18 ÷ 3 = 6.'),
      q('facil', 'Qual é a solução de 2x − 4 = 10?', ['3', '5', '7', '14'], 2, 'Soma-se 4 aos dois lados: 2x = 14. Depois divide-se por 2: x = 7.'),
      q('medio', 'Qual é a solução de 5x + 3 = 2x + 18?', ['3', '5', '7', '15'], 1, 'Passando 2x para a esquerda e 3 para a direita: 3x = 15, logo x = 5. Conferindo: 28 dos dois lados.'),
      q('medio', 'Qual é a solução de 3(x − 2) = 12?', ['2', '4', '6', '10'], 2, 'Distribuindo: 3x − 6 = 12, então 3x = 18 e x = 6. O erro comum é multiplicar só o x por 3 e esquecer de multiplicar o 2.'),
      q('medio', 'Qual é a solução de x/4 + 1 = 6?', ['5', '20', '24', '28'], 1, 'Subtrai-se 1: x/4 = 5. Multiplica-se por 4: x = 20.'),
      q('dificil', 'O dobro de um número, mais 5, é igual ao triplo desse número menos 3. Qual é o número?', ['2', '8', '11', '16'], 1, 'Equação: 2x + 5 = 3x − 3. Então 5 + 3 = 3x − 2x, logo x = 8. Conferindo: 2·8 + 5 = 21 e 3·8 − 3 = 21.'),
      q('dificil', 'A soma de três números inteiros consecutivos é 72. Qual é o menor deles?', ['22', '23', '24', '25'], 1, 'Os números são x, x + 1 e x + 2. A soma 3x + 3 = 72 dá x = 23 (23 + 24 + 25 = 72).'),
    ],
  },
  {
    topic: 'potenciacao-e-notacao-cientifica', grade: '8º ano', title: 'Potenciação e notação científica', subtitle: 'Propriedades das potências e como escrever números muito grandes ou pequenos',
    resumo: String.raw`## Potenciação
$a^n$ significa multiplicar $a$ por ele mesmo $n$ vezes. $2^5=2\cdot2\cdot2\cdot2\cdot2=32$.

Casos especiais: $a^0=1$ (para $a\neq0$) e $a^{-n}=\frac{1}{a^n}$.

## Propriedades
- **Mesma base, multiplicação:** soma os expoentes. $2^3\cdot2^4=2^7$.
- **Mesma base, divisão:** subtrai os expoentes. $\frac{5^6}{5^2}=5^4$.
- **Potência de potência:** multiplica os expoentes. $(3^2)^3=3^6$.

## Notação científica
Um número fica na forma $a\times10^n$, com $1\le a<10$.
- $320\,000=3{,}2\times10^5$
- $0{,}00045=4{,}5\times10^{-4}$

Para voltar ao número, mova a vírgula $n$ casas para a direita (se $n>0$) ou para a esquerda (se $n<0$).

## Multiplicando em notação científica
$(2\times10^3)\times(3\times10^4)=6\times10^7$: multiplique os números e some os expoentes.

## Erros comuns
- Somar as bases em $2^3\cdot2^4$ (o resultado **não** é $4^7$).
- Achar que $a^0=0$.
- Deixar o coeficiente fora do intervalo ($45\times10^{-5}$ não está em notação científica).`,
    questoes: [
      q('facil', 'Quanto é 2⁵?', ['10', '25', '32', '64'], 2, '2⁵ = 2 × 2 × 2 × 2 × 2 = 32. A potência não é 2 × 5.'),
      q('facil', 'Quanto é 10³?', ['30', '100', '1 000', '10 000'], 2, '10³ = 10 × 10 × 10 = 1 000: um 1 seguido de três zeros.'),
      q('facil', 'Quanto é 5⁰?', ['0', '1', '5', 'Não existe'], 1, 'Qualquer número diferente de zero elevado a zero vale 1.'),
      q('medio', 'Qual é o resultado de 2³ × 2⁴?', ['2¹²', '2⁷', '4⁷', '4¹²'], 1, 'Na multiplicação de potências de mesma base, mantém-se a base e somam-se os expoentes: 3 + 4 = 7. A base não muda.'),
      q('medio', 'Qual é o resultado de (3²)³?', ['3⁵', '3⁶', '3⁹', '9⁵'], 1, 'Potência de potência: multiplicam-se os expoentes, 2 × 3 = 6. Resulta 3⁶ = 729.'),
      q('medio', 'Como se escreve 0,00045 em notação científica?', ['4,5 × 10⁻³', '4,5 × 10⁻⁴', '4,5 × 10⁴', '45 × 10⁻⁵'], 1, 'A vírgula anda 4 casas para a direita até 4,5, então o expoente é −4. A última opção tem coeficiente maior que 10.'),
      q('dificil', 'Qual número é igual a 3,2 × 10⁵?', ['32 000', '320 000', '3 200 000', '0,000032'], 1, 'Expoente positivo 5: a vírgula de 3,2 anda 5 casas para a direita, o que dá 320 000.'),
      q('dificil', 'Qual é o resultado de (2 × 10³) × (3 × 10⁴) em notação científica?', ['6 × 10⁷', '6 × 10¹²', '5 × 10⁷', '5 × 10¹²'], 0, 'Multiplicam-se os coeficientes (2 × 3 = 6) e somam-se os expoentes (3 + 4 = 7): 6 × 10⁷.'),
    ],
  },
  {
    topic: 'teorema-de-pitagoras', grade: '9º ano', title: 'Teorema de Pitágoras', subtitle: 'A relação entre os lados de um triângulo retângulo',
    resumo: String.raw`## O teorema
Em um triângulo **retângulo** (com um ângulo de 90°), o lado oposto ao ângulo reto é a **hipotenusa** (sempre o maior). Os outros dois são os **catetos**.

$$a^2=b^2+c^2$$

onde $a$ é a hipotenusa e $b$, $c$ são os catetos: o quadrado da hipotenusa é igual à soma dos quadrados dos catetos.

## Exemplo resolvido
Catetos 3 e 4: $a^2=3^2+4^2=9+16=25$, então $a=5$.

Conhecendo a hipotenusa 13 e um cateto 5: $c^2=13^2-5^2=169-25=144$, logo $c=12$.

## Ternos pitagóricos
Trios inteiros que funcionam: $(3,4,5)$, $(5,12,13)$, $(8,15,17)$, $(7,24,25)$ e seus múltiplos, como $(6,8,10)$.

## Onde aparece
- Diagonal de um retângulo ou de um quadrado: num quadrado de lado $\ell$, a diagonal é $\ell\sqrt{2}$.
- Escadas, rampas e distâncias em mapas.

## Para testar se é retângulo
Se $a^2=b^2+c^2$ com $a$ o maior lado, o triângulo é retângulo.

## Erros comuns
- Somar os lados em vez dos **quadrados**.
- Chamar de hipotenusa um cateto.
- Esquecer de tirar a **raiz quadrada** no final.`,
    questoes: [
      q('facil', 'Em um triângulo retângulo, a hipotenusa é o lado:', ['oposto ao ângulo reto', 'adjacente ao ângulo reto', 'menor do triângulo', 'que mede sempre 90°'], 0, 'A hipotenusa fica oposta ao ângulo reto e é sempre o maior lado do triângulo retângulo.'),
      q('facil', 'Os catetos de um triângulo retângulo medem 3 e 4. Quanto mede a hipotenusa?', ['5', '6', '7', '12'], 0, 'a² = 3² + 4² = 9 + 16 = 25, então a = 5. Somar 3 + 4 = 7 é erro.'),
      q('facil', 'Os catetos medem 6 cm e 8 cm. Quanto mede a hipotenusa?', ['10 cm', '12 cm', '14 cm', '48 cm'], 0, '6² + 8² = 36 + 64 = 100, e a raiz de 100 é 10. É o terno 3, 4, 5 multiplicado por 2.'),
      q('medio', 'A hipotenusa mede 13 e um cateto mede 5. Quanto mede o outro cateto?', ['8', '12', '18', '144'], 1, 'c² = 13² − 5² = 169 − 25 = 144, então c = 12. A alternativa 144 esquece a raiz.'),
      q('medio', 'Qual é a medida da diagonal de um quadrado de lado 5?', ['10', '5√2', '25', '2√5'], 1, 'Diagonal² = 5² + 5² = 50, então a diagonal é √50 = 5√2 (cerca de 7,07).'),
      q('medio', 'Uma escada de 10 m está apoiada em uma parede, com a base a 6 m dela. A que altura da parede a escada toca?', ['4 m', '8 m', '12 m', '16 m'], 1, 'A escada é a hipotenusa: altura² = 10² − 6² = 100 − 36 = 64, então a altura é 8 m.'),
      q('dificil', 'Um terreno retangular mede 12 m por 5 m. Quanto mede a diagonal?', ['13 m', '17 m', '7 m', '√119 m'], 0, 'Diagonal² = 12² + 5² = 144 + 25 = 169, logo a diagonal é 13 m. A alternativa 17 soma os lados e 7 os subtrai.'),
      q('dificil', 'Um triângulo tem lados 7, 24 e 25. Ele é retângulo?', ['Sim, pois 7² + 24² = 25²', 'Não, pois 7 + 24 > 25', 'Não, pois 7² + 24² ≠ 25²', 'Sim, pois a soma dos lados é 56'], 0, '7² + 24² = 49 + 576 = 625 = 25². O maior lado é a hipotenusa, então o triângulo é retângulo.'),
    ],
  },
  {
    topic: 'funcao-afim', grade: '1ª série EM', title: 'Função afim', subtitle: 'f(x) = ax + b: gráfico, raiz e problemas do dia a dia',
    resumo: String.raw`## Definição
Função afim é toda função da forma $f(x)=ax+b$, com $a\neq0$. Seu gráfico é uma **reta**.

- $a$ é o **coeficiente angular** (a inclinação da reta).
- $b$ é o **coeficiente linear**: o valor de $f(0)$, onde a reta corta o eixo $y$.

## Crescente ou decrescente
- $a>0$: função **crescente** (a reta sobe).
- $a<0$: função **decrescente** (a reta desce).

## Raiz (zero da função)
É o valor de $x$ em que $f(x)=0$. Em $f(x)=2x-6$: $2x-6=0\Rightarrow x=3$. O gráfico corta o eixo $x$ em $(3,0)$.

## Determinando a função por dois pontos
Reta por $(0,1)$ e $(2,5)$:
$a=\frac{5-1}{2-0}=2$ e $b=1$, logo $f(x)=2x+1$.

## Modelagem
Corrida de táxi com bandeirada de R$ 5 e R$ 3 por km: $f(x)=3x+5$. Em 12 km: $f(12)=3\cdot12+5=41$.

## Erros comuns
- Confundir $a$ com $b$.
- Dizer que $a<0$ é crescente.
- Calcular o coeficiente angular com os pontos em ordens diferentes no numerador e no denominador.`,
    questoes: [
      q('facil', 'Se f(x) = 2x + 3, quanto vale f(4)?', ['9', '11', '14', '24'], 1, 'f(4) = 2·4 + 3 = 8 + 3 = 11.'),
      q('facil', 'Qual é o coeficiente angular de f(x) = −3x + 5?', ['5', '−3', '3', '−5'], 1, 'Em f(x) = ax + b, o coeficiente angular é a, o número que multiplica x: aqui, −3.'),
      q('facil', 'O gráfico de uma função afim é:', ['uma parábola', 'uma circunferência', 'uma reta', 'uma hipérbole'], 2, 'A função afim f(x) = ax + b tem como gráfico uma reta. A parábola é o gráfico da função quadrática.'),
      q('medio', 'Qual é a raiz da função f(x) = 2x − 6?', ['−3', '3', '6', '−6'], 1, 'A raiz é o valor de x que anula a função: 2x − 6 = 0, então x = 3.'),
      q('medio', 'Qual das funções é crescente?', ['f(x) = −2x + 1', 'f(x) = 5 − x', 'f(x) = 3x − 7', 'f(x) = −x'], 2, 'Uma função afim é crescente quando a > 0. Só f(x) = 3x − 7 tem a = 3 positivo.'),
      q('medio', 'A reta passa pelos pontos (0, 1) e (2, 5). Qual é a função?', ['f(x) = 2x + 1', 'f(x) = 4x + 1', 'f(x) = x + 1', 'f(x) = 2x + 5'], 0, 'a = (5 − 1) / (2 − 0) = 2, e como f(0) = 1, b = 1. Logo f(x) = 2x + 1.'),
      q('dificil', 'Uma corrida de táxi custa R$ 5,00 de bandeirada mais R$ 3,00 por quilômetro. Quanto custa uma corrida de 12 km?', ['R$ 36,00', 'R$ 41,00', 'R$ 60,00', 'R$ 17,00'], 1, 'A função é f(x) = 3x + 5. Em 12 km: 3·12 + 5 = 41. A alternativa R$ 36 esquece a bandeirada.'),
      q('dificil', 'Uma função afim f(x) = ax + b tem f(1) = 7 e f(3) = 15. Quanto vale f(10)?', ['43', '47', '33', '150'], 0, 'a = (15 − 7)/(3 − 1) = 4. Como f(1) = 7, 4 + b = 7 e b = 3. Então f(10) = 4·10 + 3 = 43.'),
    ],
  },
  {
    topic: 'analise-combinatoria', grade: '2ª série EM', title: 'Análise combinatória', subtitle: 'Princípio multiplicativo, permutações e combinações',
    resumo: String.raw`## Princípio fundamental da contagem
Se uma escolha pode ser feita de $m$ modos e outra, independente, de $n$ modos, as duas juntas podem ser feitas de $m\cdot n$ modos. Com 3 camisas e 2 calças há $3\cdot2=6$ combinações.

## Fatorial
$n!=n\cdot(n-1)\cdots2\cdot1$. Por exemplo, $4!=24$. Por definição, $0!=1$.

## Permutação (ordem importa, todos os elementos)
Filas com $n$ pessoas distintas: $P_n=n!$. Os anagramas de AMOR: $4!=24$.

Com repetição: anagramas de ARARA têm 3 letras A e 2 letras R:
$$\frac{5!}{3!\,2!}=10$$

## Combinação (ordem **não** importa)
$$C(n,p)=\frac{n!}{p!\,(n-p)!}$$
Comissão de 3 pessoas entre 6: $C(6,3)=20$.

## Como decidir
Pergunte: **trocar a ordem muda o resultado?**
- Sim (senha, fila, pódio): use o princípio multiplicativo ou arranjo.
- Não (comissão, time, mão de cartas): use combinação.

## Erros comuns
- Usar permutação quando a ordem não importa.
- Esquecer de dividir pelas repetições nos anagramas.
- Confundir "com repetição" (senha de 3 dígitos: $10^3$) com "sem repetição".`,
    questoes: [
      q('facil', 'Com 3 camisas e 2 calças diferentes, de quantos modos é possível se vestir usando uma camisa e uma calça?', ['5', '6', '3', '8'], 1, 'Pelo princípio multiplicativo: 3 × 2 = 6. Somar (5) é o erro mais comum.'),
      q('facil', 'Quanto vale 4! (quatro fatorial)?', ['16', '10', '24', '12'], 2, '4! = 4 × 3 × 2 × 1 = 24.'),
      q('facil', 'De quantas maneiras diferentes 3 pessoas podem formar uma fila?', ['3', '6', '9', '27'], 1, 'É uma permutação: 3! = 3 × 2 × 1 = 6.'),
      q('medio', 'Quantos anagramas tem a palavra AMOR?', ['12', '16', '24', '4'], 2, 'As 4 letras são diferentes, então são 4! = 24 anagramas.'),
      q('medio', 'Quanto vale a combinação C(5, 2)?', ['20', '10', '7', '25'], 1, 'C(5,2) = 5! / (2! · 3!) = 120 / 12 = 10. A alternativa 20 é 5 × 4, que conta a ordem.'),
      q('medio', 'Uma senha tem 3 dígitos de 0 a 9, com repetição permitida. Quantas senhas existem?', ['30', '720', '1 000', '100'], 2, 'Cada dígito tem 10 possibilidades: 10 × 10 × 10 = 1 000. Sem repetição seria 720.'),
      q('dificil', 'Quantos anagramas tem a palavra ARARA?', ['120', '60', '10', '20'], 2, 'São 5 letras, com A repetida 3 vezes e R 2 vezes: 5! / (3! · 2!) = 120 / 12 = 10.'),
      q('dificil', 'Quantas comissões de 3 pessoas podem ser formadas com 6 candidatos?', ['120', '20', '18', '216'], 1, 'A ordem não importa: C(6,3) = 6! / (3! · 3!) = 720 / 36 = 20. A alternativa 120 conta a ordem (arranjo).'),
    ],
  },
];
