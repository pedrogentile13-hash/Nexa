import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA7 · História (9º ano, módulos 13 a 16): anos de chumbo, cultura nos anos 1960 e 1970, redemocratização e
 * história recente do Brasil. Os textos-base são elaborados para os simulados; os trechos entre aspas de atos
 * oficiais (AI-5, Constituição de 1988) são os do próprio documento.
 */

/* ------------------------------------------------------------ SIMULADO BASE (10) */

export const HISTORIA_BASE: QuestaoG2[] = [
  o(
    'facil',
    `Leia o trecho do Ato Institucional nº 5, de 13 de dezembro de 1968.

"Fica suspensa a garantia de habeas corpus, nos casos de crimes políticos, contra a segurança nacional, a ordem econômica e social e a economia popular."

A medida citada no trecho`,
    'ampliou o poder do governo, pois impedia que presos políticos recorressem à Justiça contra a prisão.',
    [
      'ampliou as liberdades individuais, pois garantia o direito de defesa a todos os cidadãos.',
      'limitou o poder do governo, pois exigia ordem judicial para qualquer prisão política.',
      'restabeleceu a democracia, pois devolveu ao Congresso o poder de legislar.',
      'enfraqueceu a repressão, pois acabou com a censura prévia aos meios de comunicação.',
    ],
    'O habeas corpus protege a liberdade de quem foi preso ilegalmente. Suspendê-lo, nos casos de crimes políticos, deixou os opositores sem esse recurso: o AI-5 fortaleceu a repressão e o poder do Executivo.',
  ),
  o(
    'medio',
    `Leia o texto.

Entre 1968 e 1973, a economia brasileira cresceu a taxas muito altas, em torno de 10% ao ano. O governo investiu em estradas, hidrelétricas e grandes obras, e tomou dinheiro emprestado no exterior. Ao mesmo tempo, os salários dos trabalhadores ficaram achatados. Uma frase atribuída ao ministro da Fazenda da época dizia que era preciso "esperar o bolo crescer para depois dividi-lo".

Sobre o chamado "milagre econômico", é correto afirmar que`,
    'houve forte crescimento, acompanhado de concentração de renda e aumento da dívida externa.',
    [
      'houve crescimento, acompanhado de redução da desigualdade e do endividamento do país.',
      'a economia estagnou, mas os salários cresceram acima da inflação.',
      'o crescimento beneficiou igualmente todas as classes, por causa das obras públicas.',
      'o governo cortou investimentos e evitou recorrer a empréstimos internacionais.',
    ],
    'O "milagre" (1968-1973) combinou crescimento acelerado com arrocho salarial, concentração de renda e endividamento externo. A "divisão do bolo" nunca chegou de fato aos mais pobres.',
  ),
  o(
    'medio',
    `Leia o texto.

Em setembro de 1969, militantes de grupos de esquerda sequestraram o embaixador dos Estados Unidos no Brasil e exigiram a libertação de presos políticos. Anos depois, entre 1972 e 1974, o Exército cercou e destruiu um foco de guerrilha rural no Araguaia, região do Pará e do Tocantins.

Esses dois episódios mostram que, nos anos de chumbo,`,
    'parte da oposição aderiu à luta armada e foi combatida com forte repressão militar.',
    [
      'toda a oposição ao regime optou pela luta armada e conquistou apoio da maioria da população.',
      'o governo negociou com os grupos armados e evitou o uso de força militar.',
      'a oposição se limitou a ações pacíficas e legais, sem enfrentamentos.',
      'os grupos de esquerda foram aceitos como partidos políticos legais pelo governo.',
    ],
    'Depois do AI-5, grupos como ALN, MR-8 e VPR optaram pela luta armada (sequestros, guerrilha). O regime respondeu com intensa repressão, tortura e eliminação de militantes, como no Araguaia.',
  ),
  o(
    'medio',
    `Leia o texto.

Em 1967, na televisão, Caetano Veloso e Gilberto Gil apresentaram canções com guitarras elétricas, mistura de ritmos brasileiros e referências internacionais. No ano seguinte, surgiu o disco-manifesto "Tropicália ou Panis et Circencis", com Os Mutantes, Gal Costa e Tom Zé. A crítica conservadora acusou o grupo de "estrangeirismo". Em 1969, Caetano e Gil foram presos e depois exilados em Londres.

O movimento da Tropicália se caracterizou por`,
    'misturar elementos tradicionais da cultura brasileira com influências estrangeiras e inovar na linguagem, o que incomodou o regime.',
    [
      'rejeitar qualquer influência estrangeira e defender a "pureza" da música brasileira.',
      'apoiar publicamente o governo militar e divulgar seus slogans nas canções.',
      'limitar-se à música clássica, sem relação com a cultura popular.',
      'abandonar a crítica social para se dedicar apenas ao entretenimento.',
    ],
    'A Tropicália (1967-1969) fez uma "antropofagia" cultural: misturou o popular, o regional e o moderno/estrangeiro. Teve forte caráter crítico e experimental, e seus principais nomes sofreram com a censura e o exílio.',
  ),
  o(
    'medio',
    `Leia o texto.

Depois do AI-5, a censura prévia passou a examinar músicas, peças de teatro, filmes e jornais. Muitos compositores passaram a escrever letras com metáforas e duplo sentido, para que o público entendesse a crítica, mas os censores não conseguissem proibir.

Essa estratégia mostra que a produção cultural, no período,`,
    'tentou driblar a censura por meio de uma linguagem simbólica, mantendo a crítica ao regime.',
    [
      'deixou de abordar política, pois a censura eliminou qualquer possibilidade de crítica.',
      'foi totalmente livre, já que a censura se aplicava só aos jornais.',
      'passou a ser financiada pelo governo para divulgar suas ideias.',
      'abandonou a música popular em favor de produções importadas.',
    ],
    'A censura não impediu a crítica: artistas usaram metáforas, ironia e duplo sentido. Muitos, porém, foram proibidos, presos ou exilados.',
  ),
  o(
    'medio',
    `Leia o texto.

Em 1970, a seleção brasileira conquistou o tricampeonato mundial de futebol, no México. O governo do general Médici aproveitou o clima de festa: cartazes e propagandas diziam "Brasil: ame-o ou deixe-o", enquanto a TV, o rádio e os jornais, sob censura, divulgavam uma imagem de país moderno e feliz.

A associação entre a conquista da Copa e a propaganda oficial mostra que o governo`,
    'usou o esporte e os meios de comunicação para estimular o nacionalismo e legitimar o regime.',
    [
      'desprezou o futebol, por considerá-lo uma atividade política perigosa.',
      'permitiu que a imprensa divulgasse livremente as denúncias de tortura.',
      'proibiu a comemoração pública da vitória para evitar aglomerações.',
      'financiou campanhas contra o nacionalismo, em nome da integração internacional.',
    ],
    'O regime explorou a Copa de 1970 para fortalecer o orgulho nacional e associar a si o clima de otimismo, enquanto a repressão e a censura ocultavam o outro lado dos "anos de chumbo".',
  ),
  o(
    'medio',
    `Leia o texto.

A Lei da Anistia, de 28 de agosto de 1979, permitiu o retorno ao Brasil de milhares de exilados e a libertação de presos políticos. Ao mesmo tempo, foi interpretada por muitos como uma anistia também aos agentes do Estado acusados de tortura, o que gerou, e ainda gera, debates sobre memória, verdade e justiça.

A Lei da Anistia de 1979 é um marco do processo de`,
    'abertura política, pois possibilitou a volta de exilados, embora tenha deixado questões sobre a responsabilização dos agentes da repressão.',
    [
      'endurecimento do regime, pois ampliou os poderes dos órgãos de repressão.',
      'redemocratização completa, pois puniu todos os responsáveis pelas violações.',
      'retomada do bipartidarismo, pois criou apenas dois partidos legais.',
      'rompimento com a Constituição, pois decretou a dissolução do Congresso.',
    ],
    'A Anistia (governo Figueiredo) integra a "abertura lenta, gradual e segura": permitiu o retorno dos exilados, mas deixou impunes os agentes da repressão, tema que segue em debate.',
  ),
  o(
    'medio',
    `Leia o texto.

Entre 1983 e 1984, milhões de pessoas foram às ruas, em comícios em várias cidades, pedindo eleições diretas para presidente da República. A emenda que restabelecia o voto direto (Dante de Oliveira) foi votada em abril de 1984 e não alcançou os votos necessários na Câmara. Em janeiro de 1985, o Colégio Eleitoral elegeu Tancredo Neves.

A campanha das "Diretas Já"`,
    'foi uma ampla mobilização popular pelo voto direto; embora a emenda tenha sido rejeitada, a pressão enfraqueceu o regime e levou à eleição de um civil.',
    [
      'foi apoiada pela maioria dos militares e teve sua emenda aprovada, o que garantiu a eleição direta em 1985.',
      'teve pouca adesão popular e foi esquecida logo depois da votação no Congresso.',
      'resultou na eleição de um general pelo voto direto, em 1985.',
      'foi proibida e desarticulada antes de realizar qualquer comício.',
    ],
    'As Diretas Já foram o maior movimento popular do período. A emenda Dante de Oliveira foi derrotada, mas o fim do ciclo militar veio com a vitória de Tancredo no Colégio Eleitoral (que não chegou a tomar posse; assumiu José Sarney).',
  ),
  o(
    'medio',
    `Leia o texto da Constituição de 1988.

"Art. 1º [...] Parágrafo único. Todo o poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Constituição."

Esse trecho expressa o princípio de`,
    'soberania popular, base do Estado democrático de direito.',
    [
      'poder absoluto do chefe de governo, que decide sem consultar a população.',
      'governo militar tutelar, em que as Forças Armadas escolhem os governantes.',
      'monarquia constitucional, em que o poder é hereditário.',
      'poder exclusivo do Judiciário, sem participação dos cidadãos.',
    ],
    'A Constituição de 1988 ("Constituição Cidadã") afirma que o poder pertence ao povo, que o exerce pelo voto e por mecanismos diretos (plebiscito, referendo, iniciativa popular).',
  ),
  o(
    'medio',
    `Leia o texto.

Em 1994, o governo lançou o Plano Real, que substituiu a moeda e controlou a inflação, que passava de 40% ao mês no início daquele ano. A estabilidade aumentou o poder de compra dos mais pobres e ajudou a eleger o então ministro da Fazenda, Fernando Henrique Cardoso. Nas décadas seguintes, o país ampliou programas de transferência de renda e aumentou o acesso à educação, mas manteve altos níveis de desigualdade social.

O texto permite concluir que, na história recente do Brasil,`,
    'houve mudanças importantes, como a estabilização econômica e a ampliação de políticas sociais, ao lado de permanências, como a desigualdade.',
    [
      'não houve nenhuma mudança, pois o país manteve as mesmas condições dos anos 1980.',
      'a desigualdade social foi totalmente eliminada com a estabilização da moeda.',
      'a inflação aumentou depois de 1994, o que levou ao fim dos programas sociais.',
      'o país voltou ao regime militar para garantir a estabilidade econômica.',
    ],
    'A história recente é de "mudanças e permanências": a inflação foi controlada e houve ampliação de direitos e políticas sociais, mas a desigualdade e outros problemas estruturais persistem.',
  ),
];

/* ------------------------------------------------------ SIMULADO NÍVEL PROVA (10) */

export const HISTORIA_PROVA: QuestaoG2[] = [
  o(
    'medio',
    `Leia os textos.

TEXTO I
"Art. 4º. No interesse de preservar a Revolução, o Presidente da República, ouvido o Conselho de Segurança Nacional, e sem as limitações previstas na Constituição, poderá suspender os direitos políticos de quaisquer cidadãos pelo prazo de 10 anos e cassar mandatos eletivos federais, estaduais e municipais."
(Ato Institucional nº 5, 13 dez. 1968.)

TEXTO II
Depois do AI-5, parlamentares foram cassados, professores foram aposentados compulsoriamente e jornais passaram a ter censores nas redações.

Com base nos textos, o AI-5 pode ser compreendido como um instrumento que`,
    'concentrou poderes no Executivo e foi usado para silenciar opositores, inclusive no Legislativo e nos meios de comunicação.',
    [
      'ampliou as funções do Legislativo, ao permitir que o Congresso cassasse o presidente.',
      'garantiu a liberdade de imprensa, pois estabeleceu regras claras para a atuação dos jornais.',
      'limitou o poder do Executivo, pois submetia suas decisões à revisão do Judiciário.',
      'serviu para ampliar os direitos políticos dos cidadãos, que passaram a votar para presidente.',
    ],
    'O artigo permite ao presidente cassar mandatos e suspender direitos políticos "sem as limitações da Constituição". O texto II mostra o efeito: cassações, aposentadorias compulsórias e censura. As demais alternativas invertem o sentido do ato.',
  ),
  o(
    'dificil',
    `Leia os textos.

TEXTO I
"Ninguém segura este país!" (slogan de propaganda oficial, década de 1970)

TEXTO II
Estudos sobre o período 1968-1973 observam que, enquanto o Produto Interno Bruto crescia, a parcela da renda nacional que ficava com os 50% mais pobres diminuiu, e a mortalidade infantil permaneceu elevada em várias regiões.

A leitura conjunta dos textos permite afirmar que`,
    'a propaganda oficial exaltava o crescimento, mas as informações do texto II indicam que seus benefícios foram distribuídos de forma desigual.',
    [
      'os dados do texto II confirmam o slogan, pois mostram que todos os brasileiros se beneficiaram igualmente do crescimento.',
      'o slogan do texto I critica o governo, pois denuncia o aumento da pobreza.',
      'os dois textos tratam de períodos diferentes e, por isso, não podem ser comparados.',
      'o texto II demonstra que a propaganda era falsa, pois a economia não cresceu entre 1968 e 1973.',
    ],
    'O texto I é propaganda otimista; o II traz o contraponto: a economia crescia, mas com concentração de renda e problemas sociais. A comparação revela a diferença entre o discurso oficial e a realidade.',
  ),
  o(
    'medio',
    `Leia o texto.

O Destacamento de Operações de Informações (DOI) e o Centro de Operações de Defesa Interna (CODI) formavam, em várias capitais, uma rede de repressão que reunia militares e policiais. Presos políticos relatam que, nesses locais, eram interrogados sob tortura, e há casos de mortos e desaparecidos.

Em relação ao aparelho de repressão do período, é correto afirmar que`,
    'funcionava com ampla autonomia e na clandestinidade, o que dificultou a responsabilização dos autores de violações.',
    [
      'seguia regras públicas e controle judicial rigoroso, o que impedia abusos.',
      'se limitava ao combate de criminosos comuns, sem relação com a oposição política.',
      'era controlado pelo Congresso, que fiscalizava cada prisão realizada.',
      'foi desmontado em 1964, logo no início do regime militar.',
    ],
    'DOI-CODI e outros órgãos atuaram à margem da lei, com tortura, mortes e desaparecimentos. A falta de transparência e a anistia de 1979 explicam a dificuldade de punir os responsáveis.',
  ),
  o(
    'medio',
    `Leia o texto.

Nos festivais de música da década de 1960, o público vaiava e aplaudia as canções como em uma partida de futebol. Em 1968, uma canção de protesto, que convidava todos a "caminhar e cantar", tornou-se hino de estudantes e opositores, ainda que tenha sido proibida pouco depois. Já a Jovem Guarda, que fazia sucesso na mesma época, tinha letras mais ligadas ao cotidiano e ao romance.

A comparação entre a canção de protesto e a Jovem Guarda mostra que, no período,`,
    'a cultura de massa abrigou tendências diferentes, algumas engajadas na crítica política e outras mais voltadas ao entretenimento.',
    [
      'toda a música popular teve caráter político e de oposição ao governo.',
      'as canções de protesto eram incentivadas e divulgadas pela censura oficial.',
      'a Jovem Guarda se opunha frontalmente ao regime, ao contrário da música de protesto.',
      'os festivais deixaram de ser transmitidos para evitar manifestações do público.',
    ],
    'A televisão e os festivais popularizaram várias vertentes: a canção engajada (Vandré, Chico), a Tropicália, a Jovem Guarda. O público respondeu de modos diferentes; algumas obras foram censuradas, outras não.',
  ),
  o(
    'dificil',
    `Leia o texto.

Em 1974, ao assumir a presidência, o general Ernesto Geisel falou em uma "distensão lenta, gradual e segura". Nas eleições legislativas daquele ano, a oposição (MDB) obteve resultados expressivos. O governo, receoso, reagiu com medidas como o "Pacote de Abril" (1977), que fechou o Congresso por alguns dias e mudou as regras eleitorais para favorecer o governo.

O texto evidencia que a abertura política do governo Geisel foi`,
    'controlada pelo regime, que a conduzia de acordo com seus interesses e retrocedia quando se sentia ameaçado.',
    [
      'imediata e irrestrita, com o fim das restrições logo após a posse.',
      'imposta pela oposição, que dominou o Congresso e mudou as regras do jogo.',
      'inexistente, pois o governo manteve inalterada a política de repressão total.',
      'concluída em 1974, com a realização de eleições diretas para presidente.',
    ],
    'A distensão era "lenta, gradual e segura": os militares controlavam o ritmo. Quando a oposição avançou (1974), o governo reagiu com o Pacote de Abril. A abertura real veio no governo Figueiredo, sob pressão da sociedade.',
  ),
  o(
    'medio',
    `Leia o texto.

Em 1989, os brasileiros votaram para presidente pela primeira vez em quase trinta anos. Eleito, Fernando Collor adotou um plano econômico que bloqueou poupanças. Em 1992, denúncias de corrupção levaram a uma CPI, a manifestações de rua (os "caras-pintadas") e ao seu afastamento pelo Congresso.

Esse processo mostra que, no período da redemocratização,`,
    'as instituições e a sociedade civil mostraram força para responsabilizar um presidente eleito, dentro das regras democráticas.',
    [
      'o presidente foi deposto por um golpe militar apoiado pelos estudantes.',
      'não havia mecanismos legais para o afastamento de presidentes, que só saíam pela força.',
      'o Congresso perdeu poder e foi substituído por assembleias populares.',
      'a imprensa foi censurada e não pôde divulgar as denúncias contra o governo.',
    ],
    'O impeachment de Collor (1992) seguiu o rito da Constituição de 1988: CPI, mobilização popular e votação no Congresso. Foi uma prova de que as instituições democráticas funcionavam.',
  ),
  o(
    'medio',
    `Leia o texto da Constituição de 1988.

"Art. 5º [...] XLII - a prática do racismo constitui crime inafiançável e imprescritível, sujeito à pena de reclusão, nos termos da lei;"

O dispositivo mostra que a Constituição de 1988`,
    'ampliou direitos e garantias, ao tratar o racismo como crime grave, em contraste com o período de restrição de liberdades.',
    [
      'manteve as restrições do regime militar, pois considerou o racismo um problema apenas privado.',
      'excluiu qualquer proteção a grupos discriminados, para garantir a igualdade formal.',
      'concentrou os direitos nas mãos do Executivo, que decide quando o racismo é crime.',
      'limitou a atuação da Justiça, ao proibir a prisão em casos de racismo.',
    ],
    'A Constituição Cidadã incorporou demandas dos movimentos sociais (negro, indígena, mulheres, trabalhadores). O racismo passou a ser crime inafiançável e imprescritível.',
  ),
  o(
    'dificil',
    `Leia os textos.

TEXTO I
"A redemocratização trouxe a Constituição de 1988, o voto livre e a liberdade de imprensa."

TEXTO II
"A redemocratização não eliminou a desigualdade, a violência policial e o racismo, que persistem em muitas partes do país."

A leitura conjunta dos textos indica que a redemocratização brasileira foi um processo de`,
    'mudanças institucionais importantes, com permanências de problemas sociais históricos.',
    [
      'ruptura completa com o passado, sem permanências de qualquer tipo.',
      'continuidade total com o regime militar, sem mudanças institucionais.',
      'retrocesso político e social em todos os aspectos.',
      'estabilidade social, com fim das desigualdades e da violência.',
    ],
    'Os textos se complementam: houve avanços (direitos, eleições, imprensa livre) e continuidades (desigualdade, racismo, violência). Por isso se fala em "mudanças e permanências" na história recente.',
  ),
  o(
    'medio',
    `Leia o texto.

Nos anos 2000, o Brasil ampliou programas de transferência de renda, aumentou o salário mínimo acima da inflação e expandiu o acesso ao ensino superior por meio de bolsas e da Lei de Cotas (2012). Esses avanços foram acompanhados de debates sobre o financiamento das políticas sociais e sobre a necessidade de reduzir desigualdades regionais.

O texto permite concluir que as políticas sociais recentes`,
    'buscaram ampliar o acesso a direitos, mas geraram debates sobre financiamento e continuidade.',
    [
      'eliminaram qualquer desigualdade regional e social no país.',
      'foram unanimidade política e nunca geraram discussões públicas.',
      'se limitaram à ampliação do ensino privado, sem inclusão social.',
      'acabaram com o salário mínimo e reduziram o acesso à educação.',
    ],
    'As políticas de inclusão (transferência de renda, cotas, valorização do salário mínimo) ampliaram direitos, mas seguem em debate quanto a custo e alcance, e a desigualdade persiste.',
  ),
  o(
    'dificil',
    `Leia o texto.

Historiadores usam a expressão "anos de chumbo" para designar o período mais duro da repressão da ditadura militar brasileira, que vai do final de 1968 até meados dos anos 1970. Nessa época, os órgãos de segurança agiram contra a luta armada e contra qualquer oposição, com censura prévia, prisões, tortura e desaparecimentos.

A expressão "anos de chumbo" se justifica porque, nesse período,`,
    'a repressão política foi mais intensa, apoiada no AI-5 e na censura.',
    [
      'a economia entrou em recessão por causa do aumento do preço dos metais.',
      'o regime reduziu a violência e abriu o diálogo com a oposição.',
      'houve ampla liberdade de expressão e participação dos cidadãos.',
      'o Congresso passou a legislar sem a interferência do Executivo.',
    ],
    'O adjetivo "de chumbo" remete à pesadez e à violência do período, que começa com o AI-5 (dez. 1968) e vai até meados da década de 1970, no governo Médici e início do Geisel.',
  ),
];
