import { o, type PacoteG2 } from '../grande2/types';

/**
 * Revisão para a P7 e P8 do 4º bimestre (9º ano, Anglo): simulado OBJETIVO de Português.
 * Baseado nos conteúdos de Português do PB4 que o Nexa já tem (modos e formas nominais, vozes verbais, verbos,
 * verbos de ligação, texto didático e "Assassinatos da Rua Morgue").
 */
export const SIMULADO_PROVA_PORTUGUES: PacoteG2 = {
  slug: 'pb4-prova-portugues-objetivo',
  kind: 'simulado',
  context: 'study',
  subject: 'lingua-portuguesa',
  grade: '9º ano',
  title: 'Simulado · Português para a prova (P7 e P8)',
  subtitle: 'Revisão do 4º bimestre: 20 questões objetivas',
  description:
    'Modos verbais, formas nominais, vozes verbais, tempos verbais, verbos de ligação, texto didático e o conto "Assassinatos da Rua Morgue". Todas as questões são objetivas, com explicação no gabarito.',
  minutes: 45,
  questoes: [
    o(
      'facil',
      'Em "Os alunos estavam preparando a apresentação", a forma verbal "preparando" está em qual forma nominal e o que ela indica?',
      'Gerúndio, indicando uma ação em andamento.',
      [
        'Infinitivo, indicando uma ação em andamento.',
        'Particípio, indicando uma ação concluída.',
        'Gerúndio, indicando uma ação já concluída.',
      ],
      'O gerúndio termina em -ando, -endo ou -indo e mostra a ação em andamento. O particípio (-ado, -ido) indica ação concluída.',
    ),
    o(
      'facil',
      'Em "O trabalho foi concluído", a forma "concluído" é:',
      'um particípio, usado na voz passiva e que indica ação concluída.',
      [
        'um gerúndio, usado para ação em andamento.',
        'um infinitivo, que funciona como sujeito.',
        'um verbo no imperativo, que expressa ordem.',
      ],
      'O particípio termina em -ado ou -ido, indica ação concluída e forma a voz passiva (ser + particípio) e os tempos compostos.',
    ),
    o(
      'medio',
      'Em "Estudar contribui para a aprendizagem", o verbo "estudar" está no infinitivo e exerce a função de:',
      'sujeito da oração.',
      ['predicativo do sujeito.', 'agente da passiva.', 'adjunto adverbial de tempo.'],
      'O infinitivo pode funcionar como substantivo. Aqui, "Estudar" é o sujeito: quem contribui para a aprendizagem?',
    ),
    o(
      'medio',
      'A frase "Os cientistas descobriram uma nova espécie" está na voz ativa. Qual alternativa a transforma corretamente em voz passiva analítica?',
      'Uma nova espécie foi descoberta pelos cientistas.',
      [
        'Descobriu-se uma nova espécie pelos cientistas.',
        'Uma nova espécie descobriu os cientistas.',
        'Os cientistas foram descobertos por uma nova espécie.',
      ],
      'Na passiva analítica, o objeto direto vira sujeito, o verbo fica em ser + particípio (concordando com o novo sujeito) e o antigo sujeito vira agente da passiva, com "por".',
    ),
    o(
      'medio',
      'A frase "Venderam-se os ingressos" está na voz passiva sintética. Ela equivale a:',
      '"Os ingressos foram vendidos."',
      [
        '"Os ingressos venderam alguém."',
        '"Alguém vendeu-se aos ingressos."',
        '"Os ingressos vendiam-se sozinhos, sem ninguém."',
      ],
      'A passiva sintética usa o verbo na 3ª pessoa + "se" e tem o mesmo sentido da passiva analítica: "foram vendidos".',
    ),
    o(
      'medio',
      'Por que o verbo está no plural em "Enviam-se as cartas"?',
      'Porque o verbo concorda com o sujeito, "as cartas", que está no plural.',
      [
        'Porque o "se" é sujeito e pede o plural.',
        'Porque o verbo "enviar" é sempre plural.',
        'Porque a frase está na voz ativa e não exige concordância.',
      ],
      'Na voz passiva sintética, o termo que aparece depois do verbo é o SUJEITO (paciente), e o verbo concorda com ele: "enviam-se as cartas", mas "envia-se a carta".',
    ),
    o(
      'facil',
      'Qual das frases está na voz ativa?',
      'O professor explicou a matéria.',
      [
        'A matéria foi explicada pelo professor.',
        'Explicou-se a matéria.',
        'A carta foi escrita pela menina.',
      ],
      'Na voz ativa, o sujeito pratica a ação ("o professor explicou"). Nas outras, o sujeito sofre a ação (passiva analítica ou sintética).',
    ),
    o(
      'medio',
      'Em "A carta foi escrita pela menina", o termo "pela menina" exerce a função de:',
      'agente da passiva.',
      ['sujeito.', 'objeto direto.', 'predicativo do sujeito.'],
      'O agente da passiva é quem pratica a ação numa frase na voz passiva, normalmente introduzido por "por" (pela = por + a).',
    ),
    o(
      'facil',
      'Em "Espero que os alunos compreendam o conteúdo", o verbo "compreendam" está em qual modo e expressa o quê?',
      'Subjuntivo, expressando desejo.',
      [
        'Indicativo, expressando certeza.',
        'Imperativo, expressando ordem.',
        'Subjuntivo, expressando um fato já concluído.',
      ],
      'Depois de "espero que", usa-se o subjuntivo, modo da dúvida, do desejo e da hipótese.',
    ),
    o(
      'facil',
      'Em "Leiam o texto com atenção", o verbo está no modo:',
      'imperativo, expressando uma orientação.',
      [
        'indicativo, expressando um fato real.',
        'subjuntivo, expressando uma dúvida.',
        'infinitivo, sem indicar a pessoa.',
      ],
      'O imperativo expressa ordem, pedido, conselho ou orientação.',
    ),
    o(
      'medio',
      'Compare: I. "Ela faz as atividades." II. "Espero que ela faça as atividades." Qual alternativa explica a diferença?',
      'Em I, o indicativo apresenta um fato; em II, o subjuntivo expressa um desejo.',
      [
        'Em I, o subjuntivo apresenta um fato; em II, o indicativo expressa um desejo.',
        'Em I há uma ordem; em II há uma certeza.',
        'Não há diferença de sentido, só de tempo verbal.',
      ],
      'O indicativo apresenta a ação como real; o subjuntivo, como desejada, duvidosa ou hipotética.',
    ),
    o(
      'dificil',
      'Em "Se eu tivesse chegado mais cedo, teria assistido à aula inteira", a forma "tivesse chegado" expressa:',
      'uma hipótese irreal no passado (pretérito mais-que-perfeito composto do subjuntivo).',
      [
        'uma certeza no futuro (futuro do presente).',
        'uma ordem no presente (imperativo afirmativo).',
        'um hábito no passado (pretérito imperfeito do indicativo).',
      ],
      'A condição não se realizou (eu não cheguei cedo), por isso a consequência também não. É uma hipótese irreal sobre o passado.',
    ),
    o(
      'medio',
      'Em "Quando chegou à escola, Pedro percebeu que havia esquecido o material", qual ação aconteceu primeiro?',
      'O esquecimento do material ("havia esquecido"), indicado pelo mais-que-perfeito.',
      [
        'A chegada à escola ("chegou").',
        'A percepção do erro ("percebeu").',
        'As três ações aconteceram ao mesmo tempo.',
      ],
      '"Havia esquecido" (mais-que-perfeito) indica uma ação passada anterior a outra ação também passada ("chegou" e "percebeu").',
    ),
    o(
      'medio',
      'Em "Eu estudaria mais se tivesse tempo", o verbo "estudaria" está no:',
      'futuro do pretérito do indicativo, indicando uma ação que depende de uma condição.',
      [
        'futuro do presente do indicativo, indicando certeza.',
        'pretérito perfeito do indicativo, indicando ação concluída.',
        'presente do subjuntivo, indicando dúvida.',
      ],
      'O futuro do pretérito indica o que aconteceria se uma condição ocorresse. A condição vem no imperfeito do subjuntivo ("se tivesse").',
    ),
    o(
      'facil',
      'Em "O cão é manso", o verbo "é" é classificado como:',
      'verbo de ligação, que liga o sujeito ao predicativo "manso".',
      [
        'verbo de ação, que indica o que o cão faz.',
        'verbo transitivo direto, com o objeto direto "manso".',
        'verbo de fenômeno da natureza.',
      ],
      'Verbo de ligação não indica ação: apenas liga o sujeito a uma característica ou estado (o predicativo).',
    ),
    o(
      'medio',
      'Em qual frase o verbo "andar" é de AÇÃO (e não de ligação)?',
      'Os javalis andam pelas florestas.',
      ['Os javalis andam nocivos.', 'Os javalis andam famintos.', 'Os javalis andam agitados.'],
      'Em "andam pelas florestas" o verbo indica movimento. Nas demais, "andam" liga o sujeito a um estado (nocivos, famintos, agitados): é verbo de ligação.',
    ),
    o(
      'medio',
      'A diferença entre "A moça é bonita" e "A moça está bonita" está no fato de que:',
      '"é" indica uma característica constante e "está" indica um estado temporário.',
      [
        '"é" indica um estado temporário e "está" indica uma característica constante.',
        '"é" indica ação e "está" indica estado.',
        'As duas frases têm exatamente o mesmo sentido.',
      ],
      'O verbo "ser" expressa duração constante (característica); "estar" expressa duração temporária.',
    ),
    o(
      'medio',
      'O predicado é nominal na frase:',
      'Ela parece cansada.',
      ['Ela estudou para a prova.', 'Ela leu o capítulo inteiro.', 'Ela chegará amanhã.'],
      'Predicado nominal = verbo de ligação + predicativo. Em "parece cansada", "parece" liga "ela" ao predicativo "cansada" (aparência).',
    ),
    o(
      'facil',
      'Um texto didático tem como objetivo principal:',
      'informar e explicar um conteúdo de forma clara.',
      [
        'convencer o leitor a comprar um produto.',
        'contar uma história de mistério com suspense.',
        'expressar emoções pessoais em versos.',
      ],
      'O texto didático usa linguagem objetiva, define termos técnicos e se apoia em exemplos, comparações, quadros e esquemas.',
    ),
    o(
      'medio',
      'No conto "Assassinatos da Rua Morgue", Dupin se diferencia da polícia porque ele:',
      'parte das provas e deixa que elas apontem os suspeitos.',
      [
        'começa pelo suspeito e tenta encaixar as provas.',
        'confia na força e na intimidação das testemunhas.',
        'desiste do caso quando as portas estão trancadas.',
      ],
      'Dupin usa análise (observar detalhes) e lógica (organizar as informações e concluir). No final, descobre que o assassino era um orangotango que pertencia a um marinheiro.',
    ),
  ],
};
