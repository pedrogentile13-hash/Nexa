import { resumo, type ResumoG3 } from '../grande3/types';

/**
 * PB4 · Matemática (9º ano, Prof.ª Andréia Escabin): funções (Apostila 4, módulos 29, 31, 32 e 33), volume de
 * prisma e cilindro, trigonometria no triângulo retângulo, equações (irracionais, biquadradas, literais e
 * redutíveis ao 2º grau) e frações algébricas. Baseado no roteiro, na lista de estudos e nas VA 1 a 6.
 */
const S = '9º ano' as const;
const MA = 'matematica';

export const RESUMOS_MATEMATICA_PB4: ResumoG3[] = [
  resumo(
    MA,
    S,
    'pb4-mat-roteiro',
    'Matemática PB4 · O que cai e como estudar',
    'O roteiro da Prof.ª Andréia em um quadro, com o plano de estudo',
    `## O que a prova cobra
- **Funções** (tudo o que está no caderno e os exercícios **resolvidos** dos módulos **29, 31, 32 e 33** da Apostila 4).
- **Volume** de prismas e de cilindro (VA 1).
- **Trigonometria** no triângulo retângulo: seno, cosseno e tangente (lista de estudos).
- **Equações**: biquadradas (VA 2), irracionais (VA 3), literais (VA 4), redutíveis ao 2º grau (VA 5).
- **Frações algébricas**: simplificar e somar (VA 6).

## Como estudar (do roteiro)
1. Refaça os exercícios **sem calculadora**.
2. Errou? Descubra **onde** errou e repita até acertar com segurança.
3. Use as anotações do caderno e troque dicas com os colegas.
4. Invente exercícios para treinar: trocar os números de um exercício resolvido é o melhor treino.

## Ordem sugerida no Nexa
1. Leia um resumo. 2. Faça o simulado do mesmo assunto. 3. Só depois faça o **super simulado**.

## Regra de ouro da prova
**A resolução precisa aparecer.** Nas VAs a Prof.ª pede as contas completas, resposta à caneta ou destacada. Resposta certa sem conta pode perder nota.`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-volume',
    'Matemática PB4 · Volume de prisma e de cilindro',
    'V = área da base × altura, e como achar a área da base de cada figura',
    `## A ideia única
Para **prisma** e para **cilindro**, o volume é sempre
**V = Aᵦ · h** (área da base vezes a altura).
Todo o trabalho é descobrir a **área da base**.

## Áreas das bases (as fórmulas do quadro da professora)
| Base | Área Aᵦ |
|---|---|
| **Retângulo** | b · h (base vezes altura do retângulo) |
| **Quadrado** | ℓ · ℓ = ℓ² |
| **Triângulo** | (b · h) / 2 |
| **Triângulo equilátero** | ℓ²√3 / 4 (altura h = ℓ√3 / 2) |
| **Hexágono regular** | 6 · ℓ²√3 / 4 (seis triângulos equiláteros) |
| **Círculo** (cilindro) | π · r² |

## Exemplos resolvidos
- **Cubo de aresta 5 cm:** Aᵦ = 25, h = 5 → V = **125 cm³**.
- **Prisma de base quadrada 5 cm e altura 15 cm:** Aᵦ = 25 → V = 25 · 15 = **375 cm³**.
- **Prisma hexagonal, aresta da base 4 cm, altura 13 cm:** Aᵦ = 6 · 16√3 / 4 = 24√3 → V = 24√3 · 13 = **312√3 cm³** (≈ 540 cm³, com √3 ≈ 1,73).
- **Cilindro de raio 1,2 cm e altura 2 cm:** Aᵦ = π · 1,2² = 1,44π → V = 1,44π · 2 = **2,88π cm³** (≈ 9,04 cm³, com π ≈ 3,14).

## Embalagens de mesmo volume (lista de estudos, questão 1)
Caixa A: base de área 144 cm², altura 15 → V = 144 · 15 = **2 160 cm³**; a base é um quadrado, então x = √144 = **12 cm**.
Cilindro B: diâmetro x = 12 → raio 6 → Aᵦ = 36π. Volumes iguais: 36π · h = 2 160 → **h = 60/π cm** (≈ 19,1 cm).

## Unidades (cai em pegadinha)
- **1 cm³ = 1 mL** e **1 dm³ = 1 L**, então **1 m³ = 1 000 L**.
- Dobrar **todas** as arestas de um prisma multiplica o volume por **8**. Dobrar só o **raio** do cilindro multiplica por **4** (o raio está ao quadrado).

## Erros comuns
- Esquecer de **elevar o raio ao quadrado** (π·r·h em vez de π·r²·h).
- Usar o **diâmetro** no lugar do raio.
- Trocar a **altura do prisma** pela altura do triângulo da base.`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-trigonometria',
    'Matemática PB4 · Trigonometria no triângulo retângulo',
    'Seno, cosseno, tangente, a tabela do 30°, 45°, 60° e problemas de altura',
    `## As três razões
Em um triângulo retângulo, olhando para um ângulo agudo **α**:
- **sen α = cateto oposto / hipotenusa**
- **cos α = cateto adjacente / hipotenusa**
- **tg α = cateto oposto / cateto adjacente**

Macete: **SOH-CAH-TOA** (Seno = Oposto/Hipotenusa; Cosseno = Adjacente/Hipotenusa; Tangente = Oposto/Adjacente).

## Tabela que você precisa saber de cabeça (sem calculadora!)
| | 30° | 45° | 60° |
|---|---|---|---|
| **sen** | 1/2 | √2/2 | √3/2 |
| **cos** | √3/2 | √2/2 | 1/2 |
| **tg** | √3/3 | 1 | √3 |

Dica: o seno de 30° é igual ao cosseno de 60° (ângulos **complementares**: sen α = cos(90° − α)).

## Exemplo da lista: triângulo com ângulo de 40° e hipotenusa 8
- O lado **x** é adjacente a 40°: cos 40° = x / 8. O lado **y** é oposto: sen 40° = y / 8.
- Com a tabela trigonométrica: cos 40° ≈ **0,77** e sen 40° ≈ **0,64** (e tg 40° ≈ 0,84).
- Então x = 8 · cos 40° ≈ 8 · 0,766 ≈ **6,13** e y = 8 · sen 40° ≈ 8 · 0,643 ≈ **5,14**.

## Problemas de altura e distância
1. **Torre de 12 m vista sob 30°** (tg 30° = 0,58): tg 30° = 12 / x → x = 12 / 0,58 ≈ **20,7 m**.
2. **Prédio visto sob 30° a 60 m da base:** h = 60 · tg 30° = 60 · √3/3 = 20√3 ≈ **34,6 m** (com √3 ≈ 1,73).

## Passo a passo para qualquer problema
1. Desenhe o **triângulo retângulo** e marque o ângulo.
2. Escreva o que é **oposto**, **adjacente** e **hipotenusa** para esse ângulo.
3. Escolha a razão que usa **o lado que você sabe e o que você quer**.
4. Monte a equação e resolva.

## Relação fundamental
**sen² α + cos² α = 1.** Se sen α = 0,6, então cos² α = 1 − 0,36 = 0,64 e cos α = **0,8**.

## Erros comuns
- Trocar **oposto** por **adjacente** (depende do ângulo escolhido!).
- Usar **seno** quando o problema tem os **catetos** (aí é **tangente**).
- Esquecer que a hipotenusa é sempre o **maior** lado.`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-irracional',
    'Matemática PB4 · Equações irracionais',
    'Raiz com incógnita: isole, eleve ao quadrado e CONFIRA as raízes',
    `## O que é
**Equação irracional** é aquela em que a incógnita aparece **dentro de uma raiz**. Exemplo: √(3x + 16) − x = 2.

## Método (4 passos)
1. **Isole** a raiz em um dos lados.
2. **Eleve os dois lados ao quadrado** (cuidado com o lado que não é raiz: (x + 2)² = x² + 4x + 4).
3. Resolva a equação que sobrou (em geral do 2º grau).
4. **Verifique cada raiz na equação original.** Elevar ao quadrado pode criar **raízes falsas**.

## Exemplo 1 (VA 3): √(3x + 16) − x = 2
- Isolar: √(3x + 16) = x + 2.
- Elevar: 3x + 16 = x² + 4x + 4 → x² + x − 12 = 0 → x = 3 ou x = −4.
- Verificar: x = 3 → √25 − 3 = 2 ✓. x = −4 → √4 + 4 = 6 ≠ 2 ✗.
- **S = {3}.**

## Exemplo 2 (VA 3): 5 + 3√(x − 1) = x
- Isolar: 3√(x − 1) = x − 5 → elevar: 9(x − 1) = x² − 10x + 25 → x² − 19x + 34 = 0 → x = 17 ou x = 2.
- Verificar: x = 17 → 5 + 3 · 4 = 17 ✓. x = 2 → 5 + 3 · 1 = 8 ≠ 2 ✗.
- **S = {17}.**

## Exemplos da lista de estudos
- **√(5x + 1) + 1 = x:** √(5x + 1) = x − 1 → x² − 7x = 0 → x = 0 ou 7. Só **x = 7** serve (x = 0 dá 2 ≠ 0). **S = {7}.**
- **√(y + 10) − √(2y − 5) = 0:** as duas raízes são iguais → y + 10 = 2y − 5 → y = 15 ✓. **S = {15}.**
- **√(4a + 5) = a:** a² − 4a − 5 = 0 → a = 5 ou a = −1. Só **a = 5** serve (uma raiz quadrada nunca é negativa). **S = {5}.**
- **√(2x² + 3x + 5) = x + 3** (VA 5): x² − 3x − 4 = 0 → x = 4 ou x = −1. **Os dois** servem (−1 + 3 = 2 e √4 = 2). **S = {−1, 4}.**

## Regras de bolso
- A raiz quadrada (em ℝ) nunca é **negativa**: se o outro lado ficar negativo, a raiz é **falsa**.
- **Verificar não é opcional.** É o passo que mais derruba nota.`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-biquadrada',
    'Matemática PB4 · Equações biquadradas',
    'ax⁴ + bx² + c = 0: troque x² por t, resolva e volte para x',
    `## O que é
**Biquadrada:** equação do tipo **ax⁴ + bx² + c = 0** (só potências pares).

## Método
1. Coloque na **forma geral** (desenvolva parênteses, passe tudo para um lado).
2. Faça **x² = t** (então x⁴ = t²).
3. Resolva **at² + bt + c = 0** (Bhaskara, soma e produto ou fatoração).
4. Volte: **x = ±√t**. Se **t < 0**, não há raiz real naquele caso.

## Exemplos resolvidos
- **m⁴ − 3m² − 4 = 0:** t² − 3t − 4 = 0 → t = 4 ou t = −1. t = 4 → m = ±2; t = −1 não serve. **S = {−2, 2}.**
- **y⁴ − 20y² + 36 = 0:** t² − 20t + 36 = 0 → t = 18 ou t = 2 → **S = {±3√2, ±√2}** (√18 = 3√2).
- **16x⁴ + 9 = 40x²:** 16t² − 40t + 9 = 0 → Δ = 1 024 → t = 9/4 ou t = 1/4 → **S = {±3/2, ±1/2}.**
- **2x² + 5 = (x² + 1)²:** (x² + 1)² = x⁴ + 2x² + 1 → x⁴ − 4 = 0 → x² = 2 → **S = {±√2}.**
- **x²(x² − 2x + 1) = −x(2x² − 2x):** x⁴ − 2x³ + x² = −2x³ + 2x² → x⁴ − x² = 0 → x²(x² − 1) = 0 → **S = {−1, 0, 1}.**

## VA 2
- **3x²(x² − 5) = 5 − x²:** 3x⁴ − 15x² + x² − 5 = 0 → 3x⁴ − 14x² − 5 = 0 → 3t² − 14t − 5 = 0 → t = 5 ou t = −1/3 → **S = {±√5}.**
- **x²(x² − 10) + 9 = (x + 1)(x − 1):** x⁴ − 10x² + 9 = x² − 1 → x⁴ − 11x² + 10 = 0 → t = 10 ou t = 1 → **S = {±√10, ±1}.**

## Quantas raízes?
Até **4**. Cada t positivo gera **2** raízes (±); t = 0 gera **1**; t negativo gera **nenhuma**.

## Erros comuns
- Parar em **t** e esquecer de voltar para **x**.
- Esquecer o **±** ao tirar a raiz.
- Errar o sinal ao desenvolver (x² + 1)² (o termo do meio é **2x²**).`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-literal',
    'Matemática PB4 · Equações literais',
    'Letras como parâmetros: resolva em x, em função das outras letras',
    `## O que é
**Equação literal** tem, além da incógnita, **outras letras** que representam números (**parâmetros**). Você resolve **em relação a uma letra** (em geral x) e deixa a resposta **em função das outras**.

## Equação do 1º grau literal
**mx − 1 = nx + 1** (VA 4)
- Termos com x de um lado: mx − nx = 1 + 1.
- Fatorar: **(m − n) x = 2**.
- Dividir: **x = 2 / (m − n)**, com a condição **m ≠ n**.

## Equação do 2º grau literal
**x² − 3ax + 2a² = 0** (VA 4)
- Por **Bhaskara**: Δ = 9a² − 8a² = a². x = (3a ± a) / 2 → **x = 2a** ou **x = a**.
- Ou por **fatoração**: (x − a)(x − 2a) = 0.

**x² − 4nx + 3n² = 0** (VA 5)
- Δ = 16n² − 12n² = 4n². x = (4n ± 2n) / 2 → **x = 3n** ou **x = n**.

## Truque da soma e do produto
Em x² − Sx + P = 0 as raízes têm **soma S** e **produto P**.
- x² − 4nx + 3n²: soma 4n e produto 3n² → raízes n e 3n (1n + 3n = 4n; n · 3n = 3n²).

## Cuidados
- Diga a **condição** quando dividir (m − n ≠ 0).
- Δ pode ser expressão literal: **Δ = b² − 4ac** continua valendo com letras.
- (3a)² = **9a²** (eleve o número **e** a letra).`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-reducao',
    'Matemática PB4 · Redução a uma equação do 2º grau',
    'Troque uma expressão repetida por uma letra nova e resolva duas vezes',
    `## A ideia
Quando uma **mesma expressão** se repete, dê um **nome novo** para ela (uma letra) e a equação vira uma do 2º grau.

## Exemplo da VA 5: (x² + 6)² − 17(x² + 6) + 70 = 0
1. Faça **y = x² + 6**: y² − 17y + 70 = 0.
2. Δ = 289 − 280 = 9 → y = (17 ± 3) / 2 → **y = 10** ou **y = 7**.
3. **Volte** para x: x² + 6 = 10 → x² = 4 → x = ±2; x² + 6 = 7 → x² = 1 → x = ±1.
4. **S = {−2, −1, 1, 2}.**

## Outros casos que "se reduzem" ao 2º grau
- **Biquadrada** (x² = t).
- **Irracional** (depois de elevar ao quadrado).
- **Fracionária** (depois de eliminar os denominadores).

## Lista de passos
1. Reconheça a **expressão repetida**.
2. Troque por uma letra e resolva.
3. **Volte** à incógnita original (é a etapa mais esquecida).
4. Confira as raízes (principalmente se havia raiz quadrada ou denominador).`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-fracoes',
    'Matemática PB4 · Frações algébricas',
    'Fatorar para simplificar, somar com o mesmo denominador e dividir frações',
    `## Simplificar = fatorar e cortar fatores iguais
Só se corta **fator** (coisa que multiplica), **nunca parcela** (coisa que soma). Em (x + 2)/x **não** se corta o x.

## Fatoração que mais aparece
| Caso | Exemplo |
|---|---|
| **Fator comum** | ax² − ay² = a(x² − y²) |
| **Diferença de quadrados** | x² − 9 = (x − 3)(x + 3) |
| **Quadrado perfeito** | x² − 2xy + y² = (x − y)² |
| **Agrupamento** | ax − 3ay + bx − 3by = (x − 3y)(a + b) |
| **Trinômio** | x² + 5x + 6 = (x + 2)(x + 3) |

## Exemplos da VA 6 e da lista
- **121x²y³z / 77x⁴y³** = 11z / (7x²) (121/77 = 11/7; x²/x⁴ = 1/x²; y³ cancela).
- **(x² + 5x + 6) / (x² − 9)** = (x + 2)(x + 3) / ((x − 3)(x + 3)) = **(x + 2)/(x − 3)**.
- **(x² − 9y²) / (ax − 3ay + bx − 3by)** = (x − 3y)(x + 3y) / [(x − 3y)(a + b)] = **(x + 3y)/(a + b)**.
- **(ax² − ay²) / (x² − 2xy + y²)** = a(x − y)(x + y) / (x − y)² = **a(x + y)/(x − y)**.

## Frações dentro de fração (VA 6, item a)
(1/(x + 1)) ÷ ((x + 2)/(x² − 1)) = 1/(x + 1) · (x² − 1)/(x + 2) = (x − 1)(x + 1) / [(x + 1)(x + 2)] = **(x − 1)/(x + 2)**.
**Dividir** é **multiplicar pelo inverso**.

## Soma e subtração
1. Fatore os denominadores e ache o **denominador comum**.
2. Some os numeradores (cuidado com o **sinal** de quem vem depois do menos).
3. **Simplifique** o resultado.

**Exemplo (lista):** (−x² + 4x − 1)/(x² − 1) + (x − 2)/(x + 1). O denominador comum é x² − 1, e (x − 2)/(x + 1) = (x − 2)(x − 1)/(x² − 1). Numerador: −x² + 4x − 1 + x² − 3x + 2 = x + 1. Resultado: (x + 1)/(x² − 1) = **1/(x − 1)**.

**Exemplo (VA 6, b):** (p + q)/(p − q) + (p − q)/(p + q) − 4pq/(p² − q²) = [(p + q)² + (p − q)² − 4pq] / (p² − q²) = (2p² − 4pq + 2q²) / (p² − q²) = 2(p − q)² / [(p + q)(p − q)] = **2(p − q)/(p + q)**.

## Condição de existência
O denominador **não pode ser zero**: em 1/(x − 1), x ≠ 1.`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-funcoes',
    'Matemática PB4 · Funções: afim e quadrática (revisão)',
    'Valor de f(x), raiz, gráfico da reta e da parábola, vértice',
    `## Aviso do Nexa
O roteiro manda estudar "toda a parte de função do caderno" e os exercícios resolvidos dos módulos 29, 31, 32 e 33. Este resumo cobre o que costuma cair em 9º ano; **complete com as anotações do seu caderno**.

## Ideias básicas
- **Função** relaciona cada x a **um único** y = f(x).
- **Valor numérico:** troque x pelo número. Se f(x) = x² − 3x + 1, então f(−2) = 4 + 6 + 1 = **11**.
- **Raiz (zero)** é o x que faz **f(x) = 0** (onde o gráfico corta o eixo x).
- **Domínio:** valores de x permitidos. Em 1/(x − 2), x ≠ 2.

## Função afim: f(x) = ax + b
- **Gráfico:** uma **reta**. **b** é onde corta o eixo y; **a** é a inclinação.
- **a > 0:** crescente. **a < 0:** decrescente.
- **Raiz:** x = −b/a. Para f(x) = 2x − 8, a raiz é x = 4.
- **Pela reta que passa por (0, 3) e (2, 7):** a = (7 − 3)/(2 − 0) = 2 e b = 3 → **f(x) = 2x + 3**.
- **Problema de táxi:** bandeirada R$ 5 + R$ 2 por km → f(x) = 5 + 2x; para 12 km, f(12) = **R$ 29**.

## Função quadrática: f(x) = ax² + bx + c (a ≠ 0)
- **Gráfico:** uma **parábola**. **a > 0:** concavidade para **cima** (tem valor **mínimo**). **a < 0:** para **baixo** (tem **máximo**).
- **Raízes:** Bhaskara, x = (−b ± √Δ) / 2a. Δ > 0: duas raízes; Δ = 0: uma; Δ < 0: nenhuma.
- **Vértice:** xᵥ = −b / 2a e yᵥ = f(xᵥ).
- **Corta o eixo y** em (0, c).

**Exemplo:** f(x) = x² − 4x + 3 → raízes 1 e 3; xᵥ = 2; yᵥ = 4 − 8 + 3 = −1; vértice **(2, −1)**.
**Exemplo:** f(x) = −x² + 6x → xᵥ = 3, yᵥ = −9 + 18 = **9** (valor máximo).

## Erros comuns
- Trocar **raiz** (x) por **valor** (y).
- Esquecer o **sinal** ao substituir número negativo: (−2)² = **4**, mas −2² = −4.
- Achar o vértice com a fórmula do Δ (use **−b/2a**).`,
  ),
  resumo(
    MA,
    S,
    'pb4-mat-ficha',
    'Matemática PB4 · Ficha relâmpago da véspera',
    'Todas as fórmulas e os passos em uma página para ler antes da prova',
    `## Volume
- **V = Aᵦ · h**. Cilindro: **V = πr²h**. Hexágono: **Aᵦ = 6ℓ²√3/4**. Triângulo equilátero: **ℓ²√3/4**.
- **1 m³ = 1 000 L**, **1 dm³ = 1 L**, **1 cm³ = 1 mL**.

## Trigonometria
- **sen = oposto/hip.**, **cos = adjacente/hip.**, **tg = oposto/adjacente**.
- 30°: sen **1/2**, cos **√3/2**, tg **√3/3**. 45°: sen **√2/2**, cos **√2/2**, tg **1**. 60°: sen **√3/2**, cos **1/2**, tg **√3**.
- **sen² + cos² = 1**.

## Equações
- **Irracional:** isole a raiz, **eleve ao quadrado**, resolva e **CONFIRA**.
- **Biquadrada:** **x² = t**, resolva, volte com **x = ±√t** (t negativo não serve).
- **Literal:** isole x, fatore, diga a **condição** (ex.: m ≠ n).
- **Redução:** letra nova para a expressão repetida; **volte** ao x.

## Frações algébricas
- **Fatore, depois corte** (só fatores, nunca parcelas).
- **Dividir = multiplicar pelo inverso.**
- Soma: **denominador comum**, depois **simplifique**.

## Funções
- **Afim:** reta; raiz **−b/a**. **Quadrática:** parábola; vértice **xᵥ = −b/2a**.

## Na hora da prova
1. **Mostre as contas** (a Prof.ª exige).
2. **Verifique** raízes de equação irracional.
3. Escreva a **resposta final** destacada (caneta ou marca-texto).`,
  ),
];
