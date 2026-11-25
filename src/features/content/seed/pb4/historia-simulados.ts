import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · História (9º ano, Prof. Renan Nakamura): Ditadura e redemocratização, aulas 49 a 64.
 * Três simulados: (1) o do professor, com as 25 questões do roteiro; (2) o perto da prova, no estilo da VA;
 * (3) objetivo de revisão. REGRA DE ESCRITA do objetivo: a certa nunca se reconhece pelo tamanho.
 */

const MATERIA = 'historia';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · O DO PROFESSOR (25 dissertativas do roteiro) */

const S1: QuestaoG2[] = [
  // Abertura e anistia
  dq(
    'facil',
    'O que foi o projeto de abertura "lenta, gradual e segura" do general Geisel?',
    'Projeto de Geisel, a partir de 1974, para abrandar a ditadura aos poucos e devolver o poder, ao fim de alguns anos, a civis identificados com os militares. Alternava medidas liberais e autoritárias para conter tanto a oposição quanto a "linha dura".',
    [
      'Explica cada palavra: lenta (aos poucos), gradual (por etapas), segura (sob controle dos militares)',
      'Situa o projeto em 1974, no governo Geisel',
      'Cita que alternava concessões e repressão',
    ],
  ),
  dq(
    'medio',
    'Por que a morte de Vladimir Herzog, em 1975, abalou o regime militar?',
    'Herzog foi chamado a depor no DOI-Codi e apareceu morto; a versão oficial de suicídio era inverossímil. A imprensa e entidades civis a rejeitaram, um culto ecumênico reuniu cerca de 8 mil pessoas na Sé, e Geisel demitiu o comandante do Exército em São Paulo.',
    [
      'Conta o fato: morte sob custódia no DOI-Codi',
      'Mostra que a versão oficial de suicídio foi rejeitada',
      'Liga o caso à reação da sociedade civil (culto na Sé, imprensa)',
    ],
  ),
  dq(
    'facil',
    'O que reivindicava a campanha por uma anistia "ampla, geral e irrestrita"?',
    'A libertação de todos os presos políticos e a volta dos exilados com plenos direitos, sem exceções. Era a bandeira do Comitê Brasileiro pela Anistia (1978) e mostrava a sociedade civil reorganizada.',
    [
      'Explica as três palavras: ampla (todos os crimes políticos), geral (todas as pessoas), irrestrita (sem condições)',
      'Cita a libertação dos presos e a volta dos exilados',
      'Não confunde o que a campanha pedia com a lei aprovada',
    ],
  ),
  dq(
    'medio',
    'Por que se diz que a Lei de Anistia de 1979 funcionou como uma via de mão dupla?',
    'A lei perdoou os presos e exilados por crimes políticos (exceto os condenados por "crimes de sangue") e, ao mesmo tempo, os agentes da repressão, por meio dos "crimes conexos": torturadores e assassinos do regime não puderam ser processados.',
    [
      'Mostra o primeiro sentido: presos e exilados foram libertados',
      'Mostra o segundo sentido: agentes da repressão foram protegidos (crimes conexos)',
      'Resposta que cita só os presos políticos está incompleta',
    ],
  ),
  dq(
    'facil',
    'O que foi o atentado do Riocentro e o que ele revelou sobre a "linha dura"?',
    'Em 1981, uma bomba preparada por militares para causar pânico num show do Dia do Trabalhador explodiu no carro dos próprios organizadores. O episódio revelou que a "linha dura" resistia à abertura com atentados e a desgastou.',
    [
      'Conta o fato em uma frase (1981, bomba, show do Dia do Trabalhador)',
      'Explica que a bomba explodiu no carro dos militares',
      'Conclui que a linha dura se opunha à abertura',
    ],
  ),
  // A sociedade civil se reorganiza
  dq(
    'medio',
    'Por que o Movimento Negro Unificado criticava o mito da "democracia racial"?',
    'A "democracia racial" era a ideia de que no Brasil não havia racismo e brancos e negros viviam em harmonia; o regime a usava como base da integração nacional. O MNU mostrava que era um mito: a violência policial e a discriminação contra negros eram rotina.',
    [
      'Define democracia racial',
      'Mostra por que o MNU a considerava falsa',
      'Dá um exemplo de 1978',
    ],
  ),
  dq(
    'medio',
    'Que episódios de 1978 levaram à fundação do Movimento Negro Unificado?',
    'A morte de Robson Silveira da Luz, torturado numa delegacia; a proibição da entrada de quatro jovens negros no Clube de Regatas Tietê; e o assassinato do operário Nilton Lourenço por um policial na Lapa.',
    ['Cita os três casos', 'Classifica cada um (violência policial ou discriminação)'],
  ),
  dq(
    'dificil',
    'Por que denunciar o racismo podia ser tratado como crime durante a ditadura?',
    'A Lei de Segurança Nacional (1967) punia quem incitasse a discriminação racial. Denunciar o racismo e expor o mito da democracia racial podia ser visto como incitação e ameaça à ordem pública.',
    [
      'Cita a Lei de Segurança Nacional',
      'Explica a inversão: a lei que dizia combater a discriminação servia para calar quem a denunciava',
    ],
  ),
  dq(
    'medio',
    'Por que as greves do ABC, em 1978, foram um marco para os trabalhadores?',
    'Foram as primeiras greves operárias depois de uma década de silêncio imposto pela repressão. Os metalúrgicos protestavam contra a política econômica e por melhores salários, e delas surgiu a liderança de Lula.',
    [
      'Diz que foram as primeiras greves depois de anos de repressão',
      'Cita as reivindicações (salários, política econômica)',
      'Relaciona às novas lideranças (Lula) e à reorganização da sociedade civil',
    ],
  ),
  dq(
    'medio',
    'O que mudou para a oposição com as eleições de 1982?',
    'Com a volta do pluripartidarismo, a oposição elegeu dez governadores e a maioria dos deputados federais. Os governistas, porém, ainda controlavam o Colégio Eleitoral, graças aos senadores nomeados pelos militares.',
    [
      'Aponta o avanço: governadores e deputados',
      'Aponta o limite: o Colégio Eleitoral continuava governista',
      'Conclui que a oposição ainda não podia escolher o presidente',
    ],
  ),
  // Diretas Já e governo Sarney
  dq(
    'medio',
    'O que foram as Diretas Já e por que a emenda Dante de Oliveira foi derrotada?',
    'Campanha de 1983-1984 que levou milhões às ruas pela emenda Dante de Oliveira, que restabelecia as eleições diretas para presidente. A Câmara, de maioria governista, rejeitou a emenda em abril de 1984.',
    [
      'Explica a mobilização popular (milhões nas ruas)',
      'Explica o objetivo: eleições diretas para presidente',
      'Mostra a derrota no Congresso, por falta de votos',
    ],
  ),
  dq(
    'facil',
    'Como Tancredo Neves foi eleito presidente em 1985?',
    'Por eleição indireta no Colégio Eleitoral, em 15 de janeiro de 1985. Tancredo (PMDB) venceu Paulo Maluf (PDS) com a Aliança Democrática, união do PMDB com dissidentes do PDS, que indicou Sarney como vice.',
    [
      'Diz que a eleição foi indireta (Colégio Eleitoral)',
      'Cita a Aliança Democrática',
      'Cita o adversário (Maluf) e o vice (Sarney)',
    ],
  ),
  dq(
    'medio',
    'Por que a chegada de José Sarney à presidência gerou desconfiança, considerando sua trajetória política?',
    'Sarney foi presidente da Arena e do PDS, partidos de apoio à ditadura, e só deixou o PDS em 1984. Era um dos civis mais identificados com o regime; por isso, sua posse como primeiro presidente da Nova República, após a morte de Tancredo, decepcionou quem esperava uma ruptura.',
    [
      'Cita a trajetória na Arena e no PDS',
      'Relaciona o passado ao cargo (presidente da redemocratização)',
      'Cita a morte de Tancredo',
    ],
  ),
  dq(
    'medio',
    'O que era o "entulho autoritário" e que medidas Sarney tomou para eliminá-lo?',
    'Era o conjunto de leis e práticas herdadas da ditadura. Sarney acabou com a censura, legalizou a UNE e os partidos clandestinos, deu voto aos analfabetos, restabeleceu as diretas para presidente e encaminhou a nova Constituição.',
    ['Define a expressão', 'Cita pelo menos três medidas'],
  ),
  dq(
    'medio',
    'O que foi o Plano Cruzado e por que ele fracassou?',
    'Plano econômico de 1986 que criou o cruzado e congelou preços e salários. A inflação caiu e a população virou "fiscal do Sarney", mas o consumo cresceu sem a produção acompanhar e produtores retiraram mercadorias das prateleiras: houve desabastecimento e a inflação voltou.',
    [
      'Cita o sucesso inicial (congelamento, inflação em queda)',
      'Explica a causa do fracasso (consumo sem produção, desabastecimento)',
      'Diz que a inflação voltou',
    ],
  ),
  // Eleição de 1989 e governo Collor
  dq(
    'facil',
    'Por que a eleição presidencial de 1989 foi tão aguardada?',
    'Era a primeira eleição direta para presidente desde 1960. Cerca de 82 milhões de pessoas tinham direito ao voto, perto de 90% da população adulta, contra 21% em 1960.',
    [
      'Diz que foi a primeira eleição direta desde 1960',
      'Compara o eleitorado com o de 1960 (cerca de 90% x 21%)',
    ],
  ),
  dq(
    'medio',
    'Que imagem Collor construiu na campanha e por que o apelido de "caçador de marajás" atraiu eleitores?',
    'Collor se apresentou como jovem, moderno e defensor da moralidade pública. O apelido vinha da promessa de cortar os altos salários de servidores públicos, os "marajás", o que agradava eleitores cansados de privilégios e corrupção.',
    [
      'Cita a imagem de jovem, moderno e moralizador',
      'Explica quem eram os "marajás"',
      'Explica por que combatê-los atraía votos',
    ],
  ),
  dq(
    'medio',
    'Qual medida do Plano Collor mais afetou a população e por quê?',
    'O bloqueio das cadernetas de poupança acima de 50 mil cruzados novos, devolvidas só depois de 18 meses. Milhares de pessoas tiveram seus projetos comprometidos, e a inflação voltou a subir.',
    [
      'Identifica a medida (bloqueio da poupança)',
      'Explica o efeito no cotidiano das pessoas',
      'Cita que a inflação voltou a subir',
    ],
  ),
  dq(
    'medio',
    'Quem foram os caras-pintadas e que papel tiveram no impeachment de Collor?',
    'Jovens que pintavam o rosto e foram às ruas em 1992 pedir o impeachment de Collor, acusado de corrupção no esquema de PC Farias. A pressão popular ajudou o Congresso a abrir a CPI e o processo.',
    [
      'Identifica os jovens com rostos pintados, em 1992',
      'Cita a corrupção (PC Farias)',
      'Relaciona a mobilização nas ruas ao processo no Congresso',
    ],
  ),
  dq(
    'dificil',
    'O que aconteceu na Presidência depois da saída de Collor e o que isso mostra sobre a democracia?',
    'Collor renunciou e foi cassado; o vice Itamar Franco assumiu, como previa a Constituição, sem golpe nem crise institucional. Isso mostrou que a democracia podia afastar um presidente dentro das regras.',
    [
      'Aponta quem assumiu (Itamar Franco)',
      'Diz que foi como previa a Constituição',
      'Explica que é sinal de normalidade democrática',
    ],
  ),
  // Plano Real e governo FHC
  dq(
    'medio',
    'Como a inflação alta afetava a vida dos mais pobres antes do Plano Real?',
    'Os preços subiam todos os dias. Quem não tinha conta em banco nem correção do dinheiro via o salário comprar menos a cada semana; em 1993, a inflação chegou a cerca de 2.000% no ano.',
    [
      'Usa um exemplo concreto (salário, compras)',
      'Explica por que os mais pobres sofriam mais (sem proteção financeira)',
      'Cita a inflação de cerca de 2.000% em 1993',
    ],
  ),
  dq(
    'medio',
    'O que significava, para FHC, pôr fim à "Era Vargas"?',
    'Acabar com o modelo de Estado forte na economia criado por Vargas, com empresas estatais, intervenção estatal e economia fechada. FHC queria dar prioridade ao investimento privado.',
    [
      'Define o modelo varguista (Estado forte, estatais, economia fechada)',
      'Diz o que FHC queria mudar (mais investimento privado)',
    ],
  ),
  dq(
    'medio',
    'O que é neoliberalismo e que medidas do governo FHC seguiram esse modelo?',
    'Modelo surgido nos anos 1980, na Inglaterra e nos EUA, que defende o Estado mínimo, sem empresas estatais nem forte regulação. No governo FHC, apareceu nas privatizações e na abertura às importações.',
    [
      'Define o conceito (Estado mínimo)',
      'Dá dois exemplos: privatizações e abertura às importações',
    ],
  ),
  dq(
    'medio',
    'Que problemas marcaram o segundo mandato de FHC?',
    'Denúncias de compra de votos na emenda da reeleição, a crise de energia (apagão de 2001) com racionamento, crises internacionais que frearam o crescimento e o aumento do desemprego (de 4,5 milhões para 7,8 milhões).',
    [
      'Cita pelo menos dois problemas (apagão, desemprego, crises, reeleição)',
      'Relaciona os problemas à queda de popularidade',
    ],
  ),
  dq(
    'medio',
    'Por que o sucesso do Plano Real ajudou FHC a vencer a eleição de 1994?',
    'O Real derrubou a inflação que corroía o salário, sobretudo dos mais pobres. FHC era o ministro da Fazenda que lançou o plano e foi associado a esse sucesso: saiu do segundo lugar nas pesquisas para a vitória no primeiro turno em 1994.',
    [
      'Cita o plano (queda da inflação)',
      'Cita o papel de FHC (ministro da Fazenda)',
      'Cita o resultado eleitoral (vitória em 1994, no primeiro turno)',
    ],
  ),
];

/* ============================================================ SIMULADO 2 · PERTO DA PROVA (estilo VA, com letras a e b) */

const S2: QuestaoG2[] = [
  dq(
    'medio',
    '1. a) Leia os acontecimentos. (1) A crise do petróleo encarece as importações brasileiras e abala o modelo de crescimento sustentado por empréstimos estrangeiros. (2) Um golpe derruba o governo de João Goulart e dá início à ditadura militar. (3) Diante do crescente descontentamento, o governo Geisel propõe uma abertura política "lenta, gradual e segura". (4) Durante o governo Médici, o "milagre econômico" e obras como a Transamazônica alimentam a propaganda de um país em progresso. (5) O AI-5 amplia os poderes do presidente e intensifica a repressão. Escreva por extenso a sequência numérica dos fatos em ordem cronológica. b) Explique por que o crescimento econômico do "milagre brasileiro" não garantiu a melhoria das condições de vida de toda a população.',
    'a) Dois, cinco, quatro, um, três (golpe de 1964, AI-5 em 1968, Médici e o milagre, crise do petróleo em 1973, abertura de Geisel em 1974). b) O crescimento ficou concentrado nas mãos de poucos: a renda se concentrou, os salários perderam valor (arrocho), faltou investimento em saúde, educação e moradia, e o modelo dependia de empréstimos estrangeiros. A desigualdade aumentou e a maioria não sentiu a melhoria.',
    [
      'Escreve a sequência 2, 5, 4, 1, 3 por extenso',
      'Explica a concentração de renda ("o bolo crescer para depois dividir")',
      'Cita o arrocho salarial ou a falta de investimento social',
      'Cita a dependência de dívida externa ou a desigualdade',
    ],
  ),
  dq(
    'medio',
    '2. Leia: "O movimento X conquistou o público com canções sobre namoros, separações, carros e aventuras do cotidiano urbano. A linguagem simples, o humor e o ritmo dançante aproximavam suas músicas das experiências e dos desejos de muitos adolescentes. Seus artistas também se tornaram referências de comportamento e consumo. A televisão e a publicidade ajudaram a transformar os cantores em ídolos nacionais." a) Identifique o movimento musical representado por X. b) Compare as temáticas desse movimento às dos tropicalistas e explique como seu repertório favorecia a identificação com um público amplo.',
    'a) A Jovem Guarda (iê-iê-iê, Roberto Carlos, Erasmo Carlos e Wanderléa). b) A Jovem Guarda falava do cotidiano urbano, de amor, carros e diversão, com linguagem simples, humor e ritmo dançante, o que facilitava a identificação de um público amplo, sobretudo jovem, e a ligava ao consumo e à televisão. Os tropicalistas (Caetano Veloso, Gilberto Gil, Os Mutantes) tinham temas mais críticos e experimentais: misturavam rock e ritmos brasileiros e faziam crítica social, política e cultural.',
    [
      'Identifica a Jovem Guarda',
      'Cita as temáticas da Jovem Guarda (cotidiano, amor, carros, consumo)',
      'Cita as temáticas dos tropicalistas (crítica social e política, experimentação)',
      'Explica a identificação com o público amplo (linguagem simples, ritmo dançante, TV)',
    ],
  ),
  dq(
    'medio',
    '3. Sobre a abertura política: a) Explique por que se diz que a Lei de Anistia (1979) foi uma "via de mão dupla". b) Explique o que foi o atentado do Riocentro (1981) e o que ele revelou sobre a "linha dura".',
    'a) A lei beneficiou os perseguidos políticos (presos e exilados voltaram) e, ao mesmo tempo, protegeu os agentes da repressão, por meio dos "crimes conexos": torturadores e assassinos do regime não puderam ser processados. A campanha pedia uma anistia "ampla, geral e irrestrita", e a lei aprovada não atendeu integralmente a isso. b) Em 1981, uma bomba preparada por militares para causar pânico num show do Dia do Trabalhador explodiu no carro dos próprios organizadores. Mostrou que a "linha dura" resistia à abertura e usava atentados para tentar barrá-la.',
    [
      'Cita os dois lados da anistia (perseguidos e agentes da repressão)',
      'Menciona os crimes conexos',
      'Conta o fato do Riocentro (bomba, show do Dia do Trabalhador, explodiu no carro dos militares)',
      'Conclui sobre a resistência da linha dura',
    ],
  ),
  dq(
    'dificil',
    '4. Sobre a transição democrática: a) Explique o que foram as Diretas Já e por que a emenda Dante de Oliveira foi derrotada. b) Explique como Tancredo Neves foi eleito e por que a chegada de Sarney à presidência gerou desconfiança.',
    'a) Foi a campanha de 1983-84 que levou milhões às ruas por eleições diretas para presidente. A emenda Dante de Oliveira foi rejeitada na Câmara, em abril de 1984, por falta de votos (quórum), já que o Congresso era de maioria governista. b) Tancredo foi eleito indiretamente, no Colégio Eleitoral, em 1985, pela Aliança Democrática (PMDB e dissidentes do PDS), contra Paulo Maluf. Morreu antes da posse e assumiu Sarney, que fora presidente da Arena e do PDS, partidos de apoio à ditadura, o que gerou desconfiança.',
    [
      'Descreve a mobilização das Diretas Já e a derrota da emenda no Congresso',
      'Diz que Tancredo foi eleito indiretamente (Aliança Democrática, contra Maluf)',
      'Cita a morte de Tancredo e a posse de Sarney',
      'Explica a desconfiança (passado na Arena e no PDS)',
    ],
  ),
  dq(
    'dificil',
    '5. Sobre os planos econômicos: a) Compare o Plano Cruzado (1986) e o Plano Collor (1990), explicando a medida principal de cada um. b) Explique por que o Plano Cruzado fracassou.',
    'a) O Plano Cruzado criou o cruzado e congelou preços e salários, enquanto o Plano Collor bloqueou as cadernetas de poupança e os depósitos acima de 50 mil cruzados novos, devolvidos só depois de 18 meses. São medidas diferentes: congelamento no primeiro, bloqueio de dinheiro no segundo. b) No início a inflação caiu, mas o consumo cresceu sem que a produção acompanhasse, produtores retiraram produtos das prateleiras, houve desabastecimento e a inflação voltou.',
    [
      'Cita o congelamento de preços e salários (Cruzado)',
      'Cita o bloqueio da poupança (Collor)',
      'Explica o fracasso do Cruzado (consumo sem produção, desabastecimento)',
      'Diz que a inflação voltou',
    ],
  ),
  dq(
    'medio',
    '6. Sobre Collor: a) Quem foram os caras-pintadas e que papel tiveram no impeachment? b) O que aconteceu na Presidência depois da saída de Collor e o que isso mostra sobre a democracia? Aproveite para indicar a diferença entre o fim do regime militar e a Constituição de 1988.',
    'a) Jovens que foram às ruas com o rosto pintado, em 1992, pedir o impeachment de Collor, acusado de corrupção no esquema de PC Farias; a pressão popular ajudou o Congresso a abrir o processo. b) Collor renunciou e perdeu os direitos políticos; o vice Itamar Franco assumiu, como prevê a Constituição, sem golpe, o que mostra que a democracia pode afastar um presidente dentro das regras. O regime militar acabou em 1985 e a Constituição democrática foi promulgada em 1988.',
    [
      'Identifica os caras-pintadas e a corrupção (PC Farias)',
      'Relaciona a pressão das ruas ao processo no Congresso',
      'Aponta a posse de Itamar e a normalidade democrática',
      'Distingue 1985 (fim do regime) de 1988 (Constituição)',
    ],
  ),
  dq(
    'medio',
    '7. Sobre o governo FHC: a) Explique por que o sucesso do Plano Real ajudou FHC a vencer a eleição de 1994. b) Defina neoliberalismo, cite duas medidas do governo FHC que o seguiram e um problema do segundo mandato.',
    'a) O Real derrubou a inflação que corroía o salário, sobretudo dos mais pobres. FHC era o ministro da Fazenda que lançou o plano e foi associado ao sucesso, vencendo no primeiro turno. b) Neoliberalismo é o modelo que defende o Estado mínimo, com privatizações e menos regulação. No governo FHC apareceu nas privatizações e na abertura às importações ("fim da Era Vargas"). No segundo mandato houve o apagão de 2001, desemprego e crises internacionais.',
    [
      'Liga o Real, o papel de FHC e a vitória de 1994',
      'Define neoliberalismo',
      'Cita privatizações e abertura às importações',
      'Cita um problema do segundo mandato (apagão, desemprego, crises)',
    ],
  ),
];

/* ============================================================ SIMULADO 3 · OBJETIVO DE REVISÃO (20 questões) */

const S3: QuestaoG2[] = [
  o(
    'facil',
    'Qual era o objetivo do projeto de abertura "lenta, gradual e segura" de Geisel?',
    'Abrandar a ditadura aos poucos, sem perder o controle',
    [
      'Entregar o poder de uma vez a líderes da oposição',
      'Convocar de imediato uma Assembleia Constituinte livre',
      'Reforçar a censura para evitar qualquer protesto',
      'Antecipar as eleições diretas para presidente em 1975',
    ],
    'A abertura de Geisel (1974) era controlada pelos militares: aos poucos, em etapas, sem ruptura, alternando concessões e repressão.',
  ),
  o(
    'facil',
    'O que aconteceu com Vladimir Herzog em 1975?',
    'Morreu sob custódia, e a versão oficial foi contestada',
    [
      'Foi preso num protesto e depois solto sem acusação',
      'Morreu num acidente de carro durante um trabalho',
      'Foi exilado em 1975 e só voltou com a anistia de 1979',
      'Foi morto por militantes de esquerda numa emboscada de rua',
    ],
    'Herzog apareceu morto no DOI-Codi, e a versão de suicídio foi rejeitada pela imprensa e por entidades civis, o que abalou o regime.',
  ),
  o(
    'medio',
    'O que pedia a campanha por uma anistia "ampla, geral e irrestrita"?',
    'Libertação dos presos políticos e volta dos exilados',
    [
      'Perdão apenas aos militares acusados de torturas',
      'Perdão só aos exilados, mantendo presos os demais',
      'Julgamento imediato de todos os agentes da repressão',
      'Retorno dos partidos, sem libertar os presos políticos',
    ],
    'A campanha (1978) queria a libertação de todos os presos e a volta de todos os exilados, sem exceção. A lei de 1979 não atendeu a tudo isso.',
  ),
  o(
    'medio',
    'Por que a Lei de Anistia de 1979 é chamada de "via de mão dupla"?',
    'Beneficiou os perseguidos e também os agentes da repressão',
    [
      'Beneficiou os presos e puniu os agentes da repressão',
      'Beneficiou apenas militares e impediu o retorno de exilados',
      'Beneficiou os exilados, mas não os presos políticos',
      'Beneficiou só os partidos e deixou a imprensa de fora',
    ],
    'A lei libertou presos e exilados, mas os "crimes conexos" protegeram torturadores e assassinos do regime.',
  ),
  o(
    'medio',
    'O que foi o atentado do Riocentro, em 1981?',
    'Uma bomba da linha dura explodiu no carro dos próprios militares',
    [
      'Uma bomba da oposição explodiu num show do Dia do Trabalhador',
      'Uma rebelião de militares tomou o Congresso Nacional em 1981',
      'Um comício das Diretas Já reuniu milhões de pessoas no Rio',
      'Uma greve geral dos trabalhadores foi reprimida pelo Exército',
    ],
    'Militares da linha dura planejaram um atentado num show do Dia do Trabalhador, e a bomba explodiu no carro deles. Mostrou a resistência à abertura.',
  ),
  o(
    'medio',
    'Como o Movimento Negro Unificado via a "democracia racial"?',
    'Dizia que a harmonia entre as raças era um mito',
    [
      'Defendia o mito como base da unidade nacional',
      'Aceitava a integração racial do regime militar',
      'Dizia que o racismo existia só nos Estados Unidos',
      'Via o mito como conquista do movimento operário',
    ],
    'O MNU (1978) denunciou que a ideia de harmonia racial escondia racismo, violência policial e discriminação.',
  ),
  o(
    'dificil',
    'Como a Lei de Segurança Nacional era usada contra o movimento negro?',
    'Podia enquadrar a denúncia do racismo como ameaça à ordem',
    [
      'Protegia quem denunciava a violência policial contra negros',
      'Proibia apenas a divulgação de notícias sobre a economia',
      'Garantia a liberdade de reunião a todos os movimentos',
      'Obrigava as escolas a ensinar a história da África',
    ],
    'A lei punia a incitação à discriminação racial, e expor o mito da democracia racial podia ser tratado como ameaça à ordem pública.',
  ),
  o(
    'medio',
    'Por que as greves do ABC, em 1978, foram um marco?',
    'Foram as primeiras greves operárias depois de anos de silêncio',
    [
      'Foram as primeiras greves de estudantes após o AI-5, em 1968',
      'Foram as greves de funcionários públicos contra o Plano Cruzado',
      'Foi uma greve geral convocada pelo governo Geisel em 1978',
      'Foram as greves de camponeses por terra no Nordeste do país',
    ],
    'Os metalúrgicos do ABC voltaram a protestar por salários e condições de trabalho, e surgiu a liderança de Lula.',
  ),
  o(
    'medio',
    'O que as eleições de 1982 mostraram?',
    'A oposição elegeu governadores, sem controlar o Colégio',
    [
      'A oposição elegeu o presidente da República pelo voto direto',
      'A oposição perdeu todos os governos estaduais para a Arena',
      'A oposição passou a controlar o Colégio Eleitoral',
      'A oposição foi proibida de disputar as eleições estaduais',
    ],
    'Com o pluripartidarismo, a oposição elegeu dez governadores, mas o Colégio Eleitoral, que escolhia o presidente, continuou governista.',
  ),
  o(
    'medio',
    'Qual foi o destino da emenda Dante de Oliveira, das Diretas Já?',
    'Foi derrotada na Câmara, por falta de votos',
    [
      'Foi aprovada e restabeleceu as diretas em 1985',
      'Foi retirada pelo próprio autor antes da votação',
      'Foi derrubada pelo Supremo Tribunal Federal',
      'Foi barrada no Senado, depois de aprovada',
    ],
    'Apesar dos milhões nas ruas, a Câmara rejeitou a emenda em abril de 1984. As diretas só voltaram em 1989.',
  ),
  o(
    'facil',
    'Como Tancredo Neves foi eleito presidente?',
    'De forma indireta, no Colégio Eleitoral, em 1985',
    [
      'Pelo voto direto, em segundo turno, em 1985',
      'Pela Assembleia Constituinte, no início de 1985',
      'Por nomeação do presidente Figueiredo em 1985',
      'Por plebiscito, com apoio das Forças Armadas',
    ],
    'Tancredo venceu Maluf no Colégio Eleitoral pela Aliança Democrática. Morreu antes da posse, e Sarney assumiu.',
  ),
  o(
    'medio',
    'Por que a posse de Sarney gerou desconfiança?',
    'Tinha sido presidente da Arena e do PDS, partidos da ditadura',
    [
      'Tinha liderado a campanha das Diretas Já em todo o país',
      'Tinha sido exilado durante o regime militar por muitos anos',
      'Tinha comandado o DOI-Codi em São Paulo durante a ditadura',
      'Tinha sido aliado de Collor desde as eleições de 1989',
    ],
    'Sarney presidiu a Arena e o PDS e só deixou o partido em 1984. Era um civil muito ligado ao regime.',
  ),
  o(
    'facil',
    'O que era o "entulho autoritário"?',
    'Leis e práticas herdadas da ditadura, como a censura',
    [
      'Restos de obras públicas abandonadas pelo regime militar',
      'Dívidas externas contraídas pelos governos militares',
      'Partidos políticos criados pelos militares em 1965',
      'Símbolos nacionais usados na propaganda do regime',
    ],
    'Sarney acabou com a censura, legalizou a UNE e os partidos clandestinos, deu voto aos analfabetos e restabeleceu as diretas.',
  ),
  o(
    'medio',
    'Qual foi a sequência do Plano Cruzado?',
    'Congelou preços e salários, e depois faltaram produtos',
    [
      'Bloqueou as poupanças, e depois faltou dinheiro vivo',
      'Privatizou estatais, e depois subiu o desemprego',
      'Criou o real e a URV, e depois caiu bastante a inflação',
      'Abriu a economia às importações, e depois faltaram divisas',
    ],
    'O congelamento fez a inflação cair, mas o consumo cresceu sem produção, houve desabastecimento e a inflação voltou.',
  ),
  o(
    'facil',
    'Por que a eleição presidencial de 1989 foi marcante?',
    'Primeira eleição direta para presidente desde 1960',
    [
      'Primeira eleição direta para presidente desde 1930',
      'Primeira eleição em que as mulheres puderam votar',
      'Primeira eleição com urna eletrônica no Brasil',
      'Primeira eleição presidencial depois do AI-5, em 1968',
    ],
    'Foi a primeira escolha direta do presidente em quase 30 anos, com cerca de 82 milhões de eleitores.',
  ),
  o(
    'medio',
    'Qual medida do Plano Collor atingiu mais a população?',
    'O bloqueio de cadernetas de poupança acima de um limite',
    [
      'O congelamento de preços e salários por tempo indeterminado',
      'A privatização de todas as estatais em seis meses',
      'A troca imediata do cruzado pelo real, com a URV',
      'O fim das importações e o fechamento da economia',
    ],
    'As cadernetas acima de 50 mil cruzados novos ficaram bloqueadas por 18 meses, e a inflação voltou a subir.',
  ),
  o(
    'facil',
    'Quem foram os caras-pintadas?',
    'Jovens que foram às ruas pedir o impeachment de Collor',
    [
      'Estudantes que lutaram pelas Diretas Já em 1984',
      'Operários que fizeram as greves metalúrgicas do ABC',
      'Militantes que apoiaram o golpe militar de 1964',
      'Jovens que pediram a renúncia de Sarney em 1989',
    ],
    'Em 1992, jovens de rosto pintado protestaram contra a corrupção, e a pressão ajudou o Congresso a abrir o processo de impeachment.',
  ),
  o(
    'medio',
    'O que aconteceu na Presidência após a saída de Collor?',
    'O vice Itamar Franco assumiu, como previa a Constituição',
    [
      'Os militares assumiram o poder até a nova eleição geral',
      'O presidente da Câmara convocou uma Constituinte nova',
      'O Supremo Tribunal Federal escolheu um novo presidente',
      'Uma junta de ministros governou o país por um ano',
    ],
    'A posse do vice, dentro das regras, mostrou que a democracia podia afastar um presidente sem golpe nem crise institucional.',
  ),
  o(
    'medio',
    'O que defende o neoliberalismo, adotado no governo FHC?',
    'O Estado mínimo, com privatizações e abertura comercial',
    [
      'O Estado forte, com estatais e economia fechada ao exterior',
      'A reforma agrária e o controle total de todos os preços',
      'O planejamento central e o congelamento de salários',
      'A nacionalização de bancos e de empresas privadas',
    ],
    'No governo FHC, o modelo apareceu nas privatizações e na abertura às importações, o "fim da Era Vargas".',
  ),
  o(
    'dificil',
    'Quais problemas marcaram o segundo mandato de FHC?',
    'Apagão de 2001, desemprego e crises internacionais',
    [
      'Hiperinflação de 2.000% ao ano e o confisco da poupança',
      'Fim do Plano Real e volta do cruzado como moeda',
      'Impeachment do presidente e posse do vice Itamar',
      'Derrota nas Diretas Já e eleição indireta do sucessor',
    ],
    'Houve racionamento de energia (apagão de 2001), crises internacionais, desemprego em alta e denúncias na emenda da reeleição.',
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

export const PACOTES_HISTORIA_PB4: PacoteG2[] = [
  pacote(
    'pb4-his-s1-professor',
    'Simulado 1 · O do professor: as 25 questões do roteiro (PB4 História)',
    'As 25 questões de revisão do Prof. Renan, com o gabarito orientado',
    'As mesmas 25 questões dissertativas do roteiro de estudos, na ordem dele. A IA corrige com a resposta esperada do professor e os critérios do "como resolver".',
    90,
    S1,
  ),
  pacote(
    'pb4-his-s2-prova',
    'Simulado 2 · Perto da prova (PB4 História)',
    '7 questões dissertativas, com letras a e b, no estilo da VA',
    'Como o professor cobra: ordenar fatos, identificar o movimento, comparar e explicar. Responda em parágrafo, citando os dois lados quando a questão pedir.',
    60,
    S2,
  ),
  pacote(
    'pb4-his-s3-objetivo',
    'Simulado 3 · Objetivo de revisão (PB4 História)',
    '20 questões objetivas de toda a matéria, aulas 49 a 64',
    'Abertura, anistia, sociedade civil, Diretas Já, Sarney, Collor e FHC. Cada erro vem com a explicação.',
    40,
    S3,
  ),
];
