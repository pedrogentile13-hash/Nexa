import { q, type PacoteSeed } from './helpers';

export const LOTE4_HISTORIA: PacoteSeed[] = [
  {
    topic: 'grecia-e-roma', grade: '6º ano', title: 'Grécia e Roma antigas', subtitle: 'Cidades-Estado, democracia ateniense, República e Império Romano',
    resumo: String.raw`## Grécia Antiga
Organizada em **cidades-Estado (pólis)**, independentes entre si.
- **Atenas:** berço da **democracia direta**: os cidadãos votavam nas decisões na assembleia. Mas só era cidadão o **homem adulto livre nascido em Atenas**; mulheres, estrangeiros e escravizados ficavam de fora.
- **Esparta:** sociedade **militarizada**, com treinamento desde a infância.
- Legado: filosofia (Sócrates, Platão, Aristóteles), teatro, **Jogos Olímpicos**, matemática.

## Roma Antiga
- **Monarquia** (753 a.C., segundo a tradição), **República** (Senado e magistrados) e **Império**.
- **Augusto** foi o primeiro imperador (27 a.C.).
- O **Império Romano do Ocidente** caiu em **476 d.C.**, marco do fim da Antiguidade.
- Legado: **direito romano**, engenharia (estradas, aquedutos), o **latim**, origem do português, e a difusão do cristianismo.

## Por que importa
Ideias de cidadania, república e direito que usamos hoje vêm dessas civilizações.

## Erros comuns
- Achar que toda a população de Atenas votava.
- Confundir Esparta (militar) com Atenas (democrática).`,
    questoes: [
      q('facil', 'Como se chamavam as cidades-Estado da Grécia Antiga?', ['Pólis', 'Impérios', 'Feudos', 'Senados'], 0, 'Pólis eram cidades independentes, com governo e leis próprias.'),
      q('facil', 'Atenas é conhecida como o berço da:', ['democracia', 'monarquia absoluta', 'república romana', 'sociedade feudal'], 0, 'Em Atenas surgiu a democracia direta, com participação dos cidadãos na assembleia.'),
      q('facil', 'O português se originou principalmente do:', ['grego', 'latim', 'árabe', 'hebraico'], 1, 'O latim, língua de Roma, originou as línguas românicas, como o português.'),
      q('medio', 'Esparta se destacou por ter uma sociedade:', ['militarizada', 'baseada no comércio marítimo', 'sem Exército', 'exclusivamente agrícola e pacífica'], 0, 'Os espartanos eram treinados para a guerra desde crianças.'),
      q('medio', 'Na democracia ateniense, NÃO eram considerados cidadãos:', ['homens adultos livres de Atenas', 'mulheres, estrangeiros e escravizados', 'os filhos de cidadãos atenienses', 'os membros da assembleia'], 1, 'A cidadania era restrita aos homens adultos livres nascidos em Atenas.'),
      q('medio', 'A queda do Império Romano do Ocidente, em 476 d.C., marca o fim da:', ['Idade Moderna', 'Idade Média', 'Antiguidade', 'Pré-História'], 2, 'Esse evento é o marco do fim da Antiguidade e início da Idade Média.'),
      q('dificil', 'Quem foi o primeiro imperador de Roma?', ['Júlio César', 'Augusto', 'Nero', 'Constantino'], 1, 'Otávio, chamado Augusto, tornou-se o primeiro imperador em 27 a.C.'),
      q('dificil', 'Qual forma de governo romano tinha o Senado como instituição central?', ['República', 'Monarquia absoluta', 'Teocracia', 'Tirania'], 0, 'Na República, o Senado e os magistrados eleitos governavam Roma.'),
    ],
  },
  {
    topic: 'idade-media', grade: '7º ano', title: 'Idade Média e feudalismo', subtitle: 'Sociedade, poder da Igreja, cruzadas e crise do feudalismo',
    resumo: String.raw`## Período
Vai da queda de Roma do Ocidente (**476**) à queda de Constantinopla (**1453**), pelo marco mais usado.

## Feudalismo
Sistema econômico e social baseado na **terra** (o **feudo**).
- **Suserano** concede o feudo; **vassalo** presta fidelidade e serviço militar.
- **Servos** trabalham a terra do senhor feudal e entregam parte do que produzem, sem poder sair do feudo.
- Economia **agrária** e voltada ao autoconsumo.

## Sociedade estamental
Três ordens: **clero** (rezam), **nobreza** (guerreiam) e **servos** (trabalham). Pouca mobilidade social.

## Igreja Católica
Grande poder religioso, político e cultural, com mosteiros guardando o saber.

## Cruzadas (séculos XI a XIII)
Expedições militares cristãs para retomar a **Terra Santa**. Reabriram o comércio com o Oriente.

## Transformações
**Renascimento comercial e urbano**: crescem as cidades (burgos) e uma classe de comerciantes, a **burguesia**. A **Peste Negra** (século XIV) matou grande parte da população europeia e abalou o sistema.

## Erros comuns
- Achar que a Idade Média foi só atraso: houve universidades, cidades e inovações.
- Confundir servo com escravizado: o servo era preso à terra, mas tinha direitos limitados.`,
    questoes: [
      q('facil', 'O marco tradicional do início da Idade Média é:', ['a queda do Império Romano do Ocidente, em 476', 'a chegada de Colombo à América', 'a Revolução Francesa', 'a Peste Negra'], 0, 'Em 476 d.C. caiu o Império Romano do Ocidente.'),
      q('facil', 'No feudalismo, os servos eram os que:', ['guerreavam', 'rezavam', 'trabalhavam a terra do senhor feudal', 'governavam o feudo'], 2, 'Os servos cultivavam a terra e entregavam parte da produção ao senhor.'),
      q('facil', 'A sociedade medieval era dividida em:', ['clero, nobreza e servos', 'burgueses, operários e escravos', 'patrícios e plebeus', 'cidadãos e estrangeiros'], 0, 'Era uma sociedade estamental, com pouca mobilidade social.'),
      q('medio', 'Na relação de suserania e vassalagem, o vassalo:', ['dava terras ao suserano', 'devia fidelidade e apoio militar ao suserano', 'governava o suserano', 'não tinha obrigações'], 1, 'O vassalo recebia o feudo e, em troca, prestava fidelidade e serviço militar.'),
      q('medio', 'As Cruzadas foram expedições que tinham como objetivo declarado:', ['descobrir a América', 'retomar a Terra Santa', 'abolir o feudalismo', 'combater os vikings'], 1, 'Os cristãos europeus buscavam controlar Jerusalém e a Terra Santa.'),
      q('medio', 'A Peste Negra, no século XIV, teve como efeito:', ['o aumento da população europeia', 'a morte de grande parte da população da Europa', 'o fim das cidades', 'a invenção da imprensa'], 1, 'A epidemia matou milhões de pessoas e abalou a economia e a sociedade medievais.'),
      q('dificil', 'Qual evento é muito usado como marco do fim da Idade Média?', ['A queda de Constantinopla, em 1453', 'A Revolução Industrial', 'A Independência dos EUA', 'A Primeira Guerra Mundial'], 0, 'A tomada de Constantinopla pelos turcos otomanos, em 1453, é o marco mais citado.'),
      q('dificil', 'O renascimento comercial e urbano da baixa Idade Média levou ao crescimento de:', ['burgos e da burguesia', 'feudos isolados', 'ordens militares apenas', 'mosteiros apenas'], 0, 'O comércio revitalizou as cidades (burgos) e fez surgir a burguesia.'),
    ],
  },
  {
    topic: 'grandes-navegacoes', grade: '7º ano', title: 'Grandes Navegações', subtitle: 'Expansão marítima europeia, Tordesilhas e consequências',
    resumo: String.raw`## Contexto
Entre os séculos **XV e XVI**, europeus (sobretudo portugueses e espanhóis) buscaram novas rotas marítimas.

## Motivos
- Acesso às **especiarias** e ao comércio com o Oriente, após a tomada de Constantinopla (1453) dificultar as rotas tradicionais.
- **Mercantilismo:** acumular metais preciosos e manter uma balança comercial favorável.
- Expansão da fé cristã e busca de prestígio.
- Avanços técnicos: caravela, bússola, astrolábio.

## Portugal e Espanha
Portugal foi **pioneiro** por estar bem situado no Atlântico, ter Estado centralizado cedo e experiência marítima.
- **1492:** Cristóvão Colombo, a serviço da Espanha, chega à **América**.
- **1498:** **Vasco da Gama** chega à **Índia**, contornando a África.
- **1500:** **Pedro Álvares Cabral** chega ao Brasil.
- **1494, Tratado de Tordesilhas:** dividiu as terras descobertas e a descobrir entre Portugal e Espanha.

## Consequências
Encontro entre continentes, colonização, comércio atlântico e o **tráfico de escravizados**. Para os povos nativos da América: mortes por guerras, escravização e **doenças** trazidas pelos europeus.

## Erros comuns
- Achar que Colombo chegou à Índia ou ao Brasil.
- Dizer que Tordesilhas é de 1500.`,
    questoes: [
      q('facil', 'Em que ano Cabral chegou ao Brasil?', ['1492', '1498', '1500', '1822'], 2, 'Pedro Álvares Cabral chegou ao Brasil em 1500.'),
      q('facil', 'Em que ano Colombo chegou à América?', ['1492', '1500', '1534', '1808'], 0, 'Em 1492, a serviço da Espanha, Colombo chegou à América.'),
      q('facil', 'O Tratado de Tordesilhas foi assinado entre:', ['Portugal e Espanha', 'França e Inglaterra', 'Brasil e Portugal', 'Itália e Espanha'], 0, 'O tratado de 1494 dividiu as terras do Novo Mundo entre as duas coroas ibéricas.'),
      q('medio', 'Um dos principais motivos das Grandes Navegações foi:', ['buscar especiarias e novas rotas comerciais', 'acabar com o comércio', 'conquistar a Lua', 'fundar a ONU'], 0, 'As especiarias eram muito valorizadas e as rotas tradicionais ficaram difíceis.'),
      q('medio', 'Vasco da Gama ficou conhecido por:', ['descobrir a América', 'chegar à Índia contornando a África', 'chegar ao Brasil', 'dar a volta ao mundo'], 1, 'Em 1498 ele chegou a Calicute, na Índia, pelo caminho marítimo ao redor da África.'),
      q('medio', 'O mercantilismo defendia:', ['liberdade total de comércio', 'acumular metais preciosos e ter balança comercial favorável', 'abolir os impostos', 'a economia só de subsistência'], 1, 'O Estado intervinha para enriquecer, acumulando ouro e prata e exportando mais do que importando.'),
      q('dificil', 'Uma consequência da chegada dos europeus aos povos nativos da América foi:', ['o aumento da população nativa', 'a diminuição drástica da população por guerras, escravização e doenças', 'o fim de todas as culturas nativas em um ano', 'a ausência de contato'], 1, 'Doenças novas, violência e trabalho forçado reduziram muito as populações.'),
      q('dificil', 'Por que Portugal foi pioneiro na expansão marítima?', ['Era o país mais populoso da Europa', 'Tinha localização atlântica, Estado centralizado e experiência marítima', 'Não tinha nenhum rival', 'Possuía as maiores florestas'], 1, 'A posição geográfica, a centralização política precoce e a experiência náutica favoreceram os portugueses.'),
    ],
  },
  {
    topic: 'iluminismo-revolucao-francesa', grade: '8º ano', title: 'Iluminismo e Revolução Francesa', subtitle: 'Ideias iluministas, 1789 e o império de Napoleão',
    resumo: String.raw`## Iluminismo (século XVIII)
Movimento que defendia a **razão**, a liberdade e o questionamento do absolutismo.
- **Locke:** direitos naturais (vida, liberdade, propriedade).
- **Montesquieu:** **separação dos poderes** (Executivo, Legislativo, Judiciário).
- **Rousseau:** *O Contrato Social*, soberania popular.
- **Voltaire:** tolerância religiosa e liberdade de expressão.

## Revolução Francesa (1789)
Na França, o **Antigo Regime** tinha 3 estados: clero, nobreza e **Terceiro Estado** (a imensa maioria: burguesia, camponeses, trabalhadores), que pagava os impostos.
- **14 de julho de 1789:** tomada da **Bastilha**, símbolo do absolutismo.
- **Declaração dos Direitos do Homem e do Cidadão:** liberdade, igualdade perante a lei, propriedade.
- Lema: **Liberdade, Igualdade e Fraternidade.**
- Fase do **Terror** (1793–94), com guilhotina e perseguições.

## Napoleão
General que deu o **golpe de 18 de Brumário (1799)** e se coroou imperador em 1804. Consolidou conquistas burguesas (Código Civil), mas governou de forma autoritária.

## Importância
Inspirou ideias de cidadania, direitos e república pelo mundo.

## Erros comuns
- Achar que a Revolução Francesa foi só de uma classe (foram várias).
- Confundir Montesquieu (poderes) com Rousseau (soberania popular).`,
    questoes: [
      q('facil', 'Em que ano começou a Revolução Francesa?', ['1500', '1789', '1822', '1914'], 1, 'O marco é 1789, com a tomada da Bastilha.'),
      q('facil', 'Qual era o lema da Revolução Francesa?', ['Ordem e Progresso', 'Liberdade, Igualdade e Fraternidade', 'Deus, Pátria e Família', 'Paz e Terra'], 1, 'O trio liberdade, igualdade e fraternidade resumia os ideais revolucionários.'),
      q('facil', 'Qual pensador iluminista defendeu a separação dos poderes?', ['Montesquieu', 'Maquiavel', 'Napoleão', 'Hobbes'], 0, 'Montesquieu propôs a divisão em Executivo, Legislativo e Judiciário.'),
      q('medio', 'A tomada da Bastilha, em 14 de julho de 1789, simbolizou:', ['a vitória do absolutismo', 'o início da Revolução e a queda do poder real arbitrário', 'o fim da Revolução', 'a coroação de Napoleão'], 1, 'A Bastilha, prisão real, representava o despotismo da monarquia absoluta.'),
      q('medio', 'O Terceiro Estado na França era formado por:', ['clero e nobreza', 'a maior parte da população: burguesia, camponeses e trabalhadores', 'só pelos reis', 'apenas por militares'], 1, 'Reunia a imensa maioria da população, que pagava impostos e tinha pouco poder político.'),
      q('medio', 'A Declaração dos Direitos do Homem e do Cidadão afirmou, entre outros, o direito à:', ['igualdade perante a lei e à liberdade', 'servidão', 'monarquia absoluta', 'censura'], 0, 'O documento de 1789 proclamou direitos naturais, como liberdade e igualdade perante a lei.'),
      q('dificil', 'Em que ano Napoleão Bonaparte deu o golpe do 18 de Brumário?', ['1789', '1799', '1815', '1848'], 1, 'Em 1799 ele tomou o poder; coroou-se imperador em 1804.'),
      q('dificil', 'Qual obra de Rousseau trata da soberania popular?', ['O Príncipe', 'O Contrato Social', 'O Espírito das Leis', 'Cândido'], 1, 'Em O Contrato Social, Rousseau defende que o poder vem do povo.'),
    ],
  },
  {
    topic: 'revolucao-industrial', grade: '8º ano', title: 'Revolução Industrial', subtitle: 'Origem na Inglaterra, mudanças sociais e fases',
    resumo: String.raw`## O que foi
Conjunto de transformações que passaram a produzir em **fábricas, com máquinas**, em vez de oficinas artesanais. Começou na **Inglaterra**, por volta de **1760**.

## Por que na Inglaterra
Carvão e ferro, capital acumulado pelo comércio, mercado consumidor (inclusive colonial), cercamentos que levaram gente do campo à cidade e estabilidade política.

## Principais inovações
- **Máquina a vapor** (aperfeiçoada por **James Watt**).
- **Tear mecânico** e a indústria têxtil.
- Locomotivas e navios a vapor.

## Mudanças sociais
- **Êxodo rural** e rápido **crescimento urbano**.
- Nasce o **proletariado** (operários), com jornadas de 14 a 16 horas, salários baixos e **trabalho infantil**.
- Os trabalhadores reagem: o **ludismo** (destruição de máquinas) e depois os **sindicatos**, que lutam por direitos.

## Fases
- **1ª fase** (séc. XVIII a meados do XIX): carvão, vapor, têxtil.
- **2ª fase** (séc. XIX a XX): **aço, eletricidade, petróleo** e novas indústrias; expansão para Alemanha, EUA, Japão.

## Erros comuns
- Achar que a industrialização foi instantânea.
- Confundir os luditas com os sindicatos (os sindicatos são organização, o ludismo era destruição de máquinas).`,
    questoes: [
      q('facil', 'A Revolução Industrial começou em qual país?', ['França', 'Inglaterra', 'Brasil', 'Japão'], 1, 'A Inglaterra foi o berço da industrialização, por volta de 1760.'),
      q('facil', 'A máquina a vapor foi aperfeiçoada por:', ['James Watt', 'Isaac Newton', 'Napoleão', 'Galileu'], 0, 'Watt melhorou o desempenho da máquina a vapor, tornando-a útil para a indústria.'),
      q('facil', 'Os trabalhadores das fábricas formavam a classe dos:', ['servos', 'nobres', 'operários (proletariado)', 'clérigos'], 2, 'O proletariado vendia sua força de trabalho em troca de salário.'),
      q('medio', 'Uma consequência social imediata da industrialização foi:', ['o êxodo rural e o crescimento das cidades', 'o fim do trabalho assalariado', 'o desaparecimento das fábricas', 'o fortalecimento do feudalismo'], 0, 'Muitas pessoas deixaram o campo para trabalhar nas fábricas urbanas.'),
      q('medio', 'O ludismo foi um movimento em que operários:', ['criaram os primeiros sindicatos legais', 'destruíam máquinas, que viam como causa do desemprego', 'apoiaram a escravidão', 'abandonaram as cidades'], 1, 'Os luditas atacavam as máquinas, responsabilizando-as pela perda de empregos e baixos salários.'),
      q('medio', 'Quais fontes de energia e matérias-primas marcaram a 2ª fase da Revolução Industrial?', ['lenha e tração animal', 'eletricidade, aço e petróleo', 'só o carvão', 'energia nuclear'], 1, 'A 2ª fase teve eletricidade, aço, petróleo e produtos químicos.'),
      q('dificil', 'Qual fator ajuda a explicar o pioneirismo inglês?', ['abundância de carvão e ferro e capital acumulado', 'ausência de comércio', 'proibição do uso de máquinas', 'população apenas rural'], 0, 'Recursos minerais, capital, mercado e mão de obra criaram condições favoráveis.'),
      q('dificil', 'Os sindicatos surgiram para:', ['defender os direitos e melhores condições dos trabalhadores', 'destruir as fábricas', 'proibir greves', 'substituir o governo'], 0, 'Eles organizaram os trabalhadores para negociar jornada, salário e segurança.'),
    ],
  },
  {
    topic: 'primeira-guerra', grade: '9º ano', title: 'Primeira Guerra Mundial', subtitle: 'Causas, alianças, trincheiras e o Tratado de Versalhes',
    resumo: String.raw`## Período
**1914 a 1918.**

## Causas
- **Imperialismo:** disputa por colônias e mercados.
- **Nacionalismo** e rivalidades entre potências.
- **Corrida armamentista.**
- **Sistema de alianças:** **Tríplice Entente** (França, Reino Unido e Rússia) × **Tríplice Aliança** (Alemanha, Áustria-Hungria e Itália, que depois mudou de lado).

## O estopim
O assassinato do **arquiduque Francisco Ferdinando**, herdeiro do trono austro-húngaro, em **Sarajevo**, em **28 de junho de 1914**, ativou as alianças.

## A guerra
- **Guerra de trincheiras**, com metralhadoras, artilharia e gases tóxicos: milhões de mortos.
- **1917:** a **Rússia** sai da guerra após a Revolução; os **EUA** entram ao lado da Entente.

## O fim
Armistício em novembro de 1918. O **Tratado de Versalhes (1919)** responsabilizou a **Alemanha**, impondo reparações, perdas territoriais e limites militares.

## Consequências
Fim de impérios, novo mapa da Europa, crise econômica e ressentimento na Alemanha, que ajudou a preparar a Segunda Guerra.

## Erros comuns
- Achar que o assassinato foi a **única** causa.
- Confundir os lados das alianças.`,
    questoes: [
      q('facil', 'A Primeira Guerra Mundial ocorreu entre:', ['1914 e 1918', '1939 e 1945', '1850 e 1860', '1789 e 1799'], 0, 'A guerra durou de 1914 a 1918.'),
      q('facil', 'O estopim da Primeira Guerra foi o assassinato de:', ['Napoleão', 'Francisco Ferdinando', 'Hitler', 'Lênin'], 1, 'O arquiduque Francisco Ferdinando foi morto em Sarajevo, em 28 de junho de 1914.'),
      q('facil', 'O Tratado de Versalhes, de 1919, impôs à Alemanha:', ['reparações de guerra e limites militares', 'a posse de novas colônias', 'a liderança da Europa', 'a entrada na ONU'], 0, 'A Alemanha foi responsabilizada e teve de pagar reparações, perder territórios e reduzir o Exército.'),
      q('medio', 'A Tríplice Entente era formada por:', ['França, Reino Unido e Rússia', 'Alemanha, Itália e Japão', 'EUA, México e Canadá', 'Brasil, Argentina e Chile'], 0, 'Esse bloco se opôs à Tríplice Aliança de Alemanha e Áustria-Hungria.'),
      q('medio', 'A guerra de trincheiras foi marcada por:', ['batalhas rápidas e móveis', 'longos períodos de impasse e imensas perdas humanas', 'ausência de armas de fogo', 'combates só no mar'], 1, 'As frentes ficaram estagnadas, com milhões de mortos.'),
      q('medio', 'A entrada dos EUA na guerra, em 1917, favoreceu:', ['a Tríplice Aliança', 'a Entente', 'a Rússia czarista', 'nenhum dos lados'], 1, 'O apoio americano reforçou a Entente e ajudou a decidir o conflito.'),
      q('dificil', 'A Rússia deixou a Primeira Guerra em 1917 porque:', ['venceu a Alemanha', 'ocorreu a Revolução Russa', 'foi invadida pelo Brasil', 'assinou o Tratado de Versalhes'], 1, 'Com a revolução, o novo governo buscou a paz e saiu do conflito.'),
      q('dificil', 'O Tratado de Versalhes contribuiu para a futura instabilidade europeia porque:', ['humilhou e empobreceu a Alemanha, alimentando ressentimento', 'foi muito brando com a Alemanha', 'dividiu a Europa em partes iguais', 'extinguiu todas as alianças'], 0, 'As duras condições geraram revolta e crise econômica na Alemanha.'),
    ],
  },
  {
    topic: 'segunda-guerra', grade: '9º ano', title: 'Segunda Guerra Mundial e Guerra Fria', subtitle: 'Eixo e Aliados, Holocausto, ONU e a disputa EUA x URSS',
    resumo: String.raw`## Segunda Guerra Mundial (1939–1945)
Começou com a invasão da **Polônia** pela Alemanha nazista (1º de setembro de 1939).
- **Eixo:** Alemanha, Itália e Japão. **Aliados:** Reino Unido, França (inicialmente), URSS, EUA e outros.
- **1941:** ataque japonês a **Pearl Harbor** leva os EUA à guerra.
- **1944:** **Dia D**, desembarque aliado na Normandia.
- **Holocausto:** extermínio sistemático de cerca de **6 milhões de judeus**, além de ciganos, pessoas com deficiência e outros grupos.
- **Agosto de 1945:** bombas atômicas em **Hiroshima e Nagasaki**; fim da guerra.
- **1945:** criação da **ONU**, para promover a paz.

## Guerra Fria (1947–1991)
Disputa **sem confronto militar direto** entre **EUA (capitalismo)** e **URSS (socialismo)**: corrida armamentista e espacial, espionagem, guerras indiretas (Coreia, Vietnã).
- **Muro de Berlim** (1961), símbolo da divisão, **caiu em 1989**.
- **1991:** fim da URSS.

## Erros comuns
- Achar que a Guerra Fria teve batalhas diretas entre EUA e URSS.
- Confundir as datas das duas guerras mundiais.`,
    questoes: [
      q('facil', 'A Segunda Guerra Mundial teve início em:', ['1914', '1939', '1945', '1961'], 1, 'A invasão da Polônia, em 1939, é o marco inicial.'),
      q('facil', 'O Eixo era formado por:', ['Alemanha, Itália e Japão', 'EUA, Reino Unido e URSS', 'França, Espanha e Portugal', 'Brasil, Argentina e Chile'], 0, 'Essas três potências formaram o bloco contra os Aliados.'),
      q('facil', 'A Organização das Nações Unidas (ONU) foi criada em:', ['1919', '1945', '1989', '1991'], 1, 'A ONU surgiu em 1945, ao fim da guerra, para manter a paz.'),
      q('medio', 'O Holocausto foi:', ['uma batalha naval', 'o extermínio sistemático de cerca de 6 milhões de judeus pelo regime nazista', 'um tratado de paz', 'uma crise econômica'], 1, 'O regime nazista assassinou milhões de judeus e outros grupos perseguidos.'),
      q('medio', 'Em agosto de 1945, os EUA lançaram bombas atômicas sobre:', ['Berlim e Roma', 'Hiroshima e Nagasaki', 'Pearl Harbor e Tóquio', 'Moscou e Leningrado'], 1, 'As bombas atômicas atingiram duas cidades japonesas, e o Japão se rendeu.'),
      q('medio', 'A Guerra Fria opôs principalmente:', ['EUA e URSS', 'França e Alemanha', 'China e Japão', 'Brasil e Argentina'], 0, 'Foi a disputa de poder e ideologia entre capitalismo (EUA) e socialismo (URSS).'),
      q('dificil', 'Em que ano caiu o Muro de Berlim?', ['1961', '1975', '1989', '2001'], 2, 'O muro caiu em 1989, e a Alemanha se reunificou em 1990.'),
      q('dificil', 'A Guerra Fria é chamada "fria" porque:', ['só ocorreu no inverno', 'não houve confronto militar direto entre as duas superpotências', 'não existiam armas', 'foi vivida só no Ártico'], 1, 'EUA e URSS disputaram por meio de corrida armamentista, espionagem e guerras indiretas.'),
    ],
  },
  {
    topic: 'ditadura-militar', grade: '3ª série EM', title: 'Ditadura militar e redemocratização', subtitle: 'De 1964 à Constituição de 1988',
    resumo: String.raw`## O golpe de 1964
Em **31 de março/1º de abril de 1964**, militares depuseram o presidente **João Goulart** e iniciaram um regime que durou até **1985**, com presidentes militares.

## Características
- **Repressão política**, censura à imprensa e às artes, perseguição, tortura e exílio de opositores.
- **Atos Institucionais:** o **AI-5** (13 de dezembro de 1968) endureceu o regime: fechou o Congresso, suspendeu garantias e ampliou a censura.
- **"Milagre econômico"** (1968–1973): forte crescimento do PIB, mas com **concentração de renda** e aumento da dívida externa.

## A abertura
- **1979:** **Lei da Anistia**, que permitiu o retorno de exilados.
- **1983–84:** campanha das **Diretas Já**, que pedia eleições diretas para presidente. A emenda não passou.
- **1985:** o Colégio Eleitoral elegeu **Tancredo Neves** (indiretamente); com a doença e morte dele, assumiu **José Sarney**: fim do regime militar.

## Redemocratização
- **1988:** **Constituição Cidadã**, ampliando direitos e garantias.
- **1989:** primeira eleição direta para presidente desde 1960.

## Erros comuns
- Achar que a ditadura acabou com as Diretas Já (foi com a eleição de 1985).
- Esquecer que houve resistência e luta por direitos.`,
    questoes: [
      q('facil', 'Em que ano ocorreu o golpe militar no Brasil?', ['1930', '1945', '1964', '1985'], 2, 'O golpe depôs João Goulart em 1964.'),
      q('facil', 'O AI-5, de 1968, foi um ato que:', ['restabeleceu a democracia', 'endureceu o regime, ampliando a censura e a repressão', 'instituiu eleições diretas', 'aboliu a censura'], 1, 'O Ato Institucional nº 5 deu poderes extraordinários ao governo.'),
      q('facil', 'O movimento "Diretas Já" reivindicava:', ['eleições diretas para presidente', 'o fim do voto', 'a volta da monarquia', 'a censura à imprensa'], 0, 'Milhões foram às ruas em 1983–84 pedindo voto direto para presidente.'),
      q('medio', 'A Constituição de 1988 ficou conhecida como:', ['Constituição Cidadã', 'Constituição do Império', 'Carta de 1937', 'Ato Institucional'], 0, 'Ampliou direitos sociais, civis e políticos após o regime militar.'),
      q('medio', 'A Lei da Anistia, de 1979:', ['permitiu a volta de exilados políticos', 'fechou o Congresso', 'criou a ditadura', 'aboliu o Senado'], 0, 'A anistia permitiu o retorno de perseguidos políticos, num processo de abertura lenta.'),
      q('medio', 'Uma característica do período militar foi:', ['ampla liberdade de imprensa', 'censura e repressão política', 'eleições diretas para presidente', 'aumento das liberdades sindicais'], 1, 'Houve censura, perseguição e tortura de opositores.'),
      q('dificil', 'O fim do regime militar se consolidou, em 1985, com:', ['a eleição indireta de Tancredo Neves e a posse de um civil', 'um novo golpe', 'o AI-6', 'a volta de João Goulart'], 0, 'Tancredo foi eleito pelo Colégio Eleitoral; com sua morte, assumiu José Sarney, um civil.'),
      q('dificil', 'O "milagre econômico" (1968–1973) foi caracterizado por:', ['crescimento do PIB acompanhado de concentração de renda e endividamento externo', 'queda de todos os preços', 'fim da desigualdade', 'recessão profunda'], 0, 'Houve alto crescimento, mas os ganhos foram desiguais e o país se endividou.'),
    ],
  },
];
