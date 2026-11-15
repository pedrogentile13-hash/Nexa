import { dq, o, type PacoteG2 } from '../grande2/types';

/**
 * Português · 4º bimestre · 9º ano. Simulados dos TCs online (um por módulo: 38, 40 e 41) e dois simulados
 * extras de 15 questões (13 objetivas + 2 dissertativas): Verbos com verbos de ligação, e "Assassinatos da Rua Morgue".
 * Os dois extras ficam FORA da trilha (a trilha libera uma etapa por vez): ficam abertos na Biblioteca.
 */
const MATERIA = 'lingua-portuguesa';
const SERIE = '9º ano' as const;

const DOYLE =
  'DOYLE, Arthur Conan. Sherlock Holmes: obra completa. Trad. Louisa Ibañez; Brancs de Villa-Flor; Edna Jansen de Mello. Rio de Janeiro: Nova Fronteira, 2015, v. 4.';

const TRECHO_SUSSEX = `Uma criada, vestida com apuro, a única coisa moderna que tínhamos visto na casa, havia trazido chá. Enquanto ela nos servia, a porta abriu-se, e um jovem entrou na sala. Era um moço singular, de rosto pálido, louro, com olhos azuis expressivos, que brilharam com uma repentina chama de emoção e alegria quando pousaram no pai. Ele precipitou-se para frente e lançou os braços em volta do pescoço do pai, com a espontaneidade de uma jovem carinhosa.
${DOYLE}`;

const NOTICIA_TURCAS = `Sem sexo, séries turcas viram febre no Brasil e dominam o streaming
Que o brasileiro é apaixonado por novelas não é novidade. O que você talvez não saiba é que algumas histórias que estão fazendo sucesso por aqui são da Turquia. As plataformas de streaming têm apostado nos produtos audiovisuais de lá e curtido o resultado. No último fim de semana, por exemplo, Minha Menina, uma série turca, ficou no Top 1 da HBO Max, que já conta com outros títulos do país em seu catálogo, como Será Isso Amor?
Disponível em: https://www.uol.com.br/splash/noticias/2023/06/11/series-turcas-viram-febre-no-brasil-dominam-o-streaming-e-atraem-turistas.htm. Acesso em: 1º jun. 2026.`;

/* ------------------------------------------------------------------ módulos dos TCs online */

const MODULO_38: PacoteG2 = {
  slug: 'pb4-tc-modulo-38-verbos',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Módulo 38: Verbos (TC online)',
  subtitle: 'Tempos, modos e sentidos dos verbos: 3 objetivas e 1 dissertativa',
  description:
    'Exercícios do TC online do módulo 38 (Mínimas e Leão): valor dos tempos verbais, classificação das formas verbais e o efeito de sentido de cada uma, com trechos de "A aventura do vampiro de Sussex".',
  minutes: 20,
  questoes: [
    o(
      'medio',
      `Leia o trecho do conto "A aventura do vampiro de Sussex":

Ele apanhou uma segunda carta que tinha ficado despercebida na mesa enquanto ele estivera absorvido com a primeira. Começou a lê-la com um sorriso divertido no rosto, que aos poucos foi substituído por uma expressão de interesse e de concentração intensa. Quando terminou, ficou sentado por algum tempo perdido em seus pensamentos, com a carta pendendo de seus dedos. Por fim, saiu de seu devaneio.
${DOYLE}

Considere as afirmações:
I - A forma verbal "estivera" indica estado posterior à ação de apanhar uma segunda carta.
II - A locução verbal "começou a lê-la" indica o momento inicial da ação de ler.
III - A forma verbal "ficou" indica situação estática anterior ao momento da fala.
IV - A forma nominal "pendendo" está no gerúndio, exprimindo processo verbal não concluído.

Estão corretas as afirmações:`,
      'II, III e IV.',
      ['I, II e III.', 'I, III e IV.', 'I, II e IV.'],
      '"Estivera" é pretérito mais-que-perfeito: o estado (estar absorvido) é ANTERIOR à ação de apanhar a carta, então a I está errada. "Começou a lê-la" marca o início da leitura (II certa), "ficou" é um estado já passado em relação ao momento da fala (III certa) e "pendendo" é gerúndio, processo ainda em andamento (IV certa).',
    ),
    o(
      'medio',
      `Considere o trecho do conto "A aventura do vampiro de Sussex":

Nosso cliente, sr. Robert Ferguson, de Ferguson e Muirhead, corretores de chá, de Mincing Lane, CONSULTOU-nos, através de uma carta da mesma data, a respeito de vampiros. Como nossa firma é especializada em avaliação de máquinas, o assunto dificilmente ESTARIA dentro de nossa área de atuação, e nós, portanto, recomendamos ao sr. Ferguson que RECORRESSE ao senhor e que lhe expusesse o assunto.
${DOYLE}

A alternativa em que as formas verbais em destaque ("consultou", "estaria" e "recorresse") estão classificadas corretamente, mantendo a ordem, é:`,
      'pretérito perfeito do indicativo, futuro do pretérito, pretérito imperfeito do subjuntivo.',
      [
        'pretérito imperfeito do indicativo, futuro do presente, pretérito mais-que-perfeito.',
        'pretérito mais-que-perfeito, futuro do pretérito, presente do subjuntivo.',
        'pretérito perfeito do indicativo, futuro do presente, futuro do subjuntivo.',
      ],
      '"Consultou" é pretérito perfeito (ação concluída). "Estaria" é futuro do pretérito (hipótese: o assunto dificilmente estaria na área da firma). "Recorresse" vem depois de "recomendamos... que" e está no pretérito imperfeito do subjuntivo.',
    ),
    o(
      'medio',
      `Leia o trecho do conto "O vampiro de Sussex":

${TRECHO_SUSSEX}

No enunciado "Enquanto ela nos servia, a porta abriu-se [...]", é correto afirmar sobre os verbos:`,
      '"servia" indica uma ação passada e simultânea à expressa por "abriu".',
      [
        '"abriu" denota uma ação passada, anterior à expressa por "servia".',
        '"servia" e "abriu" indicam ações em andamento no passado.',
        '"abriu" e "servia" indicam ações concluídas no passado.',
      ],
      '"Servia" está no pretérito imperfeito: ação passada que se prolongava. "Abriu" é pretérito perfeito: ação pontual e concluída, que acontece DURANTE o serviço. Por isso as duas são simultâneas, e só "abriu" é concluída.',
    ),
    dq(
      'medio',
      `Leia o trecho do conto "O vampiro de Sussex":

${TRECHO_SUSSEX}

a) A forma verbal "tínhamos visto" está no mais-que-perfeito composto do indicativo. Ela denota que a ação é anterior ou posterior à indicada por "havia trazido"?
b) A forma composta "havia trazido" corresponde a que tempo simples do verbo? Qual das duas é menos formal?
c) O verbo "era", em destaque, está empregado com que valor em relação à duração do fato?`,
      'a) Anterior: ver a criada (e a casa) aconteceu antes de ela trazer o chá. b) "Havia trazido" corresponde ao mais-que-perfeito simples, "trouxera"; a forma composta ("havia trazido") é a menos formal, mais usada na fala. c) "Era" está no pretérito imperfeito e indica um fato de duração prolongada no passado, sem começo nem fim marcados (descrição do moço).',
      [
        'a) Diz que a ação de "tínhamos visto" é anterior',
        'b) Indica o mais-que-perfeito simples (trouxera) e aponta a forma composta como menos formal',
        'c) Indica duração prolongada, continuidade no passado (pretérito imperfeito)',
      ],
    ),
  ],
};

const MODULO_40: PacoteG2 = {
  slug: 'pb4-tc-modulo-40-texto-didatico',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Módulo 40: Texto didático (TC online)',
  subtitle: 'Título, sentido do texto e ficha de estudo: 2 objetivas e 1 dissertativa',
  description:
    'Exercícios do TC online do módulo 40: escolher o título que resume um texto, relacionar dois textos sobre criatividade e completar uma ficha de estudo de um texto didático.',
  minutes: 20,
  questoes: [
    o(
      'medio',
      `Leia o texto:

Desde a Revolução Industrial, as atividades humanas têm emitido quantidades crescentes de gases de efeito estufa. Esse excesso de emissões na atmosfera torna a camada de ozônio mais espessa e capaz de reter mais calor, resultando no aumento da temperatura média da superfície do planeta — ou seja, no famoso aquecimento global. E nós e todos os outros seres que nele habitam, vivenciamos as alterações no estado do clima: a chamada Crise Climática.
Mas por que isso é uma "crise"? Pois, à medida que a temperatura global aumenta, a Terra e a humanidade sofrem os impactos negativos desse processo, como ondas de calor, fortes chuvas, escassez de água, degradação ambiental e aumento do volume dos oceanos, que consequentemente levam à queda na produtividade agrícola e causam problemas de saúde. Tais impactos reverberam na vida de todas as espécies e da população como um todo, que já enfrenta problemas respiratórios e escassez de recursos com uma frequência cada vez maior.
Colocada como o principal desafio da humanidade atualmente — é justamente seu caráter de emergência que nos faz usar o termo "crise climática" e não "mudanças climáticas" —, ela exige medidas eficazes e a participação de governos, empresas e da sociedade. Afinal, se a atividade humana é a causa do problema, também temos de ser a solução.
Cada um de nós deve se perceber como parte do todo, já que grandes mudanças coletivas partem de indivíduos. É sempre bom lembrar que o comportamento de uma única pessoa serve de inspiração e exemplo para família, amigos e comunidade, catalisando mudanças positivas em grande escala.
Ao adotar hábitos de consumo consciente que diminuem as emissões de gases de efeito estufa e outros impactos negativos, um indivíduo contribui para mudar o cenário atual. E vai além: passa a exercer seu poder de influência multiplicadora no combate à crise climática.
Disponível em: reclameaqui.com.br (Crise climática: um desafio a ser superado por todos). Acesso em: 29 maio 2026.

Analise as cinco frases criadas como propostas de título para o texto. Assinale a mais adequada, ou seja, a que melhor resume o conteúdo desenvolvido nele.`,
      'A crise climática e a responsabilidade de todos nós.',
      [
        'O excesso de emissões de gases na atmosfera.',
        'A principal causa da crise climática e seus principais efeitos.',
        'Gases de efeito estufa e aumento dos problemas respiratórios.',
        'Aumento da temperatura global e queda da produtividade agrícola.',
      ],
      'O bom título resume o texto TODO. O texto explica a crise climática (parágrafos 1 e 2) e termina dizendo que governos, empresas e cada pessoa precisam agir (parágrafos 3 a 5). As outras opções pegam só um detalhe: as emissões, a causa e os efeitos, os problemas respiratórios ou a temperatura e a agricultura.',
    ),
    o(
      'dificil',
      `(Enem) TEXTO I — Criatividade em publicidade: teorias e reflexões
Resumo: O presente artigo aborda uma questão primordial na publicidade: a criatividade. Apesar de aclamada pelos departamentos de Criação das agências, devemos ter a consciência de que nem todo anúncio é, de fato, criativo. A partir do resgate teórico, no qual os conceitos são tratados à luz da publicidade, busca-se estabelecer a compreensão dos temas. Para elucidar tais questões, é analisada uma campanha impressa da marca XXXX. As reflexões apontam que a publicidade criativa é essencialmente simples e apresenta uma releitura do cotidiano.
DEPEXE, S. D. Travessias: Pesquisas em Educação, Cultura, Linguagem e Artes, n. 2, 2008.

TEXTO II — homenagem promovida por um site de publicidade ao trabalho das mães, que brinca com o verbo "criar" (criar os filhos) e com a palavra "criação" (a área de Criação das agências).

Os dois textos versam sobre o tema criatividade. O texto I é um resumo de caráter científico e o texto II, uma homenagem promovida por um site de publicidade. De que maneira o texto II exemplifica o conceito de criatividade em publicidade apresentado no texto I?`,
      'Explorando a polissemia do termo "criação".',
      [
        'Fazendo menção ao difícil trabalho das mães em criar seus filhos.',
        'Promovendo uma leitura simplista do papel materno em seu trabalho de criar os filhos.',
        'Recorrendo a uma estrutura linguística simples.',
        'Utilizando recursos gráficos diversificados.',
      ],
      'O texto I diz que a publicidade criativa é simples e faz uma releitura do cotidiano. O texto II faz isso ao explorar a polissemia de "criação": o trabalho de criar filhos e a "criação" publicitária. Mencionar o trabalho das mães, sozinho, só descreve o tema; não mostra COMO a peça é criativa.',
    ),
    dq(
      'medio',
      `Leia o texto:

Jacaré de papo amarelo
Nome científico: Caiman latirostris
Classe: Reptilia
Ordem: Crocodylia
Família: Alligatoridae
Distribuição: Litoral do Rio Grande do Norte ao Rio Grande do Sul
Habitat: Lagoas litorâneas
Hábito: Noturno
Nome popular: JACARÉ DE PAPO AMARELO

Características: Sua cor é esverdeada, quase pardo, com o ventre amarelado, o focinho largo e achatado e pode medir até 3 metros de comprimento. Os jacarés são animais de hábitos noturnos e durante o dia formam grupos para tomar sol. Alimenta-se de peixes, aves e mamíferos. Seu período de reprodução é entre janeiro e março, época das grandes enchentes dos rios e põe entre 30 e 60 ovos por ninhada. Pode viver até 50 anos.

Os jacarés são animais ecologicamente importantes, pois fazem o controle biológico de outras espécies de animais, pois se alimentam dos animais mais velhos e fracos que não conseguem escapar de seu ataque. Além disso, suas fezes servem de alimento a peixes e outros seres vivos aquáticos. Hoje, os jacarés-de-papo-amarelo fazem parte da lista de animais em extinção do IBAMA. Isso se deve, principalmente, pela destruição de seu habitat e à poluição dos rios.
Disponível em: fiocruz.br/biosseguranca/Bis/infantil/jacareamarelo.html. Acesso em: 1º jun. 2026.

Complete a ficha de estudo da segunda parte do texto:

1. Características:
   1.1 físicas:
      1.1.1 cor: esverdeada quase parda; ventre amarelado
      1.1.2 focinho:
      1.1.3 tamanho:
   1.2 hábitos:
      1.2.1
      1.2.2
   1.3 alimentação:
   1.4 reprodução:
      1.4.1 período:
      1.4.2 ninhada:
   1.5 tempo de vida:
2. Importância ecológica:
   2.1
   2.2 fezes:
3. Situação:`,
      '1.1.2 focinho: largo e achatado. 1.1.3 tamanho: até 3 metros de comprimento. 1.2 hábitos: 1.2.1 noturnos; 1.2.2 durante o dia formam grupos para tomar sol. 1.3 alimentação: peixes, aves e mamíferos. 1.4 reprodução: 1.4.1 período: entre janeiro e março (época das grandes enchentes dos rios); 1.4.2 ninhada: de 30 a 60 ovos. 1.5 tempo de vida: até 50 anos. 2. Importância ecológica: 2.1 controle biológico de outras espécies (comem os animais mais velhos e fracos); 2.2 fezes: servem de alimento a peixes e outros seres aquáticos. 3. Situação: em extinção (lista do IBAMA), por causa da destruição do habitat e da poluição dos rios.',
      [
        'Preenche focinho e tamanho (largo e achatado; até 3 metros)',
        'Preenche os dois hábitos (noturnos; grupos para tomar sol de dia)',
        'Preenche alimentação e tempo de vida (peixes, aves e mamíferos; até 50 anos)',
        'Preenche reprodução (janeiro a março; 30 a 60 ovos)',
        'Preenche a importância ecológica (controle biológico; fezes como alimento)',
        'Preenche a situação (em extinção, por habitat destruído e rios poluídos)',
      ],
      'Uma ficha de estudo resume o texto em tópicos curtos, sem copiar frases inteiras.',
    ),
  ],
};

const MODULO_41: PacoteG2 = {
  slug: 'pb4-tc-modulo-41-verbos-ligacao',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Módulo 41: Verbos de ligação (TC online)',
  subtitle: 'Predicativo, predicado nominal e sentido do verbo: 2 objetivas e 1 dissertativa',
  description:
    'Exercícios do TC online do módulo 41: reconhecer o verbo de ligação e o predicativo, identificar o predicado nominal e explicar o aspecto que o verbo "virar" indica.',
  minutes: 20,
  questoes: [
    o(
      'medio',
      `Leia o trecho do texto jornalístico "'Anéis de carbono' vão simular o futuro na Amazônia":

O aumento do carbono na atmosfera pode levar a uma "savanização" da Amazônia, com sua vegetação adaptada a um clima de temperaturas mais altas e secas mais prolongadas. Mas o CO2 também pode "fertilizar" a floresta e torná-la temporariamente mais resistente a essas mudanças. "Seria um cenário de impacto positivo, pelo menos por um tempo, o que seria muito importante para chegarmos a políticas de emissão zero", diz Quesada. O projeto é "uma janela para o futuro: vamos poder abri-la e ver o que vai acontecer nos próximos 30 anos. E com isso ganhamos tempo", acrescenta [...]
O Estado de S. Paulo. Ambiente. 25 maio 2023. Acesso em: 29 maio 2026.

A respeito da oração "O projeto é 'uma janela para o futuro [...]'", é correto afirmar que seu verbo:`,
      'é de ligação, seu predicativo é "uma janela para o futuro", e esse atributo tem duração constante.',
      [
        'é transitivo direto, com o objeto direto "uma janela" e o adjunto adverbial de tempo "futuro".',
        'é de ligação, seu predicativo é "o futuro" e esse atributo tem duração temporária.',
        'é intransitivo, e "uma janela para o futuro" é o adjunto adverbial de tempo.',
      ],
      '"É" (verbo ser) não indica ação: liga o sujeito "O projeto" ao predicativo "uma janela para o futuro". O verbo "ser" marca um atributo de duração constante, e não temporária.',
    ),
    o(
      'medio',
      `Leia o trecho extraído de uma notícia jornalística.

${NOTICIA_TURCAS}

O predicado é nominal na alternativa:`,
      '"Que o brasileiro é apaixonado por novelas não é novidade."',
      [
        '"As plataformas de streaming têm apostado nos produtos audiovisuais de lá."',
        '"Minha Menina, uma série turca, ficou no Top 1 da HBO Max."',
        '"Algumas histórias que estão fazendo sucesso por aqui."',
      ],
      'Predicado nominal tem verbo de ligação + predicativo. Em "o brasileiro é apaixonado por novelas", "é" liga o sujeito ao predicativo "apaixonado por novelas". "Têm apostado" e "estão fazendo" são verbos de ação (predicado verbal), e "ficou no Top 1" indica posição alcançada, não só um estado.',
    ),
    dq(
      'medio',
      `Leia o trecho extraído de uma notícia jornalística.

${NOTICIA_TURCAS}

1. Considere o título da notícia.
a) Explique por que, no contexto citado, o verbo "virar" é de ligação.
b) Que aspecto do fato o verbo "virar" indica?
2. Identifique os termos da estrutura sintática da frase "Será Isso Amor?" e a função de cada um.`,
      '1a) Em "séries turcas viram febre no Brasil", "viram" não indica ação: liga o sujeito ("séries turcas") a uma característica, o predicativo ("febre no Brasil"). b) Indica mudança de estado: as séries passaram a ser febre (antes não eram). 2) "Será" é o verbo de ligação; "Isso" é o sujeito (aparece depois do verbo); "Amor" é o predicativo do sujeito. O predicado é nominal.',
      [
        '1a) Explica que "viram" liga o sujeito ao predicativo "febre" e não expressa ação',
        '1b) Diz que "virar" indica mudança de estado',
        '2) Identifica "Será" como verbo de ligação',
        '2) Identifica "Isso" como sujeito e "Amor" como predicativo do sujeito',
      ],
    ),
  ],
};

/* ------------------------------------------------------------------ extras (15 questões cada) */

const VERBOS_MISTO: PacoteG2 = {
  slug: 'pb4-verbos-e-ligacao-15',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Verbos e verbos de ligação (PB4)',
  subtitle: 'Tempos, modos, efeitos de sentido e ligação: 13 objetivas e 2 dissertativas',
  description:
    'Conjugação e efeito de sentido dos verbos: presente, pretérito perfeito, imperfeito e mais-que-perfeito, futuro do presente e do pretérito, subjuntivo, imperativo, aspecto verbal e verbos de ligação.',
  minutes: 60,
  questoes: [
    o(
      'facil',
      'Leia a frase: "Eu estudo todas as tardes." O verbo destacado ("estudo") está em qual tempo e modo, e que valor tem?',
      'Presente do indicativo, com valor de ação habitual (rotina).',
      [
        'Presente do subjuntivo, com valor de dúvida.',
        'Pretérito imperfeito do indicativo, com valor de hábito antigo.',
        'Futuro do presente do indicativo, com valor de ação posterior.',
      ],
      '"Todas as tardes" mostra rotina. O presente do indicativo apresenta o fato como real e habitual.',
    ),
    o(
      'medio',
      'Leia a frase: "Antigamente, eu estudava à noite." Qual alternativa classifica e explica corretamente o verbo "estudava"?',
      'Pretérito imperfeito do indicativo: ação contínua ou hábito antigo, sem marcar quando terminou.',
      [
        'Pretérito perfeito do indicativo: ação totalmente concluída no passado.',
        'Pretérito mais-que-perfeito: ação anterior a outra ação também passada.',
        'Pretérito imperfeito do subjuntivo: hipótese imaginária no passado.',
      ],
      'O imperfeito do indicativo ("estudava") descreve um costume do passado. "Antigamente" reforça o hábito. O perfeito ("estudei") seria uma ação concluída num momento marcado.',
    ),
    o(
      'medio',
      'Leia a frase: "Quando a prova começou, eu já tinha estudado." Sobre a relação entre as ações, é correto afirmar que:',
      '"tinha estudado" (mais-que-perfeito composto) indica uma ação passada anterior a "começou", que também está no passado.',
      [
        '"tinha estudado" indica uma ação posterior ao começo da prova.',
        '"começou" e "tinha estudado" ocorreram ao mesmo tempo.',
        '"tinha estudado" é futuro do pretérito, porque depende de uma condição.',
      ],
      'O mais-que-perfeito mostra o passado do passado: estudar aconteceu ANTES de a prova começar. O advérbio "já" reforça essa anterioridade.',
    ),
    o(
      'medio',
      'Leia a frase: "Eu estudaria mais se tivesse tempo." Sobre os verbos "estudaria" e "tivesse", é correto afirmar que:',
      '"estudaria" é futuro do pretérito do indicativo e "tivesse" é pretérito imperfeito do subjuntivo; juntos formam uma hipótese.',
      [
        '"estudaria" é futuro do presente e "tivesse" é futuro do subjuntivo; juntos formam uma certeza.',
        '"estudaria" é pretérito imperfeito do indicativo e "tivesse" é presente do subjuntivo; juntos formam uma ordem.',
        '"estudaria" é presente do subjuntivo e "tivesse" é pretérito perfeito; juntos formam um fato.',
      ],
      'O futuro do pretérito ("estudaria") indica uma ação que dependia de uma condição, expressa pelo imperfeito do subjuntivo ("se tivesse"). É uma hipótese, não um fato.',
    ),
    o(
      'medio',
      'Compare: I. "Eu estudarei amanhã." II. "Talvez eu estude amanhã." Qual alternativa explica corretamente a diferença de sentido?',
      'Em I, o indicativo (futuro do presente) mostra certeza; em II, o subjuntivo (presente) mostra dúvida ou possibilidade.',
      [
        'Em I, o subjuntivo mostra dúvida; em II, o indicativo mostra certeza.',
        'Em I, o imperativo dá uma ordem; em II, o indicativo dá um conselho.',
        'As duas frases têm o mesmo sentido, só muda o tempo do verbo.',
      ],
      'O MODO muda a atitude de quem fala: o indicativo apresenta o fato como certo; o subjuntivo, como duvidoso, possível ou desejado. O advérbio "talvez" pede subjuntivo.',
    ),
    o(
      'dificil',
      'Leia a frase: "Quando eu estudar o capítulo, te aviso." Sobre os verbos "estudar" e "aviso", é correto afirmar que:',
      '"estudar" é futuro do subjuntivo (ação futura eventual, que funciona como condição) e "aviso" é presente do indicativo com valor de futuro, que passa confiança ao receptor.',
      [
        '"estudar" é infinitivo impessoal e "aviso" é pretérito perfeito, com valor de ação concluída.',
        '"estudar" é futuro do presente e "aviso" é imperativo afirmativo, com valor de ordem.',
        '"estudar" é presente do subjuntivo e "aviso" é futuro do pretérito, com valor de hipótese.',
      ],
      'Depois de "quando", o futuro do subjuntivo ("estudar") aponta uma ação futura que ainda não se sabe se vai acontecer. O presente "aviso" fala do futuro como se fosse certo, o que dá segurança a quem escuta.',
    ),
    o(
      'medio',
      'Leia: I. "Estude bastante para a prova." II. "Não estude apenas na véspera do exame." Sobre os verbos destacados, é correto afirmar que:',
      'ambos estão no imperativo; o de I é afirmativo (conselho) e o de II é negativo (conselho para não fazer), e as duas formas vêm do presente do subjuntivo.',
      [
        'ambos estão no indicativo; o de I é presente e o de II é pretérito.',
        'o de I está no imperativo e o de II está no futuro do subjuntivo.',
        'ambos estão no subjuntivo, porque o imperativo só existe para ordens militares.',
      ],
      'O imperativo expressa ordem, pedido, conselho ou convite. Para "você", o afirmativo e o negativo usam as formas do presente do subjuntivo (estude / não estude).',
    ),
    o(
      'dificil',
      'Dirigindo-se a UM amigo, tratando-o por "tu", qual alternativa traz o imperativo NEGATIVO correto do verbo "pegar"?',
      'Não pegues o livro.',
      ['Não pega o livro.', 'Não pegas o livro.', 'Não pegar o livro.'],
      'O imperativo negativo de "tu" vem do presente do subjuntivo: "que tu pegues" → "não pegues". "Não pega" é uso da fala e "não pegas" é indicativo.',
    ),
    o(
      'medio',
      'Compare: I. "Ele ficou nervoso." II. "Ele ficou em casa." Qual alternativa classifica corretamente o verbo "ficar"?',
      'Em I é verbo de ligação (mudança de estado, com o predicativo "nervoso"); em II é verbo de ação (permaneceu no lugar).',
      [
        'Em I é verbo de ação; em II é verbo de ligação.',
        'Nas duas frases é verbo de ligação, porque "ficar" sempre liga.',
        'Nas duas frases é verbo de ação, porque o sujeito "ele" faz algo.',
      ],
      'O mesmo verbo muda de função conforme o contexto. Em I, "ficou" liga "ele" a "nervoso" e mostra mudança de estado. Em II, "em casa" é adjunto de lugar e "ficou" indica permanência no local.',
    ),
    o(
      'medio',
      'Associe corretamente o verbo de ligação ao sentido que ele costuma expressar:',
      'ficar: mudança de estado; continuar: permanência; parecer: aparência ou impressão.',
      [
        'ficar: permanência; continuar: aparência; parecer: mudança de estado.',
        'ficar: aparência; continuar: mudança de estado; parecer: permanência.',
        'ficar: ação; continuar: ação; parecer: ação.',
      ],
      '"Ele ficou nervoso" (mudou), "Ela continua animada" (se mantém), "Você parece cansado" (impressão). Já "ser" e "estar" indicam característica ou estado.',
    ),
    o(
      'medio',
      'O predicado é NOMINAL (verbo de ligação + predicativo) na alternativa:',
      'Ela continua animada.',
      ['Ontem eu estudei português.', 'Amanhã eu estudarei mais.', 'Estude bastante para a prova.'],
      '"Continua" liga "ela" ao predicativo "animada". Nas demais, os verbos (estudei, estudarei, estude) indicam ação: o predicado é verbal.',
    ),
    o(
      'dificil',
      'Qual alternativa relaciona corretamente a locução verbal ao aspecto da ação?',
      '"Começou a ler": início; "Estava lendo": continuidade; "Acabou de ler": conclusão.',
      [
        '"Começou a ler": conclusão; "Estava lendo": início; "Acabou de ler": continuidade.',
        '"Começou a ler": continuidade; "Estava lendo": conclusão; "Acabou de ler": início.',
        '"Começou a ler": início; "Estava lendo": conclusão; "Acabou de ler": continuidade.',
      ],
      'O aspecto verbal mostra a duração da ação: início, continuidade ou conclusão. "Estava lendo" usa o gerúndio, que indica ação em andamento.',
    ),
    o(
      'dificil',
      'Ao pedir um favor, uma pessoa diz: "Poderia me ajudar com este exercício?" Qual é o efeito de sentido do tempo verbal usado em "poderia"?',
      'O futuro do pretérito suaviza o pedido, deixando-o mais educado do que "Pode me ajudar?".',
      [
        'O futuro do pretérito indica que a ajuda já aconteceu no passado.',
        'O pretérito perfeito dá uma ordem direta ao ouvinte.',
        'O futuro do presente garante que a ajuda acontecerá amanhã.',
      ],
      'O futuro do pretérito, além de hipótese, serve para polidez: ele "distancia" o pedido e o torna menos brusco. É o mesmo efeito de "Queria um café" (imperfeito) no lugar de "Quero um café".',
    ),
    dq(
      'dificil',
      'Leia a frase: "Se eu estudasse mais, tiraria nota dez." a) Classifique os verbos "estudasse" e "tiraria" quanto ao tempo e ao modo. b) Reescreva a frase de modo que a hipótese se refira ao PASSADO (ela não aconteceu), usando o pretérito mais-que-perfeito composto do subjuntivo e o futuro do pretérito composto. c) Explique o efeito de sentido dessa hipótese.',
      'a) "Estudasse": pretérito imperfeito do subjuntivo; "tiraria": futuro do pretérito do indicativo. b) "Se eu tivesse estudado mais, teria tirado nota dez." c) A frase expressa uma hipótese irreal: a condição não aconteceu e, por isso, o resultado também não aconteceu. Em (a) a condição é imaginária; em (b) ela se refere a algo que não ocorreu no passado.',
      [
        'Classifica estudasse (pretérito imperfeito do subjuntivo) e tiraria (futuro do pretérito)',
        'Reescreve com "tivesse estudado" e "teria tirado"',
        'Explica que é uma hipótese ou condição irreal, que não se realizou',
      ],
    ),
    dq(
      'dificil',
      'Leia as frases: I. "O dia está frio." II. "O dia ficou frio." III. "O dia continua frio." a) Classifique o verbo de cada frase e indique o predicativo. b) Explique o sentido que cada verbo acrescenta (estado, mudança ou permanência). c) Explique por que o predicado dessas frases é nominal.',
      'a) Em todas, o verbo é de ligação ("está", "ficou", "continua") e o predicativo do sujeito é "frio". b) "Está" indica estado temporário; "ficou" indica mudança de estado (antes não estava frio); "continua" indica permanência do estado. c) O predicado é nominal porque a informação principal está no predicativo ("frio"), e o verbo apenas liga o sujeito a ele, sem indicar ação.',
      [
        'Classifica os três verbos como de ligação e aponta "frio" como predicativo',
        'Explica estado (está), mudança (ficou) e permanência (continua)',
        'Explica que o predicado é nominal porque o verbo só liga e a informação está no predicativo',
      ],
    ),
  ],
};

const RUA_MORGUE: PacoteG2 = {
  slug: 'pb4-rua-morgue-15',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Assassinatos da Rua Morgue (PB4)',
  subtitle: 'O conto de Edgar Allan Poe: 13 objetivas e 2 dissertativas',
  description:
    'Contexto, personagens, método de Dupin, o crime, o mistério e o desfecho do conto de Edgar Allan Poe, com questões de verbos aplicadas ao texto.',
  minutes: 60,
  questoes: [
    o(
      'facil',
      'Sobre o conto "Assassinatos da Rua Morgue", de Edgar Allan Poe, é correto afirmar que:',
      'é considerado um dos primeiros contos de detetive da literatura moderna.',
      [
        'é um conto de ficção científica sobre viagens no tempo.',
        'é um poema narrativo sobre a vida de um marinheiro.',
        'é uma crônica jornalística sobre a polícia de Londres.',
      ],
      'Poe é autor do primeiro grande conto policial: o detetive Auguste Dupin resolve o caso pelo raciocínio, e esse modelo influenciou autores como Conan Doyle.',
    ),
    o(
      'facil',
      'Quem é Auguste Dupin?',
      'O investigador analítico que resolve o caso pela lógica e pela observação, não pela força.',
      [
        'O marinheiro dono do orangotango.',
        'O chefe da polícia de Paris.',
        'O narrador, que conta a história com o nome revelado.',
      ],
      'Dupin é o detetive. Ele resolve o crime observando detalhes e organizando as informações, sem violência.',
    ),
    o(
      'medio',
      'Em relação ao narrador do conto, é correto afirmar que ele:',
      'é amigo de Dupin, acompanha a investigação em primeira pessoa e não tem a identidade revelada.',
      [
        'é a polícia, que narra em terceira pessoa, com identidade revelada.',
        'é o marinheiro, que confessa o crime em primeira pessoa.',
        'é uma das testemunhas, que ouviu vozes de línguas estrangeiras.',
      ],
      'O narrador-personagem conta o que viu ao lado de Dupin. Como ele fica sem nome, o foco do leitor se mantém no detetive.',
    ),
    o(
      'medio',
      'Qual é a principal diferença entre o método de Dupin e o da polícia?',
      'Dupin parte das provas e deixa que elas apontem os suspeitos; a polícia começa pelo suspeito e tenta encaixar as provas.',
      [
        'Dupin começa pelo suspeito e tenta encaixar as provas; a polícia parte das provas.',
        'Dupin usa a força e a intimidação; a polícia usa a observação e a lógica.',
        'Os dois usam o mesmo método, mas Dupin tem mais sorte.',
      ],
      'Dupin vai da evidência para a conclusão. A polícia faz o caminho contrário, e por isso acaba presa a uma ideia errada (prende o suspeito errado).',
    ),
    o(
      'medio',
      'No conto, a "análise" e a "lógica" têm funções complementares. Qual alternativa as define corretamente?',
      'Análise: observar detalhes e relações entre as informações e identificar o que é relevante. Lógica: organizar essas informações e chegar à conclusão correta.',
      [
        'Análise: chegar à conclusão correta. Lógica: observar detalhes.',
        'Análise: aceitar a primeira explicação. Lógica: confiar no palpite.',
        'Análise e lógica são sinônimos e não têm papel diferente.',
      ],
      'Dupin usa as duas: primeiro observa e separa o que importa (análise), depois organiza e conclui (lógica).',
    ),
    o(
      'facil',
      'Qual é o crime que abre o caso do conto?',
      'Duas mulheres são assassinadas dentro de casa, em Paris.',
      [
        'Um banco é roubado em Londres.',
        'Um marinheiro desaparece no mar.',
        'Uma joia some de um museu durante uma festa.',
      ],
      'As vítimas, mãe e filha, são encontradas mortas em casa, em Paris. A violência do crime espanta a vizinhança e a polícia.',
    ),
    o(
      'medio',
      'O que torna o crime um "mistério de quarto fechado"?',
      'A porta e as janelas estavam trancadas por dentro, e não havia pistas de quem tinha entrado.',
      [
        'A casa estava aberta, mas ninguém passou por ela.',
        'Os vizinhos viram o assassino entrar pela porta da frente.',
        'O assassino deixou um bilhete assinado.',
      ],
      'Como tudo estava trancado por dentro, parecia impossível alguém ter entrado ou saído. Isso desafia a lógica da polícia e dá espaço ao raciocínio de Dupin.',
    ),
    o(
      'medio',
      'Por que as vozes ouvidas pelas testemunhas confundiram a polícia?',
      'Porque as testemunhas associaram as vozes a línguas estrangeiras, e a polícia não conseguiu identificar quem falava.',
      [
        'Porque as testemunhas não ouviram nenhum som.',
        'Porque todas disseram que reconheciam a voz do culpado.',
        'Porque as vozes eram de crianças que brincavam na rua.',
      ],
      'As testemunhas pareciam concordar que havia vozes de língua estrangeira, mas não sabiam dizer qual. Dupin percebe que o "idioma" era, na verdade, a voz de um animal, não de uma língua humana.',
    ),
    o(
      'medio',
      'Qual é o desfecho do conto?',
      'O assassino era um orangotango que pertencia a um marinheiro, e Dupin chega a essa conclusão pelo raciocínio lógico.',
      [
        'O assassino era o próprio narrador, que confessa no final.',
        'O assassino era um vizinho, e a polícia o prende corretamente.',
        'O caso fica sem solução, e Dupin desiste da investigação.',
      ],
      'Dupin junta os detalhes (vozes, a força do crime, os cabelos que não eram humanos) e deduz que o autor foi um orangotango fugido do dono, um marinheiro.',
    ),
    o(
      'medio',
      'Leia a frase: "Dupin observou os detalhes e concluiu que o culpado não era humano." Sobre os verbos, é correto afirmar que:',
      '"observou" e "concluiu" estão no pretérito perfeito (ações concluídas), e "era" está no pretérito imperfeito (descreve uma característica do culpado no passado).',
      [
        '"observou" e "concluiu" estão no pretérito imperfeito, e "era" está no pretérito perfeito.',
        '"observou", "concluiu" e "era" estão no futuro do pretérito.',
        '"observou" e "concluiu" estão no presente do indicativo, e "era" está no imperativo.',
      ],
      'O pretérito perfeito marca o que Dupin fez e terminou. O imperfeito ("era") descreve o estado do culpado, sem marcar quando acabou. Além disso, "era" é verbo de ligação (liga "culpado" a "humano").',
    ),
    o(
      'dificil',
      'Leia a frase: "Se a polícia tivesse observado melhor as provas, teria percebido o erro." Qual alternativa classifica corretamente "tivesse observado" e "teria percebido" e explica o sentido da frase?',
      '"Tivesse observado" é mais-que-perfeito composto do subjuntivo e "teria percebido" é futuro do pretérito composto; juntos expressam uma hipótese irreal no passado.',
      [
        '"Tivesse observado" é futuro do subjuntivo e "teria percebido" é presente do indicativo; juntos expressam uma ordem.',
        '"Tivesse observado" é pretérito perfeito do indicativo e "teria percebido" é imperativo; juntos expressam um fato real.',
        '"Tivesse observado" é presente do subjuntivo e "teria percebido" é futuro do presente; juntos expressam uma certeza.',
      ],
      'A condição ("se tivesse observado") não aconteceu, então a consequência ("teria percebido") também não. É uma hipótese que se refere ao passado.',
    ),
    o(
      'dificil',
      'Leia a frase: "Quando o marinheiro aparecer, Dupin explicará tudo." Sobre os verbos "aparecer" e "explicará", é correto afirmar que:',
      '"aparecer" está no futuro do subjuntivo (ação futura eventual, que funciona como condição) e "explicará" está no futuro do presente do indicativo.',
      [
        '"aparecer" está no infinitivo e "explicará" está no pretérito perfeito.',
        '"aparecer" está no presente do indicativo e "explicará" está no pretérito mais-que-perfeito.',
        '"aparecer" está no imperativo e "explicará" está no futuro do pretérito.',
      ],
      'Depois de "quando", o futuro do subjuntivo indica uma ação futura que ainda é eventual. O futuro do presente ("explicará") apresenta o que vai acontecer depois, como um fato.',
    ),
    o(
      'medio',
      'Imagine que o narrador dê um conselho a um policial: "Observe os detalhes e não se prenda ao primeiro suspeito." Os verbos "observe" e "prenda" estão em qual modo?',
      'No imperativo (afirmativo e negativo), usado para dar um conselho.',
      [
        'No indicativo, porque apresentam fatos reais.',
        'No subjuntivo, porque expressam apenas dúvida.',
        'Nas formas nominais, porque não indicam pessoa.',
      ],
      'O imperativo expressa ordem, pedido ou conselho. "Observe" é afirmativo e "não se prenda" é negativo, ambos formados a partir do presente do subjuntivo.',
    ),
    dq(
      'medio',
      'Explique a diferença entre o método de Dupin e o método da polícia e mostre como o método de Dupin foi essencial para resolver o mistério do quarto trancado por dentro. Use as ideias de "análise" e de "lógica".',
      'A polícia começa pelo suspeito e tenta encaixar as provas, por isso prende o suspeito errado e não explica as vozes nem o quarto trancado. Dupin parte das provas e deixa que elas apontem a resposta. Pela análise, observa detalhes e relações (as vozes de "línguas estrangeiras", a força do crime, a forma de entrar e sair da casa). Pela lógica, organiza esses dados e chega à conclusão correta: o autor não era humano, era um orangotango de um marinheiro.',
      [
        'Diferencia os métodos (provas primeiro × suspeito primeiro)',
        'Explica a análise (observar detalhes e relações)',
        'Explica a lógica (organizar e concluir)',
        'Liga o método à solução do crime (orangotango do marinheiro)',
      ],
    ),
    dq(
      'dificil',
      'Escreva um resumo do conto em 5 a 7 linhas, no PASSADO, contando o crime, o mistério e o desfecho. Depois, explique por que você usou o pretérito perfeito para alguns verbos e o pretérito imperfeito para outros, dando um exemplo de cada.',
      'Resumo esperado: em Paris, duas mulheres foram assassinadas dentro de casa; a porta e as janelas estavam trancadas por dentro e não havia pistas de quem entrou; as testemunhas ouviam vozes de línguas estrangeiras, o que confundia a polícia; Dupin analisou as provas e concluiu que o assassino era um orangotango que pertencia a um marinheiro. Explicação: o pretérito perfeito indica ações concluídas, os fatos principais da história (ex.: "foram assassinadas", "concluiu"); o pretérito imperfeito indica ações em andamento, cenário e descrição (ex.: "estavam trancadas", "confundia").',
      [
        'Resume o crime, o mistério e o desfecho',
        'Usa o passado de forma coerente no resumo',
        'Explica que o pretérito perfeito marca ações concluídas e o imperfeito, descrição ou ação contínua',
        'Dá um exemplo correto de cada tempo',
      ],
    ),
  ],
};

export const PACOTES_TCS_ONLINE: PacoteG2[] = [MODULO_38, MODULO_40, MODULO_41];
export const PACOTES_PB4_EXTRAS: PacoteG2[] = [VERBOS_MISTO, RUA_MORGUE];
