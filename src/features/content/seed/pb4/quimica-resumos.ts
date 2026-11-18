import { resumo, type ResumoG3 } from '../grande3/types';

/**
 * PB4 · Química (9º ano): resumos completos do Módulo 8 (ácidos, bases e sais) e do Módulo 9 (óxidos),
 * com base no roteiro de estudos e nas anotações da turma. São resumos de estudo do Nexa.
 */
const S = '9º ano' as const;
const QU = 'quimica';

export const RESUMOS_QUIMICA_PB4: ResumoG3[] = [
  resumo(
    QU,
    S,
    'pb4-qui-mapa',
    'Química PB4 · Mapa conceitual das funções inorgânicas',
    'Ácidos, bases, sais e óxidos num só quadro, e como eles se relacionam',
    `## A grande ideia
Funções inorgânicas são **grupos de substâncias com propriedades químicas semelhantes**. Hoje você precisa dominar quatro: **ácidos, bases, sais e óxidos**.

## Quadro comparativo
| | Ácido | Base | Sal | Óxido |
|---|---|---|---|---|
| **Íon / marca** | libera **H⁺** em água | libera **OH⁻** em água | cátion ≠ H⁺ e ânion ≠ OH⁻ | binário com **O** (o mais eletronegativo) |
| **Tipo de composto** | molecular (**ioniza**) | iônico (**dissocia**) | iônico (**dissocia**) | iônico ou molecular |
| **pH em solução** | menor que 7 | maior que 7 | em geral próximo de 7 | depende (ácido, básico ou neutro) |
| **Conduz corrente?** | sim, em solução | sim, em solução | sim, dissolvido ou fundido | só se formar íons em água |
| **Exemplos** | HCl, H₂SO₄, HNO₃ | NaOH, Ca(OH)₂ | NaCl, CaCO₃ | CO₂, CaO, Al₂O₃ |

## Mapa conceitual (como as ideias se ligam)
- **Ácido** + **base** → **sal** + **água** (*neutralização*).
- **Óxido ácido** (ametal + O) + água → **ácido**. Ex.: SO₃ + H₂O → H₂SO₄.
- **Óxido básico** (metal + O) + água → **base**. Ex.: CaO + H₂O → Ca(OH)₂.
- **Óxido ácido** + **base** → **sal** + água. Ex.: CO₂ + 2 NaOH → Na₂CO₃ + H₂O.
- O **ânion do sal** vem do **ácido** (terminação muda) e o **cátion do sal** vem da **base**.

## Ionização × dissociação (cai muito!)
- **Ionização:** a molécula *quebra e forma íons* ao reagir com a água (ácidos).
- **Dissociação:** os íons *já existem* no composto iônico e apenas **se separam** na água (bases e sais).

## Mapa mental ≠ mapa conceitual
O roteiro pede um **mapa conceitual**: caixas com conceitos ligadas por setas **com palavras de ligação** ("libera", "origina", "reage com"). Treine: *Ácido → (libera) → H⁺*; *Ácido + Base → (origina) → Sal*.`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-base',
    'Química PB4 · Pré-requisitos: íons, ligações e fórmulas',
    'O que você precisa lembrar das ligações para entender sais e óxidos',
    `## Por que revisar ligações?
Para saber se um composto é **iônico** ou **molecular** (e, portanto, se ioniza ou dissocia), você precisa dominar as ligações.

## Regra do octeto
Os átomos ganham, perdem ou compartilham elétrons para ficar com a camada de valência completa (**8 elétrons**; 2 na camada K), como os **gases nobres**.

## Os três tipos de ligação
| Ligação | Entre | O que acontece | Exemplo |
|---|---|---|---|
| **Iônica** | metal + ametal (ou H) | **transferência** de elétrons; forma cátions e ânions que se atraem | NaCl |
| **Covalente** | ametal + ametal (ou H) | **compartilhamento** de pares de elétrons | H₂O, CO₂ |
| **Metálica** | metal + metal | "mar de elétrons" livres | Cu, Fe |

- Na ligação iônica o resultado é **neutro**: as cargas se anulam.
- Covalente: **simples** (um par), **dupla** (dois pares), **tripla** (três pares).
- Fórmulas: **molecular** (quais átomos e quantos), **estrutural** (traços entre os átomos) e **eletrônica ou de Lewis** (pontos para os elétrons).

## Cátions e ânions mais usados
- **Cátions:** H⁺, Na⁺, K⁺, Ag⁺ (carga 1+); Mg²⁺, Ca²⁺, Zn²⁺ (2+); Al³⁺ (3+).
- **Ânions:** Cl⁻, F⁻, Br⁻ (1−); O²⁻, S²⁻ (2−); N³⁻ (3−).
- **Ânions com oxigênio:** NO₃⁻ (nitrato), SO₄²⁻ (sulfato), CO₃²⁻ (carbonato), PO₄³⁻ (fosfato), OH⁻ (hidróxido).

## Como escrever a fórmula de um composto iônico: "cruza e desce"
1. Escreva o cátion e o ânion com as cargas.
2. A **soma das cargas tem de dar zero**.
3. **Cruze**: o número da carga de um vira o **índice** do outro; **simplifique** se der.

**Exemplos**
- Mg²⁺ e Br⁻ → **MgBr₂** (brometo de magnésio).
- Al³⁺ e O²⁻ → **Al₂O₃** (óxido de alumínio): 2 × (3+) = 6+ e 3 × (2−) = 6−.
- Ca²⁺ e PO₄³⁻ → **Ca₃(PO₄)₂**. Se o ânion tem vários átomos e índice maior que 1, use **parênteses**.

## Erro comum
Escrever o índice **dentro** do íon: o certo é Ca(OH)₂, e não CaOH₂.`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-acidos',
    'Química PB4 · Ácidos (completo)',
    'Definição, ionização, classificações, propriedades e principais ácidos',
    `## Definição (Arrhenius)
**Ácido** é a substância que, **dissolvida em água**, sofre **ionização** e libera **H⁺ como único cátion** (na água, o H⁺ se une a uma molécula de água e vira **H₃O⁺**, o hidrônio).

**Exemplo:** HCl → H⁺ + Cl⁻

Os ácidos são **compostos moleculares**: *não têm íons antes da água*. É a água que "puxa" o H e faz a molécula ionizar.

## Onde está o H ionizável?
Em geral, o **H escrito no início da fórmula** (HCl, H₂SO₄, H₃PO₄). Em H₃PO₄ os três H ionizam, mas nem todo H de um composto ioniza (por exemplo, o H do CH₄ não).

## Classificação 1: com ou sem oxigênio
- **Hidrácidos** (sem O): HCl, HF, HBr, HI, H₂S, HCN.
- **Oxiácidos** (com O): HNO₃, H₂SO₄, H₂CO₃, H₃PO₄, HClO₄.

## Classificação 2: número de H⁺ liberados
- **Monoácido:** 1 H⁺ (HCl, HNO₃).
- **Diácido:** 2 H⁺ (H₂SO₄, H₂CO₃).
- **Triácido:** 3 H⁺ (H₃PO₄).

## Classificação 3: força (grau de ionização)
- **Forte:** ioniza muito (HCl, HBr, HI, H₂SO₄, HNO₃).
- **Fraco:** ioniza pouco (H₂CO₃, H₂S, HCN, H₃PO₄ é moderado).

Quanto mais ioniza, **mais íons livres** e **melhor conduz corrente**.

## Propriedades
- **Sabor azedo** (limão, vinagre). *Nunca prove substâncias em laboratório!*
- **pH menor que 7** a 25 °C.
- **Conduzem corrente** em solução (há íons livres).
- Mudam a cor de **indicadores**: tornassol azul → vermelho; fenolftaleína **incolor**; repolho roxo → vermelho/rosa.
- Reagem com **bases** (neutralização), com **metais ativos** (liberam H₂) e com **carbonatos** (liberam CO₂).

## Principais ácidos e usos
| Ácido | Fórmula | Onde aparece |
|---|---|---|
| **Clorídrico** | HCl | suco gástrico; em excesso causa azia; limpeza (ácido muriático) |
| **Sulfúrico** | H₂SO₄ | o mais produzido pela indústria; baterias de carro; refino do petróleo; fertilizantes |
| **Nítrico** | HNO₃ | fertilizantes, plásticos, explosivos |
| **Carbônico** | H₂CO₃ | refrigerantes e águas gaseificadas (CO₂ + H₂O); chuva "normal" levemente ácida |
| **Fosfórico** | H₃PO₄ | fertilizantes; acidulante em refrigerantes de cola |
| **Fluorídrico** | HF | gravação em vidro (corrosivo e perigoso) |

## Como cai na prova
- Escrever a **equação de ionização** (conferindo cargas: o total antes = o total depois).
- **Classificar** o ácido (oxi ou hidrácido; mono, di ou triácido).
- Dar **nome** do ácido e do **ânion**.
- Relacionar o ácido a uma **aplicação** ou a um problema ambiental.

## Erros comuns
- Dizer que ácido "libera OH⁻" (isso é a base).
- Esquecer o **2** em 2 H⁺ para o H₂SO₄.
- Confundir **ionização** (ácido) com **dissociação** (base e sal).`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-nomenclatura-acidos',
    'Química PB4 · Nomenclatura de ácidos e ânions',
    'Regra das terminações, tabelas prontas e a mnemônica do mosquito',
    `## Regra principal: a terminação muda
| Ácido termina em | Ânion termina em |
|---|---|
| **-ídrico** (hidrácidos) | **-eto** |
| **-ico** (oxiácidos) | **-ato** |
| **-oso** (oxiácidos) | **-ito** |

### Mnemônica (da turma)
> **"Mosquito teimoso, te mato, te pico e te meto num vidro."**
> - *te**i**moso* → ácido **-oso** vira ânion **-ito**
> - *te **m**ato / te **p**ico* → ácido **-ico** vira ânion **-ato**
> - *te meto num **vidro*** → ácido **-ídrico** vira ânion **-eto**

## Hidrácidos: ácido + nome do elemento + ÍDRICO
| Fórmula | Ácido | Ânion |
|---|---|---|
| HF | fluorídrico | F⁻ fluoreto |
| HCl | clorídrico | Cl⁻ cloreto |
| HBr | bromídrico | Br⁻ brometo |
| HI | iodídrico | I⁻ iodeto |
| H₂S | sulfídrico | S²⁻ sulfeto |
| HCN | cianídrico | CN⁻ cianeto |

## Oxiácidos: o par -ico / -oso
O ácido **-ico** tem **um oxigênio a mais** que o **-oso** do mesmo elemento.
| Fórmula | Ácido | Ânion |
|---|---|---|
| HNO₃ | **nítrico** | NO₃⁻ **nitrato** |
| HNO₂ | **nitroso** | NO₂⁻ **nitrito** |
| H₂SO₄ | **sulfúrico** | SO₄²⁻ **sulfato** |
| H₂SO₃ | **sulfuroso** | SO₃²⁻ **sulfito** |
| H₂CO₃ | **carbônico** | CO₃²⁻ **carbonato** |
| H₃PO₄ | **fosfórico** | PO₄³⁻ **fosfato** |
| HClO₄ / HClO₃ / HClO₂ / HClO | perclórico / clórico / cloroso / hipocloroso | perclorato / clorato / clorito / hipoclorito |

## Atenção
- O **ânion** é o que sobra do ácido **sem o(s) H⁺**. A carga do ânion é igual ao número de H⁺ perdidos: H₂SO₄ perde **2 H⁺** → SO₄**²⁻**.
- **Sulfato × sulfito × sulfeto:** SO₄²⁻ / SO₃²⁻ / S²⁻.
- **Nitrato × nitrito × nitreto:** NO₃⁻ / NO₂⁻ / N³⁻.

## Treino rápido
- HBr → bromídrico → **brometo**.
- H₂SO₃ → sulfuroso → **sulfito**.
- ânion **PO₄³⁻** → vem do ácido **fosfórico** (ico → ato).`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-bases',
    'Química PB4 · Bases (completo)',
    'Dissociação, classificação, nomenclatura, propriedades e aplicações',
    `## Definição (Arrhenius)
**Base** (ou álcali) é a substância que, **dissolvida em água**, sofre **dissociação iônica** e libera **OH⁻ (hidróxido ou hidroxila) como único ânion**.

**Exemplos:**
- NaOH → Na⁺ + OH⁻
- Ca(OH)₂ → Ca²⁺ + 2 OH⁻

As bases são, em geral, **compostos iônicos** (metal + OH). Por isso **dissociam** (e não ionizam).

## Classificação por número de OH⁻
- **Monobase:** 1 OH⁻ (NaOH, KOH).
- **Dibase:** 2 OH⁻ (Ca(OH)₂, Mg(OH)₂).
- **Tribase:** 3 OH⁻ (Al(OH)₃, Fe(OH)₃).

## Solubilidade e força
- **Solúveis em água:** bases dos metais **alcalinos** (Na, K, Li): NaOH, KOH. *São as mais fortes.*
- **Pouco solúveis:** Ca(OH)₂, Mg(OH)₂.
- **Praticamente insolúveis:** a maioria das demais, como Al(OH)₃ e Fe(OH)₃.
- **Fraca e solúvel:** NH₄OH (hidróxido de amônio, o "amoníaco").

## Nomenclatura
**Hidróxido de** + **nome do cátion**.
- NaOH: hidróxido de **sódio** · Ca(OH)₂: hidróxido de **cálcio** · Al(OH)₃: hidróxido de **alumínio** · Mg(OH)₂: hidróxido de **magnésio**.
- Se o cátion tem duas cargas possíveis, indica-se a carga: Fe(OH)₂ = hidróxido de **ferro II**; Fe(OH)₃ = hidróxido de **ferro III**.

## Propriedades
- **Sabor adstringente** ("amarra" a boca) e toque escorregadio (sabão). *Nunca prove nem toque em bases fortes: são corrosivas.*
- **pH maior que 7**.
- **Conduzem corrente** em solução (íons livres).
- **Fenolftaleína fica rosa/avermelhada**; tornassol vermelho → azul; repolho roxo → azul/verde/amarelo.
- **Neutralizam ácidos**.

## Principais bases e usos
| Base | Nome popular | Usos |
|---|---|---|
| **NaOH** | soda cáustica | sabão, papel, desentupidores, fabricação de alumínio |
| **Ca(OH)₂** | cal hidratada, cal apagada | argamassa, caiação, correção da acidez do solo |
| **Mg(OH)₂** | leite de magnésia | antiácido e laxante |
| **Al(OH)₃** | — | tratamento de água, antiácidos |
| **NH₄OH** | amoníaco | produtos de limpeza |

## Como cai na prova
Equação de dissociação, classificação pelo nº de OH⁻, nome e uso, e **neutralização**.

## Erros comuns
- Escrever Ca(OH)₂ como CaOH₂.
- Trocar o **íon**: base libera **OH⁻**; ácido libera **H⁺**.
- Dizer que a base "ioniza": ela **dissocia**.`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-sais',
    'Química PB4 · Sais e neutralização (completo)',
    'Formação, nomenclatura, fórmulas, propriedades e aplicações',
    `## Definição
**Sal** é o composto iônico que, em água, **se dissocia** liberando **pelo menos um cátion diferente de H⁺ e um ânion diferente de OH⁻**. Geralmente é produzido por **neutralização**.

## Neutralização
**Ácido + Base → Sal + Água**

O H⁺ do ácido reage com o OH⁻ da base: **H⁺ + OH⁻ → H₂O**. Os outros íons formam o sal.

| Reação | Sal formado |
|---|---|
| HCl + NaOH → **NaCl** + H₂O | cloreto de sódio |
| H₂SO₄ + 2 NaOH → **Na₂SO₄** + 2 H₂O | sulfato de sódio |
| 2 HNO₃ + Ca(OH)₂ → **Ca(NO₃)₂** + 2 H₂O | nitrato de cálcio |
| H₃PO₄ + 3 NaOH → **Na₃PO₄** + 3 H₂O | fosfato de sódio |
| 3 HCl + Al(OH)₃ → **AlCl₃** + 3 H₂O | cloreto de alumínio |

### Como balancear rapidamente
1. Escreva o **ânion** do ácido e o **cátion** da base; monte o sal com "cruza e desce".
2. Conte os **H⁺** do ácido e os **OH⁻** da base: o número de H₂O formadas é o total de H⁺ que reagiu.
3. Acerte os coeficientes até que cada elemento tenha o mesmo número dos dois lados.

## Nomenclatura
**Nome do ânion + "de" + nome do cátion.**
- Terminações: **-ídrico → -eto**, **-ico → -ato**, **-oso → -ito**.
- NaCl: cloreto de sódio · KNO₃: nitrato de potássio · CaCO₃: carbonato de cálcio · Na₂SO₃: sulfito de sódio · MgBr₂: brometo de magnésio.

## Fórmula do sal
Cruza e desce, com **parênteses** quando o ânion tem mais de um átomo:
- Na⁺ + SO₄²⁻ → Na₂SO₄ · Al³⁺ + SO₄²⁻ → Al₂(SO₄)₃ · Ca²⁺ + PO₄³⁻ → Ca₃(PO₄)₂.

## Propriedades
- **Sólidos cristalinos** em temperatura ambiente.
- **Altos pontos de fusão e ebulição** (forças iônicas fortes).
- Podem ser **solúveis ou insolúveis** em água.
- **Conduzem corrente** quando **dissolvidos** ou **fundidos**, mas **não no estado sólido** (íons presos).
- Muitos têm **sabor salgado**.

## Principais sais e usos
| Sal | Fórmula | Uso |
|---|---|---|
| cloreto de sódio | NaCl | sal de cozinha, conservação de alimentos, soro fisiológico (0,9%) |
| bicarbonato de sódio | NaHCO₃ | antiácido, fermento, extintores |
| carbonato de cálcio | CaCO₃ | calcário, mármore, giz, conchas, antiácido |
| carbonato de sódio | Na₂CO₃ | barrilha: vidro e sabão |
| sulfato de cálcio | CaSO₄ | gesso |
| nitrato de potássio | KNO₃ | fertilizante, pólvora |
| fluoreto de sódio | NaF | cremes dentais |

## Como cai na prova
Montar a **reação de neutralização balanceada**, dar o **nome do sal**, justificar a **condução de corrente** (dissociação) e escrever **fórmulas** com cargas.

## Erros comuns
- Esquecer de balancear a água.
- Trocar -ato por -ito (sulfato × sulfito).
- Dizer que o sal sólido conduz corrente.`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-oxidos',
    'Química PB4 · Óxidos (completo)',
    'Iônicos e moleculares, nomenclatura, caráter ácido ou básico e aplicações',
    `## Definição
**Óxido** é um composto **binário** (dois elementos) em que o **oxigênio é o elemento mais eletronegativo**. (Com o flúor o composto é fluoreto de oxigênio, OF₂, e não óxido.)

## Classificação do roteiro: iônicos × moleculares
| | **Óxido iônico** | **Óxido molecular** |
|---|---|---|
| **Elementos** | **metal + oxigênio** | **ametal + oxigênio** |
| **Ligação** | iônica (transferência de elétrons) | covalente (compartilhamento) |
| **Estado físico** | sólidos de alto ponto de fusão | gases, líquidos ou sólidos de baixo ponto de fusão |
| **Exemplos** | Na₂O, CaO, MgO, Al₂O₃, Fe₂O₃ | CO, CO₂, SO₂, SO₃, NO₂, N₂O₅, H₂O |

## Nomenclatura
### Óxidos iônicos: **óxido de** + nome do elemento
- Na₂O: óxido de **sódio** · CaO: óxido de **cálcio** · Al₂O₃: óxido de **alumínio**.
- Metais com mais de uma carga indicam o número romano: FeO = óxido de **ferro II**; Fe₂O₃ = óxido de **ferro III**.
- Fórmula pelo cruza e desce: Al³⁺ e O²⁻ → **Al₂O₃**.

### Óxidos moleculares: **prefixos** (mono, di, tri, tetra, penta) + óxido de + prefixo + elemento
| Fórmula | Nome |
|---|---|
| CO | monóxido de carbono |
| CO₂ | dióxido de carbono |
| SO₂ | dióxido de enxofre |
| SO₃ | trióxido de enxofre |
| NO₂ | dióxido de nitrogênio |
| N₂O | monóxido de dinitrogênio |
| N₂O₅ | pentóxido de dinitrogênio |
*(O "mono" do primeiro elemento costuma ser omitido: dióxido de carbono, não dióxido de monocarbono.)*

## Caráter químico (complemento)
- **Óxidos ácidos** (ametal + O): reagem com água e formam **ácidos**. SO₃ + H₂O → H₂SO₄. CO₂ + H₂O → H₂CO₃.
- **Óxidos básicos** (metal + O): reagem com água e formam **bases**. CaO + H₂O → Ca(OH)₂.
- **Óxidos neutros**: CO, NO, N₂O não reagem com água, ácidos nem bases.
- Ácido + base → sal: CO₂ + 2 NaOH → Na₂CO₃ + H₂O.

## Principais óxidos e aplicações
| Óxido | Onde aparece |
|---|---|
| **CO₂** | refrigerantes, extintores, gelo-seco, efeito estufa |
| **CO** | gás tóxico da combustão incompleta (motores e aquecedores) |
| **SO₂ e SO₃** | queima de combustíveis fósseis; chuva ácida; SO₂ conserva frutas secas |
| **NO e NO₂** | motores de combustão; poluição do ar e chuva ácida |
| **CaO** | cal virgem: argamassa, correção de solo |
| **Fe₂O₃** | hematita (minério de ferro), ferrugem |
| **Al₂O₃** | alumina (bauxita), camada protetora do alumínio |
| **SiO₂** | areia, quartzo e vidro |
| **ZnO** | pomadas, protetor solar |
| **H₂O** | óxido de hidrogênio, molecular |

## Chuva ácida (passo a passo)
1. Queima de combustíveis libera **SO₂** e **NOx**.
2. SO₂ + ½ O₂ → SO₃ (no ar).
3. SO₃ + H₂O → **H₂SO₄** (ácido sulfúrico na chuva).
4. Efeitos: acidifica rios e solos, ataca folhas, corrói **monumentos de mármore (CaCO₃)** e metais.
A chuva "normal" já é levemente ácida (pH ≈ 5,6) por causa do CO₂. Chuva ácida tem **pH menor que isso**.

## Erros comuns
- Usar prefixos em óxido **iônico** (dizer "trióxido de dialumínio").
- Dizer que todo óxido é molecular.
- Confundir **CO** (tóxico) com **CO₂**.`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-ph',
    'Química PB4 · pH, indicadores e condutividade',
    'Como medir acidez e como reconhecer ácidos, bases e sais no laboratório',
    `## Escala de pH (a 25 °C)
| pH | Caráter | Exemplos |
|---|---|---|
| 0 a 6 | **ácido** | suco gástrico (≈ 2), limão (≈ 2), refrigerante (3 a 4), café (≈ 5) |
| **7** | **neutro** | água pura |
| 8 a 14 | **básico** | bicarbonato (≈ 8), leite de magnésia (≈ 10), água sanitária (≈ 12), soda cáustica (≈ 14) |

- **Quanto menor o pH, mais ácida a solução** e maior a concentração de H⁺.
- Cada unidade de pH muda a acidez em **10 vezes**: pH 2 é 10 vezes mais ácido que pH 3.

## Indicadores
| Indicador | Em ácido | Em neutro | Em base |
|---|---|---|---|
| **Fenolftaleína** | incolor | incolor | **rosa/carmim** |
| **Tornassol** | vermelho | — | azul |
| **Repolho roxo** (natural) | vermelho/rosa | roxo | azul, verde ou amarelo |

## Condutividade elétrica
- **Água pura**: péssima condutora (poucos íons).
- **Solução de ácido, base ou sal**: boa condutora, porque há **íons livres**. Quanto mais íons, melhor a condução.
- **Ácido forte** (muita ionização) conduz mais que **ácido fraco**.
- **Sal sólido**: não conduz (íons presos); fundido ou em solução, conduz.
- **Açúcar dissolvido**: não conduz (molecular, não forma íons).

## Teste em casa (não prove!)
Suco de repolho roxo + vinagre → rosa; + bicarbonato → azul/verde.

## Armadilha
"Conduz corrente" **não é** prova de ser ácido: bases e sais em solução também conduzem.`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-cotidiano',
    'Química PB4 · Química do cotidiano e meio ambiente',
    'Onde cada função inorgânica aparece e problemas ambientais que a prova adora',
    `## Casa
- **Sal de cozinha** (NaCl), **bicarbonato** (NaHCO₃) e **vinagre** (ácido acético): sais e ácidos do dia a dia.
- **Água sanitária** (hipoclorito de sódio, NaClO): sal de ácido hipocloroso, **básico**.
- **Produtos de limpeza**: bases (soda, amoníaco) tiram gordura; **ácido muriático** (HCl) limpa pisos.
- **Sabão**: feito com soda cáustica (NaOH).

## Saúde
- **Azia**: excesso de HCl no estômago → **antiácidos** (Mg(OH)₂, Al(OH)₃, NaHCO₃, CaCO₃) **neutralizam**.
- **Soro fisiológico**: NaCl a 0,9%.
- **Creme dental**: fluoreto de sódio (NaF).

## Construção e indústria
- **Cal virgem** (CaO) → com água → **cal hidratada** Ca(OH)₂ → argamassa.
- **Gesso**: sulfato de cálcio (CaSO₄).
- **Vidro**: SiO₂ com barrilha (Na₂CO₃).
- **Alumínio**: protegido por uma fina camada de **Al₂O₃**.
- **Ferrugem**: Fe₂O₃ hidratado.

## Agricultura
- **Fertilizantes**: nitratos, fosfatos e sulfatos (KNO₃, Ca₃(PO₄)₂, (NH₄)₂SO₄), feitos com HNO₃, H₃PO₄ e H₂SO₄.
- **Calagem**: cal (CaO ou CaCO₃) **neutraliza** a acidez do solo e melhora a produtividade.

## Meio ambiente
- **Chuva ácida**: SO₂ e NOx + água → H₂SO₄ e HNO₃.
- **Efeito estufa**: CO₂ (e CH₄) retêm calor.
- **Acidificação dos oceanos**: CO₂ + H₂O → H₂CO₃, prejudica corais e moluscos.
- **Monóxido de carbono (CO)**: gás sem cheiro e **muito tóxico**: nunca use braseiro em ambiente fechado.

## Como a prova pergunta
Costuma trazer **um texto curto do cotidiano** (poluição, antiácido, fertilizante, conservação de alimentos) e pedir: **identificar a função química**, **escrever a equação** e **explicar** o fenômeno com as palavras corretas (ionização, dissociação, neutralização, íons livres).`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-ficha',
    'Química PB4 · Ficha relâmpago da véspera',
    'Tudo o que precisa estar na ponta da língua, em uma página',
    `## Definições em uma frase
- **Ácido:** libera **H⁺** (ioniza). pH < 7. Sabor azedo.
- **Base:** libera **OH⁻** (dissocia). pH > 7. Fenolftaleína rosa.
- **Sal:** cátion ≠ H⁺ e ânion ≠ OH⁻. Vem da **neutralização**.
- **Óxido:** binário com **O** mais eletronegativo.
- **Neutralização:** ácido + base → **sal + água**.

## Terminações (mosquito)
**ídrico → eto** · **ico → ato** · **oso → ito**

## Ácidos para decorar
HCl clorídrico · HF fluorídrico · HBr bromídrico · HI iodídrico · H₂S sulfídrico · HNO₃ nítrico · HNO₂ nitroso · H₂SO₄ sulfúrico · H₂SO₃ sulfuroso · H₂CO₃ carbônico · H₃PO₄ fosfórico

## Ânions
Cl⁻ cloreto · S²⁻ sulfeto · NO₃⁻ nitrato · NO₂⁻ nitrito · SO₄²⁻ sulfato · SO₃²⁻ sulfito · CO₃²⁻ carbonato · PO₄³⁻ fosfato · OH⁻ hidróxido

## Bases
NaOH soda cáustica · Ca(OH)₂ cal hidratada · Mg(OH)₂ leite de magnésia · Al(OH)₃ tratamento de água · NH₄OH amoníaco

## Óxidos
- **Iônico** = **metal + O**: Na₂O, CaO, Al₂O₃.
- **Molecular** = **ametal + O**: CO, CO₂, SO₂, SO₃, NO₂, N₂O₅.
- Iônico: "óxido de…". Molecular: **prefixos** (mono, di, tri, penta).

## Passo a passo para qualquer fórmula iônica
1. Cátion e ânion com carga.
2. **Cruza e desce.**
3. Parênteses se o ânion tiver vários átomos.
4. Confira: **soma das cargas = 0**.

## Chuva ácida em 3 linhas
SO₂ → SO₃ → + H₂O → **H₂SO₄** → pH < 5,6 → corrói mármore (CaCO₃) e acidifica rios e solos.

## Última checagem
✔ Balanceei a equação? ✔ Usei íons corretos (H⁺/OH⁻)? ✔ Escrevi o nome com a terminação certa? ✔ Mostrei o raciocínio? ✔ Escrevi em parágrafo, com letra maiúscula e ponto final?`,
  ),
  resumo(
    QU,
    S,
    'pb4-qui-como-responder',
    'Química PB4 · Como responder à prova da Prof.ª Daiane',
    'O estilo de cobrança das PBs do 2º e do 3º bimestres e como pontuar',
    `## O que as provas anteriores mostram
Nas provas do 2º e do 3º bimestres, a professora:
- Abre cada questão com um **texto do cotidiano** (auroras polares, fogos de artifício, ruminantes e metano, latas de alumínio).
- Pede **itens a), b)** que partem do texto e chegam ao **conceito** (modelo de Bohr, distribuição eletrônica, ligações, propriedades dos metais).
- Cada item vale **até 1,0 ponto**.
- Exige **espaço para demonstração de raciocínio**: só vale com **desenvolvimento completo**.
- Mistura **explicação em texto** (compare, descreva, explique) e **tabelas ou fórmulas** para preencher.

## As regras da capa da prova (valem na PB4)
1. Respeite a **norma padrão** (sem abreviações).
2. Resposta dissertativa = **parágrafo**, com **letra maiúscula** e **ponto final**.
3. **Identifique o comando** (compare, descreva, explique, escreva, classifique) antes de responder.
4. **Caneta** na resposta final.
5. **Registre o raciocínio**: cálculo ou justificativa. Resposta seca perde nota.

## Verbos de comando
| Comando | O que fazer |
|---|---|
| **Classifique** | diga a categoria **e justifique** em uma frase |
| **Explique** | causa → consequência, com termos científicos |
| **Compare** | cite semelhanças **e** diferenças |
| **Escreva a equação** | reagentes → produtos, **balanceada**, com fórmulas corretas |
| **Dê o nome** | use a terminação certa (eto, ato, ito) |
| **Represente** | fórmula molecular, estrutural **e** eletrônica, se pedidas |

## Modelo de resposta (fórmula em 3 passos)
1. **Resposta direta**: "O SO₂ é um óxido molecular…"
2. **Justificativa**: "…porque é formado por ametal e oxigênio, unidos por ligações covalentes."
3. **Exemplo ou equação** (se pedir): "SO₃ + H₂O → H₂SO₄."

## Exemplo completo
**Pergunta:** Explique por que a solução de NaCl conduz corrente, mas o NaCl sólido não.
**Resposta nota máxima:** "O NaCl é um composto iônico. No estado sólido, os íons Na⁺ e Cl⁻ estão presos no retículo cristalino, por isso não conduz corrente. Dissolvido em água, ocorre a dissociação iônica, e os íons ficam livres para se movimentar e conduzir a corrente elétrica."

## Erros que tiram ponto
- Não balancear a equação.
- Misturar **ionização** e **dissociação**.
- Esquecer a **carga** do íon (Cl, em vez de Cl⁻).
- Responder em tópicos quando se pede **parágrafo**.
- Deixar em branco: **sempre** tente e registre o raciocínio.`,
  ),
];
