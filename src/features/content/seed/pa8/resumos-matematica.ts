import { resumo, type ResumoG3 } from '../grande3/types';

/** PA8 · micro resumos de Matemática, um por módulo (19 a 37). Resumos de estudo do Nexa. */
const S = '9º ano' as const;
const MA = 'matematica';

export const RESUMOS_PA8_MATEMATICA: ResumoG3[] = [
  resumo(
    MA,
    S,
    'pa8-mat-19',
    'Módulo 19 · Matemática Financeira',
    'Porcentagem, juros simples e juros compostos',
    `## Porcentagem
- **Desconto de i%:** multiplique por (1 − i). 15% de desconto → ×0,85.
- **Aumento de i%:** multiplique por (1 + i). 20% de aumento → ×1,2.
- Aumentos e descontos **sucessivos** se multiplicam: +20% e depois −20% dá 1,2 × 0,8 = 0,96 (**perde 4%**).

## Juros simples
J = C · i · t e M = C + J. O juro é sempre calculado sobre o **capital inicial**.

## Juros compostos
M = C · (1 + i)^t. O juro de cada período rende sobre o **montante anterior** ("juros sobre juros").

### Como cai na prova
Comparar simples × compostos, descontos sucessivos e preço à vista × a prazo.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-20',
    'Módulo 20 · Proporcionalidade',
    'Grandezas direta e inversamente proporcionais e regra de três',
    `## Tipos
- **Diretamente proporcionais:** uma cresce, a outra cresce na mesma razão (preço × quantidade).
- **Inversamente proporcionais:** uma cresce, a outra diminui (operários × dias).

## Regra de três
- Direta: multiplica em cruz.
- Inversa: o produto é constante (4 · 12 = 6 · x).
- **Composta:** compare cada grandeza com a que se quer descobrir, uma de cada vez.

## Escala
Escala 1 : 50 000 → 1 cm no mapa = 50 000 cm = 500 m no real.

### Erro comum
Usar regra de três direta quando a relação é inversa. Pergunte: "se dobra uma, a outra dobra ou cai pela metade?"`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-21',
    'Módulo 21 · Explorações no plano cartesiano',
    'Distância entre dois pontos e ponto médio',
    `## Distância entre A(x₁, y₁) e B(x₂, y₂)
d = √[(x₂ − x₁)² + (y₂ − y₁)²] (é o teorema de Pitágoras).

Exemplo: A(1, 2) e B(4, 6) → d = √(9 + 16) = **5**.

## Ponto médio
M = ((x₁ + x₂)/2 ; (y₁ + y₂)/2).

Exemplo: A(−2, 4) e B(6, −2) → M(**2**, **1**).

## Dica
Faça um esboço dos pontos: ajuda a achar erros de sinal.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-22',
    'Módulo 22 · Relações métricas no triângulo retângulo',
    'Pitágoras, altura e projeções',
    `## Elementos
Hipotenusa **a**, catetos **b** e **c**, altura **h** relativa à hipotenusa, projeções **m** e **n** dos catetos (m + n = a).

## As relações
- **a² = b² + c²** (Pitágoras)
- **h² = m · n**
- **b² = a · m** e **c² = a · n**
- **a · h = b · c**

Exemplo: m = 9 e n = 16 → h² = 144 → h = **12**.

### Dica
Diagonal do quadrado de lado ℓ: ℓ√2.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-23',
    'Módulo 23 · Estudo da circunferência',
    'Arcos, ângulos, comprimento e tangente',
    `## Ângulos
- **Central:** mede o mesmo que o arco.
- **Inscrito:** mede **metade** do arco que enxerga.

## Comprimento
C = 2πr. A roda de raio 0,5 m percorre 3,14 m por volta.

## Tangente
A reta tangente é **perpendicular ao raio** no ponto de tangência. Isso forma um triângulo retângulo: PO² = PT² + r².

### Como cai na prova
Arco → ângulo inscrito, comprimento de roda e tangente + Pitágoras.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-24',
    'Módulo 24 · Propriedades das raízes da equação do 2º grau',
    'Soma, produto e discriminante',
    `## Para ax² + bx + c = 0
- **Soma** das raízes: −b/a
- **Produto** das raízes: c/a
- **Δ = b² − 4ac:** Δ > 0 duas raízes reais diferentes; Δ = 0 duas iguais; Δ < 0 nenhuma real.

Exemplo: x² − 7x + 10 = 0 → soma 7, produto 10 (raízes 2 e 5).

## Truque
Soma dos inversos = soma ÷ produto. Para raízes 2 e 3: 5/6.

### Erro comum
Esquecer o sinal de −b/a.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-25',
    'Módulo 25 · Sistemas de equações',
    'Sistemas lineares e com uma equação do 2º grau',
    `## Métodos
- **Adição:** some as equações para eliminar uma incógnita.
- **Substituição:** isole uma incógnita e substitua na outra.

## Quando há 2º grau
Se x + y = 5 e xy = 6, os números são raízes de t² − 5t + 6 = 0 (2 e 3).

## Identidade útil
x² + y² = (x + y)² − 2xy. Com x + y = 5 e xy = 6: 25 − 12 = 13.

### Dica
Confira a solução nas **duas** equações.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-26',
    'Módulo 26 · Polígonos regulares',
    'Ângulos, apótema e polígonos inscritos',
    `## Ângulos
- Soma dos ângulos internos: **(n − 2) · 180°**.
- Ângulo interno de um regular: (n − 2) · 180° ÷ n.
- Ângulo externo: 360° ÷ n.

Exemplos: hexágono 120°, octógono **135°**, pentágono 108°.

## Elementos
- **Apótema:** distância do centro ao lado.
- No **hexágono regular**, o lado é igual ao raio da circunferência circunscrita.

### Dica
Divida o polígono em triângulos a partir do centro.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-27',
    'Módulo 27 · Funções: dependência entre variáveis',
    'Função afim e leitura de situações',
    `## Ideia
Uma grandeza **depende** da outra: f(x). Cada x tem **um único** y.

## Função afim
f(x) = ax + b. **a** é a taxa de variação (inclinação); **b** é o valor inicial.

Exemplo: táxi com bandeirada R$ 5 e R$ 2/km → f(x) = 2x + 5. Para 12 km: 29.

### Dica
Para achar onde o gráfico corta o eixo x, resolva f(x) = 0.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-28',
    'Módulo 28 · Resolução de problemas',
    'Estratégias para interpretar e resolver',
    `## Passo a passo
1. **Leia** e identifique o que se pergunta.
2. **Organize** os dados (tabela, desenho, equação).
3. **Escolha** a estratégia: equação, proporção, sistema, desenho.
4. **Resolva** e **confira** se a resposta faz sentido (unidade, ordem de grandeza).

## Estratégias comuns
- Tentativa e erro organizada
- Trabalhar de trás para frente
- Dividir em casos

### Erro comum
Responder o que não foi perguntado (ex.: dar x quando se pede 2x).`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-29',
    'Módulo 29 · Volume de prismas e cilindros',
    'V = área da base × altura',
    `## Regra única
**V = A_base · h**

- Prisma de base retangular: V = comprimento · largura · altura.
- Prisma de base triangular: área da base = (b · h)/2.
- **Cilindro:** V = π r² h. Raio 3 m e altura 10 m → 90π m³.

## Unidades
1 m³ = **1 000 litros** · 1 dm³ = 1 litro.

### Erro comum
Usar o diâmetro no lugar do raio.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-30',
    'Módulo 30 · Probabilidade',
    'Eventos independentes e dependentes',
    `## Probabilidade
P = casos favoráveis ÷ casos possíveis.

## Eventos independentes
Um não influencia o outro: **multiplique**. Cara (1/2) e múltiplo de 3 (1/3): 1/6.

## Eventos dependentes (sem reposição)
O 2º depende do 1º. Duas vermelhas de 4 V e 6 A: 4/10 · 3/9 = **2/15**.

### Dica
"E" → multiplica. "OU" → soma (se não puderem acontecer juntos).`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-31',
    'Módulo 31 · Equações redutíveis a equações do 2º grau',
    'Biquadradas e substituições',
    `## Biquadrada
ax⁴ + bx² + c = 0. Faça **y = x²** e resolva ay² + by + c = 0.

Exemplo: x⁴ − 5x² + 4 = 0 → y = 1 ou y = 4 → x = ±1 ou ±2 (**4** raízes).

## Atenção
- y negativo não gera x real.
- Volte para x no final.

### Dica
Teste as raízes na equação original.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-32',
    'Módulo 32 · Frações algébricas e equações fracionárias',
    'Simplificar e resolver com denominadores',
    `## Frações algébricas
Fatore e **cancele fatores iguais**. (x² − 9)/(x − 3) = (x − 3)(x + 3)/(x − 3) = x + 3, com x ≠ 3.

## Equações fracionárias
1. Determine as **restrições** (denominador ≠ 0).
2. Reduza ao mesmo denominador.
3. Resolva e **verifique** a restrição.

Exemplo: 1/x + 1/2 = 3/4 → x = 4.

### Erro comum
Cancelar parcelas (e não fatores).`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-33',
    'Módulo 33 · Razões trigonométricas no triângulo retângulo',
    'Seno, cosseno e tangente',
    `## Definições (em relação ao ângulo α)
- **sen α** = cateto oposto ÷ hipotenusa
- **cos α** = cateto adjacente ÷ hipotenusa
- **tg α** = cateto oposto ÷ cateto adjacente

## Ângulos notáveis
| | 30° | 45° | 60° |
|---|---|---|---|
| sen | 1/2 | √2/2 | √3/2 |
| cos | √3/2 | √2/2 | 1/2 |
| tg | √3/3 | 1 | √3 |

Exemplo: rampa de 6 m a 30° → altura = 6 · sen 30° = 3 m.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-34',
    'Módulo 34 · Representação de funções',
    'Tabelas, gráficos e leis',
    `## Três representações
- **Lei** (f(x) = −2x + 6)
- **Tabela** de valores
- **Gráfico** no plano cartesiano

## Função afim
- O gráfico é uma **reta**.
- Corta o eixo y em **b** e o eixo x em **−b/a**.
- a > 0: **crescente**; a < 0: **decrescente**.

Exemplo: f(x) = −2x + 6 corta o eixo x em x = 3 e o eixo y em y = 6.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-35',
    'Módulo 35 · Vistas e perspectivas',
    'Vistas de objetos tridimensionais',
    `## Vistas ortogonais
- **Frontal**, **superior** e **lateral** (de lado).
- Cada vista mostra o objeto **de frente, sem perspectiva**, e partes escondidas podem ficar nas linhas tracejadas.

## Dicas
- Conte os cubos por camadas.
- Cuidado com cubos escondidos atrás de outros.
- O volume de um sólido de cubos iguais é o número de cubos × o volume de cada um.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-36',
    'Módulo 36 · Organização de dados de pesquisa',
    'Tabelas, gráficos e medidas de tendência central',
    `## Pesquisa
- **População** e **amostra** (representativa).
- Variáveis **qualitativas** (cor) e **quantitativas** (idade).

## Medidas
- **Média:** soma ÷ quantidade.
- **Mediana:** valor do meio, com os dados em ordem.
- **Moda:** valor que mais aparece.

## Gráficos
Barras, colunas, setores (pizza) e linhas. Leia **título e eixos** antes de interpretar.`,
  ),
  resumo(
    MA,
    S,
    'pa8-mat-37',
    'Módulo 37 · Investigações matemáticas e resolução de problemas',
    'Observar, conjecturar e justificar',
    `## O processo
1. **Observe** casos particulares.
2. **Conjecture** (levante uma hipótese).
3. **Teste** com novos casos.
4. **Justifique** com argumentos.

## Padrões
Sequências e regularidades podem virar uma **expressão algébrica**.

### Lembre
Um exemplo que funciona **não prova** a regra, mas um contraexemplo a derruba.`,
  ),
];
