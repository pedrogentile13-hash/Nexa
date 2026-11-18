import { q, type PacoteSeed } from './helpers';

export const LOTE3_MAT_A: PacoteSeed[] = [
  {
    topic: 'semelhanca-e-tales', grade: '9º ano', title: 'Semelhança e Teorema de Tales', subtitle: 'Figuras semelhantes, razão de semelhança e segmentos proporcionais',
    resumo: String.raw`## Semelhança
Duas figuras são **semelhantes** quando têm a mesma forma: ângulos correspondentes iguais e lados correspondentes **proporcionais**. A razão entre lados correspondentes é a **razão de semelhança** $k$.

Triângulo 3, 4, 5 ampliado com $k=2$: 6, 8, 10.

## Triângulos semelhantes
Se dois lados correspondentes são 4 e 6 ($k=\frac{6}{4}$), outro lado de 5 no menor corresponde a $5\cdot\frac{6}{4}=7{,}5$ no maior.

## Áreas
Se a razão de semelhança entre lados é $k$, a razão entre as **áreas** é $k^2$. Com $k=3$, a área fica 9 vezes maior.

## Teorema de Tales
Retas **paralelas** cortadas por duas transversais determinam segmentos proporcionais:
$$\frac{AB}{BC}=\frac{A'B'}{B'C'}$$
Com $AB=4$, $BC=6$ e $A'B'=2$: $\frac{4}{6}=\frac{2}{x}\Rightarrow x=3$.

## Aplicação: sombras
Um poste de 2 m projeta 3 m de sombra. No mesmo instante, um prédio projeta 30 m. Então $\frac{h}{30}=\frac{2}{3}$ e $h=20$ m.

## Erros comuns
- Usar $k$ na área (o correto é $k^2$).
- Montar a proporção com lados que não são correspondentes.`,
    questoes: [
      q('facil', 'Duas figuras semelhantes têm:', ['a mesma área', 'a mesma forma, com lados correspondentes proporcionais', 'os mesmos lados', 'apenas o mesmo perímetro'], 1, 'Semelhança preserva a forma (ângulos iguais) e mantém a proporção entre os lados.'),
      q('facil', 'Um triângulo de lados 3, 4 e 5 é ampliado com razão de semelhança 2. Quais são os lados do novo triângulo?', ['5, 6, 7', '6, 8, 10', '9, 12, 15', '4, 5, 6'], 1, 'Cada lado é multiplicado por 2: 6, 8 e 10.'),
      q('facil', 'O Teorema de Tales trata de:', ['retas paralelas cortadas por transversais', 'triângulos retângulos', 'ângulos de um polígono', 'áreas de círculos'], 0, 'Tales relaciona os segmentos formados por retas paralelas cortadas por transversais.'),
      q('medio', 'Em dois triângulos semelhantes, lados correspondentes medem 4 e 6. Se outro lado do triângulo menor mede 5, quanto mede o lado correspondente no maior?', ['7,5', '7', '8', '9'], 0, 'A razão é 6/4 = 1,5. Então 5 × 1,5 = 7,5.'),
      q('medio', 'Um poste de 2 m projeta uma sombra de 3 m. No mesmo instante, um prédio projeta uma sombra de 30 m. Qual é a altura do prédio?', ['15 m', '20 m', '45 m', '60 m'], 1, 'Os triângulos são semelhantes: h/30 = 2/3, então h = 20 m.'),
      q('medio', 'Três retas paralelas cortam duas transversais. Em uma, os segmentos medem 4 e 6; na outra, o primeiro mede 2. Quanto mede o segundo?', ['3', '4', '6', '12'], 0, 'Por Tales: 4/6 = 2/x, então x = 3.'),
      q('dificil', 'Se a razão de semelhança entre dois polígonos é 3, qual é a razão entre as suas áreas?', ['3', '6', '9', '27'], 2, 'A razão entre áreas é o quadrado da razão de semelhança: 3² = 9.'),
      q('dificil', 'No triângulo ABC, DE é paralelo a BC, com D em AB e E em AC. Se AD = 3, DB = 6 e AE = 2, quanto mede EC?', ['2', '4', '6', '9'], 1, 'Por Tales: AD/DB = AE/EC, então 3/6 = 2/EC e EC = 4.'),
    ],
  },
  {
    topic: 'trigonometria-no-triangulo-retangulo', grade: '9º ano', title: 'Razões trigonométricas no triângulo retângulo', subtitle: 'Seno, cosseno e tangente',
    resumo: String.raw`## As três razões
Em um triângulo retângulo, para um ângulo agudo $\alpha$:
$$\operatorname{sen}\alpha=\frac{\text{cateto oposto}}{\text{hipotenusa}}\quad\cos\alpha=\frac{\text{cateto adjacente}}{\text{hipotenusa}}\quad\tan\alpha=\frac{\text{cateto oposto}}{\text{cateto adjacente}}$$

## Exemplo
Triângulo 3, 4, 5, com $\alpha$ oposto ao cateto 3: $\operatorname{sen}\alpha=\frac{3}{5}$, $\cos\alpha=\frac{4}{5}$, $\tan\alpha=\frac{3}{4}$.

## Ângulos notáveis
| | $30^\circ$ | $45^\circ$ | $60^\circ$ |
|---|---|---|---|
| seno | $\frac{1}{2}$ | $\frac{\sqrt{2}}{2}$ | $\frac{\sqrt{3}}{2}$ |
| cosseno | $\frac{\sqrt{3}}{2}$ | $\frac{\sqrt{2}}{2}$ | $\frac{1}{2}$ |
| tangente | $\frac{\sqrt{3}}{3}$ | $1$ | $\sqrt{3}$ |

## Aplicações
Uma escada de 10 m forma $30^\circ$ com o chão: altura $=10\cdot\operatorname{sen}30^\circ=5$ m.
Observador a 20 m de um prédio, ângulo de elevação de $60^\circ$ (com $\sqrt{3}\approx1{,}7$): altura $=20\cdot\tan60^\circ\approx34$ m.

## Erros comuns
- Trocar cateto oposto por adjacente (depende do ângulo escolhido).
- Usar seno quando o problema envolve os dois catetos (use tangente).`,
    questoes: [
      q('facil', 'No triângulo retângulo, o seno de um ângulo agudo é a razão entre:', ['cateto adjacente e hipotenusa', 'cateto oposto e hipotenusa', 'cateto oposto e cateto adjacente', 'hipotenusa e cateto oposto'], 1, 'seno = cateto oposto / hipotenusa.'),
      q('facil', 'A tangente de um ângulo agudo é a razão entre:', ['cateto oposto e cateto adjacente', 'cateto adjacente e hipotenusa', 'hipotenusa e cateto oposto', 'cateto oposto e hipotenusa'], 0, 'tangente = cateto oposto / cateto adjacente.'),
      q('facil', 'Quanto vale o seno de 30°?', ['√3/2', '1/2', '√2/2', '1'], 1, 'O seno de 30° vale 1/2, um dos valores notáveis que vale memorizar.'),
      q('medio', 'Em um triângulo retângulo de lados 3, 4 e 5, qual é o seno do ângulo oposto ao lado 3?', ['3/4', '3/5', '4/5', '5/3'], 1, 'O cateto oposto mede 3 e a hipotenusa mede 5: sen = 3/5.'),
      q('medio', 'Quanto vale cos 60°?', ['√3/2', '1/2', '1', '0'], 1, 'cos 60° = 1/2 (e sen 30° também vale 1/2).'),
      q('medio', 'Quanto vale tan 45°?', ['0', '1/2', '1', '√2'], 2, 'Em 45° os dois catetos são iguais, então a tangente vale 1.'),
      q('dificil', 'Uma escada de 10 m está apoiada em uma parede formando 30° com o chão. A que altura ela toca a parede?', ['5 m', '8,7 m', '10 m', '20 m'], 0, 'A altura é o cateto oposto: 10 · sen 30° = 10 · 0,5 = 5 m. O valor 8,7 m seria 10 · cos 30°.'),
      q('dificil', 'Um observador a 20 m de um prédio vê o topo sob um ângulo de 60°. Usando tan 60° ≈ 1,7, qual é a altura aproximada do prédio?', ['11,8 m', '20 m', '34 m', '40 m'], 2, 'h = 20 · tan 60° ≈ 20 · 1,7 = 34 m.'),
    ],
  },
  {
    topic: 'juros-simples-e-compostos', grade: '9º ano', title: 'Juros simples e compostos', subtitle: 'Capital, taxa, tempo e montante',
    resumo: String.raw`## Vocabulário
- **Capital ($C$):** valor inicial. **Taxa ($i$):** porcentagem por período. **Tempo ($t$):** número de períodos. **Juros ($J$):** o rendimento. **Montante ($M$):** $M=C+J$.

## Juros simples
Os juros incidem **sempre sobre o capital inicial**:
$$J=C\cdot i\cdot t$$
$C=2000$, $i=3\%$ ao mês, $t=4$ meses: $J=2000\cdot0{,}03\cdot4=240$ e $M=2240$.

## Juros compostos
Os juros de cada período **entram na base** do seguinte ("juros sobre juros"):
$$M=C\,(1+i)^t$$
$C=1000$, $i=10\%$ ao ano, 2 anos: $M=1000\cdot1{,}1^2=1210$.

## Comparação
No primeiro período são iguais. Depois, os **compostos rendem mais**: R$ 1 000 a 10% ao ano por 2 anos dão R$ 1 200 (simples) contra R$ 1 210 (composto).

## Achando o capital
$J=360$, $i=2\%$ ao mês, $t=6$: $C=\frac{360}{0{,}02\cdot6}=3000$.

## Erros comuns
- Usar a taxa como 3 em vez de $0{,}03$.
- Misturar unidades (taxa ao mês e tempo em anos).
- Confundir juros com montante.`,
    questoes: [
      q('facil', 'Qual é a fórmula dos juros simples?', ['J = C · i · t', 'J = C · (1 + i)ᵗ', 'J = C + i + t', 'J = C / i'], 0, 'Nos juros simples, J = C · i · t, com a taxa em forma decimal.'),
      q('facil', 'Um capital de R$ 1.000 rende juros simples de 5% ao mês durante 2 meses. Qual é o valor dos juros?', ['R$ 50', 'R$ 100', 'R$ 105', 'R$ 1.100'], 1, 'J = 1000 · 0,05 · 2 = 100.'),
      q('facil', 'O montante é igual a:', ['só os juros', 'capital + juros', 'capital − juros', 'a taxa × o tempo'], 1, 'O montante é o valor final: o capital mais os juros (M = C + J).'),
      q('medio', 'Um capital de R$ 2.000 é aplicado a juros simples de 3% ao mês por 4 meses. Quanto rende de juros?', ['R$ 60', 'R$ 240', 'R$ 2.240', 'R$ 2.400'], 1, 'J = 2000 · 0,03 · 4 = 240. O valor 2.240 é o montante.'),
      q('medio', 'Qual é o montante da aplicação anterior (R$ 2.000, 3% ao mês, 4 meses, juros simples)?', ['R$ 240', 'R$ 2.060', 'R$ 2.240', 'R$ 2.400'], 2, 'M = C + J = 2000 + 240 = 2.240.'),
      q('medio', 'Um capital de R$ 1.000 é aplicado a juros compostos de 10% ao ano por 2 anos. Qual é o montante?', ['R$ 1.200', 'R$ 1.210', 'R$ 1.100', 'R$ 1.220'], 1, 'M = 1000 · 1,1² = 1.210. Em juros simples seriam R$ 1.200.'),
      q('dificil', 'Para o mesmo capital, a mesma taxa e um prazo maior que um período, os juros compostos, em comparação aos simples, rendem:', ['menos', 'o mesmo', 'mais', 'nada'], 2, 'A partir do segundo período, os juros incidem também sobre os juros anteriores, então rendem mais.'),
      q('dificil', 'Que capital rende R$ 360 de juros simples em 6 meses, a 2% ao mês?', ['R$ 1.800', 'R$ 3.000', 'R$ 4.500', 'R$ 7.200'], 1, 'C = J / (i · t) = 360 / (0,02 · 6) = 360 / 0,12 = 3.000.'),
    ],
  },
  {
    topic: 'conjuntos', grade: '1ª série EM', title: 'Conjuntos numéricos e operações', subtitle: 'Pertinência, união, interseção, diferença e conjuntos numéricos',
    resumo: String.raw`## Notação
Um conjunto é uma coleção de elementos. $3\in A$ lê-se "3 pertence a $A$". $B\subset A$: $B$ está contido em $A$.

## Operações
Com $A=\{1,2,3\}$ e $B=\{3,4\}$:
- **União:** $A\cup B=\{1,2,3,4\}$.
- **Interseção:** $A\cap B=\{3\}$.
- **Diferença:** $A-B=\{1,2\}$.

## Número de elementos
$$n(A\cup B)=n(A)+n(B)-n(A\cap B)$$
Com $n(A)=10$, $n(B)=8$ e $n(A\cap B)=3$: $n(A\cup B)=15$.

## Problema
De 100 pessoas, 60 gostam de futebol, 50 de vôlei e 20 de ambos. Gostam de pelo menos um: $60+50-20=90$. Nenhum dos dois: $100-90=10$.

## Conjuntos numéricos
$$\mathbb{N}\subset\mathbb{Z}\subset\mathbb{Q}\subset\mathbb{R}$$
Os **irracionais** (como $\sqrt{2}$ e $\pi$) têm decimal infinito e não periódico.

## Erros comuns
- Usar $\in$ entre conjuntos (use $\subset$).
- Esquecer de subtrair a interseção ao contar elementos da união.`,
    questoes: [
      q('facil', 'Qual símbolo relaciona um elemento a um conjunto?', ['∈ (pertence)', '⊂ (está contido)', '∪ (união)', '∩ (interseção)'], 0, '∈ liga elemento a conjunto. ⊂ liga conjunto a conjunto.'),
      q('facil', 'Se A = {1, 2, 3} e B = {3, 4}, quanto é A ∩ B?', ['{3}', '{1, 2, 3, 4}', '{1, 2}', '{4}'], 0, 'A interseção traz os elementos comuns aos dois conjuntos: só o 3.'),
      q('facil', 'Se A = {1, 2, 3} e B = {3, 4}, quanto é A ∪ B?', ['{3}', '{1, 2, 3, 4}', '{1, 2}', '{1, 2, 3}'], 1, 'A união junta todos os elementos, sem repetir: {1, 2, 3, 4}.'),
      q('medio', 'Se A = {1, 2, 3} e B = {3, 4}, quanto é A − B?', ['{3}', '{4}', '{1, 2}', '{1, 2, 4}'], 2, 'A − B tem os elementos de A que não estão em B: {1, 2}.'),
      q('medio', 'Qual dos números a seguir é irracional?', ['0,25', '√2', '1/3', '−4'], 1, '√2 tem representação decimal infinita e não periódica. Os demais são racionais.'),
      q('medio', 'Se n(A) = 10, n(B) = 8 e n(A ∩ B) = 3, quanto vale n(A ∪ B)?', ['18', '15', '21', '11'], 1, 'n(A ∪ B) = 10 + 8 − 3 = 15.'),
      q('dificil', 'Em um grupo de 100 pessoas, 60 gostam de futebol, 50 de vôlei e 20 gostam dos dois. Quantas não gostam de nenhum dos dois?', ['0', '10', '20', '30'], 1, 'Gostam de pelo menos um: 60 + 50 − 20 = 90. Não gostam de nenhum: 100 − 90 = 10.'),
      q('dificil', 'Qual das relações entre conjuntos numéricos é verdadeira?', ['ℤ ⊂ ℕ', 'ℕ ⊂ ℤ', 'ℚ ⊂ ℤ', 'ℝ ⊂ ℚ'], 1, 'Todo natural é inteiro (ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ). As outras trocam a ordem.'),
    ],
  },
  {
    topic: 'funcao-exponencial', grade: '1ª série EM', title: 'Função exponencial', subtitle: 'Crescimento e decaimento, equações exponenciais',
    resumo: String.raw`## Definição
$f(x)=a^x$, com $a>0$ e $a\neq1$. A variável está no **expoente**.

## Comportamento
- $a>1$: função **crescente** ($2^x$).
- $0<a<1$: função **decrescente** ($\left(\frac{1}{2}\right)^x$).
- Sempre passa por $(0,1)$, pois $a^0=1$.
- Seus valores são sempre **positivos**.

## Valores
$f(x)=2^x$: $f(3)=8$ e $f(-1)=\frac{1}{2}$.

## Equações exponenciais
Iguale as **bases** e depois os expoentes.
- $2^x=32=2^5\Rightarrow x=5$.
- $3^{x+1}=27=3^3\Rightarrow x+1=3\Rightarrow x=2$.

## Aplicações
Uma colônia de 100 bactérias que dobra a cada hora tem $N(t)=100\cdot2^t$. Após 3 horas: $100\cdot8=800$.

Decaimento: uma substância que perde metade a cada ano segue $N(t)=N_0\cdot\left(\frac{1}{2}\right)^t$.

## Erros comuns
- Confundir $2^x$ (exponencial) com $x^2$ (quadrática).
- Esquecer que $a^0=1$ e que $a^{-n}=\frac{1}{a^n}$.`,
    questoes: [
      q('facil', 'Se f(x) = 2ˣ, quanto vale f(3)?', ['6', '8', '9', '5'], 1, '2³ = 2 × 2 × 2 = 8.'),
      q('facil', 'Se f(x) = 3ˣ, quanto vale f(0)?', ['0', '1', '3', 'Não existe'], 1, 'Qualquer número positivo elevado a zero vale 1.'),
      q('facil', 'A função f(x) = 2ˣ é:', ['crescente', 'decrescente', 'constante', 'sempre negativa'], 0, 'Com base maior que 1, a função exponencial é crescente.'),
      q('medio', 'Se f(x) = 2ˣ, quanto vale f(−1)?', ['−2', '1/2', '2', '−1/2'], 1, '2⁻¹ = 1/2. Expoente negativo inverte a base, mas o resultado continua positivo.'),
      q('medio', 'Qual é a solução da equação 2ˣ = 32?', ['4', '5', '6', '16'], 1, '32 = 2⁵, então x = 5.'),
      q('medio', 'A função f(x) = (1/2)ˣ é:', ['crescente', 'decrescente', 'constante', 'não é exponencial'], 1, 'Com base entre 0 e 1, a função exponencial é decrescente.'),
      q('dificil', 'Uma colônia com 100 bactérias dobra de tamanho a cada hora. Quantas bactérias haverá após 3 horas?', ['300', '600', '800', '1 000'], 2, 'N = 100 · 2³ = 800.'),
      q('dificil', 'Qual é o valor de x na equação 3^(x + 1) = 27?', ['1', '2', '3', '9'], 1, '27 = 3³, então x + 1 = 3 e x = 2.'),
    ],
  },
];
