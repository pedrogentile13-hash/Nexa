import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA8 · Química (módulos 7 a 9 do Setor C: ligações químicas, ácidos/bases/sais e óxidos) e
 * Biologia (Setor A: hereditariedade, genes e biotecnologia, doenças genéticas, evolução;
 * mais Sustentabilidade e Unidades de Conservação).
 */

/* ============================================================ QUÍMICA */

export const QUIMICA_BASE: QuestaoG2[] = [
  o(
    'facil',
    'A ligação entre um átomo de sódio (metal) e um de cloro (ametal), formando o sal de cozinha (NaCl), é',
    'iônica, com transferência de elétrons do sódio para o cloro.',
    [
      'covalente, com elétrons compartilhados de modo igual.',
      'metálica, com um mar de elétrons entre os dois átomos.',
      'iônica, com transferência de prótons do sódio para o cloro.',
      'covalente, com transferência de nêutrons entre os átomos.',
    ],
    'Metal + ametal: o metal cede elétron(s) e vira cátion (Na⁺); o ametal recebe e vira ânion (Cl⁻). A atração entre os íons é a ligação iônica.',
  ),
  o(
    'facil',
    'Na molécula de água (H₂O), os átomos se mantêm unidos por',
    'ligações covalentes, em que há compartilhamento de elétrons.',
    [
      'ligações iônicas, com perda total de elétrons de cada átomo.',
      'ligações metálicas, com um mar de elétrons livres e cátions.',
      'forças nucleares que unem os prótons e os nêutrons do núcleo.',
      'ligações de hidrogênio entre os átomos de oxigênio da água.',
    ],
    'Entre ametais (H e O) os átomos compartilham pares de elétrons: ligação covalente.',
  ),
  o(
    'medio',
    'Os metais conduzem bem a corrente elétrica. Essa propriedade pode ser explicada pela ligação metálica, na qual',
    'os elétrons de valência ficam livres, formando um "mar de elétrons".',
    [
      'os átomos compartilham pares fixos de elétrons entre dois a dois.',
      'os átomos perdem todos os elétrons de valência e viram gás.',
      'os átomos trocam prótons e nêutrons livremente uns com os outros.',
      'os elétrons de valência ficam presos a cada átomo e não circulam.',
    ],
    'Elétrons livres se deslocam sob uma diferença de potencial, daí a condutividade, e também explicam o brilho e a maleabilidade.',
  ),
  o(
    'facil',
    'Qual das fórmulas abaixo representa um ácido?',
    'HCl',
    ['NaOH', 'NaCl', 'CaO', 'KOH'],
    'Ácidos liberam H⁺ em água. HCl é o ácido clorídrico; NaOH e KOH são bases, NaCl é sal e CaO é óxido.',
  ),
  o(
    'facil',
    'O hidróxido de sódio (NaOH, soda cáustica) é uma base porque, em água, libera',
    'íons OH⁻ (hidróxido).',
    ['íons H⁺ (hidrônio).', 'moléculas de oxigênio.', 'íons Cl⁻ (cloreto).', 'apenas elétrons.'],
    'As bases (Arrhenius) liberam o ânion OH⁻ em solução aquosa e deixam a fenolftaleína rosa.',
  ),
  o(
    'medio',
    'Misturando-se ácido clorídrico (HCl) e hidróxido de sódio (NaOH), ocorre uma reação de neutralização. Os produtos são',
    'cloreto de sódio (NaCl) e água (H₂O).',
    [
      'hidrogênio e cloro, ambos gasosos.',
      'óxido de sódio e ácido nítrico dissolvido.',
      'apenas água, sem formar nenhum sal.',
      'sódio metálico e gás carbônico livres.',
    ],
    'Ácido + base → sal + água. HCl + NaOH → NaCl + H₂O.',
  ),
  o(
    'facil',
    'Óxidos são compostos binários que têm o oxigênio como elemento mais eletronegativo. Qual das substâncias é um óxido?',
    'CO₂',
    ['NaCl', 'HCl', 'NaOH', 'H₂SO₄'],
    'CO₂ (dióxido de carbono) tem só dois elementos, e um deles é o oxigênio. Os demais são sal, ácido, base e ácido.',
  ),
  o(
    'medio',
    'A chamada "chuva ácida" é causada principalmente pelo lançamento na atmosfera de',
    'óxidos de enxofre e de nitrogênio, que reagem com a água e formam ácidos.',
    [
      'óxidos de cálcio e de sódio, que reagem com a água e formam bases.',
      'gás oxigênio puro, que se dissolve na água e forma um ácido forte.',
      'sal de cozinha dissolvido no ar, que reage com a água e forma ácidos.',
      'gás hélio liberado por balões de festa e que reage com a água da chuva.',
    ],
    'SO₂ e NO₂ (de combustíveis fósseis) reagem com a água e viram ácido sulfúrico e ácido nítrico, que acidificam a chuva.',
  ),
  o(
    'medio',
    'O átomo de sódio (Na) tem 1 elétron na camada de valência. Para ficar estável, ele tende a',
    'perder 1 elétron e formar o íon Na⁺.',
    [
      'ganhar 7 elétrons e formar Na⁷⁻.',
      'perder 1 próton do núcleo e formar Na⁺.',
      'ganhar 1 elétron e formar o íon Na⁻.',
      'perder 7 elétrons e formar Na⁷⁺.',
    ],
    'Perdendo o único elétron da última camada, o sódio fica com a camada anterior completa (regra do octeto): Na⁺.',
  ),
  o(
    'medio',
    'A cal virgem (CaO) é um óxido básico. Ao reagir com a água, ela forma',
    'hidróxido de cálcio, Ca(OH)₂, uma base.',
    [
      'ácido clorídrico, HCl, e gás oxigênio.',
      'gás carbônico, CO₂, e vapor de água.',
      'cloreto de cálcio, CaCl₂, e gás hidrogênio.',
      'água oxigenada, H₂O₂, e cálcio metálico.',
    ],
    'Óxido básico + água → base: CaO + H₂O → Ca(OH)₂ (cal apagada, usada em construção).',
  ),
];

export const QUIMICA_PROVA: QuestaoG2[] = [
  o(
    'medio',
    `Um sólido branco tem alto ponto de fusão, é duro e quebradiço. No estado sólido, não conduz corrente elétrica, mas conduz quando fundido ou dissolvido em água.

Essas propriedades são típicas de um composto`,
    'iônico, pois os íons só ficam livres para conduzir quando fundido ou dissolvido.',
    [
      'metálico, pois os elétrons livres conduzem corrente também no estado sólido.',
      'covalente molecular, pois as moléculas têm cargas livres que se movem na água.',
      'iônico, pois seus átomos compartilham elétrons e formam moléculas isoladas.',
      'formado por átomos de gases nobres, que se ligam por ligações iônicas fortes.',
    ],
    'No retículo iônico sólido os íons estão fixos. Fundido ou em solução, eles se movem e conduzem corrente.',
  ),
  o(
    'medio',
    'Uma substância tem baixo ponto de fusão, é formada por ametais e não conduz corrente elétrica em nenhum estado físico. Ela é, provavelmente,',
    'covalente molecular.',
    ['iônica, com íons.', 'metálica, com cátions.', 'um metal puro.', 'uma liga metálica.'],
    'Substâncias moleculares têm atração fraca entre as moléculas (baixos PF e PE) e não possuem íons nem elétrons livres.',
  ),
  o(
    'medio',
    'O latão é uma liga formada por cobre e zinco, mais resistente que o cobre puro e ainda maleável. Essas características se explicam porque',
    'os átomos se unem por ligação metálica, e as camadas podem deslizar sem romper a ligação.',
    [
      'os átomos do latão formam moléculas isoladas, unidas por ligações covalentes fixas.',
      'o latão é um composto iônico quebradiço, e suas camadas se rompem ao deslizarem.',
      'a ligação metálica é covalente, com pares fixos de elétrons presos entre os átomos.',
      'a liga não tem elétrons livres, e por isso as camadas de átomos ficam sempre travadas.',
    ],
    'Na ligação metálica, o "mar de elétrons" mantém o conjunto coeso mesmo quando os planos de átomos deslizam: maleabilidade e ductilidade.',
  ),
  o(
    'dificil',
    `Leia o texto.

A água da chuva é naturalmente um pouco ácida (pH em torno de 5,6), pois dissolve o gás carbônico do ar e forma ácido carbônico. Considera-se chuva ácida quando o pH fica abaixo desse valor, geralmente por causa de óxidos de enxofre e de nitrogênio.

Com base no texto, é correto afirmar que`,
    'a chuva "normal" já é levemente ácida, e a chuva ácida tem pH menor que 5,6.',
    [
      'a chuva "normal" é neutra, com pH igual a 7, e a chuva ácida tem pH menor.',
      'a chuva "normal" já é levemente ácida, e a chuva ácida tem pH maior que 5,6.',
      'o CO₂ é o único responsável pela chuva ácida, sem participação de outros gases.',
      'a chuva ácida só ocorre em regiões sem indústrias e sem veículos de combustão.',
    ],
    'O CO₂ dá acidez natural (pH ≈ 5,6). SO₂ e NO₂ baixam o pH ainda mais e caracterizam a chuva ácida.',
  ),
  o(
    'medio',
    'Os antiácidos estomacais têm, em sua composição, bases fracas, como o hidróxido de magnésio [Mg(OH)₂]. Eles aliviam a azia porque',
    'neutralizam o excesso de ácido clorídrico do estômago, formando sal e água.',
    [
      'aumentam a produção de ácido no estômago, o que alivia a queimação da azia.',
      'transformam todo o ácido do estômago em gás oxigênio, que sai pela boca.',
      'são ácidos mais fortes que o clorídrico e por isso o anulam rapidamente.',
      'destroem o ácido do estômago, sem formar nenhum produto nem consumir a base.',
    ],
    'Base + ácido → sal + água. Aqui: Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O, com aumento do pH do suco gástrico.',
  ),
  o(
    'medio',
    'O suco de limão tem pH próximo de 2, a água pura tem pH 7 e o leite de magnésia tem pH próximo de 10. Podemos classificá-los, respectivamente, como',
    'ácido, neutro e básico.',
    [
      'básico, neutro e ácido.',
      'ácido, ácido e básico.',
      'neutro, básico e ácido.',
      'básico, básico e neutro.',
    ],
    'pH menor que 7: ácido; igual a 7: neutro; maior que 7: básico.',
  ),
  o(
    'medio',
    'O sal NaNO₃ é formado pela reação entre o hidróxido de sódio e o ácido nítrico. Seu nome é',
    'nitrato de sódio.',
    ['nitrito de sódio.', 'cloreto de sódio.', 'sulfato de sódio.', 'nitreto de sódio.'],
    'Ácidos com terminação -ico formam sais com terminação -ato. HNO₃ (nítrico) → nitrato.',
  ),
  o(
    'dificil',
    'O monóxido de carbono (CO) é um óxido que não reage com água, ácidos nem bases. Por isso, ele é classificado como óxido',
    'neutro.',
    ['ácido.', 'básico.', 'anfótero.', 'peróxido.'],
    'Óxidos neutros (CO, NO, N₂O) não reagem com água, ácidos ou bases. Mesmo assim, o CO é tóxico: impede o transporte de O₂ pelo sangue.',
  ),
  o(
    'dificil',
    'A reação entre o hidróxido de sódio e o ácido sulfúrico pode ser representada por 2 NaOH + H₂SO₄ → X + 2 H₂O. A substância X é',
    'o sulfato de sódio, Na₂SO₄.',
    [
      'o sulfeto de sódio, Na₂S.',
      'o cloreto de sódio, NaCl.',
      'o óxido de sódio, Na₂O.',
      'o sulfito de sódio, Na₂SO₃.',
    ],
    'Cátion Na⁺ + ânion SO₄²⁻ = Na₂SO₄, o sal da neutralização total. Os átomos se conservam: 2 Na, 1 S, 4 O + 2 O, 4 H.',
  ),
  o(
    'medio',
    'Nos refrigerantes, o gás carbônico (um óxido ácido) dissolvido na água forma o ácido carbônico, o que explica',
    'o leve caráter ácido dessas bebidas e o pH menor que 7.',
    [
      'o caráter básico do refrigerante, com pH maior que 7.',
      'a ausência total de ácidos na bebida, que tem pH 7.',
      'a neutralidade do refrigerante, com pH igual a 7.',
      'a produção de hidróxido de sódio ao dissolver o gás.',
    ],
    'Óxido ácido + água → ácido: CO₂ + H₂O ⇌ H₂CO₃. Ele é um ácido fraco, mas o suficiente para baixar o pH.',
  ),
];

/* ============================================================ BIOLOGIA */

export const BIOLOGIA_BASE: QuestaoG2[] = [
  o(
    'facil',
    'Em genética, o conjunto de genes de um indivíduo (por exemplo, Aa) é chamado de',
    'genótipo.',
    ['fenótipo.', 'cariótipo.', 'cromatina.', 'ecossistema.'],
    'Genótipo é a constituição genética (os alelos). Fenótipo é a característica que se manifesta (cor, forma...), resultado do genótipo e do ambiente.',
  ),
  o(
    'medio',
    'Do cruzamento entre dois indivíduos heterozigotos (Aa × Aa), qual é a probabilidade de nascer um descendente aa?',
    '1/4 (25%)',
    ['1/2 (50%)', '3/4 (75%)', '0%', '100%'],
    'Aa × Aa gera 1 AA : 2 Aa : 1 aa. O genótipo aa aparece em 1 de 4 casos.',
  ),
  o(
    'medio',
    'No cruzamento Aa × aa, os descendentes terão proporção de',
    '50% Aa e 50% aa.',
    ['100% Aa, nenhum aa.', '25% AA e 75% aa.', '100% aa, nenhum Aa.', '75% Aa e 25% aa.'],
    'O heterozigoto produz gametas A e a; o homozigoto recessivo só produz a. Resultam metade Aa e metade aa.',
  ),
  o(
    'facil',
    'Na molécula de DNA, as bases nitrogenadas se pareiam sempre da seguinte forma:',
    'adenina com timina e citosina com guanina.',
    [
      'adenina com citosina e timina com guanina.',
      'adenina com guanina e citosina com timina.',
      'adenina com adenina e citosina com citosina.',
      'adenina com uracila e citosina com timina.',
    ],
    'A=T e C≡G. No RNA, a timina é trocada por uracila.',
  ),
  o(
    'medio',
    'A insulina humana pode ser produzida em grande escala por bactérias que receberam o gene humano da insulina. Esses organismos são chamados de',
    'transgênicos (geneticamente modificados).',
    [
      'clones (cópias geneticamente idênticas).',
      'mutantes naturais (sem intervenção humana).',
      'híbridos naturais (cruzamento entre espécies).',
      'parasitas (organismos que vivem em outros).',
    ],
    'Transgênico é o organismo que recebeu, por engenharia genética, um gene de outra espécie. A insulina recombinante substituiu a extraída de animais.',
  ),
  o(
    'dificil',
    'Dois pais com pele de pigmentação normal têm um filho albino. Sabendo que o albinismo é uma condição recessiva, os genótipos dos pais são',
    'ambos heterozigotos (Aa).',
    [
      'ambos homozigotos (AA).',
      'ambos homozigotos (aa).',
      'um homozigoto AA e um Aa.',
      'um homozigoto aa e um AA.',
    ],
    'O filho aa recebeu um alelo a de cada genitor. Como os pais são normais, só podem ser Aa.',
  ),
  o(
    'facil',
    'O aconselhamento genético é um serviço de saúde que',
    'orienta famílias sobre o risco de transmitir doenças genéticas e as opções disponíveis.',
    [
      'cura todas as doenças genéticas das famílias com remédios e cirurgias simples.',
      'escolhe previamente as características físicas e de personalidade que um bebê terá.',
      'impede legalmente que casais com risco de doenças genéticas tenham filhos juntos.',
      'só atende animais e plantas, orientando criadores e agricultores sobre cruzamentos.',
    ],
    'O aconselhamento informa, com base na história familiar e em exames, riscos e possibilidades. A decisão é sempre da família.',
  ),
  o(
    'medio',
    'Segundo a teoria da seleção natural, de Charles Darwin, a evolução das espécies ocorre porque',
    'indivíduos com características vantajosas tendem a sobreviver e deixar mais descendentes.',
    [
      'os organismos se esforçam para mudar e passam essa mudança aos filhos pelos genes.',
      'todos os indivíduos de uma espécie são idênticos, por isso todos sobrevivem do mesmo jeito.',
      'o ambiente cria, de forma direta, os indivíduos de que a espécie precisa em cada época.',
      'as espécies nunca se modificam, pois cada uma foi criada pronta e permanece igual.',
    ],
    'Há variação entre indivíduos; os mais adaptados ao ambiente sobrevivem e se reproduzem mais, e suas características se tornam mais frequentes.',
  ),
  o(
    'facil',
    'O desenvolvimento sustentável busca equilibrar',
    'as dimensões ambiental, social e econômica, sem comprometer as futuras gerações.',
    [
      'apenas o lucro das empresas no curto prazo, sem olhar o meio ambiente.',
      'o consumo máximo dos recursos naturais, para atender só à geração atual.',
      'a proteção total da natureza, sem considerar as pessoas nem a economia.',
      'o abandono de toda atividade econômica para que a natureza se recupere sozinha.',
    ],
    'Sustentabilidade é o tripé ambiental, social e econômico, com uso responsável dos recursos para que continuem existindo no futuro.',
  ),
  o(
    'medio',
    'Os parques nacionais e as estações ecológicas são Unidades de Conservação de proteção integral. Isso significa que',
    'o objetivo é preservar a natureza, só com uso indireto (pesquisa, educação, turismo).',
    [
      'a exploração madeireira é livre, desde que se plante uma árvore a cada corte feito.',
      'há moradias, fazendas e indústrias em seu interior, com atividade econômica livre.',
      'a caça esportiva é permitida durante todo o ano, para controlar as populações.',
      'são áreas cercadas e fechadas, sem qualquer tipo de visitação ou de pesquisa.',
    ],
    'Proteção integral admite apenas o uso indireto. Já nas de uso sustentável (como Reservas Extrativistas), há uso direto e controlado.',
  ),
];

export const BIOLOGIA_PROVA: QuestaoG2[] = [
  o(
    'medio',
    'Um casal de pigmentação normal teve uma filha albina (condição recessiva). Qual é a probabilidade de o próximo filho ser menino e albino?',
    '1/8',
    ['1/4', '1/2', '1/16', '3/8'],
    'Ambos são Aa: P(albino) = 1/4. P(menino) = 1/2. Eventos independentes: 1/4 · 1/2 = 1/8.',
  ),
  o(
    'medio',
    `Leia o texto.

Em 1996 nasceu a ovelha Dolly, o primeiro mamífero clonado a partir de uma célula de um animal adulto. Os cientistas retiraram o núcleo de uma célula da glândula mamária de uma ovelha e o colocaram em um óvulo cujo núcleo havia sido removido.

Dolly era geneticamente igual`,
    'à ovelha doadora do núcleo da célula mamária.',
    [
      'à ovelha que forneceu o óvulo sem núcleo.',
      'à ovelha que a gestou, sem participar da clonagem.',
      'a todas as ovelhas do rebanho de origem.',
      'a um carneiro que fertilizou o óvulo da doadora.',
    ],
    'O material genético de Dolly veio do núcleo da célula doadora, então ela era um clone dela. O óvulo só forneceu o citoplasma.',
  ),
  o(
    'medio',
    'Os testes de DNA para investigação de paternidade são possíveis porque',
    'metade do DNA do filho vem da mãe e a outra metade do pai, e certos trechos são muito variáveis.',
    [
      'o filho herda todo o DNA do pai, e a mãe não passa nenhum material genético ao embrião.',
      'o DNA muda totalmente a cada geração, por isso os trechos variáveis nunca se repetem.',
      'todas as pessoas têm exatamente o mesmo DNA, por isso o exame compara as impressões.',
      'o filho herda todo o DNA da mãe, e o pai não passa nenhum material genético ao embrião.',
    ],
    'A comparação de marcadores do DNA do filho com os dos possíveis pais mostra de quem vieram os trechos não maternos.',
  ),
  o(
    'medio',
    `Leia o texto.

A síndrome de Down é causada pela presença de três cópias do cromossomo 21, em vez de duas. A ocorrência aumenta com a idade da mãe, mas pode acontecer em qualquer gestação.

A partir do texto, a síndrome de Down é`,
    'uma alteração cromossômica (número de cromossomos), e não de um único gene recessivo herdado.',
    [
      'uma doença contagiosa, transmitida pelo contato entre as pessoas e pelo espirro de quem tem a síndrome.',
      'uma doença causada por bactérias que invadem as células durante a gestação da mãe.',
      'uma doença que só ocorre em filhos de mães muito jovens, com menos de vinte anos de idade.',
      'uma alteração de um único gene recessivo, herdada sempre dos pais portadores sadios.',
    ],
    'A trissomia do 21 é uma alteração cromossômica numérica, em geral por não disjunção na formação do gameta.',
  ),
  o(
    'dificil',
    `Leia o texto.

A anemia falciforme é uma doença hereditária causada por uma alteração na hemoglobina. Pessoas heterozigotas (portadoras) normalmente não têm a doença e, em regiões com malária, apresentam maior resistência a essa infecção.

O texto permite concluir que, em regiões com malária, o alelo da anemia falciforme`,
    'pode se manter na população porque o heterozigoto tem uma vantagem seletiva.',
    [
      'desaparece rapidamente da população, pois só traz prejuízos a quem o possui.',
      'surge porque a malária muda o DNA das pessoas infectadas pelo mosquito.',
      'é transmitido pelo mosquito da malária de uma pessoa doente para outra.',
      'só existe em pessoas que já tiveram malária e conseguiram sobreviver a ela.',
    ],
    'A seleção natural favorece o heterozigoto onde há malária, e isso mantém o alelo na população, mesmo com o custo para quem é homozigoto.',
  ),
  o(
    'medio',
    'Para Lamarck, o pescoço das girafas ficou longo porque elas o esticavam para alcançar folhas altas, e passavam essa característica aos filhos. Para Darwin, isso ocorreu porque',
    'havia variação no pescoço, e as de pescoço longo sobreviveram e se reproduziram mais.',
    [
      'todas as girafas já nasciam com pescoço longo e não havia variação entre elas.',
      'o esforço de esticar o pescoço mudava o DNA delas e era passado aos filhotes.',
      'a girafa decide, conforme a necessidade do ambiente, se terá filhos de pescoço longo.',
      'o ambiente não influenciava a sobrevivência das girafas de pescoço curto ou longo.',
    ],
    'Darwin explica a mudança por variação e seleção. Lamarck falava em uso e desuso e herança de características adquiridas, ideia que não se confirmou.',
  ),
  o(
    'medio',
    'O uso inadequado de antibióticos favorece o surgimento de bactérias resistentes. Em termos evolutivos, isso acontece porque',
    'o antibiótico elimina as sensíveis, e as resistentes, que já existiam, sobrevivem e se multiplicam.',
    [
      'a bactéria decide se tornar resistente ao remédio quando entra em contato direto com ele.',
      'o antibiótico "ensina" as bactérias a resistir e elas passam isso à sua descendência direta.',
      'todas as bactérias são sempre resistentes desde a sua origem, e o remédio nunca faz efeito.',
      'o remédio cria novos genes de resistência em todas as bactérias que entram em contato com ele.',
    ],
    'É seleção natural: a variação (por mutação) já existia, e o antibiótico selecionou as resistentes.',
  ),
  o(
    'medio',
    'As Reservas Extrativistas são Unidades de Conservação de uso sustentável. Elas permitem',
    'que comunidades tradicionais, como seringueiros, usem os recursos de modo sustentável.',
    [
      'a exploração madeireira em larga escala por empresas privadas de outros estados.',
      'a remoção das comunidades que vivem ali, que passam a morar em cidades vizinhas.',
      'a mineração em qualquer área da reserva, sem plano de manejo nem licença ambiental.',
      'apenas a pesquisa científica e o turismo, sem moradores nem atividade extrativista.',
    ],
    'O objetivo é conciliar conservação e uso dos recursos pelas populações que dependem deles, com plano de manejo.',
  ),
  o(
    'medio',
    'O relatório Brundtland (1987) define desenvolvimento sustentável como aquele que',
    'atende às necessidades do presente sem comprometer as das gerações futuras.',
    [
      'prioriza só o crescimento econômico atual, sem se preocupar com o futuro.',
      'proíbe qualquer uso de recursos naturais, mesmo o que for controlado.',
      'atende apenas às necessidades dos países ricos e das gerações que já existem.',
      'pretende manter a natureza intocada para sempre, sem nenhuma atividade humana.',
    ],
    'A definição inclui justiça entre gerações. Sustentabilidade não é "não usar" os recursos, mas usá-los de forma que continuem disponíveis.',
  ),
  o(
    'medio',
    'As mutações são importantes para a evolução porque',
    'geram novas variantes genéticas, sobre as quais a seleção natural pode atuar.',
    [
      'sempre trazem vantagens para quem as recebe e são todas passadas aos descendentes.',
      'ocorrem só quando o organismo precisa de uma mudança para sobreviver no ambiente.',
      'são sempre prejudiciais e eliminadas pela seleção natural na mesma hora.',
      'impedem qualquer mudança nas populações, pois mantêm todos os indivíduos iguais.',
    ],
    'Mutações ocorrem ao acaso e podem ser neutras, prejudiciais ou vantajosas. A seleção natural atua sobre a variação que existe.',
  ),
];
