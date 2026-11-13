import { resumo, type ResumoG3 } from './types';

const M = 'matematica';

/** Resumos de Matemática do 6º ano ao 3º ano do Ensino Médio. */
export const RESUMOS_MATEMATICA: ResumoG3[] = [
  // ------------------------------------------------------------ 6º ano
  resumo(
    M,
    '6º ano',
    'mat6-expressoes-mmc',
    'Expressões numéricas, MMC e MDC',
    'A ordem das contas e como achar múltiplos e divisores comuns',
    `
## A ordem das operações
Em uma expressão, resolva nesta ordem:
1. parênteses, depois colchetes e chaves;
2. potências e raízes;
3. **multiplicação e divisão**, da esquerda para a direita;
4. **soma e subtração**, da esquerda para a direita.

Exemplo: 5 + 3 × 4 = 5 + 12 = **17** (e não 32).

## MMC e MDC
- **MMC**: o menor múltiplo comum. Serve para eventos que se repetem juntos (dois ônibus que passam a cada 6 e 8 minutos se encontram de **24 em 24** minutos).
- **MDC**: o maior divisor comum. Serve para dividir em grupos iguais sem sobra (12 e 18 se dividem em grupos de até **6**).

## Erros comuns
- Somar antes de multiplicar.
- Confundir MMC (juntar) com MDC (repartir).`,
  ),
  resumo(
    M,
    '6º ano',
    'mat6-fracoes',
    'Frações: conceito e operações',
    'Parte de um todo, equivalência e soma com denominadores diferentes',
    `
## O que é uma fração
É uma parte de um todo dividido em partes iguais. Em 3/4, o **denominador** (4) diz em quantas partes o todo foi dividido e o **numerador** (3) diz quantas partes foram tomadas.

## Operações
- **Mesmo denominador:** soma os numeradores e mantém o denominador. 2/7 + 3/7 = 5/7.
- **Denominadores diferentes:** ache frações equivalentes com o mesmo denominador (use o MMC). 1/2 + 1/3 = 3/6 + 2/6 = **5/6**.
- **Fração de uma quantidade:** divida pelo denominador e multiplique pelo numerador. 3/4 de 20 = 20 ÷ 4 × 3 = **15**.

## Simplificar
Divida numerador e denominador pelo mesmo número: 6/8 = 3/4.

## Erros comuns
- Somar numeradores e denominadores (1/2 + 1/3 não é 2/5).`,
  ),
  resumo(
    M,
    '6º ano',
    'mat6-decimais',
    'Números decimais e dinheiro',
    'Somar, multiplicar por 10, 100, 1000 e calcular troco',
    `
## Como ler
Cada casa depois da vírgula é uma divisão por 10: **décimos**, **centésimos**, **milésimos**.

## Operações
- **Soma e subtração:** alinhe as vírgulas. 4,5 + 2,35 = 6,85.
- **Multiplicar por 10, 100, 1000:** a vírgula anda 1, 2, 3 casas para a **direita**.
- **Dividir por 10, 100, 1000:** a vírgula anda para a **esquerda**.

## No dia a dia
Troco = valor pago − valor da compra. Pagando R$ 20,00 por uma compra de R$ 13,75, o troco é R$ 6,25.

## Erros comuns
- Não alinhar as vírgulas na soma.
- Achar que 0,5 é menor que 0,05 por ter mais "números".`,
  ),
  resumo(
    M,
    '6º ano',
    'mat6-perimetro-area',
    'Perímetro e área',
    'Contorno e superfície de retângulos, quadrados e triângulos',
    `
## Perímetro
É a **soma dos lados** (o contorno). Retângulo de 5 m por 3 m: 5 + 3 + 5 + 3 = **16 m** de cerca.

## Área
É a medida da **superfície**, em unidades quadradas.
- Retângulo: base × altura.
- Quadrado: lado × lado.
- Triângulo: (base × altura) ÷ 2.

## Quando usar
- Cercar, contornar, rodapé: **perímetro**.
- Piso, tinta, grama: **área**.

## Erros comuns
- Esquecer o ÷ 2 na área do triângulo.
- Trocar m por m² na resposta.`,
  ),

  // ------------------------------------------------------------ 7º ano
  resumo(
    M,
    '7º ano',
    'mat7-inteiros',
    'Números inteiros',
    'Regras de sinais, reta numérica e situações com saldo e temperatura',
    `
## Reta numérica
Os inteiros incluem positivos, zero e negativos. Quanto mais à direita, maior: −2 > −5.

## Regras de sinais
- **Soma:** sinais iguais, soma e mantém o sinal; sinais diferentes, subtrai e fica o sinal do maior módulo.
- **Multiplicação e divisão:** sinais iguais dão **+**; sinais diferentes dão **−**.
  - (−3) × (−4) = +12
  - (−3) × (+4) = −12

## Exemplo real
Temperatura de −3 °C que sobe 10 °C vira 7 °C. Um saldo de R$ 50 com uma compra de R$ 80 vira **−R$ 30**.

## Erros comuns
- Achar que −8 é maior que −2.
- Esquecer que subtrair um negativo é somar: 5 − (−3) = 8.`,
  ),
  resumo(
    M,
    '7º ano',
    'mat7-equacoes',
    'Equações do 1º grau',
    'Isolar a incógnita e resolver problemas do dia a dia',
    `
## Ideia central
Uma equação é uma **balança em equilíbrio**: o que você faz de um lado, faz do outro.

## Passo a passo
Resolva 3x + 5 = 20:
1. Tire o 5 dos dois lados: 3x = 15.
2. Divida por 3: **x = 5**.

## Problemas
"O dobro de um número mais 7 dá 25." Monte 2x + 7 = 25 → 2x = 18 → **x = 9**.

## Conferência
Substitua o valor encontrado na equação original: 3·5 + 5 = 20. ✓

## Erros comuns
- Trocar o sinal ao passar um termo para o outro lado.
- Dividir só um termo e esquecer os outros.`,
  ),
  resumo(
    M,
    '7º ano',
    'mat7-proporcao',
    'Razão, proporção e regra de três',
    'Comparar grandezas e descobrir o valor que falta',
    `
## Razão e proporção
**Razão** compara duas quantidades (3 meninas para 5 meninos = 3/5). **Proporção** é a igualdade de duas razões.

## Regra de três simples
Se 4 cadernos custam R$ 28, quanto custam 10?
- Preço de 1 caderno: 28 ÷ 4 = R$ 7.
- 10 cadernos: **R$ 70**.

## Diretamente × inversamente
- **Direta:** uma cresce, a outra cresce (mais cadernos, mais preço).
- **Inversa:** uma cresce, a outra diminui (mais pedreiros, menos dias).

## Escala
Mapa 1:100.000 → 1 cm no mapa = 1 km real.

## Erros comuns
- Usar regra direta numa situação inversa.`,
  ),
  resumo(
    M,
    '7º ano',
    'mat7-porcentagem',
    'Porcentagem',
    'Descontos, aumentos e percentuais de acerto',
    `
## Ideia
Porcentagem é uma fração de denominador 100: 25% = 25/100 = 0,25.

## Cálculos rápidos
- **10%** de um valor: divida por 10.
- **50%:** metade. **25%:** a metade da metade.
- **Desconto de 20%** em R$ 150: 150 × 0,20 = 30 → paga R$ 120 (ou 150 × 0,80).
- **Aumento de 8%:** multiplique por 1,08.

## Percentual de acerto
Acertou 18 de 24? 18 ÷ 24 = 0,75 = **75%**.

## Erros comuns
- Aumentar 10% e depois descontar 10% **não** volta ao valor inicial (1,1 × 0,9 = 0,99).
- Calcular a porcentagem sobre a base errada.`,
  ),

  // ------------------------------------------------------------ 8º ano
  resumo(
    M,
    '8º ano',
    'mat8-potencias',
    'Potências, raízes e notação científica',
    'Propriedades das potências e números muito grandes ou pequenos',
    `
## Propriedades (mesma base)
- aᵐ · aⁿ = aᵐ⁺ⁿ (soma os expoentes)
- aᵐ ÷ aⁿ = aᵐ⁻ⁿ
- (aᵐ)ⁿ = aᵐ·ⁿ
- a⁰ = 1 e a⁻ⁿ = 1/aⁿ

## Raiz quadrada
√49 = 7 porque 7 × 7 = 49.

## Notação científica
Um número entre 1 e 10 vezes uma potência de 10. 8.500.000 = **8,5 × 10⁶**; 0,0003 = **3 × 10⁻⁴**.

## Erros comuns
- (−3)² = +9, mas −3² = −9.
- Multiplicar os expoentes quando deveria somar.`,
  ),
  resumo(
    M,
    '8º ano',
    'mat8-produtos-notaveis',
    'Cálculo algébrico e produtos notáveis',
    'Quadrado da soma, da diferença e diferença de quadrados',
    `
## Os três produtos notáveis
- **Quadrado da soma:** (a + b)² = a² + 2ab + b²
- **Quadrado da diferença:** (a − b)² = a² − 2ab + b²
- **Diferença de quadrados:** (a + b)(a − b) = a² − b²

## Para que servem
Atalho de cálculo: 51² = (50 + 1)² = 2500 + 100 + 1 = **2601**. E 99 × 101 = (100 − 1)(100 + 1) = 10000 − 1 = **9999**.

## Termos semelhantes
Só se somam termos com a mesma parte literal: 3x + 2x = 5x, mas 3x + 2x² não simplifica.

## Erro comum
- (a + b)² **não** é a² + b²: falta o termo do meio, 2ab.`,
  ),
  resumo(
    M,
    '8º ano',
    'mat8-sistemas',
    'Sistemas de equações do 1º grau',
    'Duas incógnitas, método da adição e da substituição',
    `
## Quando usar
Quando o problema tem **duas incógnitas** e duas informações.

## Método da adição
x + y = 10 e x − y = 4. Somando: 2x = 14 → x = 7; então y = 3.

## Método da substituição
De x + y = 10 isole y = 10 − x e substitua na outra equação.

## Exemplo
"Num estacionamento há 12 veículos (carros e motos) e 38 rodas." Com c carros e m motos: c + m = 12 e 4c + 2m = 38 → c = 7 e m = 5.

## Dica
Sempre confira as duas equações com os valores encontrados.`,
  ),
  resumo(
    M,
    '8º ano',
    'mat8-estatistica',
    'Probabilidade e estatística básica',
    'Média, mediana, moda e chance de um evento',
    `
## Medidas
- **Média:** soma dos valores ÷ quantidade.
- **Mediana:** valor do meio com os dados em ordem (com quantidade par, a média dos dois do meio).
- **Moda:** valor que mais aparece.

## Probabilidade
P = casos favoráveis ÷ casos possíveis. Dado de 6 faces, sair número par: 3/6 = **1/2**.

## Dois dados
Há 36 resultados. A soma 7 tem 6 combinações: P = 6/36 = 1/6.

## Erro comum
- Achar que a média é sempre um dos valores do conjunto.`,
  ),

  // ------------------------------------------------------------ 9º ano
  resumo(
    M,
    '9º ano',
    'mat9-segundo-grau',
    'Equações do 2º grau',
    'Bhaskara, soma e produto das raízes',
    `
## Forma geral
ax² + bx + c = 0, com a ≠ 0.

## Bhaskara
1. Calcule **Δ = b² − 4ac**.
2. x = (−b ± √Δ) ÷ 2a.
   - Δ > 0: duas raízes reais diferentes;
   - Δ = 0: uma raiz;
   - Δ < 0: nenhuma raiz real.

## Atalho: soma e produto
Raízes somam −b/a e multiplicam c/a. Em x² − 5x + 6 = 0: soma 5 e produto 6 → **2 e 3**.

## Casos incompletos
- x² − 25 = 0 → x = ±5.
- x² − 7x = 0 → x(x − 7) = 0 → x = 0 ou 7.

## Dica
Em problemas de medida, descarte a raiz negativa.`,
  ),
  resumo(
    M,
    '9º ano',
    'mat9-pitagoras',
    'Teorema de Pitágoras',
    'Catetos, hipotenusa e aplicações em rampas, telas e escadas',
    `
## Enunciado
Em todo triângulo **retângulo**, a² = b² + c², onde a é a **hipotenusa** (o lado oposto ao ângulo reto) e b, c são os **catetos**.

## Triplas que valem decorar
3-4-5, 5-12-13, 8-15-17 e seus múltiplos (6-8-10).

## Aplicações
- Escada de 5 m a 3 m da parede toca o muro a **4 m** de altura.
- Diagonal de um quadrado de lado l: **l√2**.
- Diagonal de um retângulo 6 × 8: **10**.

## Erros comuns
- Somar os lados em vez dos quadrados.
- Usar a fórmula em triângulo que não é retângulo.`,
  ),
  resumo(
    M,
    '9º ano',
    'mat9-trigonometria',
    'Trigonometria no triângulo retângulo',
    'Seno, cosseno e tangente nos ângulos notáveis',
    `
## Razões
Para um ângulo agudo do triângulo retângulo:
- **sen** = cateto oposto ÷ hipotenusa
- **cos** = cateto adjacente ÷ hipotenusa
- **tg** = cateto oposto ÷ cateto adjacente

## Ângulos notáveis
| ângulo | sen | cos | tg |
|---|---|---|---|
| 30° | 1/2 | √3/2 | √3/3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |

## Aplicação
A 20 m de um prédio, vê-se o topo com ângulo de 45°: altura = 20 · tg 45° = **20 m**.

## Erro comum
- Confundir cateto oposto e adjacente: eles dependem do ângulo escolhido.`,
  ),
  resumo(
    M,
    '9º ano',
    'mat9-juros',
    'Juros simples e compostos',
    'Quanto rende e quanto custa uma dívida',
    `
## Juros simples
Incidem **sempre sobre o capital inicial**. J = C · i · t. R$ 1.000 a 2% ao mês por 6 meses: J = R$ 120.

## Juros compostos
Incidem sobre o montante acumulado ("juros sobre juros"). M = C · (1 + i)ᵗ. R$ 1.000 a 2% ao mês por 3 meses: 1000 · 1,02³ ≈ **R$ 1.061,21**.

## Por que importa
Dívida no rotativo do cartão cresce em juros compostos e fica gigante em poucos meses. Já investir cedo faz os juros compostos trabalharem a seu favor.

## Erros comuns
- Usar o tempo em meses com taxa anual (a taxa e o tempo precisam estar na mesma unidade).`,
  ),

  // ------------------------------------------------------------ 1ª série EM
  resumo(
    M,
    '1ª série EM',
    'mat1-funcao-afim',
    'Função afim',
    'y = ax + b: crescimento, raiz e gráfico',
    `
## Definição
f(x) = ax + b. O gráfico é uma **reta**.

## O que cada letra faz
- **a** (coeficiente angular): inclinação. a > 0 cresce; a < 0 decresce.
- **b** (coeficiente linear): onde a reta corta o eixo y.

## Raiz (zero)
Resolva ax + b = 0 → x = −b/a. Em f(x) = 2x − 6, a raiz é **3**.

## Modelagem
Táxi com bandeirada R$ 5 e R$ 3 por km: **P(x) = 5 + 3x**. Para 10 km: R$ 35.

## Erro comum
- Confundir a taxa de variação (a) com o valor inicial (b).`,
  ),
  resumo(
    M,
    '1ª série EM',
    'mat1-funcao-quadratica',
    'Função quadrática',
    'Parábola, vértice, raízes e máximo ou mínimo',
    `
## Definição
f(x) = ax² + bx + c, com a ≠ 0. O gráfico é uma **parábola**.

## Concavidade
- a > 0: para cima (tem **mínimo**).
- a < 0: para baixo (tem **máximo**).

## Vértice
- xᵥ = −b ÷ 2a
- yᵥ = f(xᵥ) (o valor máximo ou mínimo)

## Raízes
Pontos onde f(x) = 0, por Bhaskara.

## Aplicação
Altura de uma bola: h(t) = −t² + 6t. O máximo ocorre em t = 3 s, com h = **9 m**.

## Erro comum
- Esquecer o sinal de b ao calcular xᵥ.`,
  ),
  resumo(
    M,
    '1ª série EM',
    'mat1-exp-log',
    'Função exponencial e logaritmo',
    'Crescimento exponencial e o que o logaritmo responde',
    `
## Exponencial
f(x) = aˣ (a > 0, a ≠ 1). Se a > 1, **cresce**; se 0 < a < 1, **decresce**. Modela juros compostos, bactérias e epidemias.

## Logaritmo
log_a(b) = x significa aˣ = b. Ele responde: "a que expoente elevo a para obter b?"
- log₂ 8 = 3, log₁₀ 1000 = 3.

## Propriedades
- log(a·b) = log a + log b
- log(a ÷ b) = log a − log b
- log(aⁿ) = n · log a

## Erro comum
- log(a + b) **não** é log a + log b.`,
  ),
  resumo(
    M,
    '1ª série EM',
    'mat1-progressoes',
    'Progressões aritmética e geométrica',
    'Termo geral e soma dos termos',
    `
## PA (soma constante)
- Termo geral: aₙ = a₁ + (n − 1)·r
- Soma: Sₙ = (a₁ + aₙ)·n ÷ 2
- Exemplo: 1 + 2 + … + 100 = (1 + 100)·100 ÷ 2 = **5050**.

## PG (multiplicação constante)
- Termo geral: aₙ = a₁ · qⁿ⁻¹
- Exemplo: 3, 6, 12, 24… → razão 2; o 6º termo é 3 · 2⁵ = **96**.

## Como reconhecer
Diferença constante entre termos: PA. Razão constante: PG.

## Erro comum
- Usar n em vez de (n − 1) no termo geral.`,
  ),

  // ------------------------------------------------------------ 2ª série EM
  resumo(
    M,
    '2ª série EM',
    'mat2-combinatoria',
    'Análise combinatória',
    'Princípio multiplicativo, permutação, arranjo e combinação',
    `
## Princípio multiplicativo
Se há 3 camisetas e 2 calças, são 3 × 2 = **6** looks.

## Quando a ordem importa?
- **Permutação:** ordenar n elementos = n! (5 pessoas em fila: 120).
- **Arranjo A(n,k):** escolher k de n **com ordem** (pódio de 3 entre 8: 8·7·6 = 336).
- **Combinação C(n,k):** escolher k de n **sem ordem** (comissão de 3 entre 8: 56).

## Anagramas
Palavra com letras repetidas: divida por n! de cada repetição. AMOR tem 4! = 24; ARARA tem 5! ÷ (3!·2!) = 10.

## Erro comum
- Usar combinação quando a ordem importa (ou o contrário).`,
  ),
  resumo(
    M,
    '2ª série EM',
    'mat2-probabilidade',
    'Probabilidade',
    'Eventos, complementar e independentes',
    `
## Definição
P(A) = casos favoráveis ÷ casos possíveis (de 0 a 1).

## Regras úteis
- **Complementar:** P(não A) = 1 − P(A).
- **E (independentes):** multiplica. Cara duas vezes na moeda: 1/2 · 1/2 = 1/4.
- **OU (excludentes):** soma.

## Sem reposição
Urna com 3 brancas e 2 pretas, tirando 2 brancas: 3/5 · 2/4 = **3/10**.

## Dica de prova
Quando for difícil contar "pelo menos um", calcule o complementar: 1 − P(nenhum).`,
  ),
  resumo(
    M,
    '2ª série EM',
    'mat2-matrizes',
    'Matrizes e determinantes',
    'Operações, produto e determinante 2×2',
    `
## Matriz
Tabela de números em linhas e colunas. Uma matriz m × n tem m linhas e n colunas.

## Operações
- **Soma:** elemento a elemento (mesmas dimensões).
- **Produto A·B:** só existe se colunas de A = linhas de B; cada elemento é linha × coluna.

## Determinante 2×2
Para [[a, b], [c, d]], det = **a·d − b·c**.

## Aplicação
Det = 0 indica sistema sem solução única. Em sistemas 2×2, o determinante mostra se há solução.

## Erro comum
- Achar que A·B = B·A (em geral, não é).`,
  ),
  resumo(
    M,
    '2ª série EM',
    'mat2-geometria-espacial',
    'Geometria espacial',
    'Volumes de prismas, cilindros, cones e esferas',
    `
## Volumes
- **Prisma / paralelepípedo:** área da base × altura (V = a·b·c).
- **Cilindro:** π·r²·h
- **Cone:** (π·r²·h) ÷ 3
- **Esfera:** (4/3)·π·r³

## Unidades
1 m³ = 1.000 L. Uma caixa de 2 × 1 × 1 m comporta 2.000 litros.

## Dica
Faça o desenho e identifique a **base** antes de escolher a fórmula.

## Erro comum
- Esquecer o ÷ 3 do cone (e da pirâmide).`,
  ),

  // ------------------------------------------------------------ 3ª série EM
  resumo(
    M,
    '3ª série EM',
    'mat3-geometria-analitica',
    'Geometria analítica',
    'Distância, ponto médio e equação da reta',
    `
## Distância entre dois pontos
d = √[(x₂ − x₁)² + (y₂ − y₁)²]. De (0,0) a (3,4): **5**.

## Ponto médio
M = ((x₁ + x₂)/2, (y₁ + y₂)/2).

## Reta
- Coeficiente angular: m = Δy ÷ Δx.
- Forma reduzida: **y = mx + n**.
- Paralelas: mesmo m. Perpendiculares: m₁ · m₂ = −1.

## Erro comum
- Inverter Δy e Δx no coeficiente angular.`,
  ),
  resumo(
    M,
    '3ª série EM',
    'mat3-estatistica',
    'Estatística: média, mediana e dispersão',
    'Como resumir dados e interpretar gráficos',
    `
## Medidas de posição
- **Média:** sensível a valores extremos.
- **Mediana:** resiste a extremos (por isso a renda típica usa mediana).
- **Moda:** o mais frequente.

## Dispersão
- **Amplitude:** maior − menor.
- **Desvio padrão:** quanto os dados se afastam da média (quanto menor, mais homogêneos).

## Média ponderada
Soma de (valor × peso) ÷ soma dos pesos.

## Dica de ENEM
Leia título, eixos e unidades do gráfico **antes** de olhar as alternativas.`,
  ),
  resumo(
    M,
    '3ª série EM',
    'mat3-complexos',
    'Números complexos',
    'Unidade imaginária, operações e módulo',
    `
## A unidade imaginária
i² = −1. Um complexo é z = a + bi (parte real a, parte imaginária b).

## Operações
- **Soma:** real com real, imaginária com imaginária.
- **Produto:** distribua e use i² = −1.
- **Conjugado** de a + bi é a − bi; z · conjugado = a² + b².

## Módulo
|z| = √(a² + b²). Em 3 + 4i, o módulo é **5**.

## Potências de i
Repetem de 4 em 4: i, −1, −i, 1. Para i²⁵, use o resto de 25 ÷ 4 = 1 → **i**.`,
  ),
  resumo(
    M,
    '3ª série EM',
    'mat3-polinomios',
    'Polinômios e equações polinomiais',
    'Grau, valor numérico, divisão e raízes',
    `
## Conceitos
- **Grau:** maior expoente com coeficiente diferente de zero.
- **Valor numérico:** substitua x pelo número pedido.

## Teorema do resto
O resto da divisão de P(x) por (x − a) é **P(a)**.

## Relações de Girard (grau 3 com raízes x₁, x₂, x₃)
Para ax³ + bx² + cx + d: soma das raízes = **−b/a**.

## Raiz e fator
Se P(a) = 0, então (x − a) é fator de P(x).

## Erro comum
- Esquecer o sinal em x − a quando a é negativo.`,
  ),
];
