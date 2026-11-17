import { resumo, type ResumoG3 } from '../grande3/types';

/** PA8 · micro resumos de Ciências (Física, Química e Biologia), um por módulo. Resumos de estudo do Nexa. */
const S = '9º ano' as const;
const FI = 'fisica';
const QU = 'quimica';
const BI = 'biologia';

export const RESUMOS_PA8_CIENCIAS: ResumoG3[] = [
  /* ------------------------------------------------------------ Física */
  resumo(
    FI,
    S,
    'pa8-fi-11',
    'Física · Módulo 11 · Magnetismo',
    'Ímãs, polos, campo magnético e a Terra como ímã',
    `## Ímãs
- Todo ímã tem **dois polos**, norte e sul. **Não dá para separá-los**: quebrando um ímã, cada pedaço vira um ímã completo.
- Polos **iguais se repelem**; polos **diferentes se atraem**.

## Campo magnético
Região em que um ímã exerce força. É representado por **linhas de campo**, que saem do polo norte e entram no sul.

## A Terra é um grande ímã
- O **polo sul magnético** fica perto do **polo norte geográfico**, por isso a bússola aponta para o norte.
- O campo terrestre **desvia partículas** do vento solar e explica as **auroras**.`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-12',
    'Física · Módulo 12 · Eletromagnetismo',
    'Oersted, eletroímãs, indução, motores, geradores e transformadores',
    `## Corrente gera campo (Oersted)
Uma corrente elétrica cria campo magnético ao redor do fio. Enrolando o fio (bobina) e usando núcleo de ferro, temos um **eletroímã**. Sua força aumenta com **mais espiras** e **mais corrente**.

## Campo gera corrente (Faraday)
A **variação** do fluxo magnético em uma bobina **induz corrente**. Ímã parado: nada.

## Aplicações
- **Gerador:** movimento → corrente (usinas).
- **Motor:** corrente → movimento.
- **Transformador:** só funciona com corrente **alternada**. Vp/Vs = Np/Ns. Exemplo: 220 V, 200 e 20 espiras → 22 V.`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-13',
    'Física · Módulo 13 · Ondas eletromagnéticas e suas aplicações',
    'Espectro, velocidade da luz e usos das radiações',
    `## Ondas eletromagnéticas
Não precisam de meio material. No vácuo, todas têm a mesma velocidade: **c ≈ 3 × 10⁸ m/s**.

## Relação básica
**v = λ · f.** Quanto maior a frequência, menor o comprimento de onda.

## Espectro (crescente de frequência)
Rádio → micro-ondas → infravermelho → **luz visível** → ultravioleta → raios X → raios gama.

## Aplicações e cuidados
- **Rádio/TV:** comunicação. **Micro-ondas:** forno e celular.
- **Infravermelho:** controle remoto, calor.
- **UV:** esterilização; em excesso, queima a pele.
- **Raios X:** imagens de ossos. **Gama:** radioterapia. Radiações ionizantes exigem cuidado.`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-14',
    'Física · Módulo 14 · Sistemas de comunicação',
    'Sinal analógico, digital, fibra óptica e satélites',
    `## Sistema de comunicação
**Emissor → canal → receptor**, com possibilidade de **ruído** no caminho.

## Analógico × digital
- **Analógico:** sinal contínuo.
- **Digital:** sequência de **0 e 1**. Menos afetado pelo ruído e fácil de armazenar.

## Meios
- **Fibra óptica:** pulsos de **luz** por reflexão total.
- **Ondas de rádio e micro-ondas:** TV, celular, Wi-Fi.
- **Satélites geoestacionários:** período de 24 h sobre o equador, parecem parados.`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-15',
    'Física · Módulo 15 · O nascimento da Astronomia',
    'Geocentrismo, heliocentrismo e os primeiros astrônomos',
    `## Dois modelos
- **Geocentrismo** (Ptolomeu): a Terra no centro.
- **Heliocentrismo** (Copérnico): o **Sol** no centro, com os planetas em volta.

## Quem fez o quê
- **Galileu:** luneta, luas de Júpiter e **fases de Vênus**, que apoiaram o heliocentrismo.
- **Kepler:** órbitas **elípticas**.
- **Newton:** gravitação universal.

## Lembre
A ciência muda quando **novas observações** não cabem mais no modelo antigo.`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-16',
    'Física · Módulo 16 · O Sistema Solar',
    'Planetas, Lua, estações do ano e eclipses',
    `## Planetas
- **Rochosos:** Mercúrio, Vênus, Terra e Marte.
- **Gigantes:** Júpiter, Saturno, Urano e Netuno.

## Estações do ano
Causadas pela **inclinação do eixo da Terra** (cerca de 23,5°), e **não** pela distância ao Sol.

## Lua
- **Fases:** dependem da parte iluminada que vemos da Terra.
- **Eclipse solar:** na lua nova, a Lua fica entre o Sol e a Terra.
- **Eclipse lunar:** na lua cheia, a Terra fica entre o Sol e a Lua.
- Não há eclipse todo mês porque a órbita da Lua é **inclinada** (cerca de 5°).`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-17',
    'Física · Módulo 17 · Evolução estelar',
    'Do nascimento à morte de uma estrela',
    `## Ciclo de vida
**Nebulosa** → **protoestrela** → **estrela** (sequência principal, fundindo hidrogênio em hélio) → fase final.

## Fase final
- **Massa média (como o Sol):** gigante vermelha → nebulosa planetária → **anã branca**.
- **Massa muito grande:** **supernova** → estrela de nêutrons ou **buraco negro**.

## Lembre
Os elementos pesados do nosso corpo (ferro, cálcio) foram formados em estrelas: somos feitos de "poeira estelar".`,
  ),
  resumo(
    FI,
    S,
    'pa8-fi-18',
    'Física · Módulo 18 · Ser humano em outro planeta?',
    'Condições para a vida e a exploração espacial',
    `## O que a vida (como a conhecemos) precisa
Água líquida, atmosfera adequada, temperatura moderada, proteção contra radiação e gravidade tolerável.

## Marte
- Atmosfera **rarefeita**, com muito CO₂.
- Temperaturas muito baixas.
- Gravidade de cerca de **38%** da terrestre.

## Massa × peso
A **massa** não muda. O **peso** (P = m · g) é menor onde a gravidade é menor.

## Distâncias
**Ano-luz** é **distância**: o que a luz percorre em um ano (cerca de 9,5 trilhões de km).`,
  ),

  /* ------------------------------------------------------------ Química */
  resumo(
    QU,
    S,
    'pa8-qu-7',
    'Química · Módulo 7 · Ligações químicas',
    'Iônica, covalente e metálica',
    `## Regra do octeto
Os átomos tendem a ficar com **8 elétrons** na última camada.

## Tipos de ligação
- **Iônica** (metal + ametal): **transferência** de elétrons, formando íons. Ex.: NaCl. Sólidos, de alto PF; conduzem só fundidos ou dissolvidos.
- **Covalente** (ametal + ametal): **compartilhamento** de pares de elétrons. Ex.: H₂O, CO₂. Em geral, baixo PF; não conduzem.
- **Metálica** (metal + metal): "mar de elétrons"; condutividade, brilho, maleabilidade. As ligas (latão) são misturas de metais.

### Dica
Metal que perde 1 elétron (Na) vira **Na⁺**; ametal que ganha vira ânion.`,
  ),
  resumo(
    QU,
    S,
    'pa8-qu-8',
    'Química · Módulo 8 · Funções inorgânicas: ácidos, bases e sais',
    'Definições, indicadores, pH e neutralização',
    `## Definições (Arrhenius)
- **Ácido:** libera **H⁺** em água (HCl, H₂SO₄, HNO₃).
- **Base:** libera **OH⁻** (NaOH, KOH, Ca(OH)₂).
- **Sal:** produto da neutralização (NaCl, NaNO₃).

## Neutralização
**Ácido + base → sal + água.** HCl + NaOH → NaCl + H₂O.

## pH
Menor que 7 é ácido, 7 é neutro e maior que 7 é básico. A fenolftaleína fica **rosa** em meio básico.

## Nomes
-ico → **-ato** (sulfúrico → sulfato, nítrico → nitrato).`,
  ),
  resumo(
    QU,
    S,
    'pa8-qu-9',
    'Química · Módulo 9 · Funções inorgânicas: óxidos',
    'Óxidos ácidos, básicos e neutros',
    `## O que é óxido
Composto **binário** em que o oxigênio é o elemento mais eletronegativo.

## Tipos
- **Ácidos** (de ametais, como CO₂, SO₂): + água → ácido. Causam a **chuva ácida** (SO₂, NO₂).
- **Básicos** (de metais, como CaO): + água → base. A cal virgem forma Ca(OH)₂.
- **Neutros** (CO, NO, N₂O): não reagem com água, ácidos ou bases.

## Chuva
A água da chuva já é levemente ácida (pH ≈ 5,6) por causa do CO₂. **Chuva ácida** tem pH menor que isso.`,
  ),

  /* ------------------------------------------------------------ Biologia */
  resumo(
    BI,
    S,
    'pa8-bi-7',
    'Biologia · Módulo 7 · Hereditariedade',
    'Genótipo, fenótipo e cruzamentos',
    `## Conceitos
- **Gene:** trecho de DNA com informação para uma característica. **Alelos:** versões do gene.
- **Genótipo:** os alelos (Aa). **Fenótipo:** a característica manifestada.
- **Dominante** (A) aparece no heterozigoto; **recessivo** (a) só aparece em **aa**.

## Cruzamentos
- Aa × Aa → 1 AA : 2 Aa : 1 aa → 25% aa (3 : 1 no fenótipo).
- Aa × aa → 50% Aa e 50% aa.

## Probabilidade
Independentes se **multiplicam**: menino (1/2) e albino (1/4) → 1/8.`,
  ),
  resumo(
    BI,
    S,
    'pa8-bi-8',
    'Biologia · Módulo 8 · Genes e Biotecnologia',
    'DNA, transgênicos, clonagem e testes de DNA',
    `## DNA
Dupla hélice com bases **A–T** e **C–G**. No RNA, a timina dá lugar à **uracila**.

## Biotecnologia
- **Transgênicos:** recebem gene de **outra espécie** (insulina em bactérias, milho resistente).
- **Clonagem:** cópia genética de um organismo (Dolly, 1996: núcleo de célula adulta em óvulo sem núcleo).
- **Teste de DNA:** compara marcadores variáveis; metade vem da mãe e metade do pai.

## Debate
Benefícios (saúde, alimentos) e riscos/ética (impacto ambiental, acesso, privacidade).`,
  ),
  resumo(
    BI,
    S,
    'pa8-bi-9',
    'Biologia · Módulo 9 · Doenças genéticas e aconselhamento genético',
    'Herança, alterações cromossômicas e orientação',
    `## Tipos
- **Gênicas:** alteração em um gene (anemia falciforme, fenilcetonúria, albinismo).
- **Cromossômicas:** número de cromossomos (síndrome de Down: trissomia do 21).

## Heterozigotos
Em doença **recessiva**, pais saudáveis podem ser **portadores (Aa)** e ter filho aa (25%).

## Vantagem do heterozigoto
Na anemia falciforme, o portador tem maior resistência à **malária**: a seleção natural mantém o alelo.

## Aconselhamento genético
Informa **riscos** e opções à família. Não "escolhe" nada: a decisão é do casal.`,
  ),
  resumo(
    BI,
    S,
    'pa8-bi-10',
    'Biologia · Módulo 10 · Evolução é transformação',
    'Lamarck, Darwin e seleção natural',
    `## Lamarck
Uso e desuso e herança de **caracteres adquiridos**. Ideia não confirmada.

## Darwin: seleção natural
1. Há **variação** entre indivíduos.
2. Mais indivíduos nascem do que o ambiente sustenta.
3. Os **mais adaptados** sobrevivem e se reproduzem mais.
4. A característica vantajosa fica mais **frequente**.

## Hoje
A **mutação** gera variação nova. A seleção atua sobre ela: ex., **bactérias resistentes a antibióticos**. Os antibióticos não criam resistência, eles **selecionam** quem já era resistente.`,
  ),
  resumo(
    BI,
    S,
    'pa8-bi-sust',
    'Biologia · Setor C · Sustentabilidade',
    'Desenvolvimento sustentável e consumo consciente',
    `## Ideia central
Atender às necessidades de hoje **sem comprometer as gerações futuras** (relatório Brundtland, 1987).

## Tripé
**Ambiental** + **social** + **econômica**.

## Na prática
Reduzir, reutilizar e reciclar; energia limpa; consumo consciente; menos desperdício de água e alimento.

### Cuidado
Sustentabilidade **não** é deixar de usar os recursos, e sim usá-los de modo que continuem existindo.`,
  ),
  resumo(
    BI,
    S,
    'pa8-bi-uc',
    'Biologia · Setor C · Unidades de Conservação',
    'Proteção integral e uso sustentável',
    `## O que são
Áreas protegidas por lei para conservar a natureza (SNUC).

## Proteção integral
Preservar a natureza, com uso **indireto** (pesquisa, educação, turismo ecológico). Ex.: **parque nacional**, estação ecológica, reserva biológica. Sem moradores.

## Uso sustentável
Conciliam conservação e **uso controlado**. Ex.: **APA** (Área de Proteção Ambiental), **reserva extrativista**, floresta nacional. Podem ter moradores e atividades com regras.

### Dica
Pergunta típica: "pode ter gente morando?" Proteção integral não; uso sustentável sim.`,
  ),
];
