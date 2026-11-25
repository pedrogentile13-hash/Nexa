import { q, type PacoteSeed } from './helpers';

export const LOTE3_QUIMICA: PacoteSeed[] = [
  {
    topic: 'materia-e-misturas', grade: '1ª série EM', title: 'Matéria, substâncias e misturas', subtitle: 'Substâncias simples e compostas, estados físicos, densidade e separação',
    resumo: String.raw`## Substâncias e misturas
- **Substância simples:** um só elemento ($O_2$, $N_2$, $Fe$).
- **Substância composta:** mais de um elemento ($H_2O$, $CO_2$, $NaCl$).
- **Mistura:** reúne substâncias (ar, água do mar, granito). Tem PF e PE **variáveis**; a substância pura tem valores **constantes** (água a 100 °C, ao nível do mar).

## Estados e mudanças
Sólido, líquido e gasoso. **Fusão** (sólido→líquido), **vaporização** (líquido→gás), **condensação**, **solidificação**, **sublimação** (sólido↔gás direto: gelo seco).

## Densidade
$$d=\frac{m}{V}$$
200 g em 100 cm³: $d=2\ \text{g/cm}^3$. O gelo **flutua** na água porque é **menos denso**.

## Separação de misturas
- **Destilação fracionada:** líquidos miscíveis com **pontos de ebulição** diferentes (refino do petróleo).
- Filtração, decantação, centrifugação, flotação, separação magnética, evaporação.

## Erros comuns
- Achar que "substância composta" é o mesmo que "mistura".
- Confundir massa com densidade.`,
    questoes: [
      q('facil', 'Qual das opções é uma substância simples?', ['H₂O', 'O₂', 'NaCl', 'CO₂'], 1, 'O₂ é formada por um único elemento (oxigênio). As outras têm mais de um elemento.'),
      q('facil', 'Qual dos materiais a seguir é uma mistura?', ['Água destilada', 'Ar atmosférico', 'Ouro puro', 'Gás oxigênio'], 1, 'O ar é uma mistura de nitrogênio, oxigênio, argônio e outros gases.'),
      q('facil', 'A passagem do estado líquido para o gasoso é chamada de:', ['fusão', 'solidificação', 'vaporização', 'sublimação'], 2, 'Líquido para gasoso é vaporização (evaporação, ebulição ou calefação).'),
      q('medio', 'Uma amostra de 200 g ocupa 100 cm³. Qual é a densidade?', ['0,5 g/cm³', '2 g/cm³', '20 g/cm³', '300 g/cm³'], 1, 'd = m / V = 200 / 100 = 2 g/cm³.'),
      q('medio', 'Uma substância pura, durante a ebulição à pressão constante, apresenta temperatura:', ['crescente', 'constante', 'decrescente', 'variável sem regra'], 1, 'A substância pura ferve a uma temperatura constante, ao contrário das misturas.'),
      q('medio', 'A destilação fracionada separa componentes de uma mistura de líquidos miscíveis com base na diferença de:', ['cor', 'ponto de ebulição', 'tamanho dos grãos', 'magnetismo'], 1, 'Cada líquido evapora em uma faixa de temperatura diferente (usada no refino do petróleo).'),
      q('dificil', 'O gelo flutua na água líquida porque o gelo:', ['é mais denso que a água', 'é menos denso que a água', 'é mais quente que a água', 'tem massa nula'], 1, 'A densidade do gelo é menor que a da água líquida.'),
      q('dificil', 'A mudança do gelo seco (CO₂ sólido) diretamente para gás é chamada de:', ['fusão', 'condensação', 'sublimação', 'solidificação'], 2, 'Sublimação é a passagem direta de sólido para gás, sem passar pelo estado líquido.'),
    ],
  },
  {
    topic: 'modelos-atomicos', grade: '1ª série EM', title: 'Modelos atômicos', subtitle: 'De Dalton a Bohr e a distribuição eletrônica',
    resumo: String.raw`## Evolução dos modelos
- **Dalton:** átomo como esfera **maciça e indivisível**.
- **Thomson:** descobriu o **elétron**; modelo "pudim de passas".
- **Rutherford:** átomo com **núcleo** pequeno, denso e positivo, e eletrosfera quase vazia.
- **Bohr:** elétrons em **níveis de energia** (camadas) **quantizados**. Ao saltar para um nível mais alto, o elétron absorve energia; ao voltar, **emite luz**. Explica a cor dos **fogos de artifício**.
- **Modelo atual:** orbitais (probabilidade de encontrar o elétron).

## Distribuição eletrônica (diagrama de Pauling)
Ordem: $1s^2\,2s^2\,2p^6\,3s^2\,3p^6\,4s^2\,3d^{10}\ldots$
- Na ($Z=11$): $1s^2\,2s^2\,2p^6\,3s^1$.
- Ca ($Z=20$): $1s^2\,2s^2\,2p^6\,3s^2\,3p^6\,4s^2$.

## Camadas e valência
K (máx. 2), L (8), M (18). O Cl ($Z=17$) fica $2-8-7$: tem **7 elétrons na camada de valência**.

## Erros comuns
- Confundir quem descobriu o elétron (Thomson) com quem descobriu o núcleo (Rutherford).
- Esquecer que o $4s$ é preenchido antes do $3d$.`,
    questoes: [
      q('facil', 'Quem descobriu o elétron e propôs o modelo "pudim de passas"?', ['Dalton', 'Thomson', 'Rutherford', 'Bohr'], 1, 'J. J. Thomson identificou o elétron e propôs o átomo como uma esfera positiva com elétrons incrustados.'),
      q('facil', 'O modelo de Rutherford introduziu a ideia de que o átomo possui:', ['uma esfera maciça', 'um núcleo pequeno, denso e positivo', 'apenas nêutrons', 'carga total negativa'], 1, 'O experimento da lâmina de ouro mostrou um núcleo pequeno e denso.'),
      q('facil', 'Para Dalton, o átomo era:', ['divisível em partículas', 'uma esfera maciça e indivisível', 'um núcleo com elétrons em órbitas', 'uma nuvem de probabilidade'], 1, 'Dalton propôs o átomo como uma pequena esfera maciça, indivisível.'),
      q('medio', 'O modelo de Bohr afirma que os elétrons:', ['ficam parados no núcleo', 'ocupam níveis de energia definidos', 'não têm energia', 'só existem em metais'], 1, 'Os elétrons só podem ter certos valores de energia, os níveis (ou camadas).'),
      q('medio', 'Qual é a distribuição eletrônica do sódio (Z = 11)?', ['1s² 2s² 2p⁶ 3s¹', '1s² 2s² 2p⁵ 3s²', '1s² 2s² 2p⁶ 3p¹', '1s² 2s¹ 2p⁶ 3s²'], 0, 'Preenchem-se 1s² 2s² 2p⁶ (10 elétrons) e o 11º elétron vai ao 3s¹.'),
      q('medio', 'Quantos elétrons existem na camada de valência do cloro (Z = 17, distribuição 2-8-7)?', ['2', '7', '8', '17'], 1, 'A última camada do cloro tem 7 elétrons.'),
      q('dificil', 'Qual é a distribuição eletrônica do cálcio (Z = 20)?', ['1s² 2s² 2p⁶ 3s² 3p⁶ 4s²', '1s² 2s² 2p⁶ 3s² 3p⁶ 3d²', '1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹', '1s² 2s² 2p⁶ 3s² 3p⁶ 4p²'], 0, 'Depois do 3p⁶ (18 elétrons), os 2 restantes vão para o 4s, antes do 3d.'),
      q('dificil', 'A explicação da cor dos fogos de artifício, segundo o modelo de Bohr, é que:', ['os elétrons são destruídos', 'elétrons excitados voltam a níveis menores e emitem luz', 'o núcleo explode', 'a eletrosfera some'], 1, 'Ao receber energia, os elétrons sobem de nível; ao retornar, liberam essa energia como luz de cor característica.'),
    ],
  },
  {
    topic: 'termoquimica', grade: '2ª série EM', title: 'Termoquímica', subtitle: 'Reações exotérmicas e endotérmicas, entalpia e lei de Hess',
    resumo: String.raw`## Calor nas reações
- **Exotérmica:** **libera** calor para o ambiente. $\Delta H<0$. Exemplos: combustão, neutralização.
- **Endotérmica:** **absorve** calor. $\Delta H>0$. Exemplos: fotossíntese (absorve energia da luz), fusão do gelo, dissolução de nitrato de amônio (o frasco esfria).

## Entalpia
$\Delta H=H_{produtos}-H_{reagentes}$. Se $\Delta H=+100\ \text{kJ}$, a reação **absorve** 100 kJ.

## Combustão
É **sempre exotérmica**: queimar gás, etanol ou gasolina libera energia.

## Lei de Hess
O $\Delta H$ de uma reação depende **só do estado inicial e do final**, não do caminho. O $\Delta H$ total é a **soma** dos $\Delta H$ das etapas.
$A\to B$: $+50\ \text{kJ}$; $B\to C$: $-20\ \text{kJ}$. Então $A\to C$: $+50-20=+30\ \text{kJ}$.

## Erros comuns
- Achar que exotérmica significa "esquenta o frasco" só por ser reação (olhe o sinal de $\Delta H$).
- Esquecer de inverter o sinal ao inverter a equação.`,
    questoes: [
      q('facil', 'Uma reação exotérmica é aquela que:', ['absorve calor do ambiente', 'libera calor para o ambiente', 'não troca calor', 'só ocorre no gelo'], 1, 'Exotérmica libera energia na forma de calor.'),
      q('facil', 'Em uma reação exotérmica, o valor de ΔH é:', ['positivo', 'negativo', 'sempre zero', 'infinito'], 1, 'Como os produtos têm menos entalpia que os reagentes, ΔH < 0.'),
      q('facil', 'A combustão de um combustível é um processo:', ['endotérmico', 'exotérmico', 'sem troca de energia', 'só ocorre no vácuo'], 1, 'Queimar um combustível libera energia, por isso é exotérmica.'),
      q('medio', 'Uma reação com ΔH = +100 kJ:', ['libera 100 kJ', 'absorve 100 kJ', 'não envolve energia', 'é uma combustão'], 1, 'ΔH positivo indica reação endotérmica, que absorve energia.'),
      q('medio', 'A fusão do gelo é um processo:', ['exotérmico', 'endotérmico', 'sem variação de energia', 'impossível'], 1, 'Para fundir, o gelo precisa absorver calor do ambiente.'),
      q('medio', 'Qual das opções é um processo endotérmico?', ['Combustão do gás de cozinha', 'Fotossíntese', 'Formação de gelo', 'Queima de papel'], 1, 'A fotossíntese absorve energia luminosa. As demais liberam energia.'),
      q('dificil', 'A lei de Hess afirma que o ΔH de uma reação:', ['depende do caminho percorrido', 'depende só dos estados inicial e final', 'é sempre positivo', 'é sempre zero'], 1, 'O ΔH é uma função de estado: a soma dos ΔH das etapas dá o ΔH total.'),
      q('dificil', 'Se A → B tem ΔH = +50 kJ e B → C tem ΔH = −20 kJ, qual é o ΔH de A → C?', ['−70 kJ', '+30 kJ', '+70 kJ', '−30 kJ'], 1, 'Soma das etapas: +50 + (−20) = +30 kJ.'),
    ],
  },
  {
    topic: 'cinetica-e-equilibrio', grade: '3ª série EM', title: 'Cinética e equilíbrio químico', subtitle: 'Velocidade das reações, catalisadores, equilíbrio dinâmico e Le Chatelier',
    resumo: String.raw`## Velocidade das reações
Quanto mais rápido os reagentes se transformam em produtos, maior a velocidade. Fatores que a **aumentam**:
- **Temperatura:** mais colisões e mais energéticas.
- **Concentração** dos reagentes.
- **Superfície de contato:** o comprimido efervescente em pó dissolve mais rápido que inteiro.
- **Catalisador:** acelera a reação **sem ser consumido**, porque **diminui a energia de ativação**.

## Equilíbrio químico
Em reações reversíveis, chega-se a um estado em que as velocidades da reação **direta e inversa são iguais**. É um equilíbrio **dinâmico**: as reações continuam, mas as concentrações ficam constantes.

## Constante de equilíbrio
Para $N_2+3H_2\rightleftharpoons2NH_3$:
$$K_c=\frac{[NH_3]^2}{[N_2]\,[H_2]^3}$$

## Princípio de Le Chatelier
Se perturbamos o equilíbrio, ele se **desloca** para minimizar a perturbação. Aumentar a concentração de um **reagente** desloca o equilíbrio para os **produtos**.

## Erros comuns
- Achar que, no equilíbrio, as concentrações são iguais (são **constantes**).
- Achar que o catalisador muda o rendimento final do equilíbrio.`,
    questoes: [
      q('facil', 'Em geral, o aumento da temperatura:', ['diminui a velocidade da reação', 'aumenta a velocidade da reação', 'não tem efeito', 'para a reação'], 1, 'A temperatura maior aumenta a energia e a frequência das colisões entre as partículas.'),
      q('facil', 'Um catalisador:', ['é consumido na reação', 'acelera a reação sem ser consumido', 'retarda sempre a reação', 'muda a cor da reação'], 1, 'O catalisador facilita a reação e é regenerado ao final.'),
      q('facil', 'O equilíbrio químico é dinâmico porque:', ['as reações param', 'as reações direta e inversa continuam ocorrendo com a mesma velocidade', 'só há produtos', 'só há reagentes'], 1, 'Nada "para": as duas reações continuam, em velocidades iguais.'),
      q('medio', 'Um comprimido efervescente em pó se dissolve mais rápido que inteiro porque:', ['o pó tem maior superfície de contato', 'o pó é mais pesado', 'o pó é mais frio', 'o pó não tem água'], 0, 'Quanto maior a superfície exposta, mais colisões e maior a velocidade.'),
      q('medio', 'O catalisador aumenta a velocidade de uma reação porque:', ['aumenta a temperatura do ambiente', 'diminui a energia de ativação', 'altera a massa dos reagentes', 'elimina os produtos'], 1, 'Oferece um caminho alternativo com menor barreira de energia.'),
      q('medio', 'No equilíbrio químico, as velocidades das reações direta e inversa são:', ['iguais', 'zero', 'sempre diferentes', 'infinitas'], 0, 'Esse é o critério do equilíbrio: v(direta) = v(inversa).'),
      q('dificil', 'Pelo princípio de Le Chatelier, aumentar a concentração de um reagente faz o equilíbrio:', ['se deslocar para os produtos', 'se deslocar para os reagentes', 'não se alterar', 'terminar'], 0, 'O sistema reage consumindo o reagente adicionado, formando mais produtos.'),
      q('dificil', 'Para N₂ + 3 H₂ ⇌ 2 NH₃, a expressão de Kc é:', ['[NH₃]² / ([N₂] · [H₂]³)', '[N₂] · [H₂]³ / [NH₃]²', '[NH₃] / ([N₂] · [H₂])', '2[NH₃] / (N₂ + 3H₂)'], 0, 'Kc = [produtos]^coeficientes / [reagentes]^coeficientes.'),
    ],
  },
  {
    topic: 'ph', grade: '3ª série EM', title: 'pH e equilíbrio ácido-base', subtitle: 'Escala de pH, pOH e relações',
    resumo: String.raw`## O que é pH
$$\text{pH}=-\log[H^+]$$
Mede a **acidez** de uma solução. Se $[H^+]=10^{-3}\ \text{mol/L}$, então $\text{pH}=3$.

## Escala (a 25 °C)
- $\text{pH}<7$: **ácida** (suco de limão, vinagre).
- $\text{pH}=7$: **neutra** (água pura).
- $\text{pH}>7$: **básica** (soda cáustica, água sanitária).

Cada unidade de pH corresponde a um fator **10** na concentração de $H^+$: pH 4 é **10 vezes** mais ácido que pH 5.

## pOH
$\text{pOH}=-\log[OH^-]$ e, a 25 °C,
$$\text{pH}+\text{pOH}=14$$
Se $[OH^-]=10^{-2}$, $\text{pOH}=2$ e $\text{pH}=12$. Com pH 9, o pOH é 5.

## Chuva
A chuva normal é levemente ácida (pH em torno de 5,6) pela dissolução de $CO_2$. A **chuva ácida** (pH menor) vem de óxidos de enxofre e nitrogênio da poluição.

## Indicadores
Mudam de cor conforme o pH (papel de tornassol, fenolftaleína, repolho roxo).

## Erros comuns
- Achar que pH 3 é "três vezes" mais ácido que pH 6 (são 1 000 vezes).
- Esquecer que o pH diminui quando $[H^+]$ aumenta.`,
    questoes: [
      q('facil', 'Uma solução com pH igual a 7, a 25 °C, é:', ['ácida', 'neutra', 'básica', 'impossível'], 1, 'pH 7 é neutro, como a água pura.'),
      q('facil', 'O suco de limão tem pH:', ['maior que 7', 'igual a 7', 'menor que 7', 'igual a 14'], 2, 'O suco de limão é ácido, então seu pH é menor que 7.'),
      q('facil', 'Em uma solução com [H⁺] = 10⁻³ mol/L, o pH vale:', ['−3', '3', '10', '11'], 1, 'pH = −log(10⁻³) = 3.'),
      q('medio', 'Em relação ao pH 5, uma solução com pH 4 é:', ['10 vezes mais ácida', '10 vezes menos ácida', '2 vezes mais ácida', 'igual'], 0, 'A cada unidade de pH, a concentração de H⁺ muda por um fator de 10. O pH 4 é 10 vezes mais ácido.'),
      q('medio', 'Uma solução com pH = 9, a 25 °C, tem pOH igual a:', ['5', '9', '14', '23'], 0, 'pH + pOH = 14, então pOH = 14 − 9 = 5.'),
      q('medio', 'Uma solução de soda cáustica (NaOH) tem pH:', ['muito baixo', 'próximo de 7', 'alto (básico)', 'igual a zero'], 2, 'O NaOH é uma base forte, com pH bem acima de 7.'),
      q('dificil', 'Uma solução tem [OH⁻] = 10⁻² mol/L. Qual é o seu pH (a 25 °C)?', ['2', '7', '12', '14'], 2, 'pOH = 2, então pH = 14 − 2 = 12.'),
      q('dificil', 'A chuva "normal" é levemente ácida (pH ≈ 5,6) porque:', ['dissolve CO₂ da atmosfera', 'contém soda cáustica', 'é composta de água destilada', 'tem excesso de oxigênio puro'], 0, 'O CO₂ dissolvido forma ácido carbônico, que acidifica levemente a água da chuva.'),
    ],
  },
  {
    topic: 'eletroquimica', grade: '3ª série EM', title: 'Eletroquímica: pilhas e eletrólise', subtitle: 'Oxirredução, pilha de Daniell, potencial e eletrólise',
    resumo: String.raw`## Oxirredução
- **Oxidação:** o elemento **perde** elétrons (seu número de oxidação aumenta).
- **Redução:** o elemento **ganha** elétrons.
Acontecem sempre juntas.

## Pilha (célula galvânica)
Converte **energia química em elétrica**, em reação espontânea.
- **Ânodo (−):** onde ocorre a **oxidação**.
- **Cátodo (+):** onde ocorre a **redução**.
- Os elétrons fluem do ânodo para o cátodo pelo fio externo.

## Pilha de Daniell
Zn e Cu: o **zinco** (menor potencial de redução) oxida: $Zn\to Zn^{2+}+2e^-$ e é o **ânodo**. O cobre reduz: $Cu^{2+}+2e^-\to Cu$ e é o **cátodo**.

## Diferença de potencial
$$\Delta E=E^\circ_{cátodo}-E^\circ_{ânodo}$$
Com $E^\circ(Cu^{2+}/Cu)=+0{,}34\ \text{V}$ e $E^\circ(Zn^{2+}/Zn)=-0{,}76\ \text{V}$: $\Delta E=0{,}34-(-0{,}76)=1{,}10\ \text{V}$.

## Eletrólise
Usa **energia elétrica** para provocar uma reação **não espontânea** (produção de cloro, alumínio, galvanização).

## Galvanização
Revestir o ferro com **zinco**, que oxida antes do ferro e o protege da corrosão.

## Erros comuns
- Inverter ânodo e cátodo (oxidação é no **ânodo**).
- Esquecer de subtrair o potencial do ânodo.`,
    questoes: [
      q('facil', 'A oxidação é o processo em que um elemento:', ['ganha elétrons', 'perde elétrons', 'ganha prótons', 'perde nêutrons'], 1, 'Oxidar é perder elétrons. Reduzir é ganhar elétrons.'),
      q('facil', 'Uma pilha converte:', ['energia elétrica em química', 'energia química em energia elétrica', 'luz em som', 'calor em frio'], 1, 'Na pilha, uma reação espontânea produz corrente elétrica.'),
      q('facil', 'A eletrólise utiliza:', ['uma reação espontânea para gerar eletricidade', 'energia elétrica para provocar uma reação não espontânea', 'só calor', 'só luz'], 1, 'Na eletrólise, a corrente elétrica força uma transformação que não ocorreria sozinha.'),
      q('medio', 'Em uma pilha, o ânodo é o eletrodo onde ocorre:', ['redução', 'oxidação', 'neutralização', 'fusão'], 1, 'No ânodo ocorre sempre a oxidação (perda de elétrons).'),
      q('medio', 'Em uma pilha, no cátodo ocorre:', ['oxidação', 'redução', 'evaporação', 'combustão'], 1, 'No cátodo ocorre a redução (ganho de elétrons).'),
      q('medio', 'Na pilha de Daniell, o zinco funciona como:', ['cátodo, onde ocorre a redução', 'ânodo, onde ocorre a oxidação', 'ponte salina', 'isolante'], 1, 'O zinco perde elétrons (Zn → Zn²⁺ + 2e⁻), então é o ânodo.'),
      q('dificil', 'Dados E°(Cu²⁺/Cu) = +0,34 V e E°(Zn²⁺/Zn) = −0,76 V, qual é a ddp da pilha de Daniell?', ['0,42 V', '1,10 V', '0,76 V', '−1,10 V'], 1, 'ΔE = E°cátodo − E°ânodo = 0,34 − (−0,76) = 1,10 V.'),
      q('dificil', 'A galvanização, revestimento do ferro com zinco, protege o ferro da corrosão porque:', ['o zinco oxida no lugar do ferro', 'o zinco é mais pesado', 'o ferro derrete', 'o zinco absorve a chuva'], 0, 'O zinco tem maior tendência a oxidar e funciona como metal de sacrifício.'),
    ],
  },
  {
    topic: 'quimica-organica', grade: '3ª série EM', title: 'Química orgânica: hidrocarbonetos e funções', subtitle: 'Carbono, nomenclatura, hidrocarbonetos e principais funções',
    resumo: String.raw`## O carbono
É **tetravalente**: faz **4 ligações**, o que permite cadeias longas e variadas. Metano: $CH_4$.

## Hidrocarbonetos
Compostos **só de carbono e hidrogênio**.
- **Alcanos** (ligações simples): $C_nH_{2n+2}$. Metano $CH_4$, etano $C_2H_6$, propano $C_3H_8$, butano $C_4H_{10}$.
- **Alcenos** (uma dupla): $C_nH_{2n}$. Eteno $C_2H_4$.
- **Alcinos** (uma tripla): $C_nH_{2n-2}$. Etino $C_2H_2$.

## Prefixos (nº de carbonos)
1 met, 2 et, 3 prop, 4 but, 5 pent, 6 hex, 7 hept, 8 oct, 9 non, 10 dec.

## Principais funções
- **Álcool:** $-OH$ ligado a carbono saturado (etanol, $C_2H_5OH$).
- **Ácido carboxílico:** $-COOH$ (ácido acético, do vinagre).
- **Aldeído** ($-CHO$), **cetona** ($C=O$ entre carbonos), **éster**, **éter**, **amina**.

## Aplicações
Gás de cozinha (propano e butano), gasolina, etanol, plásticos, medicamentos.

## Erros comuns
- Confundir o número de hidrogênios em alcano e alceno.
- Achar que todo composto com carbono é orgânico (o $CO_2$, por exemplo, tem comportamento inorgânico).`,
    questoes: [
      q('facil', 'Quantas ligações o átomo de carbono costuma fazer?', ['1', '2', '4', '8'], 2, 'O carbono é tetravalente: faz 4 ligações.'),
      q('facil', 'Qual é a fórmula do metano?', ['CH₄', 'C₂H₆', 'CO₂', 'CH₃OH'], 0, 'O metano é o alcano mais simples, com 1 carbono e 4 hidrogênios.'),
      q('facil', 'Hidrocarbonetos são compostos formados somente por:', ['carbono e oxigênio', 'carbono e hidrogênio', 'hidrogênio e oxigênio', 'carbono e nitrogênio'], 1, 'Hidro + carboneto: apenas C e H.'),
      q('medio', 'Qual é o nome do alcano com 3 carbonos?', ['Metano', 'Etano', 'Propano', 'Butano'], 2, 'Prefixo prop (3 carbonos) + terminação ano: propano (C₃H₈).'),
      q('medio', 'O etanol (C₂H₅OH) pertence à função:', ['ácido carboxílico', 'álcool', 'cetona', 'éster'], 1, 'O grupo −OH ligado a um carbono saturado caracteriza o álcool.'),
      q('medio', 'Qual é a fórmula do eteno (alceno com 2 carbonos)?', ['C₂H₂', 'C₂H₄', 'C₂H₆', 'C₂H₈'], 1, 'Alcenos seguem CₙH₂ₙ: n = 2 resulta em C₂H₄.'),
      q('dificil', 'Qual é a fórmula molecular do butano?', ['C₄H₈', 'C₄H₁₀', 'C₄H₆', 'C₅H₁₂'], 1, 'Alcanos seguem CₙH₂ₙ₊₂: com n = 4, C₄H₁₀.'),
      q('dificil', 'O ácido acético, presente no vinagre, pertence à função:', ['álcool', 'aldeído', 'ácido carboxílico', 'éter'], 2, 'Tem o grupo −COOH, característico dos ácidos carboxílicos.'),
    ],
  },
];
