import { q, type PacoteSeed } from './helpers';

export const LOTE3_MAT_B: PacoteSeed[] = [
  {
    topic: 'logaritmos', grade: '1ª série EM', title: 'Logaritmos', subtitle: 'Definição, propriedades e equações logarítmicas',
    resumo: String.raw`## Definição
$$\log_b a=x\iff b^x=a\qquad(a>0,\ b>0,\ b\neq1)$$
O logaritmo é o **expoente** a que se eleva a base para obter o número. $\log_2 8=3$, pois $2^3=8$. Sem base escrita, é base 10: $\log100=2$.

## Valores especiais
$\log_b1=0$ e $\log_bb=1$. Também $\log_2\frac{1}{4}=-2$.

## Propriedades
$$\log(ab)=\log a+\log b\qquad\log\frac{a}{b}=\log a-\log b\qquad\log a^n=n\log a$$
Exemplos: $\log2+\log5=\log10=1$ e $\log8=\log2^3=3\log2$. Se $\log2\approx0{,}3$, então $\log8\approx0{,}9$.

## Equação logarítmica
$\log_2x=5\Rightarrow x=2^5=32$.

## Aplicações
Escala Richter, pH, decibéis e juros compostos usam logaritmos, porque comprimem números enormes em uma escala pequena.

## Erros comuns
- Achar que $\log(a+b)=\log a+\log b$ (a soma de logs é o log do **produto**).
- Esquecer a condição $a>0$.`,
    questoes: [
      q('facil', 'Quanto vale log₂ 8?', ['2', '3', '4', '8'], 1, 'Quanto devo elevar 2 para obter 8? 2³ = 8, então o logaritmo é 3.'),
      q('facil', 'Quanto vale log 100 (base 10)?', ['1', '2', '10', '100'], 1, '10² = 100, então log 100 = 2.'),
      q('facil', 'Quanto vale log₅ 1?', ['0', '1', '5', 'Não existe'], 0, 'Em qualquer base, o logaritmo de 1 é 0, pois b⁰ = 1.'),
      q('medio', 'Quanto vale log₃ 81?', ['3', '4', '9', '27'], 1, '3⁴ = 81, então log₃ 81 = 4.'),
      q('medio', 'Quanto vale log 2 + log 5 (base 10)?', ['0', '1', 'log 7', '10'], 1, 'Soma de logaritmos é o logaritmo do produto: log(2 · 5) = log 10 = 1.'),
      q('medio', 'Quanto vale log₂ (1/4)?', ['2', '−2', '4', '−4'], 1, '2⁻² = 1/4, então o logaritmo é −2.'),
      q('dificil', 'Sabendo que log 2 ≈ 0,3, qual é o valor aproximado de log 8?', ['0,6', '0,9', '1,2', '2,4'], 1, 'log 8 = log 2³ = 3 · log 2 ≈ 3 · 0,3 = 0,9.'),
      q('dificil', 'Qual é a solução da equação log₂ x = 5?', ['10', '25', '32', '64'], 2, 'Pela definição, x = 2⁵ = 32.'),
    ],
  },
  {
    topic: 'trigonometria-no-ciclo', grade: '2ª série EM', title: 'Trigonometria no ciclo trigonométrico', subtitle: 'Radianos, seno, cosseno e relação fundamental',
    resumo: String.raw`## Radianos
$\pi\ \text{rad}=180^\circ$. Então $90^\circ=\frac{\pi}{2}$, $60^\circ=\frac{\pi}{3}$, $30^\circ=\frac{\pi}{6}$ e $360^\circ=2\pi$.

## O ciclo
Circunferência de raio 1. Para um arco $\alpha$, o **cosseno** é a coordenada $x$ e o **seno** é a coordenada $y$ do ponto.

## Valores
| ângulo | $0^\circ$ | $90^\circ$ | $180^\circ$ | $270^\circ$ |
|---|---|---|---|---|
| seno | 0 | 1 | 0 | $-1$ |
| cosseno | 1 | 0 | $-1$ | 0 |

## Sinais por quadrante
1º: seno e cosseno positivos. 2º: seno positivo, cosseno negativo. 3º: os dois negativos. 4º: seno negativo, cosseno positivo.

## Redução ao 1º quadrante
$\operatorname{sen}210^\circ$: está no 3º quadrante (seno negativo) e $210^\circ-180^\circ=30^\circ$, logo $\operatorname{sen}210^\circ=-\frac{1}{2}$.

## Relação fundamental
$$\operatorname{sen}^2x+\cos^2x=1$$
Se $\operatorname{sen}x=\frac{3}{5}$ no 1º quadrante, $\cos x=\frac{4}{5}$.

## Erros comuns
- Esquecer o sinal pelo quadrante.
- Confundir seno e cosseno nos ângulos $0^\circ$ e $90^\circ$.`,
    questoes: [
      q('facil', 'O arco de π radianos corresponde a quantos graus?', ['90°', '180°', '270°', '360°'], 1, 'A metade de uma volta completa (180°) mede π radianos.'),
      q('facil', 'Quanto vale sen 90°?', ['0', '1', '−1', '1/2'], 1, 'No topo do ciclo, a coordenada y é 1.'),
      q('facil', 'Quanto vale cos 0°?', ['0', '1', '−1', '1/2'], 1, 'No ponto (1, 0) do ciclo, o cosseno (coordenada x) vale 1.'),
      q('medio', 'O ângulo de 60° corresponde, em radianos, a:', ['π/6', 'π/3', 'π/2', '2π/3'], 1, '60° = 180°/3, ou seja, π/3 rad.'),
      q('medio', 'Quanto vale cos 180°?', ['0', '1', '−1', '1/2'], 2, 'Em 180° o ponto é (−1, 0), e o cosseno vale −1.'),
      q('medio', 'Se sen x = 3/5 e x está no 1º quadrante, quanto vale cos x?', ['2/5', '3/4', '4/5', '5/3'], 2, 'cos²x = 1 − 9/25 = 16/25, e no 1º quadrante o cosseno é positivo: 4/5.'),
      q('dificil', 'Quanto vale sen 210°?', ['1/2', '−1/2', '√3/2', '−√3/2'], 1, '210° está no 3º quadrante (seno negativo) e 210° − 180° = 30°. Logo, sen 210° = −sen 30° = −1/2.'),
      q('dificil', 'Em qual quadrante está o arco de 5π/6 radianos?', ['1º', '2º', '3º', '4º'], 1, '5π/6 = 150°, entre 90° e 180°: segundo quadrante.'),
    ],
  },
  {
    topic: 'matrizes-e-determinantes', grade: '2ª série EM', title: 'Matrizes e determinantes', subtitle: 'Operações com matrizes e determinante 2×2',
    resumo: String.raw`## Matriz
Tabela de números com $m$ linhas e $n$ colunas: tipo $m\times n$. A de 2 linhas e 3 colunas é $2\times3$.

## Operações
- **Soma:** elemento a elemento (mesmo tipo). $\begin{pmatrix}1&2\\3&4\end{pmatrix}+\begin{pmatrix}0&1\\1&0\end{pmatrix}=\begin{pmatrix}1&3\\4&4\end{pmatrix}$.
- **Por escalar:** multiplica todos os elementos. $2\begin{pmatrix}1&2\\3&4\end{pmatrix}=\begin{pmatrix}2&4\\6&8\end{pmatrix}$.
- **Produto $A\cdot B$:** só existe se as colunas de $A$ forem iguais às linhas de $B$. Uma matriz $2\times3$ por uma $3\times2$ resulta em uma $2\times2$. Cada elemento é "linha vezes coluna".

## Identidade
$I=\begin{pmatrix}1&0\\0&1\end{pmatrix}$: $A\cdot I=A$.

## Determinante 2×2
$$\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$$
$\det\begin{pmatrix}1&2\\3&4\end{pmatrix}=4-6=-2$ e $\det\begin{pmatrix}2&3\\1&4\end{pmatrix}=8-3=5$.

Se as linhas são **proporcionais**, o determinante é 0: $\det\begin{pmatrix}3&6\\1&2\end{pmatrix}=6-6=0$.

## Erros comuns
- Achar que $AB=BA$ (em geral é falso).
- Calcular $ad+bc$ em vez de $ad-bc$.`,
    questoes: [
      q('facil', 'Uma matriz com 2 linhas e 3 colunas tem tipo:', ['3 × 2', '2 × 3', '2 × 2', '6 × 1'], 1, 'O tipo é sempre linhas × colunas: 2 × 3.'),
      q('facil', 'Qual é o determinante da matriz [1 2; 3 4] (linhas 1 2 e 3 4)?', ['−2', '2', '10', '−10'], 0, 'det = 1·4 − 2·3 = 4 − 6 = −2.'),
      q('facil', 'Quanto é 2 · [1 2; 3 4]?', ['[2 4; 6 8]', '[3 4; 5 6]', '[1 4; 3 8]', '[2 2; 3 4]'], 0, 'O escalar multiplica todos os elementos: [2 4; 6 8].'),
      q('medio', 'Quanto é [1 2; 3 4] + [0 1; 1 0]?', ['[1 3; 4 4]', '[1 2; 3 4]', '[0 2; 3 0]', '[1 3; 4 5]'], 0, 'A soma é elemento a elemento: [1+0, 2+1; 3+1, 4+0] = [1 3; 4 4].'),
      q('medio', 'Multiplicando uma matriz A (2 × 3) por uma matriz B (3 × 2), obtém-se uma matriz de tipo:', ['3 × 3', '2 × 2', '2 × 3', '3 × 2'], 1, 'O resultado tem as linhas de A e as colunas de B: 2 × 2.'),
      q('medio', 'Qual é o determinante de [2 3; 1 4]?', ['5', '11', '−5', '7'], 0, 'det = 2·4 − 3·1 = 8 − 3 = 5.'),
      q('dificil', 'Quanto é [1 2; 3 4] multiplicada pela matriz identidade [1 0; 0 1]?', ['A matriz nula', 'A própria matriz [1 2; 3 4]', '[1 0; 0 4]', '[4 3; 2 1]'], 1, 'A matriz identidade é o elemento neutro da multiplicação: A · I = A.'),
      q('dificil', 'Qual é o determinante de [3 6; 1 2]?', ['0', '12', '6', '−12'], 0, 'det = 3·2 − 6·1 = 6 − 6 = 0. As linhas são proporcionais (a primeira é o triplo da segunda).'),
    ],
  },
  {
    topic: 'sistemas-lineares', grade: '2ª série EM', title: 'Sistemas lineares', subtitle: 'Classificação (SPD, SPI, SI) e resolução',
    resumo: String.raw`## Classificação
Um sistema linear pode ter:
- **SPD** (possível e determinado): **uma** solução.
- **SPI** (possível e indeterminado): **infinitas** soluções.
- **SI** (impossível): **nenhuma** solução.

## Exemplos com duas incógnitas
- $x+y=5$ e $x-y=1$: somando, $x=3$ e $y=2$. **SPD**.
- $x+y=2$ e $2x+2y=4$: a segunda é o dobro da primeira. **SPI**.
- $x+y=2$ e $x+y=3$: contradição. **SI**.

## Escalonamento (3 incógnitas)
$x+y+z=6$, $x-y=0$, $z=2$: de $z=2$ e $x=y$, vem $2x+2=6$, então $x=2$. Solução $(2,2,2)$.

## Problema
2 canetas e 3 cadernos custam R$ 19; 1 caneta e 2 cadernos custam R$ 12. Com $c$ e $d$: $2c+3d=19$ e $c+2d=12$. Então $c=12-2d$ e $24-4d+3d=19$, logo $d=5$ e $c=2$.

## Parâmetro
Para $x+y=2$ e $2x+2y=k$ ter infinitas soluções, é preciso $k=4$.

## Erros comuns
- Concluir que "sem solução única" significa "sem solução".
- Esquecer de verificar a solução nas equações originais.`,
    questoes: [
      q('facil', 'Um sistema possível e determinado (SPD) tem:', ['nenhuma solução', 'uma única solução', 'infinitas soluções', 'sempre três soluções'], 1, 'SPD = possível (tem solução) e determinado (só uma).'),
      q('facil', 'Um sistema impossível (SI) é aquele que:', ['não tem solução', 'tem uma solução', 'tem infinitas soluções', 'só aceita números inteiros'], 0, 'Impossível significa que nenhuma combinação de valores satisfaz todas as equações.'),
      q('facil', 'Qual é a solução do sistema x + y = 5 e x − y = 1?', ['(2, 3)', '(3, 2)', '(4, 1)', '(5, 0)'], 1, 'Somando as equações: 2x = 6, então x = 3 e y = 2.'),
      q('medio', 'O sistema x + y = 2 e 2x + 2y = 4 é:', ['possível e determinado', 'possível e indeterminado', 'impossível', 'não é linear'], 1, 'A segunda equação é o dobro da primeira: as duas descrevem a mesma reta, com infinitas soluções.'),
      q('medio', 'O sistema x + y = 2 e x + y = 3 é:', ['possível e determinado', 'possível e indeterminado', 'impossível', 'homogêneo'], 2, 'x + y não pode valer 2 e 3 ao mesmo tempo: não há solução.'),
      q('medio', 'No sistema x + y + z = 6, x − y = 0 e z = 2, qual é o valor de x?', ['1', '2', '3', '4'], 1, 'De x − y = 0, x = y. Com z = 2: 2x + 2 = 6, então x = 2 (solução (2, 2, 2)).'),
      q('dificil', '2 canetas e 3 cadernos custam R$ 19; 1 caneta e 2 cadernos custam R$ 12. Quanto custa cada caderno?', ['R$ 3', 'R$ 4', 'R$ 5', 'R$ 6'], 2, '2c + 3d = 19 e c + 2d = 12. Da segunda, c = 12 − 2d; substituindo: 24 − 4d + 3d = 19, então d = 5 (e c = 2).'),
      q('dificil', 'Para que valor de k o sistema x + y = 2 e 2x + 2y = k é possível e indeterminado?', ['2', '3', '4', '6'], 2, 'A segunda equação precisa ser o dobro da primeira: 2x + 2y = 4, então k = 4.'),
    ],
  },
  {
    topic: 'geometria-espacial', grade: '2ª série EM', title: 'Geometria espacial', subtitle: 'Poliedros, relação de Euler e volumes de pirâmide, cone e esfera',
    resumo: String.raw`## Poliedros
Sólidos limitados por faces planas. Elementos: **vértices** ($V$), **arestas** ($A$) e **faces** ($F$). O cubo tem $V=8$, $A=12$, $F=6$.

## Relação de Euler
$$V-A+F=2$$
Um poliedro com 6 vértices e 9 arestas tem $F=2-6+9=5$ faces.

## Volumes
- Prisma e cilindro: $V=A_b\cdot h$ e $V=\pi r^2h$.
- **Pirâmide:** $V=\frac{A_b\cdot h}{3}$. Base de área 12 e altura 5: $V=20$.
- **Cone:** $V=\frac{\pi r^2h}{3}$. Com $r=3$, $h=4$ e $\pi\approx3$: $V=36$.
- **Esfera:** $V=\frac{4}{3}\pi r^3$ e área da superfície $A=4\pi r^2$. Com $r=3$ e $\pi\approx3$: $V=108$. Com $r=2$: $A=48$.

## Comparações
O volume do cone é **um terço** do volume do cilindro de mesma base e mesma altura. O mesmo vale para pirâmide e prisma.

## Erros comuns
- Esquecer o fator $\frac{1}{3}$ em pirâmide e cone.
- Confundir o volume da esfera ($r^3$) com a área ($r^2$).`,
    questoes: [
      q('facil', 'Quantas faces tem um cubo?', ['4', '6', '8', '12'], 1, 'O cubo tem 6 faces quadradas.'),
      q('facil', 'Quantas arestas tem um cubo?', ['6', '8', '12', '24'], 2, 'O cubo tem 12 arestas.'),
      q('facil', 'Pela relação de Euler, um poliedro com 6 vértices e 9 arestas tem quantas faces?', ['3', '4', '5', '6'], 2, 'V − A + F = 2, então 6 − 9 + F = 2 e F = 5.'),
      q('medio', 'Qual é o volume de uma pirâmide de base com área 12 cm² e altura 5 cm?', ['60 cm³', '20 cm³', '17 cm³', '30 cm³'], 1, 'V = (Ab · h) / 3 = (12 · 5) / 3 = 20 cm³.'),
      q('medio', 'Qual é o volume de um cone de raio 3 cm e altura 4 cm, usando π = 3?', ['12 cm³', '36 cm³', '108 cm³', '24 cm³'], 1, 'V = (π · r² · h) / 3 = (3 · 9 · 4) / 3 = 36 cm³.'),
      q('medio', 'Qual é o volume de uma esfera de raio 3 cm, usando π = 3?', ['36 cm³', '108 cm³', '324 cm³', '81 cm³'], 1, 'V = (4/3) · π · r³ = (4/3) · 3 · 27 = 108 cm³.'),
      q('dificil', 'Um cone e um cilindro têm o mesmo raio e a mesma altura. O volume do cone é:', ['a metade do do cilindro', 'um terço do do cilindro', 'dois terços do do cilindro', 'igual ao do cilindro'], 1, 'V(cone) = πr²h/3 e V(cilindro) = πr²h. O cone tem um terço do volume.'),
      q('dificil', 'Qual é a área da superfície de uma esfera de raio 2 cm, usando π = 3?', ['16 cm²', '24 cm²', '48 cm²', '32 cm²'], 2, 'A = 4 · π · r² = 4 · 3 · 4 = 48 cm².'),
    ],
  },
  {
    topic: 'geometria-analitica-reta', grade: '3ª série EM', title: 'Geometria analítica: ponto e reta', subtitle: 'Distância, ponto médio, coeficiente angular e equação da reta',
    resumo: String.raw`## Distância entre dois pontos
$$d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$$
De $(0,0)$ a $(3,4)$: $d=5$. De $(1,1)$ a $(7,9)$: $\sqrt{36+64}=10$.

## Ponto médio
$M=\left(\frac{x_1+x_2}{2},\frac{y_1+y_2}{2}\right)$. Entre $(2,4)$ e $(6,8)$: $(4,6)$.

## Coeficiente angular
$$m=\frac{y_2-y_1}{x_2-x_1}$$
Pelos pontos $(0,1)$ e $(2,5)$: $m=\frac{4}{2}=2$.

## Equação da reta
$y-y_0=m\,(x-x_0)$. Com $m=2$ passando por $(1,3)$: $y-3=2(x-1)\Rightarrow y=2x+1$.

## Posição relativa
- **Paralelas:** mesmo $m$. Paralela a $y=3x+1$: $y=3x-5$.
- **Perpendiculares:** $m_1\cdot m_2=-1$. Perpendicular a $y=2x$ tem $m=-\frac{1}{2}$.

## Interseção
$y=x+1$ e $y=-x+5$: $x+1=-x+5\Rightarrow x=2$ e $y=3$. Ponto $(2,3)$.

## Erros comuns
- Inverter a ordem dos pontos em apenas um dos termos do coeficiente angular.
- Esquecer o sinal de menos na perpendicular.`,
    questoes: [
      q('facil', 'Qual é o ponto médio entre (2, 4) e (6, 8)?', ['(4, 6)', '(8, 12)', '(3, 5)', '(2, 2)'], 0, 'Média das coordenadas: (2 + 6)/2 = 4 e (4 + 8)/2 = 6.'),
      q('facil', 'Qual é a distância entre os pontos (0, 0) e (3, 4)?', ['3', '4', '5', '7'], 2, 'd = √(3² + 4²) = √25 = 5.'),
      q('facil', 'Qual é o coeficiente angular da reta que passa por (0, 1) e (2, 5)?', ['1', '2', '3', '4'], 1, 'm = (5 − 1) / (2 − 0) = 2.'),
      q('medio', 'Qual é a equação da reta de coeficiente angular 2 que passa pelo ponto (1, 3)?', ['y = 2x + 1', 'y = 2x + 3', 'y = x + 2', 'y = 3x + 1'], 0, 'y − 3 = 2(x − 1), então y = 2x − 2 + 3 = 2x + 1.'),
      q('medio', 'Qual das retas é paralela a y = 3x + 1?', ['y = −3x + 1', 'y = 3x − 5', 'y = x/3 + 1', 'y = −x/3'], 1, 'Retas paralelas têm o mesmo coeficiente angular: 3.'),
      q('medio', 'Qual é o coeficiente angular de uma reta perpendicular a y = 2x?', ['2', '−2', '1/2', '−1/2'], 3, 'Perpendiculares têm m₁ · m₂ = −1: 2 · m = −1, então m = −1/2.'),
      q('dificil', 'Qual é a distância entre (1, 1) e (7, 9)?', ['8', '10', '14', '100'], 1, 'd = √(6² + 8²) = √100 = 10.'),
      q('dificil', 'Qual é o ponto de interseção das retas y = x + 1 e y = −x + 5?', ['(1, 2)', '(2, 3)', '(3, 2)', '(4, 5)'], 1, 'x + 1 = −x + 5 dá x = 2, e y = 3.'),
    ],
  },
  {
    topic: 'circunferencia', grade: '3ª série EM', title: 'Circunferência', subtitle: 'Equação reduzida, posição de pontos e comprimento',
    resumo: String.raw`## Equação reduzida
A circunferência de centro $C(a,b)$ e raio $r$ tem equação
$$(x-a)^2+(y-b)^2=r^2$$
$(x-2)^2+(y+1)^2=16$ tem centro $(2,-1)$ e raio $4$. Com centro na origem e raio 3: $x^2+y^2=9$.

## Posição de um ponto
Substitua o ponto no lado esquerdo e compare com $r^2$:
- resultado $<r^2$: ponto **interior**;
- $=r^2$: ponto **sobre** a circunferência;
- $>r^2$: ponto **exterior**.

O ponto $(3,4)$ está sobre $x^2+y^2=25$, pois $9+16=25$. O ponto $(1,1)$ é interior a $x^2+y^2=4$, pois $2<4$.

## Achando a equação
Centro $(1,2)$ passando por $(4,6)$: $r=\sqrt{3^2+4^2}=5$, então $(x-1)^2+(y-2)^2=25$.

## Equação geral
$x^2+y^2-6x+8y=0$: complete quadrados, $(x-3)^2+(y+4)^2=25$. Centro $(3,-4)$ e raio 5.

## Comprimento
$C=2\pi r$. Com $r=5$ e $\pi=3{,}14$: $C=31{,}4$.

## Erros comuns
- Trocar o sinal do centro (em $(y+1)^2$ o centro é $-1$).
- Usar $r$ em vez de $r^2$ no lado direito.`,
    questoes: [
      q('facil', 'Qual é o centro da circunferência (x − 2)² + (y + 1)² = 16?', ['(2, 1)', '(−2, 1)', '(2, −1)', '(−2, −1)'], 2, 'O centro (a, b) vem de (x − a)² e (y − b)². Aqui, x − 2 dá a = 2 e y + 1 = y − (−1) dá b = −1.'),
      q('facil', 'Qual é o raio da circunferência (x − 2)² + (y + 1)² = 16?', ['2', '4', '8', '16'], 1, 'r² = 16, então r = 4.'),
      q('facil', 'Qual é o comprimento de uma circunferência de raio 5 cm (π = 3,14)?', ['15,7 cm', '31,4 cm', '78,5 cm', '25 cm'], 1, 'C = 2πr = 2 · 3,14 · 5 = 31,4 cm. O valor 78,5 é a área.'),
      q('medio', 'Qual é a equação da circunferência de centro na origem e raio 3?', ['x² + y² = 3', 'x² + y² = 9', 'x + y = 9', '(x − 3)² + (y − 3)² = 9'], 1, 'Com centro (0, 0): x² + y² = r² = 9.'),
      q('medio', 'O ponto (3, 4) em relação à circunferência x² + y² = 25 é:', ['sobre ela', 'interior', 'exterior', 'o seu centro'], 0, '3² + 4² = 25, igual a r²: o ponto está sobre a circunferência.'),
      q('medio', 'O ponto (1, 1) em relação à circunferência x² + y² = 4 é:', ['interior', 'exterior', 'sobre ela', 'o seu centro'], 0, '1² + 1² = 2, menor que 4: o ponto é interior.'),
      q('dificil', 'Uma circunferência tem centro (1, 2) e passa pelo ponto (4, 6). Qual é a sua equação?', ['(x − 1)² + (y − 2)² = 5', '(x − 1)² + (y − 2)² = 25', '(x + 1)² + (y + 2)² = 25', '(x − 4)² + (y − 6)² = 25'], 1, 'O raio é a distância entre (1, 2) e (4, 6): √(9 + 16) = 5. Então r² = 25.'),
      q('dificil', 'A equação x² + y² − 6x + 8y = 0 representa uma circunferência de:', ['centro (−3, 4) e raio 5', 'centro (3, −4) e raio 5', 'centro (3, −4) e raio 25', 'centro (6, −8) e raio 10'], 1, 'Completando quadrados: (x − 3)² + (y + 4)² = 9 + 16 = 25. Centro (3, −4) e raio 5.'),
    ],
  },
  {
    topic: 'estatistica', grade: '3ª série EM', title: 'Estatística: média, mediana e moda', subtitle: 'Média ponderada, mediana, moda e medidas de dispersão',
    resumo: String.raw`## Medidas de posição
- **Média aritmética:** soma ÷ quantidade. De 2, 4, 6, 8: $\frac{20}{4}=5$.
- **Mediana:** o valor central dos dados **ordenados**. De 3, 9, 5 (ordenados: 3, 5, 9): é 5.
- **Moda:** o valor que mais se repete. Em 1, 2, 2, 3, 3, 3, 4 é 3.

## Média ponderada
Cada valor tem um **peso**: $\bar{x}=\frac{\sum x_i\,p_i}{\sum p_i}$. Notas 6 (peso 2) e 9 (peso 3): $\frac{12+27}{5}=7{,}8$.

## Dispersão
Mede o quanto os dados se **espalham** em torno da média.
- **Variância:** média dos quadrados dos desvios. **Desvio padrão:** raiz da variância.
- Se todos os valores são iguais, a variância é **zero**. Quanto maior o desvio padrão, mais heterogêneos os dados.

## Efeito de operações
Somar 1 a cada valor aumenta a **média** em 1 (a dispersão não muda). Média 5 passa a 6.

## Soma a partir da média
8 números com média 6,5 têm soma $8\cdot6{,}5=52$.

## Erros comuns
- Calcular a mediana sem ordenar.
- Esquecer os pesos na média ponderada.`,
    questoes: [
      q('facil', 'Qual é a média aritmética de 2, 4, 6 e 8?', ['4', '5', '6', '20'], 1, '(2 + 4 + 6 + 8) / 4 = 20 / 4 = 5.'),
      q('facil', 'O desvio padrão mede:', ['o valor mais frequente', 'o valor central', 'a dispersão dos dados em torno da média', 'a soma dos dados'], 2, 'Desvio padrão indica o quanto os dados se afastam, em média, da média.'),
      q('facil', 'Qual é a mediana de 3, 9 e 5?', ['3', '5', '9', '5,67'], 1, 'Ordenando: 3, 5, 9. O valor do meio é 5.'),
      q('medio', 'Um aluno tirou 6 em uma prova de peso 2 e 9 em uma prova de peso 3. Qual é a média ponderada?', ['7,5', '7,8', '8', '6,9'], 1, '(6 · 2 + 9 · 3) / (2 + 3) = (12 + 27) / 5 = 7,8.'),
      q('medio', 'Qual é a moda do conjunto 1, 2, 2, 3, 3, 3, 4?', ['2', '3', '4', '2,5'], 1, 'O 3 aparece três vezes, mais que qualquer outro valor.'),
      q('medio', 'Um conjunto de dados em que todos os valores são iguais tem variância:', ['igual à média', 'igual a 1', 'zero', 'negativa'], 2, 'Sem nenhum desvio em relação à média, a variância é zero.'),
      q('dificil', 'A média de 10 números é 5. Se cada número for aumentado em 1, a nova média será:', ['5', '6', '15', '50'], 1, 'Somar uma constante a todos os valores soma a mesma constante à média: 5 + 1 = 6.'),
      q('dificil', 'A média de 8 números é 6,5. Qual é a soma desses números?', ['48', '52', '14,5', '6,5'], 1, 'Soma = quantidade × média = 8 · 6,5 = 52.'),
    ],
  },
  {
    topic: 'polinomios', grade: '3ª série EM', title: 'Polinômios', subtitle: 'Grau, valor numérico, raízes e teorema do resto',
    resumo: String.raw`## Definição
Polinômio: $P(x)=a_nx^n+\cdots+a_1x+a_0$. O **grau** é o maior expoente com coeficiente não nulo: $x^3-2x+5$ tem grau 3.

## Valor numérico e raiz
$P(a)$ é o valor de $P$ em $x=a$. Se $P(a)=0$, então $a$ é **raiz**. Para $P(x)=x^2-3x+2$: $P(1)=1-3+2=0$ (1 é raiz). Para $P(x)=x^3-2x+1$: $P(2)=8-4+1=5$.

## Operações
- Soma: reúna termos semelhantes. $(2x^2+x)+(x^2-3)=3x^2+x-3$.
- Produto: distributiva. $(x+1)(x^2-x+1)=x^3+1$.

## Teorema do resto
O resto da divisão de $P(x)$ por $(x-a)$ é $P(a)$. Para $P(x)=x^2+2x+3$ dividido por $x-1$, o resto é $P(1)=6$.

## Divisibilidade
$P(x)$ é divisível por $(x-a)$ se, e somente se, $P(a)=0$. $x^2-4$ é divisível por $x-2$, pois $P(2)=0$.

## Relações de Girard
Em $P(x)=x^3-6x^2+11x-6$, a soma das raízes é $-\frac{b}{a}=6$ (as raízes são 1, 2 e 3).

## Erros comuns
- Esquecer o sinal em $x-a$ (o resto usa $P(a)$).
- Somar expoentes ao somar polinômios (só os termos de mesmo grau se somam).`,
    questoes: [
      q('facil', 'Qual é o grau do polinômio x³ − 2x + 5?', ['1', '2', '3', '5'], 2, 'O grau é o maior expoente com coeficiente não nulo: 3.'),
      q('facil', 'Se P(x) = x² − 3x + 2, quanto vale P(1)?', ['0', '1', '2', '6'], 0, 'P(1) = 1 − 3 + 2 = 0. Portanto, 1 é raiz.'),
      q('facil', 'Quanto é (2x² + x) + (x² − 3)?', ['3x² + x − 3', '2x⁴ + x − 3', '3x⁴ − 3', 'x² + x − 3'], 0, 'Somam-se os termos de mesmo grau: 2x² + x² = 3x². Restam x e −3.'),
      q('medio', 'Se P(x) = x³ − 2x + 1, quanto vale P(2)?', ['3', '5', '7', '9'], 1, 'P(2) = 8 − 4 + 1 = 5.'),
      q('medio', 'Qual é o resto da divisão de P(x) = x² + 2x + 3 por x − 1?', ['0', '3', '6', '1'], 2, 'Pelo teorema do resto, o resto é P(1) = 1 + 2 + 3 = 6.'),
      q('medio', 'O polinômio x² − 4 é divisível por x − 2?', ['Sim, pois P(2) = 0', 'Não, pois P(2) ≠ 0', 'Sim, pois o grau é 2', 'Não, pois o termo independente é negativo'], 0, 'P(2) = 4 − 4 = 0, então x − 2 é fator de x² − 4.'),
      q('dificil', 'Qual é o resultado de (x + 1)(x² − x + 1)?', ['x³ + 1', 'x³ − 1', 'x³ + 2x² + 1', 'x³ + x² + 1'], 0, 'x³ − x² + x + x² − x + 1 = x³ + 1.'),
      q('dificil', 'O polinômio x³ − 6x² + 11x − 6 tem raízes 1, 2 e 3. Qual é a soma das raízes?', ['−6', '6', '11', '1'], 1, 'Pelas relações de Girard, a soma é −b/a = 6. Conferindo: 1 + 2 + 3 = 6.'),
    ],
  },
  {
    topic: 'numeros-complexos', grade: '3ª série EM', title: 'Números complexos', subtitle: 'Forma algébrica, operações, módulo e potências de i',
    resumo: String.raw`## A unidade imaginária
$i$ é definido por $i^2=-1$. Isso permite resolver equações como $x^2+1=0$.

## Forma algébrica
$z=a+bi$, com $a$ a **parte real** e $b$ a **parte imaginária**. Em $3+4i$, a parte imaginária é 4.

## Operações
- Soma: $(1+2i)+(3-i)=4+i$.
- Produto: $(2+i)(1+i)=2+2i+i+i^2=1+3i$.
- **Conjugado** de $a+bi$ é $a-bi$. O conjugado de $2-5i$ é $2+5i$.
- $(1+i)^2=1+2i+i^2=2i$.

## Módulo
$$|z|=\sqrt{a^2+b^2}$$
$|3+4i|=5$.

## Potências de $i$
Repetem-se de 4 em 4: $i^0=1$, $i^1=i$, $i^2=-1$, $i^3=-i$, $i^4=1$. Divida o expoente por 4 e use o resto. $i^{2023}$: $2023=4\cdot505+3$, então $i^{2023}=i^3=-i$.

## Erros comuns
- Achar que $i^2=1$.
- Esquecer de substituir $i^2$ por $-1$ ao multiplicar.`,
    questoes: [
      q('facil', 'Quanto vale i²?', ['1', '−1', 'i', '−i'], 1, 'Por definição, i² = −1.'),
      q('facil', 'Qual é a parte imaginária do número complexo 3 + 4i?', ['3', '4', '4i', '7'], 1, 'Em a + bi, a parte imaginária é o número b, aqui 4.'),
      q('facil', 'Qual é o conjugado de 2 − 5i?', ['−2 + 5i', '2 + 5i', '−2 − 5i', '5 − 2i'], 1, 'O conjugado de a + bi é a − bi. Troca-se apenas o sinal da parte imaginária: 2 + 5i.'),
      q('medio', 'Quanto é (1 + 2i) + (3 − i)?', ['4 + i', '4 + 3i', '2 + i', '4 − i'], 0, 'Somam-se as partes reais (1 + 3 = 4) e as imaginárias (2 − 1 = 1): 4 + i.'),
      q('medio', 'Quanto é (2 + i)(1 + i)?', ['2 + i', '1 + 3i', '3 + 3i', '1 + i'], 1, '2 + 2i + i + i² = 2 + 3i − 1 = 1 + 3i.'),
      q('medio', 'Qual é o módulo de 3 + 4i?', ['3', '4', '5', '7'], 2, '|z| = √(3² + 4²) = √25 = 5.'),
      q('dificil', 'Quanto vale i²⁰²³?', ['i', '−1', '−i', '1'], 2, 'As potências de i se repetem de 4 em 4. 2023 dividido por 4 deixa resto 3, e i³ = −i.'),
      q('dificil', 'Quanto é (1 + i)²?', ['2', '2i', '1 + 2i', '0'], 1, '(1 + i)² = 1 + 2i + i² = 1 + 2i − 1 = 2i.'),
    ],
  },
];
