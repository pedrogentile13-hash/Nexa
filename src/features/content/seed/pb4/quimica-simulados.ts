import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Química (9º ano, Prof.ª Daiane Marin): Módulo 8 (ácidos, bases e sais) e Módulo 9 (óxidos).
 * REGRA DE ESCRITA: a alternativa certa nunca pode ser reconhecida pelo tamanho. As erradas têm tamanho
 * parecido com o da certa (veja `balanco-alternativas.ts`, que é conferido nos testes).
 */

const MATERIA = 'quimica';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · ÁCIDOS (14 objetivas) */

const S1: QuestaoG2[] = [
  o(
    'facil',
    'Segundo a teoria de Arrhenius, um ácido é toda substância que, dissolvida em água,',
    'libera íons H⁺ como único cátion',
    [
      'libera íons OH⁻ como único ânion',
      'libera íons Na⁺ como único cátion',
      'se mantém inteira, sem formar íons',
      'libera íons Cl⁻ como único ânion',
    ],
    'Ácido de Arrhenius é o que sofre ionização em água e libera H⁺ (na água, H₃O⁺) como único cátion. O OH⁻ caracteriza as bases.',
  ),
  o(
    'facil',
    'Entre as fórmulas abaixo, a única que representa um hidrácido (ácido sem oxigênio) é',
    'HCl',
    ['H₂SO₄', 'HNO₃', 'H₃PO₄', 'H₂CO₃'],
    'Hidrácidos não têm oxigênio: HCl, HF, HBr, HI, H₂S, HCN. Os demais têm oxigênio e são oxiácidos.',
  ),
  o(
    'facil',
    'O ácido de fórmula HNO₃, usado na fabricação de fertilizantes e plásticos, chama-se',
    'ácido nítrico',
    ['ácido nitroso', 'ácido nítrido', 'ácido nitrídrico', 'ácido nitrato'],
    'HNO₃ é o oxiácido com mais oxigênios: terminação -ico. Já o HNO₂ é o ácido nitroso.',
  ),
  o(
    'medio',
    'O ânion formado na ionização total do ácido sulfúrico (H₂SO₄) chama-se',
    'sulfato (SO₄²⁻)',
    ['sulfito (SO₃²⁻)', 'sulfeto (S²⁻)', 'sulfúrico (SO₄²⁻)', 'sulfídrico (S²⁻)'],
    'Ácido -ico origina ânion -ato: sulfúrico → sulfato. Sulfito vem do sulfuroso e sulfeto vem do sulfídrico.',
  ),
  o(
    'medio',
    'Ao perder o H⁺, um ácido de nome terminado em -ico origina um ânion terminado em',
    '-ato',
    ['-ito', '-eto', '-oso', '-ídrico'],
    'Regra da mnemônica: ico → ato, oso → ito e ídrico → eto.',
  ),
  o(
    'medio',
    'Qual equação representa corretamente a ionização do ácido clorídrico em água?',
    'HCl → H⁺ + Cl⁻',
    ['HCl → H⁻ + Cl⁺', 'HCl → Cl⁺ + OH⁻', 'HCl → H₂ + Cl₂', 'HCl → H⁺ + Cl₂⁻'],
    'O HCl se quebra em um cátion H⁺ e um ânion Cl⁻ (cloreto), conservando as cargas: 0 = (+1) + (−1).',
  ),
  o(
    'facil',
    'O ácido mais produzido e consumido pela indústria química, presente nas baterias de automóveis, é o',
    'ácido sulfúrico (H₂SO₄)',
    [
      'ácido clorídrico (HCl)',
      'ácido carbônico (H₂CO₃)',
      'ácido fosfórico (H₃PO₄)',
      'ácido bromídrico (HBr)',
    ],
    'O H₂SO₄ é usado em baterias, refino de petróleo e fertilizantes. É o "termômetro" da indústria química.',
  ),
  o(
    'facil',
    'O ácido que faz parte do suco gástrico e, em excesso, causa a sensação de "queimação" (azia) é o',
    'ácido clorídrico (HCl)',
    [
      'ácido sulfúrico (H₂SO₄)',
      'ácido nítrico (HNO₃)',
      'ácido fosfórico (H₃PO₄)',
      'ácido fluorídrico (HF)',
    ],
    'O estômago produz HCl para ajudar na digestão. Em excesso, ele irrita a mucosa.',
  ),
  o(
    'medio',
    'Quando o gás carbônico se dissolve na água de um refrigerante, forma-se o ácido',
    'carbônico (H₂CO₃)',
    ['sulfúrico (H₂SO₄)', 'clorídrico (HCl)', 'fosfórico (H₃PO₄)', 'nítrico (HNO₃)'],
    'CO₂ + H₂O → H₂CO₃. Por isso o refrigerante é levemente ácido (pH menor que 7).',
  ),
  o(
    'medio',
    'O ácido sulfúrico (H₂SO₄) é classificado, quanto ao número de hidrogênios ionizáveis, como',
    'diácido',
    ['monoácido', 'triácido', 'tetrácido', 'hidrácido'],
    'Libera dois H⁺ por molécula: diácido. Monoácido: 1 H⁺ (HCl); triácido: 3 H⁺ (H₃PO₄).',
  ),
  o(
    'medio',
    'O que diferencia um oxiácido de um hidrácido?',
    'O oxiácido contém oxigênio e o hidrácido não',
    [
      'O hidrácido contém oxigênio e o oxiácido não',
      'O oxiácido não ioniza e o hidrácido ioniza',
      'O hidrácido é sempre básico e o oxiácido não',
      'O oxiácido tem sódio e o hidrácido tem cloro',
    ],
    'A diferença é a presença de oxigênio na molécula. Ambos ionizam em água e são ácidos.',
  ),
  o(
    'medio',
    'Uma solução aquosa de ácido conduz corrente elétrica porque',
    'a ionização forma íons livres na solução',
    [
      'há elétrons livres circulando como num metal',
      'as moléculas do ácido são carregadas por si',
      'a água pura já é ótima condutora elétrica',
      'o ácido derrete e forma íons metálicos fixos',
    ],
    'O ácido molecular ioniza em água. A corrente é transportada pelos íons livres (H⁺ e ânions), e não por elétrons livres.',
  ),
  o(
    'medio',
    'Comparando uma solução de pH 2 com outra de pH 5, a de pH 2 é',
    'mais ácida, com maior concentração de H⁺',
    [
      'menos ácida, com maior concentração de H⁺',
      'mais ácida, com menor concentração de H⁺',
      'mais básica, com maior concentração de OH⁻',
      'neutra, com igual concentração de H⁺ e OH⁻',
    ],
    'Quanto menor o pH, mais ácida a solução e maior a concentração de H⁺. Cada unidade de pH muda a acidez em 10 vezes.',
  ),
  o(
    'dificil',
    'O ácido nitroso (HNO₂) origina, ao perder o H⁺, o ânion',
    'nitrito (NO₂⁻)',
    ['nitrato (NO₃⁻)', 'nitreto (N³⁻)', 'nitroso (NO₂⁻)', 'nítrico (NO₃⁻)'],
    'Ácido -oso origina ânion -ito: nitroso → nitrito (NO₂⁻). O nitrato (NO₃⁻) vem do ácido nítrico.',
  ),
];

/* ============================================================ SIMULADO 2 · BASES E SAIS (14 objetivas) */

const S2: QuestaoG2[] = [
  o(
    'facil',
    'Uma base de Arrhenius é caracterizada por, em solução aquosa,',
    'sofrer dissociação e liberar OH⁻ como único ânion',
    [
      'sofrer ionização e liberar H⁺ como único cátion',
      'permanecer em moléculas, sem liberar nenhum íon',
      'sofrer dissociação e liberar O²⁻ como único ânion',
      'sofrer ionização e liberar Cl⁻ como único ânion',
    ],
    'As bases são, em geral, compostos iônicos: ao se dissolverem, os íons se separam (dissociação) e liberam OH⁻.',
  ),
  o(
    'facil',
    'A base de fórmula NaOH, conhecida como soda cáustica, chama-se',
    'hidróxido de sódio',
    ['óxido de sódio', 'hidreto de sódio', 'hidróxido de potássio', 'hidróxido de cloro'],
    'Nome das bases: "hidróxido de" + nome do cátion. NaOH = hidróxido de sódio.',
  ),
  o(
    'medio',
    'A cal hidratada (cal apagada), usada em argamassas e para caiar paredes, é o',
    'hidróxido de cálcio, Ca(OH)₂',
    [
      'óxido de cálcio, CaO (cal viva)',
      'carbonato de cálcio, CaCO₃',
      'hidróxido de sódio, NaOH',
      'sulfato de cálcio, CaSO₄ (gesso)',
    ],
    'A cal virgem (CaO) reage com água e vira cal hidratada: CaO + H₂O → Ca(OH)₂.',
  ),
  o(
    'facil',
    'O Mg(OH)₂ é o principal componente do leite de magnésia. O nome dessa base é',
    'hidróxido de magnésio',
    ['óxido de magnésio', 'hidreto de magnésio', 'hidróxido de manganês', 'carbonato de magnésio'],
    'Mg(OH)₂ tem o cátion Mg²⁺ e duas hidroxilas: hidróxido de magnésio. É usado como antiácido e laxante.',
  ),
  o(
    'medio',
    'A base Al(OH)₃, usada no tratamento de água, é classificada, quanto ao número de hidroxilas, como',
    'tribase',
    ['monobase', 'dibase', 'tetrabase', 'hidrácido'],
    'Três hidroxilas por fórmula: tribase. NaOH é monobase e Ca(OH)₂ é dibase.',
  ),
  o(
    'medio',
    'Ao pingar fenolftaleína em uma solução de NaOH, a cor que se observa é',
    'rosa (avermelhada)',
    ['incolor (sem cor)', 'azul (esverdeada)', 'amarela (alaranjada)', 'verde (azulada)'],
    'A fenolftaleína é incolor em meio ácido ou neutro e fica rosa em meio básico.',
  ),
  o(
    'medio',
    'Uma propriedade característica das bases em solução aquosa é',
    'pH maior que 7 e sabor adstringente',
    [
      'pH menor que 7 e sabor azedo típico',
      'pH igual a 7 e sabor adocicado leve',
      'pH menor que 7 e sabor adstringente',
      'pH maior que 7 e sabor azedo típico',
    ],
    'Bases têm pH maior que 7 e sabor adstringente ("amarra" a língua). Nunca se deve provar substâncias em laboratório!',
  ),
  o(
    'facil',
    'A reação entre um ácido e uma base chama-se',
    'neutralização, que forma sal e água',
    [
      'combustão, que forma gás e água',
      'decomposição, que forma dois sais',
      'oxidação, que forma óxido e água',
      'síntese, que forma apenas um sal',
    ],
    'Ácido + base → sal + água. O H⁺ do ácido reage com o OH⁻ da base e forma H₂O.',
  ),
  o(
    'medio',
    'Na reação HCl + NaOH → X + H₂O, o sal X formado é o',
    'cloreto de sódio (NaCl)',
    [
      'cloreto de potássio (KCl)',
      'clorato de sódio (NaClO₃)',
      'cloreto de cálcio (CaCl₂)',
      'hipoclorito de sódio (NaClO)',
    ],
    'O ânion vem do ácido (Cl⁻ de HCl, cloreto) e o cátion vem da base (Na⁺). Sal de cozinha: NaCl.',
  ),
  o(
    'medio',
    'Combinando o cátion Ca²⁺ com o ânion Cl⁻, a fórmula do sal formado é',
    'CaCl₂',
    ['Ca₂Cl', 'CaCl', 'Ca₂Cl₂', 'Ca(Cl)₃'],
    'As cargas devem se anular: um Ca²⁺ precisa de dois Cl⁻. Regra do "cruza e desce": CaCl₂.',
  ),
  o(
    'dificil',
    'O sulfato de alumínio é formado por Al³⁺ e SO₄²⁻. Sua fórmula é',
    'Al₂(SO₄)₃',
    ['Al(SO₄)₂', 'Al₃(SO₄)₂', 'Al₂SO₄', 'Al₃SO₄'],
    'Cruzando as cargas: o 3 do alumínio vira o índice do sulfato e o 2 do sulfato vira o índice do alumínio: Al₂(SO₄)₃. O sulfato fica entre parênteses.',
  ),
  o(
    'medio',
    'O sal de fórmula Na₂CO₃, usado na fabricação de vidro e sabão (barrilha), chama-se',
    'carbonato de sódio',
    ['carbonito de sódio', 'carboneto de sódio', 'carbonato de cálcio', 'bicarbonato de sódio'],
    'Ânion CO₃²⁻ = carbonato (vem do ácido carbônico, -ico → -ato). Com Na⁺, vira carbonato de sódio.',
  ),
  o(
    'medio',
    'Uma solução aquosa de NaCl conduz corrente elétrica porque o sal',
    'se dissocia e libera íons Na⁺ e Cl⁻ livres',
    [
      'se transforma em sódio metálico e cloro gasoso',
      'se ioniza e libera elétrons livres para a água',
      'mantém as moléculas unidas e carregadas dentro',
      'reage com a água e forma um novo metal sólido',
    ],
    'Sais são compostos iônicos. Na água, os íons se separam (dissociação) e ficam livres para conduzir a corrente.',
  ),
  o(
    'medio',
    'O soro fisiológico, usado na lavagem de olhos e nariz, é basicamente uma solução de',
    'cloreto de sódio em água (NaCl a 0,9%)',
    [
      'bicarbonato de sódio em água (NaHCO₃ a 9%)',
      'hidróxido de sódio em água (NaOH a 0,9%)',
      'ácido clorídrico em água (HCl a 0,9%)',
      'sulfato de cálcio em água (CaSO₄ a 9%)',
    ],
    'O soro fisiológico é uma solução de NaCl em concentração semelhante à do nosso sangue: 0,9% (9 g por litro).',
  ),
];

/* ============================================================ SIMULADO 3 · ÓXIDOS (12 objetivas) */

const S3: QuestaoG2[] = [
  o(
    'facil',
    'Óxido é um composto binário no qual o oxigênio é',
    'o elemento mais eletronegativo',
    [
      'o elemento menos eletronegativo',
      'sempre ligado a um hidrogênio',
      'o único elemento do composto',
      'o elemento de menor número atômico',
    ],
    'Binário = dois elementos. No óxido, o O é o mais eletronegativo (exceto com o flúor, que forma fluoreto de oxigênio).',
  ),
  o(
    'facil',
    'Entre as substâncias abaixo, a que é um óxido iônico é',
    'Na₂O',
    ['CO₂', 'SO₂', 'NO₂', 'H₂S'],
    'Óxido iônico = metal + oxigênio. Na₂O (óxido de sódio). CO₂, SO₂ e NO₂ são óxidos moleculares; H₂S nem é óxido.',
  ),
  o(
    'facil',
    'Entre as substâncias abaixo, a que é um óxido molecular é',
    'SO₂',
    ['CaO', 'Na₂O', 'MgO', 'Al₂O₃'],
    'Óxido molecular = ametal + oxigênio, ligação covalente. SO₂ é dióxido de enxofre.',
  ),
  o(
    'medio',
    'O óxido de fórmula Al₂O₃, componente da bauxita, chama-se',
    'óxido de alumínio',
    [
      'trióxido de dialumínio',
      'dióxido de alumínio',
      'aluminato de oxigênio',
      'óxido de dialumínio',
    ],
    'Óxidos iônicos não usam prefixos: "óxido de" + nome do elemento. Al₂O₃ = óxido de alumínio.',
  ),
  o(
    'medio',
    'O composto CO₂ chama-se',
    'dióxido de carbono',
    ['óxido de carbono', 'monóxido de carbono', 'carbonato de oxigênio', 'óxido de dicarbono'],
    'Óxidos moleculares usam prefixos que indicam o número de átomos: di- significa dois oxigênios.',
  ),
  o(
    'medio',
    'O gás tóxico formado na queima incompleta de combustíveis, de fórmula CO, chama-se',
    'monóxido de carbono',
    ['dióxido de carbono', 'monóxido de dicarbono', 'carbonato de oxigênio', 'óxido de cálcio'],
    'CO tem um C e um O: monóxido de carbono. Ele impede o sangue de transportar oxigênio e é perigoso em ambientes fechados.',
  ),
  o(
    'medio',
    'A chuva ácida se forma principalmente a partir de óxidos de',
    'enxofre e de nitrogênio lançados no ar',
    [
      'sódio e de potássio lançados no ar',
      'cálcio e de magnésio lançados no ar',
      'ferro e de alumínio lançados no ar',
      'hélio e de argônio lançados no ar',
    ],
    'SO₂/SO₃ e NOx (da queima de combustíveis fósseis) reagem com a água da atmosfera e formam ácidos (sulfúrico, nítrico).',
  ),
  o(
    'medio',
    'Ao reagir com a água, o trióxido de enxofre (SO₃) forma o ácido',
    'sulfúrico (H₂SO₄)',
    ['sulfuroso (H₂SO₃)', 'nítrico (HNO₃)', 'clorídrico (HCl)', 'carbônico (H₂CO₃)'],
    'SO₃ + H₂O → H₂SO₄. Já o SO₂ forma o ácido sulfuroso (H₂SO₃).',
  ),
  o(
    'medio',
    'A cal virgem (CaO), ao reagir com a água, forma',
    'hidróxido de cálcio, Ca(OH)₂',
    [
      'carbonato de cálcio, CaCO₃',
      'ácido clorídrico, HCl, e água',
      'cloreto de cálcio, CaCl₂',
      'gás oxigênio, O₂, e cálcio',
    ],
    'Óxido de metal + água → base. CaO + H₂O → Ca(OH)₂ (cal hidratada).',
  ),
  o(
    'medio',
    'O Fe₂O₃, principal componente da hematita, é importante porque é um minério usado para obter',
    'ferro metálico na siderurgia',
    [
      'gás oxigênio puro nas indústrias',
      'ácido sulfúrico para as baterias',
      'sal de cozinha para os alimentos',
      'vidro comum para as janelas',
    ],
    'A hematita (Fe₂O₃) é minério de ferro. Na siderurgia, o óxido é reduzido a ferro metálico, base do aço.',
  ),
  o(
    'facil',
    'O gelo-seco, usado em shows e no transporte de alimentos, é',
    'CO₂ no estado sólido',
    ['H₂O no estado sólido', 'CO no estado sólido', 'N₂ no estado líquido', 'SO₂ no estado sólido'],
    'Gelo-seco é dióxido de carbono sólido. Ele sublima (passa direto para gás) a −78 °C, sem molhar.',
  ),
  o(
    'medio',
    'Os óxidos moleculares são formados por',
    'oxigênio e outro ametal, com ligações covalentes',
    [
      'oxigênio e um metal, com ligações iônicas fortes',
      'apenas dois metais, com ligações metálicas fortes',
      'oxigênio e um gás nobre, sem nenhuma ligação',
      'hidrogênio e um metal, com ligações iônicas',
    ],
    'Ametal + O: o par de elétrons é compartilhado (covalente). Metal + O: transferência de elétrons (iônica).',
  ),
];

/* ============================================================ SIMULADO 4 · MISTO 70/30 (7 objetivas + 3 dissertativas) */

const S4: QuestaoG2[] = [
  o(
    'facil',
    'Entre as substâncias HCl, H₂SO₄, HNO₃ e H₃PO₄, a única que é hidrácido é',
    'HCl',
    ['H₂SO₄', 'HNO₃', 'H₃PO₄', 'HClO'],
    'HCl não tem oxigênio. Os outros têm e são oxiácidos.',
  ),
  o(
    'medio',
    'O gás H₂S dissolvido em água forma um ácido chamado',
    'ácido sulfídrico',
    ['ácido sulfúrico', 'ácido sulfuroso', 'ácido sulfético', 'ácido sulfático'],
    'Hidrácido: ácido + nome do elemento + ídrico. H₂S: sulfídrico (ânion sulfeto, S²⁻).',
  ),
  o(
    'medio',
    'Uma solução de pH 12 é classificada como',
    'básica, típica de uma base forte',
    [
      'ácida, típica de um ácido forte',
      'neutra, típica da água pura e limpa',
      'ácida, típica de um sal ácido',
      'salina, sem valor de pH definido',
    ],
    'pH maior que 7 é básico. Perto de 12–14, é muito básico (por exemplo, soda cáustica).',
  ),
  o(
    'medio',
    'O hidróxido de sódio (soda cáustica) é matéria-prima na fabricação de',
    'sabão, papel e produtos de limpeza',
    [
      'baterias de carro e fertilizantes',
      'gelo-seco e bebidas gaseificadas',
      'sal de cozinha e soro fisiológico',
      'extintores de incêndio e balões',
    ],
    'NaOH (soda cáustica) é usada em sabão, papel, desentupidores e produção de alumínio. É muito corrosivo.',
  ),
  o(
    'medio',
    'Na reação H₂SO₄ + 2 NaOH → X + 2 H₂O, a substância X é',
    'Na₂SO₄, o sulfato de sódio',
    [
      'Na₂SO₃, o sulfito de sódio',
      'Na₂S, o sulfeto de sódio',
      'NaHSO₄, um sal de sulfúrico',
      'Na₂O, o óxido de sódio',
    ],
    'Ânion do sulfúrico = sulfato (SO₄²⁻), cátion da base = Na⁺. Cruzando as cargas: Na₂SO₄.',
  ),
  o(
    'medio',
    'Se o suco de repolho roxo fica avermelhado ao ser misturado a uma solução, essa solução é',
    'ácida, como o suco de limão',
    [
      'básica, como a soda cáustica',
      'neutra, como a água pura',
      'básica, como a água sanitária',
      'neutra, como o soro fisiológico',
    ],
    'O suco de repolho roxo é indicador natural: vermelho/rosa em meio ácido, roxo em neutro e azul/verde/amarelo em meio básico.',
  ),
  o(
    'medio',
    'Os antiácidos aliviam a azia porque contêm',
    'bases que neutralizam o excesso de ácido do estômago',
    [
      'ácidos que neutralizam o excesso de base do estômago',
      'sais que aumentam a produção de ácido no estômago',
      'óxidos que transformam o ácido em gás oxigênio',
      'metais que reagem com a base presente no estômago',
    ],
    'Base + ácido → sal + água. O pH do suco gástrico sobe e a queimação diminui.',
  ),
  dq(
    'medio',
    'Explique, segundo Arrhenius, o que é um ácido e o que é uma base. Dê um exemplo de cada, indicando o íon que cada um libera em água.',
    'Ácido, segundo Arrhenius, é a substância que, dissolvida em água, sofre ionização e libera H⁺ como único cátion. Exemplo: HCl → H⁺ + Cl⁻. Base é a substância que, em água, sofre dissociação e libera OH⁻ como único ânion. Exemplo: NaOH → Na⁺ + OH⁻.',
    [
      'Define ácido como o que libera H⁺ como único cátion',
      'Define base como a que libera OH⁻ como único ânion',
      'Dá exemplos corretos (como HCl e NaOH)',
      'Indica o íon liberado por cada um (H⁺ e OH⁻)',
    ],
  ),
  dq(
    'medio',
    'Escreva a equação balanceada da neutralização entre o ácido fosfórico (H₃PO₄) e o hidróxido de sódio (NaOH) e dê o nome do sal formado.',
    'H₃PO₄ + 3 NaOH → Na₃PO₄ + 3 H₂O. O sal formado é o fosfato de sódio (ânion fosfato PO₄³⁻ do ácido fosfórico, cátion Na⁺ da base). A água também é produto.',
    [
      'Escreve os reagentes e os produtos corretamente (sal e água)',
      'Balanceia a equação (3 NaOH e 3 H₂O)',
      'Dá o nome correto do sal: fosfato de sódio',
    ],
  ),
  dq(
    'dificil',
    'Uma pessoa com azia toma um antiácido que contém hidróxido de magnésio, Mg(OH)₂. Explique por que o mal-estar diminui e escreva a equação balanceada da reação que ocorre no estômago (suco gástrico: HCl).',
    'A azia é causada pelo excesso de ácido clorídrico no estômago. O Mg(OH)₂ é uma base e neutraliza o ácido, formando sal e água, o que aumenta o pH do suco gástrico e reduz a queimação. Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O. O sal formado é o cloreto de magnésio.',
    [
      'Relaciona a azia ao excesso de HCl',
      'Explica que a base neutraliza o ácido (reação de neutralização)',
      'Escreve a equação balanceada: Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O',
      'Identifica os produtos: cloreto de magnésio e água',
    ],
  ),
];

/* ============================================================ SIMULADO 5 · MISTO 70/30 (10 objetivas + 4 dissertativas) */

const S5: QuestaoG2[] = [
  o(
    'medio',
    'Do ponto de vista de Arrhenius, um sal é um composto que, em água, se dissocia e libera',
    'um cátion diferente de H⁺ e um ânion diferente de OH⁻',
    [
      'apenas íons H⁺ como único cátion e nenhum ânion',
      'apenas íons OH⁻ como único ânion e nenhum cátion',
      'um cátion sempre igual a H⁺ e um ânion igual a OH⁻',
      'somente moléculas neutras, sem formar nenhum íon',
    ],
    'O sal é o produto da neutralização: tem cátion que não é H⁺ (vem da base) e ânion que não é OH⁻ (vem do ácido).',
  ),
  o(
    'medio',
    'O sal formado pela reação entre o ácido nítrico (HNO₃) e o hidróxido de potássio (KOH) é o',
    'nitrato de potássio (KNO₃)',
    [
      'nitrito de potássio (KNO₂)',
      'nitreto de potássio (K₃N)',
      'nitrato de sódio (NaNO₃)',
      'nitrato de cálcio (Ca(NO₃)₂)',
    ],
    'Ácido nítrico (-ico) → nitrato. Cátion K⁺ da base. Resultado: KNO₃ (usado em fertilizantes).',
  ),
  o(
    'medio',
    'O fosfato de cálcio, formado por Ca²⁺ e PO₄³⁻, tem fórmula',
    'Ca₃(PO₄)₂',
    ['Ca₂(PO₄)₃', 'CaPO₄', 'Ca₃PO₄', 'Ca₂PO₄'],
    'Cruzando as cargas: 3 de PO₄³⁻ vira índice do cálcio (Ca₃) e 2 de Ca²⁺ vira índice do fosfato: (PO₄)₂.',
  ),
  o(
    'medio',
    'Quanto às propriedades físicas, a maioria dos sais é',
    'sólida em temperatura ambiente, com altos pontos de fusão',
    [
      'líquida em temperatura ambiente, com baixos pontos de fusão',
      'gasosa em temperatura ambiente, com baixos pontos de fusão',
      'sólida em temperatura ambiente, com baixos pontos de fusão',
      'líquida em temperatura ambiente, com altos pontos de fusão',
    ],
    'Os sais são iônicos: sólidos cristalinos, duros e quebradiços, com altos PF e PE, que conduzem corrente quando dissolvidos ou fundidos.',
  ),
  o(
    'medio',
    'O carbonato de cálcio (CaCO₃) é o principal componente do',
    'calcário, do mármore e das cascas de ovo',
    [
      'sal de cozinha e do soro fisiológico',
      'gelo-seco e dos extintores de incêndio',
      'ferro metálico e da ferrugem dos portões',
      'vinagre e do suco de limão e de laranja',
    ],
    'CaCO₃ forma calcário, mármore, giz, conchas e cascas de ovo. É base de cimento e corretivo de solo.',
  ),
  o(
    'facil',
    'O bicarbonato de sódio (NaHCO₃), usado como antiácido e fermento, é',
    'um sal',
    ['um ácido', 'uma base', 'um óxido', 'um hidrácido'],
    'O NaHCO₃ tem cátion Na⁺ e ânion HCO₃⁻: é um sal (carbonato ácido de sódio).',
  ),
  o(
    'medio',
    'O gás carbônico (CO₂) é classificado como óxido',
    'molecular, formado por ametal e oxigênio',
    [
      'iônico, formado por metal e oxigênio',
      'molecular, formado por metais e hidrogênio',
      'iônico, formado por ametal e hidrogênio',
      'metálico, formado por carbono e oxigênio',
    ],
    'C e O são ametais. Eles compartilham elétrons: ligação covalente e óxido molecular.',
  ),
  o(
    'dificil',
    'Na reação 2 Mg + O₂ → 2 MgO, o produto formado é',
    'iônico, chamado de óxido de magnésio',
    [
      'molecular, chamado de dióxido de magnésio',
      'iônico, chamado de peróxido de magnésio',
      'molecular, chamado de óxido de oxigênio',
      'iônico, chamado de hidróxido de magnésio',
    ],
    'Metal + oxigênio forma óxido iônico (Mg²⁺ e O²⁻). Nome: óxido de magnésio (sem prefixos).',
  ),
  o(
    'medio',
    'O CO₂ dissolvido em água forma ácido carbônico. Por isso, um refrigerante gaseificado',
    'tem pH menor que 7, sendo levemente ácido',
    [
      'tem pH maior que 7, sendo levemente básico',
      'tem pH igual a 7, sendo totalmente neutro',
      'é uma base fraca, com pH próximo de 12',
      'não altera o pH da água, mantendo-o em 7',
    ],
    'CO₂ + H₂O → H₂CO₃. O H₂CO₃ ioniza e libera H⁺, deixando a bebida ácida (pH em torno de 3 a 4).',
  ),
  o(
    'dificil',
    'O óxido de fórmula N₂O₅ recebe o nome de',
    'pentóxido de dinitrogênio',
    [
      'pentanitreto de dioxigênio',
      'dióxido de pentanitrogênio',
      'dióxido de dinitrogênio',
      'nitrato de pentoxigênio',
    ],
    'Nos óxidos moleculares, os prefixos indicam o número de átomos: penta (5) oxigênios e di (2) nitrogênios.',
  ),
  dq(
    'medio',
    'Explique por que uma solução de sal de cozinha (NaCl) conduz corrente elétrica, mas o NaCl sólido não conduz.',
    'O NaCl é um composto iônico. No estado sólido, os íons Na⁺ e Cl⁻ estão presos no retículo cristalino e não se movimentam, por isso não conduz corrente. Dissolvido em água, ocorre a dissociação iônica: os íons ficam livres e se deslocam, transportando a corrente elétrica.',
    [
      'Identifica o NaCl como composto iônico (Na⁺ e Cl⁻)',
      'Explica que no sólido os íons estão fixos e não conduzem',
      'Explica a dissociação em água e a mobilidade dos íons',
    ],
  ),
  dq(
    'medio',
    'Escreva a fórmula do composto formado pelos íons Al³⁺ e O²⁻, mostrando como as cargas se anulam. Classifique-o como óxido iônico ou molecular e dê o nome.',
    'Cruzando as cargas, o 3 do alumínio vira índice do oxigênio e o 2 do oxigênio vira índice do alumínio: Al₂O₃ (2 × 3+ = 6+ e 3 × 2− = 6−, soma zero). É um óxido iônico, formado por metal e oxigênio. Nome: óxido de alumínio.',
    [
      'Escreve Al₂O₃',
      'Mostra a anulação das cargas (+6 e −6)',
      'Classifica como óxido iônico (metal + oxigênio)',
      'Nomeia como óxido de alumínio',
    ],
  ),
  dq(
    'dificil',
    'Explique como o dióxido de enxofre (SO₂) lançado por indústrias pode causar chuva ácida. Escreva as equações das etapas e cite uma consequência ambiental.',
    'O SO₂ é um óxido ácido. Na atmosfera ele pode ser oxidado a SO₃ (2 SO₂ + O₂ → 2 SO₃) e reage com a água da chuva formando ácido sulfúrico (SO₃ + H₂O → H₂SO₄); o SO₂ também forma ácido sulfuroso (SO₂ + H₂O → H₂SO₃). A chuva fica com pH menor que 5,6. Consequências: acidificação de rios e solos, danos às plantas e corrosão de monumentos de mármore e metais.',
    [
      'Identifica o SO₂ como óxido ácido que reage com a água',
      'Escreve pelo menos uma equação correta (SO₂ + H₂O → H₂SO₃ ou SO₃ + H₂O → H₂SO₄)',
      'Diz que a chuva ácida tem pH menor que o da chuva normal',
      'Cita uma consequência ambiental',
    ],
  ),
  dq(
    'dificil',
    'Diferencie óxido iônico de óxido molecular quanto aos elementos que o formam e ao tipo de ligação. Dê um exemplo de cada com fórmula e nome.',
    'Óxido iônico é formado por oxigênio e um metal, com ligação iônica (transferência de elétrons). Exemplo: Na₂O, óxido de sódio. Óxido molecular é formado por oxigênio e outro ametal, com ligação covalente (compartilhamento de elétrons). Exemplo: CO₂, dióxido de carbono.',
    [
      'Óxido iônico: metal + oxigênio, ligação iônica',
      'Óxido molecular: ametal + oxigênio, ligação covalente',
      'Exemplo correto de óxido iônico com fórmula e nome',
      'Exemplo correto de óxido molecular com fórmula e nome',
    ],
  ),
];

/* ============================================================ SIMULADO 6 · SÓ DISSERTATIVO (8) */

const S6: QuestaoG2[] = [
  dq(
    'medio',
    'O ácido nítrico (HNO₃) é usado na produção de fertilizantes. Escreva a equação de ionização desse ácido em água, classifique-o (hidrácido ou oxiácido; monoácido, diácido ou triácido) e dê o nome do ânion formado.',
    'HNO₃ → H⁺ + NO₃⁻. É um oxiácido (tem oxigênio) e um monoácido (libera um H⁺ por molécula). O ânion NO₃⁻ chama-se nitrato (ácido -ico origina ânion -ato).',
    [
      'Escreve a ionização HNO₃ → H⁺ + NO₃⁻',
      'Classifica como oxiácido e monoácido',
      'Nomeia o ânion como nitrato',
    ],
  ),
  dq(
    'medio',
    'Dê o nome dos ácidos HBr, H₂SO₃ e H₃PO₄ e dos ânions que cada um forma. Justifique a escolha das terminações.',
    'HBr: ácido bromídrico, ânion brometo (-ídrico → -eto). H₂SO₃: ácido sulfuroso, ânion sulfito (-oso → -ito). H₃PO₄: ácido fosfórico, ânion fosfato (-ico → -ato). Regra: ídrico → eto, oso → ito, ico → ato.',
    [
      'Nomeia HBr (bromídrico), H₂SO₃ (sulfuroso) e H₃PO₄ (fosfórico)',
      'Nomeia os ânions brometo, sulfito e fosfato',
      'Justifica com a regra das terminações (ídrico/eto, oso/ito, ico/ato)',
    ],
  ),
  dq(
    'medio',
    'O hidróxido de cálcio, Ca(OH)₂, é a cal hidratada usada em construção. Escreva a equação de dissociação dessa base em água, classifique-a quanto ao número de hidroxilas e cite uma aplicação.',
    'Ca(OH)₂ → Ca²⁺ + 2 OH⁻. É uma dibase, pois libera duas hidroxilas por fórmula. Aplicações: argamassa, pintura de paredes (caiação) e correção da acidez do solo.',
    [
      'Escreve a dissociação Ca(OH)₂ → Ca²⁺ + 2 OH⁻',
      'Classifica como dibase',
      'Cita uma aplicação correta',
    ],
  ),
  dq(
    'medio',
    'Classifique cada substância em ácido, base, sal ou óxido e escreva o nome: (I) NaOH, (II) HF, (III) KCl, (IV) CaO, (V) H₂SO₄.',
    '(I) NaOH: base, hidróxido de sódio. (II) HF: ácido (hidrácido), ácido fluorídrico. (III) KCl: sal, cloreto de potássio. (IV) CaO: óxido (iônico), óxido de cálcio. (V) H₂SO₄: ácido (oxiácido), ácido sulfúrico.',
    [
      'Classifica corretamente as cinco substâncias',
      'Nomeia corretamente pelo menos quatro delas',
      'Usa a regra do íon característico (OH⁻, H⁺, sal, oxigênio)',
    ],
  ),
  dq(
    'dificil',
    'Escreva a equação balanceada da neutralização entre o ácido nítrico (HNO₃) e o hidróxido de cálcio, Ca(OH)₂. Dê o nome do sal formado e explique como você determinou a fórmula dele.',
    '2 HNO₃ + Ca(OH)₂ → Ca(NO₃)₂ + 2 H₂O. O sal é o nitrato de cálcio. A fórmula vem de Ca²⁺ (da base) e NO₃⁻ (do ácido): para as cargas se anularem são necessários dois nitratos, ficando Ca(NO₃)₂ (regra do "cruza e desce").',
    [
      'Escreve e balanceia a equação (2 HNO₃ e 2 H₂O)',
      'Nomeia o sal como nitrato de cálcio',
      'Explica a fórmula pela anulação das cargas',
    ],
  ),
  dq(
    'dificil',
    'Escreva as fórmulas e os nomes dos sais formados por: (a) Na⁺ e SO₄²⁻; (b) Mg²⁺ e PO₄³⁻. Mostre como as cargas se anulam.',
    '(a) Na₂SO₄, sulfato de sódio: 2 Na⁺ (2+) e 1 SO₄²⁻ (2−). (b) Mg₃(PO₄)₂, fosfato de magnésio: 3 Mg²⁺ (6+) e 2 PO₄³⁻ (6−). Em ambos, a soma das cargas é zero.',
    [
      'Escreve Na₂SO₄ e nomeia como sulfato de sódio',
      'Escreve Mg₃(PO₄)₂ e nomeia como fosfato de magnésio',
      'Mostra a anulação das cargas',
    ],
  ),
  dq(
    'dificil',
    'Agricultores costumam adicionar cal (CaO ou CaCO₃) a solos ácidos, processo chamado de calagem. Explique por que isso melhora o solo, escrevendo a equação que mostra o CaO atuando como óxido básico.',
    'Solos ácidos têm excesso de H⁺ e prejudicam as plantas. A cal é básica: o CaO reage com a água formando base (CaO + H₂O → Ca(OH)₂), que neutraliza o ácido do solo, elevando o pH. O CaCO₃ também reage com o ácido e libera CO₂ e água.',
    [
      'Relaciona a acidez do solo ao excesso de H⁺',
      'Explica que a cal tem caráter básico e neutraliza o ácido',
      'Escreve CaO + H₂O → Ca(OH)₂',
      'Conclui que o pH do solo aumenta',
    ],
  ),
  dq(
    'dificil',
    'Estátuas e monumentos de mármore (CaCO₃) se desgastam mais em cidades com poluição. Relacione o fenômeno à chuva ácida, citando os óxidos envolvidos e a função química do ácido formado.',
    'Óxidos de enxofre (SO₂, SO₃) e de nitrogênio (NO₂) lançados pela queima de combustíveis reagem com a água da chuva e formam ácidos (sulfúrico, nítrico). Esses ácidos reagem com o carbonato de cálcio do mármore (um sal), dissolvendo-o e desgastando a superfície. A chuva ácida tem pH menor que o da chuva normal.',
    [
      'Cita óxidos de enxofre e/ou de nitrogênio como origem',
      'Diz que formam ácidos ao reagir com a água',
      'Relaciona o ácido ao ataque ao carbonato de cálcio (mármore)',
      'Conclui que ocorre desgaste do monumento',
    ],
  ),
];

/* ============================================================ SUPER SIMULADO · PROVA PB4 (estilo da Prof.ª Daiane) */

const SUPER: QuestaoG2[] = [
  dq(
    'medio',
    `QUESTÃO 1 · a)

Uma fábrica queima combustível sem filtros e lança no ar dióxido de enxofre (SO₂) e dióxido de carbono (CO₂).

Classifique cada um desses compostos como óxido iônico ou óxido molecular, justificando com os elementos e o tipo de ligação envolvidos.`,
    'SO₂ e CO₂ são óxidos moleculares. Ambos são formados por oxigênio e outro ametal (enxofre e carbono), cujos átomos se ligam por ligações covalentes, isto é, por compartilhamento de pares de elétrons. Óxidos iônicos seriam formados por metal e oxigênio.',
    [
      'Classifica SO₂ e CO₂ como óxidos moleculares',
      'Justifica com os elementos: ametal + oxigênio',
      'Cita a ligação covalente (compartilhamento de elétrons)',
    ],
    'Valor: 1,0 ponto. Responda em parágrafo, com norma padrão.',
  ),
  dq(
    'dificil',
    `QUESTÃO 1 · b)

O dióxido de enxofre (SO₂) lançado no ar reage com o oxigênio e a água da atmosfera e forma ácido sulfúrico.

Explique como isso causa a chuva ácida e escreva as equações químicas das etapas. Em seguida, cite uma consequência da chuva ácida para o meio ambiente.`,
    'O SO₂ é oxidado a SO₃ (2 SO₂ + O₂ → 2 SO₃). O SO₃ reage com a água das nuvens e forma ácido sulfúrico (SO₃ + H₂O → H₂SO₄). O ácido cai com a chuva, que passa a ter pH menor que 5,6 (chuva ácida). Consequências: acidificação de rios e solos, morte de plantas e peixes e corrosão de monumentos e metais.',
    [
      'Escreve 2 SO₂ + O₂ → 2 SO₃',
      'Escreve SO₃ + H₂O → H₂SO₄',
      'Explica que o ácido deixa a chuva com pH baixo',
      'Cita uma consequência ambiental',
    ],
    'Valor: 1,0 ponto. É obrigatório registrar o raciocínio.',
  ),
  dq(
    'medio',
    `QUESTÃO 2 · a)

Muitos antiácidos contêm hidróxido de alumínio, Al(OH)₃, para aliviar a azia causada pelo excesso de ácido clorídrico (HCl) no estômago.

Escreva a equação química balanceada da reação entre Al(OH)₃ e HCl e dê o nome do sal formado.`,
    'Al(OH)₃ + 3 HCl → AlCl₃ + 3 H₂O. O sal formado é o cloreto de alumínio. Trata-se de uma reação de neutralização (ácido + base → sal + água).',
    [
      'Escreve os reagentes e os produtos corretamente',
      'Balanceia a equação (3 HCl e 3 H₂O)',
      'Nomeia o sal como cloreto de alumínio',
    ],
    'Valor: 1,0 ponto. Demonstre o raciocínio do balanceamento.',
  ),
  dq(
    'medio',
    `QUESTÃO 2 · b)

Na equação da questão anterior (Al(OH)₃ + 3 HCl → AlCl₃ + 3 H₂O), identifique a função química de cada substância (ácido, base, sal ou óxido) e explique por que o pH do estômago aumenta depois da reação.`,
    'Al(OH)₃ é uma base (libera OH⁻), HCl é um ácido (libera H⁺), AlCl₃ é um sal e H₂O é um óxido (óxido de hidrogênio, molecular). O pH aumenta porque o HCl, que era o ácido em excesso, é consumido na neutralização, diminuindo a concentração de H⁺.',
    [
      'Classifica Al(OH)₃ como base e HCl como ácido',
      'Classifica AlCl₃ como sal',
      'Explica que o ácido é consumido e a acidez diminui',
    ],
    'Valor: 1,0 ponto.',
  ),
  dq(
    'medio',
    `QUESTÃO 3 · a)

O ácido sulfúrico (H₂SO₄) é o ácido mais produzido pela indústria química.

Escreva a equação de ionização completa do H₂SO₄ em água e indique quantos íons H⁺ são liberados por molécula.`,
    'H₂SO₄ → 2 H⁺ + SO₄²⁻. São liberados dois íons H⁺ por molécula, por isso é um diácido.',
    [
      'Escreve H₂SO₄ → 2 H⁺ + SO₄²⁻',
      'Indica 2 H⁺ por molécula (diácido)',
      'Respeita a conservação das cargas',
    ],
    'Valor: 1,0 ponto.',
  ),
  dq(
    'medio',
    `QUESTÃO 3 · b)

Com base no ácido sulfúrico (H₂SO₄), responda: (i) qual é o nome do ânion formado na ionização total? (ii) o ácido é um hidrácido ou um oxiácido? Justifique. (iii) qual seria o nome do ânion do ácido sulfuroso (H₂SO₃)?`,
    '(i) O ânion SO₄²⁻ é o sulfato (ácido -ico origina ânion -ato). (ii) É um oxiácido, pois tem oxigênio na molécula. (iii) O ânion do H₂SO₃ é o sulfito (ácido -oso origina ânion -ito).',
    [
      'Nomeia SO₄²⁻ como sulfato',
      'Classifica como oxiácido e justifica pela presença de oxigênio',
      'Nomeia o ânion do sulfuroso como sulfito',
    ],
    'Valor: 1,0 ponto.',
  ),
  dq(
    'medio',
    `QUESTÃO 4 · a)

Escreva a fórmula dos compostos a seguir, mostrando como as cargas se anulam: (I) óxido de sódio (Na⁺ e O²⁻); (II) hidróxido de cálcio (Ca²⁺ e OH⁻); (III) fosfato de sódio (Na⁺ e PO₄³⁻).`,
    '(I) Na₂O: 2 Na⁺ (2+) e 1 O²⁻ (2−). (II) Ca(OH)₂: 1 Ca²⁺ (2+) e 2 OH⁻ (2−). (III) Na₃PO₄: 3 Na⁺ (3+) e 1 PO₄³⁻ (3−).',
    [
      'Escreve Na₂O',
      'Escreve Ca(OH)₂, com parênteses',
      'Escreve Na₃PO₄',
      'Mostra a anulação das cargas',
    ],
    'Valor: 1,0 ponto. Registre o raciocínio.',
  ),
  dq(
    'medio',
    `QUESTÃO 4 · b)

Classifique os compostos da questão anterior (Na₂O, Ca(OH)₂ e Na₃PO₄) em ácido, base, sal ou óxido e diga quais deles conduzem corrente elétrica quando dissolvidos em água. Justifique.`,
    'Na₂O é um óxido (iônico, formado por metal e oxigênio), Ca(OH)₂ é uma base (libera OH⁻) e Na₃PO₄ é um sal. Os compostos iônicos que se dissociam em água (a base e o sal) liberam íons livres e conduzem corrente; o óxido de sódio reage com a água e forma NaOH, cujos íons também conduzem.',
    [
      'Classifica Na₂O como óxido, Ca(OH)₂ como base e Na₃PO₄ como sal',
      'Relaciona a condução à presença de íons livres em solução',
      'Justifica a condução pela dissociação iônica',
    ],
    'Valor: 1,0 ponto.',
  ),
  dq(
    'dificil',
    `QUESTÃO 5 · a)

O sal de cozinha (NaCl) pode ser obtido pela reação entre o ácido clorídrico e o hidróxido de sódio.

Escreva a equação da reação e explique, usando as definições de Arrhenius, por que ela é chamada de neutralização.`,
    'HCl + NaOH → NaCl + H₂O. O ácido libera H⁺ e a base libera OH⁻; esses íons se combinam formando água (H⁺ + OH⁻ → H₂O), e sobram os íons Na⁺ e Cl⁻, que formam o sal. O meio perde o caráter ácido e o básico, por isso a reação é de neutralização.',
    [
      'Escreve HCl + NaOH → NaCl + H₂O',
      'Relaciona o H⁺ do ácido e o OH⁻ da base formando água',
      'Explica o termo neutralização (o meio perde acidez e basicidade)',
    ],
    'Valor: 1,0 ponto.',
  ),
  dq(
    'dificil',
    `QUESTÃO 5 · b)

Uma solução aquosa de NaCl conduz corrente elétrica, mas o NaCl sólido não.

Explique essa diferença usando os conceitos de dissociação iônica e de íons livres.`,
    'No NaCl sólido, os íons Na⁺ e Cl⁻ estão presos no retículo cristalino e não se movimentam, então não conduzem. Em água, ocorre dissociação iônica (NaCl → Na⁺ + Cl⁻): os íons se separam e ficam livres para se deslocar, conduzindo a corrente elétrica.',
    [
      'Diz que no sólido os íons estão presos',
      'Explica a dissociação em água e escreve NaCl → Na⁺ + Cl⁻',
      'Associa a condução ao deslocamento de íons livres',
    ],
    'Valor: 1,0 ponto.',
  ),
];

/* ============================================================ pacotes */

const pacote = (
  slug: string,
  title: string,
  subtitle: string,
  description: string,
  minutes: number,
  questoes: QuestaoG2[],
): PacoteG2 => ({
  slug,
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title,
  subtitle,
  description,
  minutes,
  questoes,
});

export const PACOTES_QUIMICA_PB4: PacoteG2[] = [
  pacote(
    'pb4-quimica-s1-acidos',
    'Simulado 1 · Ácidos e nomenclatura (PB4 Química)',
    '14 questões objetivas: ionização, classificação, nomes e aplicações',
    'Módulo 8, parte dos ácidos: definição de Arrhenius, hidrácidos e oxiácidos, nomes dos ácidos e dos ânions e principais usos.',
    40,
    S1,
  ),
  pacote(
    'pb4-quimica-s2-bases-sais',
    'Simulado 2 · Bases e sais (PB4 Química)',
    '14 questões objetivas: dissociação, neutralização e fórmulas dos sais',
    'Módulo 8, bases e sais: hidroxila, classificação, indicadores, neutralização, nomenclatura e fórmula dos sais.',
    40,
    S2,
  ),
  pacote(
    'pb4-quimica-s3-oxidos',
    'Simulado 3 · Óxidos (PB4 Química)',
    '12 questões objetivas: iônicos, moleculares, nomes e aplicações',
    'Módulo 9: classificação dos óxidos em iônicos e moleculares, nomenclatura, chuva ácida e usos no cotidiano.',
    35,
    S3,
  ),
  pacote(
    'pb4-quimica-s4-misto',
    'Simulado 4 · Ácidos, bases e neutralização (PB4 Química)',
    '10 questões: 7 objetivas e 3 dissertativas',
    '70% objetivas e 30% dissertativas, com correção da IA nas respostas escritas.',
    45,
    S4,
  ),
  pacote(
    'pb4-quimica-s5-misto',
    'Simulado 5 · Sais e óxidos (PB4 Química)',
    '14 questões: 10 objetivas e 4 dissertativas',
    '70% objetivas e 30% dissertativas sobre sais, fórmulas, óxidos e chuva ácida.',
    60,
    S5,
  ),
  pacote(
    'pb4-quimica-s6-dissertativo',
    'Simulado 6 · Só dissertativo (PB4 Química)',
    '8 questões dissertativas, no estilo da prova da Prof.ª Daiane',
    'Respostas por escrito, com equações, nomes e justificativas. A IA corrige cada resposta com o gabarito.',
    70,
    S6,
  ),
  pacote(
    'pb4-quimica-super',
    'Super simulado · Prova PB4 de Química',
    'Simulação da prova: 5 questões com itens a) e b), valendo 1,0 ponto cada',
    'Feito no estilo das provas do 2º e do 3º bimestres da professora: textos do cotidiano, itens dissertativos, cálculo e raciocínio registrados. Cada item é corrigido pela IA, com nota de 0 a 1.',
    90,
    SUPER,
  ),
];
