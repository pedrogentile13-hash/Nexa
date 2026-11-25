import { dq, o, type QuestaoG2 } from '../grande2/types';

/**
 * PA7 · Simulado FINAL no formato da Prova Anglo (P-1 e P-3 do 9º ano): 32 questões de múltipla escolha
 * (1 a 16 Língua Portuguesa, 17 a 24 História, 25 a 32 Geografia) e a proposta de Produção de Texto, que o aluno
 * escreve e a IA corrige na própria questão (nota de 0 a 1).
 */

const PORTUGUES_FINAL: QuestaoG2[] = [
  /* ---- texto 1: conto policial (1 a 3) ---- */
  o(
    'medio',
    `Leia o fragmento de conto.

A biblioteca fechava às 19h. Quando a bibliotecária, d. Leontina, voltou do cafezinho, encontrou o cofre aberto e a lâmpada da mesa de leitura ainda quente. A janela dos fundos estava trancada por dentro. "Foi quem tinha a chave", pensou. Mas só duas pessoas tinham: ela própria e o professor Altair, que naquela tarde havia viajado.

No fragmento, o foco da narrativa está`,
    'na criação de um mistério, pois o crime ocorre em um ambiente fechado e as pistas parecem se contradizer.',
    [
      'na descrição detalhada da rotina da biblioteca, sem relação com o crime.',
      'na revelação do culpado, que é apresentado logo no início.',
      'na exposição das opiniões da bibliotecária sobre o professor Altair.',
      'na crítica ao horário de funcionamento das bibliotecas públicas.',
    ],
    'O cofre aberto, a janela trancada e as duas únicas chaves criam um "enigma": quem entrou, se só duas pessoas tinham a chave e uma delas estava viajando? É a base da narrativa policial.',
  ),
  o(
    'medio',
    `Leia o fragmento de conto.

A biblioteca fechava às 19h. Quando a bibliotecária, d. Leontina, voltou do cafezinho, encontrou o cofre aberto e a lâmpada da mesa de leitura ainda quente. A janela dos fundos estava trancada por dentro. "Foi quem tinha a chave", pensou. Mas só duas pessoas tinham: ela própria e o professor Altair, que naquela tarde havia viajado.

O detalhe "a lâmpada [...] ainda quente" funciona no texto como`,
    'uma pista de que alguém estivera ali havia pouco tempo.',
    [
      'um recurso de humor, para amenizar a tensão da cena.',
      'uma descrição de ambiente, sem função para o enredo.',
      'a confissão de que a bibliotecária deixou a lâmpada acesa.',
      'uma prova de que o professor Altair continuava no local.',
    ],
    'Nos contos policiais, os detalhes são pistas. A lâmpada quente indica que alguém usou a mesa de leitura pouco antes de a bibliotecária voltar.',
  ),
  o(
    'dificil',
    `Leia o fragmento de conto.

A biblioteca fechava às 19h. Quando a bibliotecária, d. Leontina, voltou do cafezinho, encontrou o cofre aberto e a lâmpada da mesa de leitura ainda quente. A janela dos fundos estava trancada por dentro. "Foi quem tinha a chave", pensou. Mas só duas pessoas tinham: ela própria e o professor Altair, que naquela tarde havia viajado.

A forma verbal "havia viajado", no trecho, indica uma ação`,
    'passada e anterior ao momento em que a bibliotecária fez sua reflexão.',
    [
      'futura em relação ao momento em que o professor foi lembrado.',
      'habitual, que o professor repetia todas as tardes.',
      'simultânea ao momento em que ela encontrou o cofre.',
      'hipotética, que o professor poderia ter realizado.',
    ],
    '"Havia viajado" (pretérito mais-que-perfeito composto) indica um fato passado anterior a outro fato passado ("pensou" / "encontrou"): a viagem já tinha ocorrido naquela tarde.',
  ),
  /* ---- texto 2: artigo de opinião (4 a 7) ---- */
  o(
    'medio',
    `Leia o fragmento de artigo de opinião.

Muitos defendem que o aluno deve estudar sozinho, sem ajuda de ninguém. Mas aprender é, antes de tudo, uma atividade coletiva: discutimos, erramos juntos, comparamos ideias. Um aluno que troca anotações com os colegas costuma compreender melhor o conteúdo do que um que se isola. Por isso, as escolas deveriam estimular grupos de estudo.

A tese defendida no fragmento é a de que`,
    'as escolas deveriam estimular grupos de estudo, pois aprender é uma atividade coletiva.',
    [
      'o aluno deve estudar sempre sozinho para ter mais concentração.',
      'os colegas atrapalham o rendimento escolar em grupos.',
      'as escolas devem proibir a troca de anotações entre alunos.',
      'compreender o conteúdo depende apenas da inteligência individual.',
    ],
    'A tese está na conclusão ("Por isso, as escolas deveriam estimular grupos de estudo"), apoiada em argumentos (aprender é coletivo; trocar anotações melhora a compreensão).',
  ),
  o(
    'medio',
    `Leia o fragmento de artigo de opinião.

Muitos defendem que o aluno deve estudar sozinho, sem ajuda de ninguém. Mas aprender é, antes de tudo, uma atividade coletiva: discutimos, erramos juntos, comparamos ideias. Um aluno que troca anotações com os colegas costuma compreender melhor o conteúdo do que um que se isola. Por isso, as escolas deveriam estimular grupos de estudo.

A conjunção "Mas", no início da segunda frase, estabelece a relação de sentido de`,
    'oposição, pois contrapõe uma ideia comum à posição defendida pelo autor.',
    [
      'adição, pois acrescenta um argumento ao anterior.',
      'conclusão, pois encerra o raciocínio do texto.',
      'explicação, pois justifica a frase anterior.',
      'alternância, pois apresenta uma escolha entre duas opções.',
    ],
    'O autor começa apresentando a opinião contrária ("Muitos defendem...") e, com "Mas", opõe a sua própria posição. É uma estratégia argumentativa comum.',
  ),
  o(
    'dificil',
    `Leia o fragmento de artigo de opinião.

Muitos defendem que o aluno deve estudar sozinho, sem ajuda de ninguém. Mas aprender é, antes de tudo, uma atividade coletiva: discutimos, erramos juntos, comparamos ideias. Um aluno que troca anotações com os colegas costuma compreender melhor o conteúdo do que um que se isola. Por isso, as escolas deveriam estimular grupos de estudo.

A forma verbal "deveriam", no final do texto, produz o efeito de sentido de`,
    'recomendação, apresentando a proposta como uma sugestão e não como uma ordem.',
    [
      'ordem, pois impõe às escolas uma obrigação imediata.',
      'certeza, pois afirma que as escolas já estimulam grupos de estudo.',
      'hábito, pois indica o que as escolas faziam no passado.',
      'dúvida, pois o autor não sabe se os grupos funcionam.',
    ],
    'O futuro do pretérito ("deveriam") atenua a afirmação e a transforma em recomendação. Em artigos de opinião, o autor propõe soluções, mas não tem autoridade para ordenar.',
  ),
  o(
    'medio',
    `Leia o fragmento de artigo de opinião.

Muitos defendem que o aluno deve estudar sozinho, sem ajuda de ninguém. Mas aprender é, antes de tudo, uma atividade coletiva: discutimos, erramos juntos, comparamos ideias. Um aluno que troca anotações com os colegas costuma compreender melhor o conteúdo do que um que se isola. Por isso, as escolas deveriam estimular grupos de estudo.

A frase "Um aluno que troca anotações com os colegas costuma compreender melhor o conteúdo" é usada, no texto, como`,
    'argumento que sustenta a tese, ao apresentar uma consequência observável do estudo coletivo.',
    [
      'conclusão que resume todo o texto.',
      'ironia, para criticar os alunos que não estudam em grupo.',
      'relato pessoal do autor, sem relação com o tema.',
      'definição de "grupo de estudo", como em um texto didático.',
    ],
    'Argumento = razão que apoia a tese. Aqui, a vantagem de trocar anotações (compreender melhor) justifica a proposta final.',
  ),
  /* ---- verbos e regência (8 a 11) ---- */
  o(
    'medio',
    `Leia o trecho de uma instrução de segurança.

"Não use o elevador em caso de incêndio. Siga as setas e desça pela escada. Se a fumaça for intensa, cubra o nariz com um pano molhado."

Sobre os modos verbais, é correto afirmar que o trecho`,
    'combina o imperativo, para orientar, e o subjuntivo, para indicar uma situação hipotética ("Se a fumaça for intensa").',
    [
      'usa somente o indicativo, para descrever fatos já ocorridos.',
      'usa o imperativo em todas as frases, inclusive na hipótese final.',
      'usa o subjuntivo para dar ordens e o indicativo para as hipóteses.',
      'não apresenta nenhuma forma de imperativo.',
    ],
    '"Não use", "siga", "desça" e "cubra" são imperativos. "Se a fumaça for intensa" está no futuro do subjuntivo, que indica hipótese/condição.',
  ),
  o(
    'medio',
    `Leia a frase.

"Os pais sempre obedeceram os conselhos do pediatra, e o médico, por sua vez, visava a bons resultados para a criança."

Em relação à regência dos verbos "obedecer" e "visar", na norma-padrão,`,
    '"obedecer" exige a preposição "a" (obedeceram aos conselhos) e "visar", no sentido de "ter como objetivo", também (visava a bons resultados).',
    [
      '"obedecer" e "visar" são transitivos diretos e dispensam a preposição.',
      '"obedecer" exige a preposição "de" e "visar" exige "em".',
      '"obedecer" é transitivo direto, e "visar" exige a preposição "com".',
      '"obedecer" é intransitivo, e "visar" é verbo de ligação.',
    ],
    'Obedecer pede a preposição "a" (obedecer a algo/alguém) e visar, com o sentido de "almejar", também (visar a algo). Em "obedeceram os conselhos", faltaria "aos".',
  ),
  o(
    'dificil',
    `Leia a frase.

"Se o time tivesse treinado mais, teria vencido a final."

A frase expressa`,
    'uma hipótese que não se realizou no passado e a consequência que teria ocorrido.',
    [
      'um fato real do passado e sua consequência.',
      'uma ordem para o futuro e sua condição.',
      'um desejo para o presente e a certeza de que se realizará.',
      'uma ação habitual do passado e uma ação que se repete.',
    ],
    'O mais-que-perfeito composto do subjuntivo ("tivesse treinado") e o futuro do pretérito composto ("teria vencido") formam uma hipótese irreal no passado: o time não treinou mais e não venceu.',
  ),
  o(
    'medio',
    `Leia a frase.

"O ambiente do laboratório permanecia silencioso, mas a plateia parecia ansiosa."

Os verbos "permanecia" e "parecia" são classificados, respectivamente, como`,
    'verbo de ligação que indica permanência de um estado e verbo de ligação que indica aparência.',
    [
      'verbo de ação que indica continuidade e verbo de ligação que indica certeza.',
      'verbo de ligação que indica mudança de estado e verbo de ação que indica aparência.',
      'verbo de ação que indica movimento e verbo de ação que indica estado.',
      'verbo de ligação que indica aparência e verbo de ligação que indica permanência.',
    ],
    '"Permanecia silencioso" mostra o estado que se mantém; "parecia ansiosa" mostra aparência. Os dois ligam o sujeito ao predicativo (silencioso / ansiosa).',
  ),
  /* ---- oralidade e texto didático (12 a 16) ---- */
  o(
    'medio',
    `Leia o diálogo.

— Cê viu o jogo ontem?
— Vi, mano! Foi show!
— Pois é. O Pedro tava voando.

No diálogo, a linguagem`,
    'é informal e adequada à situação, pois se trata de uma conversa descontraída entre amigos.',
    [
      'é incorreta, pois afasta-se da norma-padrão e impede a compreensão.',
      'é formal e adequada a uma entrevista de emprego.',
      'revela o baixo nível de instrução dos falantes.',
      'é a mesma que se espera em um artigo de opinião escrito.',
    ],
    'Variação linguística não é erro: formas como "cê", "tava" e "mano" são adequadas em conversas informais. A escolha da linguagem depende da situação e do interlocutor.',
  ),
  o(
    'medio',
    `Leia o trecho de um texto didático.

"As placas tectônicas são grandes blocos da crosta terrestre que se movimentam muito lentamente. Quando duas placas se chocam, podem surgir montanhas; quando se afastam, formam-se oceanos. Observe o esquema: as setas indicam o sentido do movimento."

Uma característica do gênero presente no trecho é`,
    'o uso de definição, de comparação entre processos e de um recurso visual (esquema) como apoio à explicação.',
    [
      'a presença de personagens e de um enredo com conflito.',
      'a defesa de uma opinião pessoal por meio de argumentos.',
      'o uso de rimas e de figuras de linguagem como no poema.',
      'o tom humorístico, característico das tiras e charges.',
    ],
    'O texto didático informa e explica: define o termo, compara processos e usa recursos de apoio, como esquemas, quadros e exemplos.',
  ),
  o(
    'medio',
    `Leia o trecho.

Na palestra de encerramento, a diretora disse: "Estudar não é só decorar. Estudar é compreender, relacionar e aplicar o que se aprendeu." Depois, pediu aos estudantes que resumissem oralmente o que ouviram.

Um bom resumo oral dessa fala é:`,
    'Segundo a diretora, estudar é compreender, relacionar e aplicar o que se aprendeu, e não apenas decorar.',
    [
      'A diretora criticou os alunos por decorarem as matérias, sem apontar qualquer alternativa.',
      'A diretora disse que decorar é a melhor forma de aprender, e que é preciso estudar bastante.',
      'A diretora fez uma palestra longa sobre vários assuntos da escola, sem uma ideia central.',
      'A diretora afirmou que estudar é fácil e que todos devem decorar tudo o que ouvirem.',
    ],
    'Um resumo oral preserva a ideia central com as próprias palavras, sem distorcer o sentido. As demais opções invertem ou omitem o que foi dito.',
  ),
  o(
    'medio',
    'Assinale a alternativa em que a regência do verbo "assistir" (no sentido de "ver") está de acordo com a norma-padrão.',
    'O filme a que assistimos ontem era sobre o Japão.',
    [
      'O filme que assistimos ontem era sobre o Japão.',
      'O filme onde assistimos ontem era sobre o Japão.',
      'O filme de que assistimos ontem era sobre o Japão.',
      'O filme o qual assistimos ontem era sobre o Japão.',
    ],
    'Quem assiste, assiste A alguma coisa. Quando o complemento vira pronome relativo, a preposição vem antes dele: "o filme A QUE assistimos" (ou "ao qual assistimos"). Sem a preposição, a frase foge da norma-padrão.',
  ),
  o(
    'medio',
    `Leia a frase.

"A professora entregou os trabalhos aos alunos que tiveram as melhores notas."

A oração "que tiveram as melhores notas" é`,
    'subordinada adjetiva restritiva, pois delimita quais alunos receberam os trabalhos.',
    [
      'subordinada adjetiva explicativa, pois acrescenta uma informação acessória sobre todos os alunos.',
      'subordinada substantiva objetiva direta.',
      'coordenada assindética, sem relação de dependência.',
      'subordinada adverbial causal.',
    ],
    'A oração restringe o sentido de "alunos": só os que tiveram as melhores notas receberam os trabalhos. Se fosse explicativa, estaria entre vírgulas e se aplicaria a todos.',
  ),
];

const HISTORIA_FINAL: QuestaoG2[] = [
  o(
    'medio',
    `Leia o texto.

A Operação Condor foi um acordo de cooperação entre as ditaduras militares de países da América do Sul, como Argentina, Brasil, Chile, Paraguai e Uruguai, a partir de meados da década de 1970. Os serviços de segurança desses países trocavam informações e atuavam além das fronteiras para perseguir opositores, que eram presos, torturados e, muitas vezes, desaparecidos.

O texto indica que as ditaduras do Cone Sul, naquele período,`,
    'articularam-se entre si para reprimir opositores, ultrapassando as fronteiras nacionais.',
    [
      'competiam entre si, e não trocavam informações de segurança.',
      'respeitavam o direito de asilo e protegiam os exilados.',
      'agiam apenas dentro dos limites de seus territórios.',
      'foram fiscalizadas pelos respectivos parlamentos nacionais.',
    ],
    'A Operação Condor foi uma rede de colaboração repressiva entre regimes militares, o que explica a perseguição de exilados em outros países.',
  ),
  o(
    'medio',
    `Leia o texto.

Em outubro de 1975, o jornalista Vladimir Herzog se apresentou espontaneamente a um órgão de repressão, em São Paulo, e foi encontrado morto. A versão oficial foi a de suicídio, mas fotografias e testemunhos contradiziam essa explicação. Seu enterro reuniu milhares de pessoas em um ato ecumênico que se tornou símbolo da resistência à ditadura.

A comoção diante da morte de Herzog mostra que`,
    'a sociedade civil passou a reagir publicamente às violações de direitos humanos, pressionando o regime.',
    [
      'a população aceitou sem contestação as versões oficiais do governo.',
      'a imprensa deixou de noticiar a repressão por falta de interesse.',
      'o regime ampliou sua base de apoio com o caso.',
      'a Igreja apoiou o governo na repressão aos jornalistas.',
    ],
    'O caso Herzog foi um marco: a versão de suicídio não convenceu, e o ato ecumênico na Sé reuniu religiosos, jornalistas, estudantes e outros setores, fortalecendo a oposição.',
  ),
  o(
    'medio',
    `Leia o texto.

Entre 1978 e 1980, metalúrgicos do ABC paulista realizaram greves por melhores salários e pelo direito de negociar. Apesar da repressão, o movimento ganhou apoio de estudantes, da Igreja e de outros trabalhadores. Dele surgiram lideranças, como Luiz Inácio Lula da Silva, e, em 1980, a fundação do Partido dos Trabalhadores.

Esse processo evidencia que, no final da ditadura,`,
    'o chamado "novo sindicalismo" se somou a outros movimentos sociais e pressionou pela abertura política.',
    [
      'os sindicatos foram controlados pelo governo e não participaram das mobilizações.',
      'as greves foram proibidas e não ocorreram até 1985.',
      'os trabalhadores se mobilizaram apenas por razões religiosas.',
      'o movimento operário apoiou a manutenção do regime militar.',
    ],
    'As greves do ABC mostraram a capacidade de organização operária e impulsionaram a redemocratização, junto a movimentos de bairro, estudantes e Igreja.',
  ),
  o(
    'dificil',
    `Leia os textos.

TEXTO I
Nos anos 1970, a televisão se consolidou como principal meio de comunicação no país, com telenovelas e telejornais que alcançavam milhões de pessoas e dialogavam com a propaganda oficial.

TEXTO II
No mesmo período, jornais alternativos, teatro, música e cinema independentes buscaram formas de criticar o regime, apesar da censura.

A leitura dos dois textos permite afirmar que a cultura brasileira dos anos 1970 foi`,
    'marcada por tensões: ao mesmo tempo em que a indústria cultural se expandia e podia servir ao regime, artistas e jornalistas encontravam brechas para criticá-lo.',
    [
      'homogênea, pois todos os meios de comunicação defendiam o regime.',
      'paralisada, pois a censura impediu qualquer produção cultural.',
      'restrita à televisão, já que o cinema e o teatro deixaram de existir.',
      'livre de qualquer controle, pois o governo apoiou a crítica.',
    ],
    'A expressão "luzes e trevas" resume o período: inovação e crescimento da cultura de massa, junto com censura, perseguições e resistências.',
  ),
  o(
    'medio',
    `Leia o texto da Constituição de 1988.

"Art. 231. São reconhecidos aos índios sua organização social, costumes, línguas, crenças e tradições, e os direitos originários sobre as terras que tradicionalmente ocupam, competindo à União demarcá-las, proteger e fazer respeitar todos os seus bens."

Esse artigo demonstra que a Constituição`,
    'reconheceu direitos específicos dos povos indígenas, rompendo com a ideia de integração forçada.',
    [
      'considerou os povos indígenas incapazes de decidir sobre suas terras.',
      'determinou a assimilação dos povos indígenas à sociedade, em um prazo fixo.',
      'retirou do Estado qualquer responsabilidade sobre os territórios indígenas.',
      'proibiu a demarcação de terras indígenas no país.',
    ],
    'A Constituição de 1988 reconheceu a organização, a cultura e os direitos territoriais indígenas, e atribuiu à União o dever de demarcar e proteger as terras.',
  ),
  o(
    'medio',
    `Leia o texto.

Em 1986, o governo Sarney lançou o Plano Cruzado: congelou preços e salários e criou uma nova moeda. No início, a inflação caiu e a população apoiou o plano, ajudando a fiscalizar os preços nos supermercados. Meses depois, faltaram produtos, o congelamento foi abandonado e a inflação voltou a subir.

O processo descrito ilustra um traço da Nova República, que foi`,
    'a dificuldade de estabilizar a economia, o que gerou esperanças e decepções nos anos 1980.',
    [
      'a estabilidade econômica total, que durou toda a década de 1980.',
      'a ausência de qualquer plano econômico até 1994.',
      'a recusa da população em participar das medidas do governo.',
      'o aumento imediato dos salários acima de qualquer inflação.',
    ],
    'A inflação alta marcou os anos 1980. Planos como o Cruzado tiveram sucesso inicial e fracassaram, o que só foi superado com o Plano Real (1994).',
  ),
  o(
    'medio',
    `Leia o texto.

A Constituição de 1988 criou o Sistema Único de Saúde (SUS), que estabelece a saúde como direito de todos e dever do Estado. Antes disso, o atendimento público era voltado principalmente a quem tinha carteira assinada.

Em relação ao SUS, é correto afirmar que`,
    'representou a ampliação de um direito social, ao tornar o atendimento universal.',
    [
      'restringiu o atendimento a trabalhadores formais, como era antes.',
      'extinguiu o atendimento público, privatizando todos os serviços.',
      'foi criado durante a ditadura militar, sem relação com a Constituição.',
      'aboliu a responsabilidade do Estado pela saúde da população.',
    ],
    'Com o SUS, saúde passou a ser direito de todos (universalidade). É um exemplo do alcance social da "Constituição Cidadã".',
  ),
  o(
    'dificil',
    `Leia o texto.

A Lei Maria da Penha, de 2006, criou mecanismos para coibir a violência doméstica e familiar contra a mulher, como medidas protetivas e juizados especializados. Mesmo assim, os índices de violência contra a mulher continuam altos, o que mostra os desafios de aplicar as leis e de mudar mentalidades.

O texto ilustra o conceito de "mudanças e permanências" porque`,
    'a lei representa um avanço, mas a violência de gênero persiste como problema social.',
    [
      'a lei eliminou a violência contra a mulher, que deixou de existir.',
      'a lei não teve nenhum efeito prático, pois não criou mecanismos de proteção.',
      'o problema da violência doméstica surgiu depois da lei.',
      'a legislação foi revogada, e a violência voltou ao patamar anterior.',
    ],
    'Houve mudança institucional (nova lei e proteção às vítimas), mas permanecem desigualdades e violências. A história recente combina avanços e continuidades.',
  ),
];

const GEOGRAFIA_FINAL: QuestaoG2[] = [
  o(
    'medio',
    `Leia o texto.

Depois do acidente na usina nuclear de Fukushima, em 2011, o Japão desligou temporariamente a maioria de seus reatores. Para suprir a energia, aumentou a importação de gás natural e de carvão. Nos anos seguintes, o país voltou a discutir o papel da energia nuclear, das fontes renováveis e da eficiência energética.

Essa situação mostra que o Japão`,
    'tem alta dependência de energia importada e precisa equilibrar segurança, custo e diversificação das fontes.',
    [
      'é autossuficiente em petróleo e gás natural.',
      'abandonou definitivamente a discussão sobre energia.',
      'tem a maior parte de sua energia produzida por usinas hidrelétricas no interior do continente.',
      'não depende do comércio exterior para abastecer suas indústrias.',
    ],
    'Poucos recursos energéticos próprios obrigam o Japão a importar combustíveis. A crise nuclear reabriu o debate sobre a matriz energética.',
  ),
  o(
    'dificil',
    `Leia o texto.

A região metropolitana de Tóquio é uma das maiores aglomerações urbanas do mundo. Sua rede de trens e metrôs é considerada uma das mais eficientes do planeta. Mesmo assim, a cidade enfrenta problemas como o alto custo de moradia, a sobrecarga do sistema de transportes nos horários de pico e a vulnerabilidade a terremotos.

Sobre a urbanização japonesa, o texto permite concluir que`,
    'a alta concentração urbana exige infraestrutura eficiente, mas gera desafios de custo de vida e de risco de desastres.',
    [
      'o país não enfrenta problemas urbanos por ter transporte público eficiente.',
      'a população se distribui de forma uniforme, sem grandes aglomerações.',
      'os terremotos não afetam grandes cidades, que ficam em áreas estáveis.',
      'as grandes cidades têm moradia barata, por causa da oferta de terrenos.',
    ],
    'Grandes metrópoles concentram oportunidades e problemas: o transporte coletivo eficiente ajuda, mas não elimina o custo de vida alto nem os riscos naturais.',
  ),
  o(
    'medio',
    `Leia o texto.

O Japão exporta automóveis, máquinas e componentes eletrônicos e importa petróleo, gás, minérios e parte dos alimentos. Por isso, a conjuntura da economia mundial e a variação do preço dos combustíveis influenciam diretamente seu comércio exterior.

A situação descrita é característica de uma economia`,
    'industrial e dependente de importações de matérias-primas e de energia.',
    [
      'agrária e exportadora de produtos primários.',
      'extrativista e voltada apenas ao mercado interno.',
      'isolada, sem participação no comércio internacional.',
      'baseada exclusivamente em serviços de turismo.',
    ],
    'Países industriais com poucos recursos próprios compram insumos e energia e vendem produtos manufaturados. Ficam sensíveis ao preço dos combustíveis.',
  ),
  o(
    'dificil',
    `Leia o texto.

Embora a população japonesa seja, em geral, homogênea do ponto de vista étnico, há minorias, como os ainu (povo indígena de Hokkaido), os coreanos que vivem no país há gerações e os descendentes de japoneses que retornaram ao Japão vindos de países como o Brasil. Todos enfrentam, em graus diferentes, desafios de reconhecimento e de inclusão.

O texto contesta a ideia de que`,
    'o Japão é um país sem nenhuma diversidade cultural e étnica.',
    [
      'o Japão tem população muito diversificada em todo o território.',
      'os imigrantes no Japão têm os mesmos direitos de todos, sem dificuldades.',
      'o povo ainu é maioria no país.',
      'a imigração é incentivada de forma ilimitada pelo governo.',
    ],
    'A imagem do Japão como "homogêneo" esconde minorias e imigrantes, como os ainu, coreanos e nipo-brasileiros (dekasseguis), que enfrentam desafios de inclusão.',
  ),
  o(
    'medio',
    `Leia o texto.

A Nova Zelândia produz uma parcela significativa de sua eletricidade a partir de fontes renováveis, como hidrelétricas e geotermia. O país está sobre uma região de intensa atividade vulcânica e geotérmica, o que favorece o aproveitamento do calor do subsolo.

O texto permite concluir que, na Nova Zelândia,`,
    'as características geológicas do território favorecem o uso de energia geotérmica.',
    [
      'a energia geotérmica é inviável, por falta de atividade vulcânica.',
      'a matriz elétrica depende exclusivamente de carvão importado.',
      'o país não aproveita recursos naturais para produzir energia.',
      'a produção de eletricidade se concentra em usinas nucleares.',
    ],
    'A Nova Zelândia está no Cinturão de Fogo, com vulcões e áreas geotérmicas. Isso, somado a rios, ajuda a manter uma matriz elétrica majoritariamente renovável.',
  ),
  o(
    'medio',
    `Leia o texto.

A Austrália recebe imigrantes de várias partes do mundo, com destaque, nas últimas décadas, para pessoas vindas da Ásia. Cidades como Sydney e Melbourne têm bairros com forte presença de comunidades chinesas, indianas e vietnamitas. O governo reconhece oficialmente o multiculturalismo como política de Estado.

O texto mostra que a população australiana contemporânea`,
    'tem composição diversificada, resultado de fluxos migratórios recentes.',
    [
      'é formada exclusivamente por descendentes de britânicos.',
      'se mantém isolada, sem receber imigrantes.',
      'é, em sua maioria, de origem indígena.',
      'rejeita oficialmente a diversidade cultural.',
    ],
    'A Austrália passou de uma política migratória restritiva a uma realidade multicultural, com imigração asiática, europeia e de outras regiões.',
  ),
  o(
    'medio',
    `Leia o texto.

A Papua-Nova Guiné tem uma das maiores diversidades linguísticas do planeta, com centenas de idiomas falados por comunidades que vivem, muitas vezes, em vales isolados por montanhas e florestas. O inglês, o tok pisin e o hiri motu são usados como línguas de comunicação mais ampla.

A diversidade linguística do país está relacionada`,
    'ao isolamento geográfico de comunidades e à manutenção de tradições próprias.',
    [
      'ao predomínio de uma única cultura, que impôs uma língua só.',
      'à ausência de povos originários na região.',
      'à uniformização cultural trazida por grandes cidades.',
      'à proibição do uso de línguas locais.',
    ],
    'O relevo e a floresta isolaram comunidades por séculos, o que favoreceu o surgimento e a conservação de muitas línguas. Línguas veiculares facilitam a comunicação nacional.',
  ),
  o(
    'facil',
    `Leia o texto.

Por estar no hemisfério sul, a Oceania tem estações do ano invertidas em relação ao hemisfério norte: quando é verão na Europa, é inverno na Austrália e na Nova Zelândia. Assim, o Natal, em dezembro, é comemorado em pleno verão.

A inversão das estações na Oceania é explicada`,
    'pela localização no hemisfério sul e pela inclinação do eixo da Terra em relação à órbita em torno do Sol.',
    [
      'pela proximidade da Linha do Equador, que anula as estações.',
      'pela altitude elevada de todas as ilhas da região.',
      'pelo movimento de rotação, que ocorre em sentido oposto no hemisfério sul.',
      'pela distância entre a Terra e o Sol, que é menor no hemisfério sul em todos os meses.',
    ],
    'A inclinação do eixo da Terra faz com que os hemisférios recebam luz solar de modo diferente ao longo do ano. Quando um está no verão, o outro está no inverno.',
  ),
];

/** Proposta de Produção de Texto (no estilo da P-1: dois infográficos, três parágrafos). */
const REDACAO_FINAL: QuestaoG2 = dq(
  'dificil',
  `PRODUÇÃO DE TEXTO

Leia atentamente os dois infográficos a seguir.

INFOGRÁFICO 1: Celular na escola, prós e contras.
PRÓS: facilita pesquisas e o acesso a aplicativos de estudo; permite usar dicionários, calculadoras e vídeos explicativos; ajuda a organizar horários e tarefas.
CONTRAS: distrai os estudantes com redes sociais e jogos; pode prejudicar a concentração em sala; aumenta o risco de exposição e de cyberbullying.

INFOGRÁFICO 2: Reduzir o plástico faz bem ao planeta.
O QUE ACONTECE: o plástico leva muito tempo para se decompor; sacolas e embalagens descartadas chegam a rios e oceanos; muitos animais confundem o plástico com alimento.
O QUE FAZER: levar sacola reutilizável; recusar canudos e copos descartáveis; separar o lixo para a coleta seletiva; preferir produtos com menos embalagem.

Escolha um desses infográficos e, a partir do tema e das informações apresentadas, elabore um ARTIGO DE OPINIÃO.
Organize seu texto em três parágrafos:
• no primeiro, apresente o tema e o que pensa sobre ele;
• no segundo, apresente argumentos que justifiquem o ponto de vista apresentado anteriormente;
• no terceiro, conclua, retomando brevemente (sem copiar) o tema e seu ponto de vista.`,
  'Artigo de opinião de três parágrafos. 1º: apresenta o tema (celular na escola ou redução do plástico) e deixa clara a opinião do autor (tese). 2º: desenvolve pelo menos dois argumentos que sustentam a tese, apoiados nas informações do infográfico escolhido e em conhecimentos do autor (exemplos, dados, comparações). 3º: conclui retomando o tema e o ponto de vista com outras palavras, sem copiar o primeiro parágrafo, podendo apresentar uma sugestão. A linguagem segue a norma-padrão, com coesão (conectivos de oposição, causa, conclusão) e uso adequado dos modos e tempos verbais.',
  [
    'Escolhe um dos infográficos e permanece no tema',
    'Apresenta o tema e uma tese clara no 1º parágrafo',
    'Desenvolve argumentos coerentes e baseados no infográfico no 2º parágrafo',
    'Conclui no 3º parágrafo retomando o ponto de vista, sem copiar',
    'Respeita a estrutura em três parágrafos e o gênero artigo de opinião',
    'Usa norma-padrão, coesão e pontuação adequadas',
  ],
  'Nota de 0 a 1: avalie tema e tese, argumentos, conclusão, estrutura e linguagem.',
);

/** 16 de Língua Portuguesa + 8 de História + 8 de Geografia + Produção de Texto. */
export const SIMULADO_FINAL: QuestaoG2[] = [
  ...PORTUGUES_FINAL,
  ...HISTORIA_FINAL,
  ...GEOGRAFIA_FINAL,
  REDACAO_FINAL,
];
