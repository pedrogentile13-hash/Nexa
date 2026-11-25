import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA7 · Português (9º ano, módulos 34 a 41). Os textos são elaborados para estes simulados (não são trechos de
 * obras ou de jornais); o estilo de cobrança segue as provas P-1 e P-3 do Anglo: texto-base curto, enunciado
 * interpretativo e cinco alternativas, em que as erradas costumam estar "quase certas".
 */

/* ------------------------------------------------------------ SIMULADO BASE (10) */

export const PORTUGUES_BASE: QuestaoG2[] = [
  o(
    'facil',
    `Leia o relato.

Na palestra sobre reciclagem, Laura anotou três palavras-chave e, depois, contou aos colegas o que tinha entendido: "O palestrante disse que separar o lixo em casa é o primeiro passo e que a coleta seletiva só funciona se todos colaborarem".

Ao reproduzir oralmente a fala do palestrante, Laura`,
    'retomou as ideias principais com as próprias palavras, mantendo o sentido original.',
    [
      'copiou cada palavra do palestrante, sem nenhuma alteração.',
      'apresentou apenas a opinião pessoal dela, sem relação com a palestra.',
      'mudou o sentido da palestra, porque contou o que lhe pareceu mais interessante.',
      'deixou de ouvir com atenção, já que precisou anotar palavras-chave.',
    ],
    'Reproduzir oralmente é retomar o que se ouviu (ideias principais) com palavras próprias e sem mudar o sentido. Anotar palavras-chave é uma boa estratégia de escuta ativa.',
  ),
  o(
    'medio',
    `Leia a fala de um apresentador de jornal:

"Boa noite. A prefeitura anunciou, hoje, que o novo parque será aberto ao público no sábado. A entrada é gratuita."

Em uma conversa informal, a mesma notícia poderia ser contada assim: "Cara, o parque novo abre sábado e é de graça!"

A diferença entre as duas falas mostra que a linguagem oral`,
    'muda conforme a situação de comunicação e o interlocutor.',
    [
      'só pode ser usada em situações informais, sem monitoramento.',
      'é sempre incorreta quando se afasta da norma-padrão.',
      'perde as informações essenciais quando é informal.',
      'deve ser a mesma em todos os contextos para ser compreendida.',
    ],
    'As duas falas trazem a mesma informação, mas em registros diferentes: um mais formal (jornal) e outro informal (conversa entre amigos). A adequação depende de quem fala, para quem e em que situação.',
  ),
  o(
    'medio',
    'Assinale a alternativa em que a regência do verbo em destaque está de acordo com a norma-padrão.',
    'Os alunos ASSISTIRAM ao filme sobre a Amazônia.',
    [
      'Os alunos ASSISTIRAM o filme sobre a Amazônia, com muita atenção.',
      'Os alunos PREFEREM mais o cinema do que o teatro, sempre.',
      'Os alunos OBEDECEM as regras da biblioteca, quase sempre.',
      'Os alunos CHEGARAM na escola mais cedo, como combinado.',
    ],
    'No sentido de "ver", "assistir" pede a preposição "a" (assistir ao filme). "Preferir" dispensa "mais" e pede "a" (prefiro cinema a teatro); "obedecer" pede "a" (obedecem às regras); "chegar" pede "a" (chegaram à escola).',
  ),
  o(
    'medio',
    `Na fala, é comum ouvir: "Eu esqueci do caderno em casa." Na escrita monitorada, de acordo com a norma-padrão, a forma adequada é:`,
    'Eu me esqueci do caderno em casa.',
    [
      'Eu esqueci do caderno em casa.',
      'Eu esqueci ao caderno em casa.',
      'Eu me esqueci o caderno em casa.',
      'Eu esqueci-me ao caderno em casa.',
    ],
    'O verbo "esquecer" tem duas construções corretas: sem pronome, com objeto direto ("esqueci o caderno"); ou pronominal, com a preposição "de" ("esqueci-me do caderno" / "eu me esqueci do caderno"). Misturar as duas ("esqueci do caderno") é comum na fala, mas foge da norma-padrão.',
  ),
  o(
    'medio',
    `Leia o trecho de um artigo de opinião.

"Na semana passada, meu vizinho, que sempre deixava a mangueira ligada, recebeu uma conta de água três vezes maior que a de costume. Ele aprendeu na carteira o que nenhuma campanha tinha conseguido: desperdiçar custa caro."

No artigo de opinião, o relato sobre o vizinho tem a função de`,
    'ilustrar com um caso concreto a tese defendida pelo autor.',
    [
      'apresentar a conclusão do texto, encerrando a discussão.',
      'desviar o leitor do assunto principal por meio de uma anedota.',
      'mostrar que o autor não tem opinião formada sobre o tema.',
      'narrar uma história de ficção que não se relaciona ao argumento.',
    ],
    'Em textos argumentativos, a narração pode servir de exemplo: um fato curto (o relato do vizinho) ajuda a sustentar o ponto de vista do autor (desperdiçar custa caro).',
  ),
  o(
    'medio',
    `Leia o trecho de um conto policial.

A detetive observou o quarto em silêncio. A janela estava trancada por dentro, a xícara de chá ainda estava morna e havia uma pegada de lama perto da porta, mas não havia lama em nenhum outro ponto da casa.

"Quem entrou aqui", pensou ela, "já conhecia o caminho e não queria ser visto."

No trecho, a "pegada de lama" funciona como`,
    'uma pista que ajuda a detetive a deduzir como o culpado agiu.',
    [
      'um enfeite descritivo, sem importância para a investigação.',
      'a confissão do culpado, que deixou a marca de propósito.',
      'o desfecho do conto, que revela o nome do criminoso.',
      'uma prova de que a detetive não sabia analisar o ambiente.',
    ],
    'No conto policial, os detalhes do cenário são pistas. A pegada isolada permite deduzir que alguém de fora entrou, andou pouco e conhecia a casa.',
  ),
  o(
    'medio',
    `Leia o texto.

Antes de sair, o detetive disse à assistente:
— Feche a porta e não toque em nada.
— E se alguém telefonar? — perguntou ela.
— Anote o recado. Talvez seja o culpado.

Os verbos "feche" e "toque" e a forma "Talvez seja" expressam, respectivamente,`,
    'ordem (imperativo), proibição (imperativo) e dúvida (subjuntivo).',
    [
      'ordem (imperativo), proibição (imperativo) e certeza (indicativo).',
      'fato (indicativo), proibição (imperativo) e certeza (indicativo).',
      'ordem (imperativo), pergunta (indicativo) e hipótese passada (subjuntivo).',
      'conselho (subjuntivo), ordem (indicativo) e certeza (indicativo).',
    ],
    '"Feche" é imperativo afirmativo (ordem); "não toque" é imperativo negativo (proibição); "talvez seja" está no presente do subjuntivo e expressa dúvida/possibilidade.',
  ),
  o(
    'medio',
    `Leia a frase.

"Se a testemunha tivesse falado a verdade desde o início, a polícia teria encontrado o culpado mais cedo."

Sobre as formas "tivesse falado" e "teria encontrado", é correto afirmar que expressam`,
    'uma hipótese irreal no passado e a consequência que ela teria tido.',
    [
      'um fato real do passado e a sua consequência certa.',
      'uma ordem no presente e uma promessa para o futuro.',
      'uma ação habitual no passado e uma ação concluída no passado.',
      'uma dúvida sobre o futuro e uma ação em andamento no presente.',
    ],
    '"Tivesse falado" (mais-que-perfeito composto do subjuntivo) apresenta uma condição que NÃO aconteceu; "teria encontrado" (futuro do pretérito composto) indica o que aconteceria se a condição tivesse ocorrido.',
  ),
  o(
    'medio',
    `Leia o trecho de um texto didático.

"A fotossíntese é o processo pelo qual as plantas produzem o próprio alimento. Para isso, elas usam luz solar, água e gás carbônico. Veja o esquema abaixo: ele mostra a entrada desses elementos e a saída do oxigênio."

A finalidade e uma característica do texto são, respectivamente:`,
    'informar e explicar um conteúdo; definição e uso de recursos de apoio, como o esquema.',
    [
      'divertir o leitor; linguagem poética e figurada.',
      'convencer o leitor de uma ideia; uso de opinião pessoal e de ironia.',
      'narrar um acontecimento; presença de personagens e de enredo.',
      'instruir sobre como agir; verbos no imperativo em sequência de passos.',
    ],
    'O texto didático informa e explica com clareza: define ("a fotossíntese é..."), usa termos técnicos explicados e se apoia em esquemas, exemplos e comparações.',
  ),
  o(
    'medio',
    `Leia a frase.

"Depois da chuva, a rua ficou intransitável."

Sobre o verbo "ficou", é correto afirmar que`,
    'é de ligação, pois liga o sujeito "a rua" ao predicativo "intransitável" e indica mudança de estado.',
    [
      'é de ação, pois indica o que a rua fez depois da chuva.',
      'é de ligação, pois indica permanência de um estado que já existia antes da chuva.',
      'é de ação, e "intransitável" é o objeto direto do verbo.',
      'é de fenômeno da natureza, pois a frase fala da chuva.',
    ],
    '"Ficar", nesse sentido, é verbo de ligação e indica mudança de estado (a rua passou a ser intransitável). Para indicar permanência, o verbo seria "continuar" ou "permanecer".',
  ),
];

/* ------------------------------------------------------ SIMULADO NÍVEL PROVA (10) */

export const PORTUGUES_PROVA: QuestaoG2[] = [
  o(
    'medio',
    `Leia o fragmento de conto.

Naquela terça-feira, o relógio da sala parou às 21h40. O sr. Anselmo, que dizia nunca ter saído do escritório, tinha na manga do paletó um fio de lã azul, igual ao que a inspetora encontrara na cerca do jardim. Ela não comentou nada. Pediu um copo de água, sorriu e deixou que ele continuasse a falar.

O comportamento da inspetora no final do fragmento produz o efeito de`,
    'criar suspense, pois ela guarda a pista e deixa o suspeito se denunciar.',
    [
      'revelar ao leitor que o culpado já foi descoberto e preso.',
      'mostrar que ela considera o sr. Anselmo inocente.',
      'interromper a investigação por falta de provas.',
      'transformar o conto em narrativa de aventura, sem mistério.',
    ],
    'A inspetora liga o fio de lã (pista) ao suspeito, mas não revela o que sabe. Ao se calar, ela mantém o leitor na expectativa: é o suspense, típico da narrativa policial.',
  ),
  o(
    'medio',
    `Leia o texto.

A detetive chegou à casa às 8h. Na entrada, notou a bengala jogada no chão. Ao interrogar o mordomo, descobriu que o dono da casa fora visto pela última vez à meia-noite. Só então percebeu que o relógio da sala marcava 3h, embora o mordomo tivesse dito que o tinha acertado ao amanhecer.

Em relação ao tempo da narrativa, o trecho`,
    'mistura tempos diferentes, pois retoma fatos passados (a última vez que o dono foi visto) para formular novas dúvidas.',
    [
      'segue uma ordem cronológica rígida, sem nenhuma retomada do passado.',
      'antecipa o futuro, ao contar o que a detetive ainda vai descobrir.',
      'suspende o tempo, descrevendo apenas objetos.',
      'apresenta somente ações simultâneas, sem relação de anterioridade.',
    ],
    'Ao interrogar o mordomo, a narrativa recorre a fatos anteriores ("fora visto à meia-noite", "tinha acertado") para criar a dúvida sobre o relógio. A narrativa policial costuma recompor o passado a partir das pistas do presente.',
  ),
  o(
    'dificil',
    `Leia o trecho.

"Não pude acreditar. Passei a noite inteira diante da porta e ninguém entrou. Se tivesse entrado alguém, eu teria visto."

O narrador desse trecho é um personagem que participa do fato narrado. Esse tipo de narrador, em um conto policial, cria o efeito de`,
    'credibilidade e dúvida, pois o leitor só sabe o que o narrador viu e pode desconfiar dele.',
    [
      'onisciência, já que ele conhece os pensamentos de todos os personagens.',
      'neutralidade total, porque o narrador não interfere na história.',
      'distanciamento, pois a história é contada por alguém que não esteve lá.',
      'certeza absoluta sobre quem é o culpado.',
    ],
    'Narrador-personagem (1ª pessoa) tem visão limitada: conta o que viu e sentiu. O leitor passa a questionar se ele diz toda a verdade, o que reforça o mistério.',
  ),
  o(
    'medio',
    `Leia o fragmento.

Um jornal local publicou: "A cidade vive dias de medo: em 15 dias, 12 casas foram assaltadas." No mesmo caderno, uma psicóloga afirma: "O medo se espalha mais rápido que o crime."

Quando um texto passa da narração de fatos para a argumentação, ele costuma`,
    'usar os fatos como base para defender uma tese ou um ponto de vista.',
    [
      'deixar de apresentar dados para apenas contar uma história.',
      'substituir qualquer opinião por uma descrição neutra.',
      'abandonar a ordem lógica e organizar-se somente pela cronologia.',
      'evitar vozes de especialistas, para não sustentar nenhuma tese.',
    ],
    'Na argumentação, dados e relatos (narração) viram argumentos: servem de base para a tese. A citação de especialista é um argumento de autoridade.',
  ),
  o(
    'medio',
    `Leia a reescrita de uma frase.

Original: "Os candidatos aspiravam o cargo de diretor."
Reescrita: "Os candidatos aspiravam ao cargo de diretor."

A alteração feita se justifica porque o verbo "aspirar", no sentido de "desejar, almejar",`,
    'é transitivo indireto e exige a preposição "a".',
    [
      'é transitivo direto e dispensa a preposição.',
      'é intransitivo e não admite complemento.',
      'é de ligação e pede um predicativo.',
      'pede a preposição "em" na norma-padrão.',
    ],
    'Aspirar = desejar pede preposição "a" (aspirar a algo). Já no sentido de "inalar", é transitivo direto: aspirar o ar.',
  ),
  o(
    'dificil',
    `Leia o trecho de uma instrução.

"Pesquise a origem da informação. Confirme se outros veículos publicaram a mesma notícia. Não compartilhe antes de checar."

O trecho combina diferentes modos verbais. É correto afirmar que o modo`,
    'imperativo predomina, pois as frases orientam o leitor e dão instruções.',
    [
      'indicativo predomina, pois as frases apresentam fatos já comprovados.',
      'subjuntivo predomina, pois as frases expressam hipóteses.',
      'indicativo predomina, pois as frases descrevem uma rotina.',
      'imperativo é usado somente em "Não compartilhe", que é uma pergunta.',
    ],
    '"Pesquise", "confirme" e "não compartilhe" são imperativos (afirmativo e negativo). O texto tem a finalidade de orientar o leitor.',
  ),
  o(
    'dificil',
    `Leia a frase.

"Quando o inspetor chegou ao local, o ladrão já tinha fugido."

Em relação à ordem dos fatos e aos tempos verbais, é correto afirmar que`,
    '"tinha fugido" (mais-que-perfeito) indica uma ação anterior à chegada do inspetor.',
    [
      '"chegou" e "tinha fugido" indicam ações simultâneas.',
      '"tinha fugido" é uma ação futura em relação a "chegou".',
      '"chegou" está no pretérito imperfeito e indica hábito.',
      '"chegou" é futuro do pretérito, pois depende de uma condição.',
    ],
    'O mais-que-perfeito (tinha fugido) é o "passado do passado": a fuga aconteceu antes de o inspetor chegar (pretérito perfeito).',
  ),
  o(
    'medio',
    `Leia o texto.

Planetas rochosos, como a Terra, são formados principalmente por rocha e metal. Os planetas gasosos, como Júpiter, são formados principalmente por gases. Comparando os dois grupos, vê-se que os rochosos são menores e mais densos.

No texto didático, o trecho "Comparando os dois grupos" apresenta`,
    'um recurso de explicação que organiza a informação por comparação.',
    [
      'uma opinião pessoal do autor sobre os planetas.',
      'uma ordem dirigida ao leitor.',
      'um relato de experiência do autor.',
      'uma pergunta retórica para provocar o leitor.',
    ],
    'Comparações, exemplos, definições, quadros e esquemas são recursos de apoio do texto didático para explicar o conteúdo com clareza.',
  ),
  o(
    'dificil',
    `Leia as frases.

I. "A criança está tranquila."
II. "A criança continua tranquila."
III. "A criança ficou tranquila."
IV. "A criança parece tranquila."

Em relação ao sentido dos verbos de ligação, as frases expressam, respectivamente:`,
    'estado temporário; permanência; mudança de estado; aparência.',
    [
      'estado permanente; mudança de estado; permanência; aparência.',
      'aparência; estado temporário; permanência; mudança de estado.',
      'mudança de estado; estado permanente; aparência; permanência.',
      'permanência; aparência; estado temporário; mudança de estado.',
    ],
    '"Está" = estado temporário; "continua" = permanência; "ficou" = mudança de estado; "parece" = aparência, impressão. "Ser" é o verbo do estado constante.',
  ),
  o(
    'dificil',
    `Leia o enunciado de uma atividade de revisão de texto.

"Reescreva a frase de acordo com a norma-padrão: Prefiro mais ler romances do que assistir filmes."

A reescrita que atende à norma-padrão é:`,
    'Prefiro ler romances a assistir a filmes.',
    [
      'Prefiro mais ler romances a assistir filmes.',
      'Prefiro ler romances do que assistir a filmes.',
      'Prefiro mais ler romances do que assistir a filmes.',
      'Prefiro ler romances que assistir filmes.',
    ],
    'Dois ajustes: "preferir" exige a preposição "a" (prefiro isto a aquilo), sem "mais" e sem "do que"/"que"; e "assistir" (ver) também pede "a" (assistir a filmes).',
  ),
];
