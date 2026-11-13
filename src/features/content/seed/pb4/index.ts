import { dq, o, type PacoteG2 } from '../grande2/types';
import { resumo, type ResumoG3, type TrilhaG3 } from '../grande3/types';

/**
 * Português · 4º bimestre · 9º ano C (Anglo Morumbi). Simulados e resumos a partir das listas de exercícios
 * da professora (Verbos de ligação, Modos verbais e formas nominais, Vozes verbais e Lista 1 – base nas VA).
 * Carregado pelo botão "Conteúdo da escola" do Admin, e só para a escola escolhida. Tudo entra como rascunho.
 */
export const PB4_TAG = 'pb4-portugues';

const MATERIA = 'lingua-portuguesa';
const SERIE = '9º ano' as const;

/* ------------------------------------------------------------------ simulados */

/** Lista "Verbos de ligação e seus sentidos" (13/11): as 5 questões dissertativas, como estão na lista. */
const VERBO_LIGACAO: PacoteG2 = {
  slug: 'pb4-verbo-ligacao-simulado',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Verbos de ligação (PB4)',
  subtitle: 'Lista do 4º bimestre: 5 questões dissertativas, corrigidas pela IA',
  description:
    'Verbos de ligação e seus sentidos: função, diferença entre ser e estar, predicativo do sujeito e uso como verbo de ação. Cada resposta é corrigida pela IA com o gabarito da professora.',
  minutes: 50,
  questoes: [
    dq(
      'medio',
      'Explique qual é a principal função dos verbos de ligação em uma oração e por que eles são chamados dessa forma. Em sua resposta, diferencie-os dos verbos de ação.',
      'Os verbos de ligação estabelecem a ligação entre o sujeito e uma característica ou estado atribuído a ele (o predicativo do sujeito). São chamados de "ligação" porque não expressam ação. Diferentemente dos verbos de ação, que indicam algo que o sujeito faz ou sofre, eles expressam estado, qualidade ou condição. Ex.: "O cão é manso": "é" apenas liga "O cão" ao atributo "manso".',
      [
        'Diz que o verbo de ligação conecta o sujeito a um atributo (predicativo)',
        'Explica o nome "ligação": não expressa ação',
        'Diferencia de verbo de ação (ação ou fenômeno concreto, estado para ligação)',
        'Usa um exemplo correto',
      ],
    ),
    dq(
      'medio',
      'Analise as diferenças de sentido entre os enunciados "A moça é bonita" e "A moça está bonita". Explique como a escolha do verbo de ligação altera o significado da frase e qual aspecto verbal cada um deles expressa.',
      'Em "A moça é bonita", o verbo "ser" indica que a beleza é um atributo contínuo e permanente, uma característica inerente da moça. Em "A moça está bonita", o verbo "estar" indica um atributo temporário, limitado no tempo (talvez por estar arrumada ou maquiada). A escolha do verbo altera o sentido: ser indica duração permanente; estar indica duração transitória.',
      [
        'Explica que "ser" marca atributo permanente ou inerente',
        'Explica que "estar" marca atributo temporário, momentâneo',
        'Conclui que a escolha do verbo muda o sentido da frase',
      ],
    ),
    dq(
      'medio',
      'Considerando os verbos de ligação "ser", "estar" e "permanecer", explique qual aspecto de duração cada um deles expressa quando utilizado em uma oração. Utilize exemplos para ilustrar sua resposta.',
      '"Ser" expressa atributo de duração constante e ilimitada: "O cão é doente" (condição permanente). "Estar" expressa duração temporária e limitada: "O cão está doente" (agora, mas pode melhorar). "Permanecer" expressa que o estado se mantém e persiste ao longo do tempo: "O cão permanece doente" (continua doente).',
      [
        'Associa "ser" a duração constante ou ilimitada, com exemplo',
        'Associa "estar" a duração temporária, com exemplo',
        'Associa "permanecer" à persistência do estado, com exemplo',
      ],
    ),
    dq(
      'medio',
      'O que é o predicativo do sujeito e qual é sua relação com o verbo de ligação? Explique também como ocorre a concordância entre o predicativo e o sujeito.',
      'O predicativo do sujeito é um adjetivo ou substantivo que expressa uma característica, estado ou qualidade atribuída ao sujeito; é o núcleo do predicado nominal. O verbo de ligação apenas conecta esse predicativo ao sujeito, que carrega a informação principal. O predicativo concorda com o sujeito em gênero e número. Ex.: "Esse animal é transmissor" e "Machos adultos são solitários".',
      [
        'Define predicativo do sujeito como adjetivo ou substantivo que atribui característica',
        'Explica que o verbo de ligação apenas faz a ponte',
        'Explica a concordância em gênero e número com o sujeito',
      ],
    ),
    dq(
      'dificil',
      'Um mesmo verbo pode funcionar como verbo de ligação ou como verbo de ação, dependendo do contexto. Explique essa afirmação e apresente exemplos que demonstrem essa diferença de uso com pelo menos dois verbos diferentes.',
      'A classificação depende da função sintática na oração, não só da forma do verbo. "Continuar" é de ligação em "O cão continua manso" (liga o sujeito ao estado) e intransitivo em "A história continua amanhã" (ação de prosseguir). "Andar" é de ligação em "Os javalis andam nocivos" (estado) e intransitivo em "Os javalis andam pelas florestas" (movimento).',
      [
        'Explica que a função na oração define a classificação do verbo',
        'Dá exemplo de ligação e de ação para o mesmo verbo',
        'Usa pelo menos dois verbos diferentes',
      ],
    ),
  ],
};

/** Lista "Modos verbais e formas nominais", parte 1 (questões 1 a 12): modos indicativo, subjuntivo e imperativo. */
const MODOS_1: PacoteG2 = {
  slug: 'pb4-modos-verbais-1',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Modos verbais, parte 1 (PB4)',
  subtitle: 'Indicativo, subjuntivo e imperativo: 12 questões dissertativas',
  description:
    'Primeira metade da lista de modos verbais: identificar o modo e o tempo, a diferença de sentido entre indicativo e subjuntivo, e o uso do imperativo.',
  minutes: 50,
  questoes: [
    dq(
      'medio',
      'Leia o período: "Os estudantes organizaram a exposição literária e apresentarão seus trabalhos à comunidade escolar." a) Identifique os verbos presentes no período. b) Indique o tempo verbal de cada verbo e explique por que eles pertencem ao modo indicativo.',
      'a) Verbos: organizaram e apresentarão. b) "Organizaram" está no pretérito perfeito do indicativo (ação concluída no passado); "apresentarão" está no futuro do presente do indicativo (ação que ocorrerá). Pertencem ao indicativo porque apresentam ações como fatos reais.',
      [
        'Identifica organizaram e apresentarão',
        'Classifica cada tempo corretamente',
        'Explica que o indicativo apresenta ações como fatos',
      ],
    ),
    dq(
      'medio',
      'Leia a frase: "Todos os dias, Mariana lê alguns capítulos do livro antes de dormir." a) Identifique o verbo e indique seu tempo verbal. b) Reescreva a frase no pretérito perfeito do indicativo. c) Reescreva a frase no futuro do presente do indicativo.',
      'a) "Lê", presente do indicativo. b) "Mariana leu alguns capítulos do livro antes de dormir." c) "Mariana lerá alguns capítulos do livro antes de dormir."',
      [
        'Identifica "lê" como presente do indicativo',
        'Reescreve no pretérito perfeito',
        'Reescreve no futuro do presente',
      ],
    ),
    dq(
      'medio',
      'Explique a diferença de sentido entre os verbos destacados nas frases: I. "Os alunos estudam para a avaliação." II. "Os alunos estudaram para a avaliação." III. "Os alunos estudarão para a avaliação."',
      'I: presente do indicativo, ação habitual ou atual. II: pretérito perfeito, ação concluída no passado. III: futuro do presente, ação que ocorrerá depois. O tempo muda o momento em que a ação acontece.',
      [
        'Explica o presente como ação habitual ou atual',
        'Explica o pretérito como ação concluída',
        'Explica o futuro como ação posterior',
      ],
    ),
    dq(
      'dificil',
      'Leia o trecho: "Quando chegou à escola, Pedro percebeu que havia esquecido o material em casa." Identifique os verbos do trecho, classifique-os quanto ao tempo e ao modo verbal e explique a relação temporal entre as ações.',
      'Chegou: pretérito perfeito do indicativo. Percebeu: pretérito perfeito do indicativo. Havia esquecido: pretérito mais-que-perfeito composto do indicativo. "Havia esquecido" é anterior às outras duas ações: Pedro esqueceu o material antes de chegar e perceber.',
      [
        'Classifica os três verbos quanto a tempo e modo',
        'Identifica o mais-que-perfeito composto',
        'Explica que esquecer ocorreu antes das outras ações',
      ],
    ),
    dq(
      'dificil',
      'Leia as frases: I. "Espero que você consiga concluir a atividade." II. "Se nós tivéssemos mais tempo, visitaríamos a exposição." III. "Quando ela terminar o trabalho, poderá descansar." a) Identifique os verbos. b) Indique o tempo verbal de cada um. c) Explique o que o modo subjuntivo expressa em cada situação.',
      'a) consiga, tivéssemos, visitaríamos, terminar, poderá. b) I: presente do subjuntivo; II: pretérito imperfeito do subjuntivo (e futuro do pretérito, visitaríamos, no indicativo); III: futuro do subjuntivo (terminar) e futuro do presente (poderá). c) I expressa desejo ou expectativa; II expressa hipótese ou condição irreal; III expressa uma ação futura e incerta, condicionada ao término.',
      [
        'Identifica os verbos das três frases',
        'Classifica os tempos do subjuntivo',
        'Explica desejo, hipótese e condição no subjuntivo',
      ],
    ),
    dq(
      'medio',
      'Reescreva as frases empregando os verbos entre parênteses no tempo adequado do modo subjuntivo: a) Espero que os alunos __________ o conteúdo. (compreender) b) Se eu __________ mais cedo, teria encontrado meus colegas. (chegar) c) Quando vocês __________ a pesquisa, apresentem os resultados. (concluir) d) Talvez ela __________ à reunião amanhã. (comparecer)',
      'a) compreendam (presente do subjuntivo). b) tivesse chegado (pretérito imperfeito do subjuntivo). c) concluírem (futuro do subjuntivo). d) compareça (presente do subjuntivo).',
      [
        'Acerta os tempos do subjuntivo nas quatro frases',
        'Usa a forma verbal correta de cada pessoa',
      ],
    ),
    dq(
      'medio',
      'Compare as frases: I. "Ela faz todas as atividades." II. "Espero que ela faça todas as atividades." Explique a diferença entre o modo indicativo e o modo subjuntivo, considerando o sentido que cada frase transmite.',
      'Na frase I, "faz" (indicativo) apresenta a realização das atividades como fato. Na frase II, "faça" (subjuntivo) expressa uma expectativa ou desejo de que a ação aconteça. O indicativo afirma; o subjuntivo deseja, supõe ou duvida.',
      [
        'Diz que o indicativo apresenta fato',
        'Diz que o subjuntivo expressa desejo ou expectativa',
      ],
    ),
    dq(
      'medio',
      'Crie três frases utilizando o modo subjuntivo: a) uma expressando um desejo; b) outra indicando uma hipótese ou condição; c) a terceira expressando uma possibilidade. Destaque os verbos empregados e indique seus tempos verbais.',
      'Respostas pessoais. Exemplos: a) "Espero que você seja feliz" (presente do subjuntivo, desejo). b) "Se eu tivesse dinheiro, viajaria" (pretérito imperfeito do subjuntivo, hipótese). c) "Talvez eles venham à festa" (presente do subjuntivo, possibilidade).',
      [
        'Cada frase está no subjuntivo',
        'Cada frase expressa o sentido pedido',
        'Os tempos verbais estão indicados',
      ],
    ),
    dq(
      'facil',
      'Leia as frases: I. "Organizem os materiais antes de iniciar a atividade." II. "Não desperdice água!" III. "Leiam o texto com atenção." a) Identifique os verbos no modo imperativo. b) Explique a finalidade do emprego desse modo verbal em cada frase.',
      'a) organizem, desperdice, leiam. b) Respectivamente, instrução, advertência e orientação. O imperativo serve para dar ordens, fazer pedidos, aconselhar ou orientar.',
      ['Identifica os três verbos no imperativo', 'Explica a finalidade de cada frase'],
    ),
    dq(
      'medio',
      'Reescreva as frases, transformando-as em ordens, pedidos ou orientações, conforme indicado: a) "Você fecha a porta." (pedido) b) "Vocês conversam durante a explicação." (ordem negativa) c) "Tu fazes a atividade com atenção." (orientação) d) "Vocês cuidam do meio ambiente." (conselho)',
      'a) Feche a porta, por favor. b) Não conversem durante a explicação. c) Faz a atividade com atenção (imperativo afirmativo de tu). d) Cuidem do meio ambiente. As respostas podem variar conforme a pessoa gramatical e a variedade da língua.',
      ['Transforma em imperativo cada frase', 'Usa a forma negativa no item b'],
    ),
    dq(
      'dificil',
      'Explique a diferença de sentido entre as frases: I. "Você entrega o trabalho amanhã." II. "Entregue o trabalho amanhã." III. "Espero que você entregue o trabalho amanhã." Considere o modo verbal e a intenção comunicativa de cada enunciado.',
      'I: presente do indicativo, apresenta a entrega como fato ou afirmação. II: imperativo afirmativo, expressa ordem, pedido ou instrução. III: presente do subjuntivo, expressa expectativa ou desejo. Mesma forma "entrega/entregue" em sentidos diferentes, conforme o modo.',
      [
        'Identifica o indicativo em I como fato',
        'Identifica o imperativo em II como ordem',
        'Identifica o subjuntivo em III como expectativa',
      ],
    ),
    dq(
      'medio',
      'Imagine que você é responsável por orientar os estudantes durante uma mostra cultural na escola. Elabore um pequeno texto com quatro frases usando o modo imperativo para instruções sobre organização, participação e conservação do espaço. Destaque os verbos empregados.',
      'Resposta pessoal. Exemplo: "Organizem os materiais sobre as mesas. Respeitem o espaço dos outros grupos. Mantenham as salas limpas. Participem das atividades com responsabilidade." Verbos no imperativo: organizem, respeitem, mantenham, participem.',
      [
        'O texto tem quatro frases no imperativo',
        'Os verbos estão destacados',
        'O conteúdo trata de organização, participação e conservação',
      ],
    ),
  ],
};

/** Lista "Modos verbais e formas nominais", parte 2 (questões 13 a 20): formas nominais e aplicação. */
const MODOS_2: PacoteG2 = {
  slug: 'pb4-modos-verbais-2',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Formas nominais e aplicação (PB4)',
  subtitle: 'Infinitivo, gerúndio e particípio, com texto e produção: 8 questões dissertativas',
  description:
    'Segunda metade da lista de modos verbais: as três formas nominais do verbo, seus usos em contexto e a análise de um texto com modos variados.',
  minutes: 50,
  questoes: [
    dq(
      'medio',
      'Explique quais são as três formas nominais do verbo e indique uma característica de cada uma. Em seguida, escreva um exemplo de verbo em cada forma nominal.',
      'Infinitivo: forma básica, termina em -ar, -er ou -ir (estudar). Gerúndio: geralmente indica ação em desenvolvimento, termina em -ando, -endo ou -indo (estudando). Particípio: geralmente expressa ação concluída, aparece em tempos compostos e na voz passiva (estudado).',
      [
        'Cita as três formas: infinitivo, gerúndio e particípio',
        'Dá uma característica correta de cada uma',
        'Dá um exemplo correto de cada uma',
      ],
    ),
    dq(
      'dificil',
      'Leia as frases: I. "Estudar diariamente contribui para a aprendizagem." II. "Os alunos estavam preparando a apresentação." III. "O trabalho foi concluído pelos estudantes." a) Identifique as formas nominais destacadas. b) Explique a função de cada forma nominal no contexto das frases.',
      'a) I: infinitivo ("estudar"); II: gerúndio ("preparando"); III: particípio ("concluído"). b) "Estudar" funciona como sujeito da oração; "preparando" integra a locução "estavam preparando", indicando ação em andamento; "concluído" integra a voz passiva "foi concluído", indicando ação realizada sobre o trabalho.',
      [
        'Identifica infinitivo, gerúndio e particípio',
        'Explica o infinitivo como sujeito',
        'Explica o gerúndio em locução e o particípio na passiva',
      ],
    ),
    dq(
      'medio',
      'Complete as frases com a forma nominal adequada dos verbos entre parênteses e justifique suas escolhas: a) __________ é essencial para ampliar o conhecimento. (ler) b) Os estudantes estavam __________ os cartazes da exposição. (produzir) c) Após ter __________ a atividade, o aluno entregou o caderno. (terminar)',
      'a) Ler (infinitivo, sujeito). b) produzindo (gerúndio, locução de ação em andamento). c) terminado (particípio, tempo composto com "ter").',
      ['Acerta as três formas', 'Justifica cada escolha pela função na frase'],
    ),
    dq(
      'dificil',
      'Reescreva as frases substituindo as expressões destacadas por formas nominais dos verbos, sem alterar o sentido principal: a) "A atividade de fazer a leitura do texto será realizada em sala." b) "Os alunos estavam no processo de construção dos painéis." c) "Depois que terminou a pesquisa, a estudante organizou as informações."',
      'a) A atividade de ler o texto será realizada em sala. b) Os alunos estavam construindo os painéis. c) Depois de terminar a pesquisa, a estudante organizou as informações.',
      ['Transforma cada expressão em forma nominal', 'Mantém o sentido de cada frase'],
    ),
    dq(
      'dificil',
      'Explique a diferença entre o infinitivo, o gerúndio e o particípio, considerando as frases: I. "Cantar é uma atividade prazerosa." II. "A menina estava cantando no palco." III. "A música foi cantada pela turma."',
      'I: infinitivo, apresenta a ação de forma geral. II: gerúndio, indica ação em desenvolvimento. III: particípio, integra a voz passiva e indica a ação realizada sobre a música.',
      [
        'Diferencia infinitivo como ação geral',
        'Diferencia gerúndio como ação em curso',
        'Diferencia particípio na voz passiva',
      ],
    ),
    dq(
      'dificil',
      'Leia o texto: "Se todos colaborassem com a organização da escola, o ambiente seria mais agradável. Separem os materiais após as atividades e procurem manter as salas limpas. Espero que cada estudante compreenda a importância dessa atitude. Cuidar do espaço coletivo é uma responsabilidade de todos." a) Retire do texto dois verbos no modo indicativo, se houver, e justifique. b) Identifique um verbo no modo subjuntivo e explique o sentido. c) Identifique dois verbos no imperativo e explique a intenção. d) Identifique as formas nominais e classifique-as.',
      'a) "Seria" (futuro do pretérito do indicativo) e "é" (presente do indicativo), ambos apresentam fatos ou hipóteses reais. b) "Colaborassem" (pretérito imperfeito do subjuntivo, hipótese) ou "compreenda" (presente do subjuntivo, expectativa). c) "Separem" e "procurem", imperativo afirmativo, com instruções e orientações. d) Infinitivo "cuidar"; não há gerúndio nem particípio.',
      [
        'Retira verbos do indicativo e justifica',
        'Identifica verbo do subjuntivo com sentido correto',
        'Identifica os dois imperativos com intenção correta',
        'Identifica o infinitivo e diz que não há gerúndio nem particípio',
      ],
    ),
    dq(
      'medio',
      'Explique como a mudança do modo verbal altera o sentido da mensagem: I. "Os estudantes participam da campanha." II. "É importante que os estudantes participem da campanha." III. "Participem da campanha!"',
      'I: presente do indicativo, apresenta a participação como fato. II: presente do subjuntivo, expressa expectativa ou avaliação da importância. III: imperativo afirmativo, expressa pedido, ordem ou convite.',
      [
        'Explica o indicativo como fato',
        'Explica o subjuntivo como expectativa',
        'Explica o imperativo como convite ou ordem',
      ],
    ),
    dq(
      'dificil',
      'Produza um pequeno texto de oito a dez linhas sobre a importância da preservação do meio ambiente, empregando: dois verbos no indicativo, dois no subjuntivo, dois no imperativo, um no infinitivo, um no gerúndio e um no particípio. Ao final, destaque os verbos e classifique-os pelo modo ou pela forma nominal.',
      'Resposta pessoal. Deve conter os seis tipos de verbo pedidos, em um texto de oito a dez linhas, com cada verbo destacado e classificado corretamente.',
      [
        'Texto de 8 a 10 linhas sobre meio ambiente',
        'Usa os modos e as formas nominais pedidos',
        'Classifica os verbos destacados corretamente',
      ],
    ),
  ],
};

/** Lista "Vozes verbais" (ativa, passiva analítica e sintética): 12 itens reescritos. */
const VOZES: PacoteG2 = {
  slug: 'pb4-vozes-verbais',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Vozes verbais (PB4)',
  subtitle: 'Passiva analítica, ativa e sintética: 12 reescritas, corrigidas pela IA',
  description:
    'Lista de vozes verbais: passar da voz ativa para a passiva analítica, da passiva analítica para a ativa, e da analítica para a sintética (com o pronome se).',
  minutes: 40,
  questoes: [
    dq(
      'medio',
      'Passe para a voz passiva analítica: a) "Os cientistas descobriram uma nova espécie de planta."',
      'Uma nova espécie de planta foi descoberta pelos cientistas.',
      ['Usa ser + particípio, concordando com o sujeito', 'Mantém o agente da passiva com "pelos"'],
    ),
    dq(
      'medio',
      'Passe para a voz passiva analítica: b) "A torcida comemorou a vitória com entusiasmo."',
      'A vitória foi comemorada pela torcida com entusiasmo.',
      ['Usa ser + particípio', 'Mantém o agente "pela torcida"'],
    ),
    dq(
      'medio',
      'Passe para a voz passiva analítica: c) "O governo construiu uma ponte moderna."',
      'Uma ponte moderna foi construída pelo governo.',
      ['Usa ser + particípio concordando com "ponte"', 'Mantém o agente "pelo governo"'],
    ),
    dq(
      'medio',
      'Passe para a voz passiva analítica: d) "A menina escreveu uma carta emocionante."',
      'Uma carta emocionante foi escrita pela menina.',
      ['Usa ser + particípio feminino concordando com "carta"', 'Mantém o agente "pela menina"'],
    ),
    dq(
      'medio',
      'Passe para a voz ativa: a) "O quadro foi pintado por um artista famoso."',
      'Um artista famoso pintou o quadro.',
      ['O agente vira sujeito', 'O objeto vira complemento verbal'],
    ),
    dq(
      'medio',
      'Passe para a voz ativa: b) "O jogo será transmitido pela televisão."',
      'A televisão transmitirá o jogo.',
      ['Usa o futuro do presente na ativa', 'O agente "a televisão" vira sujeito'],
    ),
    dq(
      'medio',
      'Passe para a voz ativa: c) "A música foi composta por aquele cantor."',
      'Aquele cantor compôs a música.',
      ['O agente vira sujeito', 'O verbo volta à forma ativa'],
    ),
    dq(
      'medio',
      'Passe para a voz ativa: d) "A lei será discutida pelo congresso amanhã."',
      'O congresso discutirá a lei amanhã.',
      ['O agente "o congresso" vira sujeito', 'Mantém o tempo futuro'],
    ),
    dq(
      'medio',
      'Passe da voz passiva analítica para a sintética: a) "A rua foi asfaltada pelos operários."',
      'Asfaltou-se a rua.',
      ['Usa o verbo + se', 'Concorda o verbo com o sujeito "a rua" (singular)'],
    ),
    dq(
      'medio',
      'Passe da voz passiva analítica para a sintética: b) "O prêmio foi entregue pelo diretor."',
      'Entregou-se o prêmio.',
      ['Usa o verbo + se', 'Verbo no singular, pois o sujeito "o prêmio" é singular'],
    ),
    dq(
      'medio',
      'Passe da voz passiva analítica para a sintética: c) "Os ingressos foram vendidos pela bilheteria online."',
      'Venderam-se os ingressos pela bilheteria online.',
      ['Usa o verbo + se', 'Verbo no plural, concordando com "os ingressos"'],
    ),
    dq(
      'medio',
      'Passe da voz passiva analítica para a sintética: d) "As cartas são enviadas pelo correio."',
      'Enviam-se as cartas pelo correio.',
      ['Usa o verbo + se', 'Verbo no plural, concordando com "as cartas"'],
    ),
  ],
};

/** Lista 1 – Base nas 2 VA: texto da notícia, texto do conto e gramática. */
const LISTA_1: PacoteG2 = {
  slug: 'pb4-lista-1-va',
  kind: 'simulado',
  context: 'study',
  subject: MATERIA,
  grade: SERIE,
  title: 'Simulado · Lista 1, base nas 2 VA (PB4)',
  subtitle: 'Notícia, conto e gramática: 10 questões, com 2 objetivas e 8 dissertativas',
  description:
    'Interpretação de uma notícia e de um trecho de conto, classificação de períodos, orações coordenadas e subordinadas, voz passiva e modalização.',
  minutes: 45,
  questoes: [
    o(
      'facil',
      'Texto 1 (notícia fictícia): "Estudantes criam aplicativo para ajudar moradores de rua". Um grupo de jovens desenvolveu um aplicativo que conecta moradores de rua a ONGs que oferecem alimentação, roupas e serviços de saúde. Pelo título, qual é o objetivo principal dos estudantes?',
      'Conectar moradores de rua a ONGs de apoio.',
      [
        'Criar um aplicativo para vender roupas.',
        'Arrecadar dinheiro para comprar celulares.',
        'Divulgar serviços de saúde particulares.',
      ],
      'O título e o texto dizem que o aplicativo conecta moradores de rua a ONGs de apoio.',
    ),
    dq(
      'medio',
      'Classifique as frases como período simples ou período composto: a) "O aplicativo está em fase de testes." b) "Os jovens desenvolveram o aplicativo e apresentaram em uma feira de tecnologia." c) "O projeto, que começou na escola, ganhou apoio de uma universidade."',
      'a) Período simples (um verbo). b) Período composto por coordenação (dois verbos ligados por "e"). c) Período composto por subordinação (oração adjetiva "que começou na escola").',
      [
        'Classifica a letra a como simples',
        'Classifica b como composto por coordenação',
        'Classifica c como composto por subordinação',
      ],
    ),
    o(
      'medio',
      'No trecho "O aplicativo já está em fase de testes, mas ainda precisa de ajustes", a oração introduzida por "mas" é:',
      'Coordenada adversativa',
      ['Coordenada conclusiva', 'Subordinada causal', 'Subordinada adjetiva'],
      '"Mas" é conjunção coordenativa adversativa: opõe uma ideia à anterior.',
    ),
    dq(
      'dificil',
      'A notícia, além de informar, também busca mobilizar as pessoas. Explique como ela pode influenciar o leitor a se engajar nesse projeto.',
      'Resposta pessoal. A notícia mobiliza ao apresentar um problema social, mostrar uma solução concreta já em teste e indicar que o projeto será lançado em breve, o que convida o leitor a apoiar, divulgar ou usar o aplicativo.',
      [
        'Relaciona o texto a um problema social',
        'Mostra como a informação convida à ação',
        'Usa um elemento do texto como prova',
      ],
    ),
    dq(
      'medio',
      'Texto 2 (adaptação de Machado de Assis): "O professor castigava severamente os alunos que cometiam qualquer falta. Muitas vezes, os estudantes saíam da escola com as mãos vermelhas, mas continuavam a repetir os erros no dia seguinte." Com base no trecho, explique como era a disciplina escolar nesse contexto.',
      'A disciplina era baseada em castigos físicos e severos. Mesmo assim, os alunos não aprendiam: continuavam a errar no dia seguinte, o que mostra que a punição não produzia mudança.',
      [
        'Diz que a disciplina era severa e baseada em castigo',
        'Relaciona o castigo com a repetição dos erros',
      ],
    ),
    dq(
      'dificil',
      'Identifique e classifique as orações do período: "Os estudantes saíam da escola com as mãos vermelhas, mas continuavam a repetir os erros." a) ______ b) ______',
      'a) "Os estudantes saíam da escola com as mãos vermelhas" é a oração principal (ou coordenada inicial). b) "mas continuavam a repetir os erros" é oração coordenada adversativa.',
      [
        'Identifica a primeira oração como principal',
        'Classifica a segunda como coordenada adversativa',
      ],
    ),
    dq(
      'dificil',
      'O castigo citado no conto pode ser associado a práticas de educação do passado. Na sua opinião, qual é a principal diferença entre a forma de ensino do século XIX e a atual?',
      'Resposta pessoal. Espera-se a comparação entre um ensino baseado em castigo e autoridade rígida e um ensino que valoriza o diálogo, a participação e o respeito ao aluno.',
      ['Compara os dois períodos', 'Fundamenta a opinião com um exemplo'],
    ),
    dq(
      'medio',
      'Transforme as frases da voz ativa para a voz passiva: a) "O professor explicou a matéria." b) "Os alunos entregaram os trabalhos." c) "A torcida comemorou a vitória."',
      'a) A matéria foi explicada pelo professor. b) Os trabalhos foram entregues pelos alunos. c) A vitória foi comemorada pela torcida.',
      ['Usa ser + particípio em cada frase', 'Mantém o agente com "pelo" ou "pela"'],
    ),
    dq(
      'medio',
      'Crie 3 frases com modalização de dúvida e 3 frases com modalização de certeza.',
      'Respostas pessoais. Dúvida: "Talvez chova amanhã", "Acho que ele virá", "Possivelmente faltarei". Certeza: "Com certeza, a prova será amanhã", "É claro que vou estudar", "Sem dúvida, ele acertou".',
      ['Três frases de dúvida com marca clara', 'Três frases de certeza com marca clara'],
    ),
    o(
      'medio',
      'Qual destas frases pertence a uma narrativa de mistério?',
      '"De repente, ouvi passos atrás de mim, mas quando me virei, não havia ninguém."',
      [
        '"O cientista explicou como funciona o sistema solar."',
        '"O time venceu a partida com dois gols no segundo tempo."',
      ],
      'O suspense (passos sem ninguém) é o que caracteriza a narrativa de mistério. As outras são informativas ou esportivas.',
    ),
  ],
};

export const PACOTES_PB4: PacoteG2[] = [VERBO_LIGACAO, MODOS_1, MODOS_2, VOZES, LISTA_1];

/* ------------------------------------------------------------------ resumos */

export const RESUMOS_PB4: ResumoG3[] = [
  resumo(
    MATERIA,
    SERIE,
    'pb4-verbo-ligacao',
    'Verbos de ligação e seus sentidos',
    'O verbo que liga o sujeito a uma característica',
    `Verbo de ligação é aquele que **não expressa ação**. Ele apenas liga o sujeito a uma característica, um estado ou uma qualidade, chamada **predicativo do sujeito**.

**Exemplo:** "O cão **é** manso." O verbo "é" só conecta "O cão" a "manso".

### Verbos de ligação mais usados
- **ser**, **estar**, **ficar**, **permanecer**, **continuar**, **parecer**, **tornar-se**, **andar**, **viver** (quando indicam estado).

### Ação ou ligação?
O mesmo verbo muda de função conforme o contexto:
- "O cão **continua** manso" → ligação (liga ao estado).
- "A história **continua** amanhã" → ação de prosseguir.
- "Os javalis **andam** nocivos" → ligação (estado).
- "Os javalis **andam** pelas florestas" → ação de movimento.

### Sentidos de duração
- **ser**: atributo constante ou inerente. "A moça **é** bonita" (característica permanente).
- **estar**: atributo temporário. "A moça **está** bonita" (naquele momento).
- **permanecer / continuar**: o estado se mantém. "O cão **permanece** doente".

### Predicativo do sujeito e concordância
O predicativo é um **adjetivo ou substantivo** e **concorda com o sujeito** em gênero e número: "Esse animal **é** transmissor"; "Machos adultos **são** solitários".`,
  ),
  resumo(
    MATERIA,
    SERIE,
    'pb4-modos-verbais',
    'Modos verbais e formas nominais',
    'Indicativo, subjuntivo, imperativo e as três formas nominais',
    `O **modo verbal** mostra a atitude de quem fala diante da ação.

### Indicativo: fato
Apresenta a ação como real, certa ou habitual.
- "Os estudantes **organizaram** a exposição." (pretérito perfeito)
- "Eles **apresentarão** os trabalhos." (futuro do presente)
- "Mariana **lê** alguns capítulos." (presente)

### Subjuntivo: desejo, dúvida, hipótese
Apresenta a ação como possível, desejada ou incerta, geralmente depois de "que", "se", "quando", "talvez".
- "Espero que os alunos **compreendam** o conteúdo." (desejo)
- "Se eu **tivesse** chegado mais cedo…" (hipótese)
- "Talvez ela **compareça** à reunião." (possibilidade)

### Imperativo: ordem, pedido, conselho
- "**Feche** a porta, por favor." (pedido)
- "**Não conversem** durante a explicação." (ordem negativa)
- "**Leiam** o texto com atenção." (orientação)

### Formas nominais
Não variam em pessoa nem em tempo.
- **Infinitivo** (-ar, -er, -ir): "**Estudar** contribui para a aprendizagem." Pode ser sujeito.
- **Gerúndio** (-ando, -endo, -indo): "Os alunos estavam **preparando** a apresentação." Ação em andamento.
- **Particípio** (-ado, -ido): "O trabalho foi **concluído**." Ação concluída, usada na voz passiva e nos tempos compostos.

### Como comparar
"Ela **faz** as atividades" (fato) × "Espero que ela **faça** as atividades" (desejo).`,
  ),
  resumo(
    MATERIA,
    SERIE,
    'pb4-vozes-verbais',
    'Vozes verbais: ativa, passiva analítica e sintética',
    'Quem pratica a ação e quem a sofre',
    `A **voz verbal** mostra se o sujeito pratica ou sofre a ação.

### Voz ativa
O sujeito pratica a ação: "O professor **explicou** a matéria."

### Voz passiva analítica
Usa **ser + particípio**, com o agente da passiva (geralmente com "por"):
- Ativa: "Os cientistas **descobriram** uma nova espécie."
- Passiva: "Uma nova espécie **foi descoberta** pelos cientistas."

O particípio concorda com o sujeito: "A carta **foi escrita** pela menina."

### Voz passiva sintética
Usa o verbo na 3ª pessoa + **se**, sem o verbo "ser":
- "**Asfaltou-se** a rua." (a rua foi asfaltada)
- "**Venderam-se** os ingressos." (os ingressos foram vendidos)

Aqui o verbo **concorda com o sujeito**: "**Enviam-se** as cartas." (plural, porque "as cartas" é plural).

### Como passar de uma voz para outra
1. Identifique o sujeito e o objeto direto da ativa.
2. Na passiva analítica, o objeto vira sujeito, e o sujeito vira agente com "por".
3. Na sintética, tire o agente, use o verbo + se e faça a concordância com o sujeito.`,
  ),
];

/* ------------------------------------------------------------------ trilha */

const L = (titulo: string, minutos: number, ...itens: string[]) => ({ titulo, minutos, itens });

export const TRILHA_PB4: TrilhaG3 = {
  slug: 'pb4-portugues',
  subject: MATERIA,
  titulo: 'PB4 · Português: 4º bimestre',
  descricao:
    'Tudo do 4º bimestre de Português do 9º ano, em ordem: verbos de ligação, modos verbais, vozes verbais e a Lista 1. Cada etapa tem um resumo e um simulado com correção pela IA.',
  categoria: 'fundamental',
  series: [SERIE],
  secoes: [
    {
      titulo: 'Verbos de ligação',
      licoes: [
        L('Resumo: verbos de ligação', 12, 'g3-pb4-verbo-ligacao'),
        L('Simulado: verbos de ligação', 50, 'pb4-verbo-ligacao-simulado'),
      ],
    },
    {
      titulo: 'Modos verbais e formas nominais',
      licoes: [
        L('Resumo: modos verbais e formas nominais', 15, 'g3-pb4-modos-verbais'),
        L('Simulado: modos verbais, parte 1', 50, 'pb4-modos-verbais-1'),
        L('Simulado: formas nominais e aplicação', 50, 'pb4-modos-verbais-2'),
      ],
    },
    {
      titulo: 'Vozes verbais',
      licoes: [
        L('Resumo: vozes verbais', 12, 'g3-pb4-vozes-verbais'),
        L('Simulado: vozes verbais', 40, 'pb4-vozes-verbais'),
      ],
    },
    {
      titulo: 'Lista 1: base nas 2 VA',
      licoes: [L('Simulado: notícia, conto e gramática', 45, 'pb4-lista-1-va')],
    },
  ],
};
