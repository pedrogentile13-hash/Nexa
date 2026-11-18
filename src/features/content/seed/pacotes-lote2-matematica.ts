import { q, type PacoteSeed } from './helpers';

export const LOTE2_MATEMATICA: PacoteSeed[] = [
  {
    topic: 'porcentagem', grade: '7º ano', title: 'Porcentagem', subtitle: 'Cálculo de porcentagens, aumentos e descontos',
    resumo: String.raw`## O que é porcentagem
Porcentagem é uma razão com denominador 100: $25\%=\frac{25}{100}=0{,}25$. "X% de Y" significa multiplicar: $25\%$ de 80 é $0{,}25\times80=20$.

## Atalhos úteis
- $50\%=\frac{1}{2}$, $25\%=\frac{1}{4}$, $10\%$ é dividir por 10, $1\%$ é dividir por 100.

## Aumentos e descontos: o fator multiplicativo
- Aumento de $20\%$: multiplique por $1{,}20$.
- Desconto de $15\%$: multiplique por $0{,}85$.

Exemplo: produto de R$ 200 com 15% de desconto custa $200\times0{,}85=170$.

## Que porcentagem um valor é do outro?
Divida a parte pelo todo: 18 é quantos por cento de 60? $\frac{18}{60}=0{,}30=30\%$.

## Variações sucessivas **não** se somam
Aumento de $10\%$ seguido de desconto de $10\%$ sobre R$ 100: $100\times1{,}10=110$ e $110\times0{,}90=99$. O resultado é R$ 99, **não** R$ 100.

## Erros comuns
- Somar as porcentagens de variações sucessivas.
- Calcular o desconto sobre o valor errado (o novo valor, e não o original).
- Esquecer que o "todo" é a base da divisão.`,
    questoes: [
      q('facil', 'Quanto é 25% de 80?', ['20', '25', '32', '55'], 0, '25% é 0,25. Então 0,25 × 80 = 20. Também é um quarto de 80.'),
      q('facil', 'Qual fração é equivalente a 50%?', ['1/5', '1/2', '1/4', '2/5'], 1, '50% é 50/100, que simplifica para 1/2.'),
      q('facil', 'Quanto é 10% de R$ 250,00?', ['R$ 2,50', 'R$ 25,00', 'R$ 40,00', 'R$ 240,00'], 1, 'Dez por cento é dividir por 10: 250 ÷ 10 = 25.'),
      q('medio', 'Uma blusa de R$ 200,00 tem desconto de 15%. Quanto ela passa a custar?', ['R$ 185,00', 'R$ 170,00', 'R$ 30,00', 'R$ 215,00'], 1, 'O desconto é 0,15 × 200 = 30. O preço novo é 200 − 30 = 170. R$ 30 é só o valor do desconto.'),
      q('medio', 'O preço de um produto subiu de R$ 80 para R$ 100. Qual foi o aumento percentual?', ['20%', '25%', '80%', '125%'], 1, 'O aumento foi de 20 reais. A base é o preço antigo: 20 / 80 = 0,25 = 25%.'),
      q('medio', '18 é quantos por cento de 60?', ['3%', '18%', '30%', '33%'], 2, 'Parte ÷ todo: 18 / 60 = 0,3, ou seja, 30%.'),
      q('dificil', 'Um produto de R$ 100 sofre aumento de 10% e, depois, desconto de 10% sobre o novo preço. Qual é o preço final?', ['R$ 100,00', 'R$ 99,00', 'R$ 101,00', 'R$ 90,00'], 1, '100 × 1,10 = 110 e 110 × 0,90 = 99. O desconto de 10% incide sobre um valor maior, então não volta ao início.'),
      q('dificil', 'Um salário de R$ 2.000 tem aumento de 8% e, depois, outro de 5% sobre o novo salário. Qual é o salário final?', ['R$ 2.260,00', 'R$ 2.268,00', 'R$ 2.280,00', 'R$ 2.300,00'], 1, '2.000 × 1,08 = 2.160 e 2.160 × 1,05 = 2.268. Somar 8% + 5% = 13% daria 2.260, que é o erro clássico.'),
    ],
  },
  {
    topic: 'razao-e-proporcao', grade: '7º ano', title: 'Razão, proporção e regra de três', subtitle: 'Grandezas diretas e inversamente proporcionais',
    resumo: String.raw`## Razão e proporção
**Razão** é a divisão entre dois números: a razão entre 12 e 4 é $\frac{12}{4}=3$. **Proporção** é a igualdade entre duas razões: $\frac{a}{b}=\frac{c}{d}$. Nela, vale a regra do produto cruzado: $a\cdot d=b\cdot c$.

Exemplo: $\frac{2}{3}=\frac{x}{9}\Rightarrow3x=18\Rightarrow x=6$.

## Regra de três simples
- **Direta:** as grandezas crescem juntas. 3 kg custam R$ 18; 5 kg custam $\frac{18\cdot5}{3}=30$.
- **Inversa:** quando uma cresce, a outra diminui. 4 operários levam 6 dias; 8 operários levam $\frac{4\cdot6}{8}=3$ dias.

## Como decidir
Pergunte: "se uma grandeza **dobra**, a outra dobra (direta) ou cai pela metade (inversa)?" Mais operários, menos dias: inversa. Mais produtos, mais dinheiro: direta.

## Escala
Escala 1:500 significa que 1 cm no mapa vale 500 cm na realidade. 4 cm no mapa são $4\times500=2000\ \text{cm}=20\ \text{m}$.

## Erros comuns
- Usar regra direta em problema de grandezas inversas.
- Esquecer de converter unidades (cm para m).
- Trocar a ordem das razões na proporção.`,
    questoes: [
      q('facil', 'Qual é a razão entre 12 e 4?', ['3', '1/3', '8', '16'], 0, 'A razão entre 12 e 4 é 12 ÷ 4 = 3.'),
      q('facil', 'Na proporção 2/3 = x/9, qual é o valor de x?', ['3', '6', '9', '27'], 1, 'Produto cruzado: 3x = 2 · 9 = 18, então x = 6.'),
      q('facil', '3 kg de arroz custam R$ 18,00. Quanto custam 5 kg do mesmo arroz?', ['R$ 24,00', 'R$ 30,00', 'R$ 36,00', 'R$ 15,00'], 1, 'Cada quilo custa R$ 6,00, então 5 kg custam 5 · 6 = 30. É regra de três direta.'),
      q('medio', '4 operários constroem um muro em 6 dias. Quantos dias 8 operários, no mesmo ritmo, levariam?', ['3 dias', '6 dias', '12 dias', '24 dias'], 0, 'Mais operários, menos dias: grandezas inversamente proporcionais. 4 · 6 = 8 · x, então x = 3.'),
      q('medio', 'Em um mapa com escala 1:500, uma distância de 4 cm representa na realidade:', ['2 m', '20 m', '200 m', '4 m'], 1, '4 · 500 = 2.000 cm, que são 20 m.'),
      q('medio', 'Um carro faz 12 km com 1 litro de combustível. Quantos quilômetros ele percorre com 30 litros?', ['36 km', '42 km', '360 km', '2,5 km'], 2, 'Grandezas diretas: 12 · 30 = 360 km.'),
      q('dificil', 'Uma receita para 4 pessoas leva 300 g de farinha. Quantos gramas são necessários para 10 pessoas?', ['600 g', '750 g', '900 g', '1.200 g'], 1, 'Regra de três direta: 300 · 10 / 4 = 750 g.'),
      q('dificil', 'Uma torneira enche um tanque em 6 horas. Com 3 torneiras iguais abertas ao mesmo tempo, em quanto tempo o tanque enche?', ['2 horas', '3 horas', '12 horas', '18 horas'], 0, 'Mais torneiras, menos tempo (inversa): 1 · 6 = 3 · x, então x = 2 horas.'),
    ],
  },
  {
    topic: 'equacoes-do-2o-grau', grade: '9º ano', title: 'Equações do 2º grau', subtitle: 'Fórmula de Bhaskara, discriminante e problemas',
    resumo: String.raw`## Forma geral
$ax^2+bx+c=0$, com $a\neq0$. Identifique $a$, $b$ e $c$ com seus sinais: em $x^2-5x+6=0$, $a=1$, $b=-5$, $c=6$.

## Fórmula de Bhaskara
$$\Delta=b^2-4ac\qquad x=\frac{-b\pm\sqrt{\Delta}}{2a}$$

- $\Delta>0$: duas raízes reais diferentes.
- $\Delta=0$: uma raiz real (dupla).
- $\Delta<0$: nenhuma raiz real.

## Exemplo resolvido
$x^2-5x+6=0$: $\Delta=25-24=1$, então $x=\frac{5\pm1}{2}$, ou seja, $x=3$ ou $x=2$.

## Soma e produto das raízes
$$S=x_1+x_2=-\frac{b}{a}\qquad P=x_1\cdot x_2=\frac{c}{a}$$
Em $x^2-7x+10=0$: $S=7$ e $P=10$ (as raízes são 2 e 5).

## Casos simples
- $x^2=9\Rightarrow x=\pm3$ (as duas raízes!).

## Problema com texto
Um retângulo tem área 24 m² e o comprimento é 2 m maior que a largura. Com $x$ a largura: $x(x+2)=24\Rightarrow x^2+2x-24=0$. $\Delta=100$, $x=4$ (descarta-se $-6$). Largura 4 m, comprimento 6 m.

## Erros comuns
- Errar o sinal de $b$ (na fórmula entra $-b$).
- Esquecer a raiz negativa em $x^2=9$.
- Aceitar medidas negativas como resposta de um problema geométrico.`,
    questoes: [
      q('facil', 'Na equação x² − 5x + 6 = 0, quais são os coeficientes a, b e c?', ['a = 1, b = 5, c = 6', 'a = 1, b = −5, c = 6', 'a = 6, b = −5, c = 1', 'a = 0, b = −5, c = 6'], 1, 'a é o número que multiplica x² (1), b multiplica x (−5, com o sinal) e c é o termo independente (6).'),
      q('facil', 'Qual é o discriminante (Δ) de x² − 5x + 6 = 0?', ['1', '49', '−1', '11'], 0, 'Δ = b² − 4ac = (−5)² − 4·1·6 = 25 − 24 = 1.'),
      q('facil', 'Quais são as soluções de x² − 9 = 0?', ['Somente 3', '3 e −3', '9 e −9', '81'], 1, 'x² = 9, então x = 3 ou x = −3. Esquecer o −3 é o erro mais comum.'),
      q('medio', 'Quais são as raízes de x² − 5x + 6 = 0?', ['1 e 6', '2 e 3', '−2 e −3', '5 e 6'], 1, 'Por Bhaskara: x = (5 ± 1) / 2, ou seja, 3 e 2. Conferindo: soma 5 e produto 6.'),
      q('medio', 'A equação x² − 4x + 4 = 0 tem:', ['duas raízes diferentes', 'uma raiz real (raiz dupla), x = 2', 'nenhuma raiz real', 'raízes 4 e −4'], 1, 'Δ = 16 − 16 = 0. Com Δ = 0 há uma raiz dupla: x = 4/2 = 2.'),
      q('medio', 'A equação x² + 2x + 5 = 0 tem:', ['duas raízes reais diferentes', 'uma raiz real', 'nenhuma raiz real', 'raízes 1 e 5'], 2, 'Δ = 4 − 20 = −16 < 0. Com Δ negativo não existem raízes reais.'),
      q('dificil', 'Qual é a soma das raízes de x² − 7x + 10 = 0?', ['−7', '7', '10', '−10'], 1, 'S = −b/a = −(−7)/1 = 7. As raízes são 2 e 5, e 2 + 5 = 7.'),
      q('dificil', 'Um retângulo tem área de 24 m² e o comprimento mede 2 m a mais que a largura. Qual é a largura?', ['4 m', '6 m', '8 m', '12 m'], 0, 'Com largura x: x(x + 2) = 24, ou x² + 2x − 24 = 0. Δ = 100 e x = (−2 + 10)/2 = 4 (descarta-se −6). O comprimento é 6 m.'),
    ],
  },
  {
    topic: 'funcao-quadratica', grade: '1ª série EM', title: 'Função quadrática', subtitle: 'Parábola, raízes, vértice e valor máximo ou mínimo',
    resumo: String.raw`## Definição
$f(x)=ax^2+bx+c$, com $a\neq0$. O gráfico é uma **parábola**.

- $a>0$: concavidade **para cima** (tem valor **mínimo**).
- $a<0$: concavidade **para baixo** (tem valor **máximo**).
- $c=f(0)$: onde a parábola corta o eixo $y$.

## Raízes
São os valores de $x$ com $f(x)=0$, achados por Bhaskara.

## Vértice
$$x_v=-\frac{b}{2a}\qquad y_v=f(x_v)=-\frac{\Delta}{4a}$$
O vértice é o ponto de máximo ou de mínimo. O eixo de simetria é a reta $x=x_v$.

## Exemplo resolvido
$f(x)=x^2-4x+3$: $a=1>0$ (mínimo). Raízes: $x=1$ e $x=3$. $x_v=\frac{4}{2}=2$ e $y_v=f(2)=4-8+3=-1$. Corta o eixo $y$ em 3.

## Problema de lançamento
$h(t)=-5t^2+20t$ (altura em metros): $a<0$, máximo em $t_v=\frac{-20}{2(-5)}=2$ s, com $h(2)=-20+40=20$ m.

## Erros comuns
- Confundir o $x_v$ com o valor máximo (o máximo é o $y_v$).
- Errar o sinal em $-\frac{b}{2a}$.
- Dizer que parábola com $a<0$ tem valor mínimo.`,
    questoes: [
      q('facil', 'O gráfico de uma função quadrática é:', ['uma reta', 'uma parábola', 'uma circunferência', 'uma hipérbole'], 1, 'A função quadrática f(x) = ax² + bx + c tem como gráfico uma parábola.'),
      q('facil', 'Se a > 0 em f(x) = ax² + bx + c, a parábola tem concavidade:', ['voltada para cima', 'voltada para baixo', 'inexistente', 'horizontal'], 0, 'Com a positivo, a parábola abre para cima e tem um ponto de mínimo.'),
      q('facil', 'Em que ponto o gráfico de f(x) = x² − 4x + 3 corta o eixo y?', ['(0, 3)', '(0, −4)', '(0, 1)', '(0, 0)'], 0, 'O ponto onde o gráfico corta o eixo y é f(0) = c = 3.'),
      q('medio', 'Quais são as raízes de f(x) = x² − 4x + 3?', ['1 e 3', '−1 e −3', '2 e 2', '3 e 4'], 0, 'Δ = 16 − 12 = 4 e x = (4 ± 2)/2, ou seja, 3 e 1.'),
      q('medio', 'Qual é a abscissa do vértice de f(x) = x² − 4x + 3?', ['−2', '2', '4', '1'], 1, 'x_v = −b / (2a) = 4 / 2 = 2.'),
      q('medio', 'Qual é o valor mínimo de f(x) = x² − 4x + 3?', ['−1', '1', '3', '0'], 0, 'O mínimo ocorre em x = 2: f(2) = 4 − 8 + 3 = −1.'),
      q('dificil', 'Qual é o valor máximo de f(x) = −x² + 6x − 5?', ['3', '4', '5', '9'], 1, 'O máximo ocorre em x_v = −6 / (2·(−1)) = 3. Então f(3) = −9 + 18 − 5 = 4. O número 3 é onde o máximo acontece, não o seu valor.'),
      q('dificil', 'A altura de uma bola é h(t) = −5t² + 20t, com h em metros e t em segundos. Qual é a altura máxima?', ['10 m', '20 m', '40 m', '15 m'], 1, 'O máximo ocorre em t = 20 / 10 = 2 s. h(2) = −20 + 40 = 20 m.'),
    ],
  },
  {
    topic: 'probabilidade', grade: '2ª série EM', title: 'Probabilidade', subtitle: 'Eventos, complementar, independentes e sem reposição',
    resumo: String.raw`## Definição
$$P(A)=\frac{\text{casos favoráveis}}{\text{casos possíveis}}\qquad0\le P\le1$$
Dado de 6 faces, número par: $\frac{3}{6}=\frac{1}{2}$.

## Evento complementar
$P(\bar{A})=1-P(A)$. Não sair o 6 no dado: $1-\frac{1}{6}=\frac{5}{6}$.

## Eventos independentes
Um não interfere no outro: **multiplica-se**. Duas moedas, duas caras: $\frac{1}{2}\cdot\frac{1}{2}=\frac{1}{4}$.

## Sem reposição
Urna com 4 bolas brancas e 6 pretas; retiram-se duas, sem devolver. Ambas brancas: $\frac{4}{10}\cdot\frac{3}{9}=\frac{12}{90}=\frac{2}{15}$. Com reposição seria $\frac{4}{10}\cdot\frac{4}{10}=\frac{4}{25}$.

## Eventos "ou"
$P(A\cup B)=P(A)+P(B)-P(A\cap B)$. Se não podem ocorrer juntos, basta somar.

## Espaço amostral de dois dados
São 36 resultados. Soma 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1), ou seja, $\frac{6}{36}=\frac{1}{6}$.

## Erros comuns
- Somar probabilidades de eventos independentes que deveriam ser multiplicados.
- Esquecer que, sem reposição, o total diminui.
- Contar casos iguais como se fossem diferentes (ou o contrário).`,
    questoes: [
      q('facil', 'Ao lançar um dado comum de 6 faces, qual é a probabilidade de sair um número par?', ['1/6', '1/3', '1/2', '2/3'], 2, 'Há 3 números pares (2, 4, 6) em 6 resultados possíveis: 3/6 = 1/2.'),
      q('facil', 'Ao lançar uma moeda honesta, a probabilidade de dar cara é:', ['1/4', '1/2', '1', '2'], 1, 'São 2 resultados possíveis, igualmente prováveis, e 1 favorável: 1/2.'),
      q('facil', 'Uma urna tem 3 bolas vermelhas e 7 azuis. Qual é a probabilidade de sortear uma vermelha?', ['3/7', '3/10', '7/10', '1/3'], 1, 'Há 3 favoráveis em 10 bolas: 3/10. O erro 3/7 compara vermelhas com azuis.'),
      q('medio', 'Ao lançar um dado, qual é a probabilidade de NÃO sair o número 6?', ['1/6', '5/6', '1/2', '2/3'], 1, 'O complementar de sair 6 (1/6) é 1 − 1/6 = 5/6.'),
      q('medio', 'Duas moedas honestas são lançadas. Qual é a probabilidade de saírem duas caras?', ['1/2', '1/4', '1/3', '3/4'], 1, 'Os eventos são independentes: 1/2 × 1/2 = 1/4.'),
      q('medio', 'Ao lançar dois dados, qual é a probabilidade de a soma ser 7?', ['1/12', '1/6', '7/12', '1/3'], 1, 'Dos 36 resultados, 6 somam 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). 6/36 = 1/6.'),
      q('dificil', 'Uma urna tem 4 bolas brancas e 6 pretas. Retiram-se 2 bolas, uma após a outra, sem reposição. Qual é a probabilidade de as duas serem brancas?', ['4/25', '2/15', '1/5', '6/25'], 1, '4/10 × 3/9 = 12/90 = 2/15. A alternativa 4/25 seria o resultado com reposição.'),
      q('dificil', 'A e B são eventos independentes com P(A) = 0,4 e P(B) = 0,5. Qual é P(A e B)?', ['0,9', '0,2', '0,1', '0,45'], 1, 'Para eventos independentes, multiplica-se: 0,4 × 0,5 = 0,2. Somar (0,9) seria tratar o "e" como se fosse "ou".'),
    ],
  },
  {
    topic: 'progressoes', grade: '1ª série EM', title: 'Progressões aritméticas e geométricas', subtitle: 'Termo geral e soma de termos',
    resumo: String.raw`## Progressão aritmética (PA)
Cada termo é o anterior **mais uma constante** $r$ (a razão). $2,5,8,11,\ldots$ tem $r=3$.

$$a_n=a_1+(n-1)\,r\qquad S_n=\frac{(a_1+a_n)\,n}{2}$$

Exemplo: 10º termo de $a_1=3$, $r=4$: $3+9\cdot4=39$.
Soma $1+2+\cdots+10=\frac{(1+10)\cdot10}{2}=55$.

## Progressão geométrica (PG)
Cada termo é o anterior **multiplicado** por uma constante $q$. $3,6,12,24,\ldots$ tem $q=2$.

$$a_n=a_1\cdot q^{\,n-1}\qquad S_n=\frac{a_1\,(q^n-1)}{q-1}$$

Exemplo: 5º termo de $a_1=2$, $q=3$: $2\cdot3^4=162$.
Soma de $1,2,4,\ldots$ com 8 termos: $\frac{1\cdot(2^8-1)}{2-1}=255$.

## Como reconhecer
- Termos **diferem** por um valor fixo: PA.
- Termos têm **razão** fixa entre si: PG.

## Erros comuns
- Usar $n$ em vez de $n-1$ no termo geral.
- Confundir o expoente $n-1$ com $n$ na PG.
- Somar quando deveria multiplicar (e vice-versa).`,
    questoes: [
      q('facil', 'Qual é a razão da PA 2, 5, 8, 11, ...?', ['2', '3', '5', '7'], 1, 'Cada termo é o anterior mais 3: 5 − 2 = 3.'),
      q('facil', 'Qual é a razão da PG 3, 6, 12, 24, ...?', ['2', '3', '6', '9'], 0, 'Cada termo é o anterior multiplicado por 2: 6 ÷ 3 = 2.'),
      q('facil', 'Qual é o próximo termo da PA 4, 9, 14, ...?', ['18', '19', '20', '24'], 1, 'A razão é 5, então o próximo termo é 14 + 5 = 19.'),
      q('medio', 'Qual é o 10º termo da PA com a₁ = 3 e razão 4?', ['36', '39', '43', '40'], 1, 'a₁₀ = 3 + (10 − 1)·4 = 3 + 36 = 39. O erro comum é usar 10 em vez de 9.'),
      q('medio', 'Qual é o 5º termo da PG com a₁ = 2 e razão 3?', ['54', '162', '486', '30'], 1, 'a₅ = 2 · 3⁴ = 2 · 81 = 162. O expoente é n − 1 = 4.'),
      q('medio', 'Qual é a soma 1 + 2 + 3 + ... + 10?', ['50', '55', '100', '45'], 1, 'S = (1 + 10) · 10 / 2 = 55.'),
      q('dificil', 'Qual é a soma dos 20 primeiros números ímpares positivos (1 + 3 + 5 + ...)?', ['200', '380', '400', '420'], 2, 'É uma PA com a₁ = 1 e r = 2, então a₂₀ = 39. S = (1 + 39) · 20 / 2 = 400.'),
      q('dificil', 'Qual é a soma dos 8 primeiros termos da PG 1, 2, 4, 8, ...?', ['127', '255', '256', '511'], 1, 'S = 1 · (2⁸ − 1) / (2 − 1) = 255. A alternativa 256 é o 9º termo da PG, não a soma.'),
    ],
  },
];
