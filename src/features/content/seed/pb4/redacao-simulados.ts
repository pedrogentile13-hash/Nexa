import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Produção de Texto: simulados da redação dissertativo-argumentativa (padrão Enem, 5 competências,
 * 4 parágrafos) com o tema "cancelamento nas redes sociais". Mesma regra de tamanho das alternativas.
 */

const MATERIA = 'producao-de-texto';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO · TEORIA (15 objetivas) */

const TEORIA: QuestaoG2[] = [
  o(
    'facil',
    'Na redação dissertativo-argumentativa trabalhada na turma, a estrutura esperada tem',
    'quatro parágrafos: introdução, dois de desenvolvimento e conclusão',
    [
      'três parágrafos: introdução, um único desenvolvimento e conclusão',
      'quatro parágrafos: título, resumo, desenvolvimento e fecho',
      'cinco parágrafos: abertura, três de argumentos e a proposta final',
      'dois parágrafos: um de ideias principais e outro de agradecimentos',
    ],
    'O modelo pedido tem 4 parágrafos: introdução (tese), dois desenvolvimentos (argumentos) e conclusão (retomada + proposta).',
  ),
  o(
    'facil',
    'Na introdução de uma redação, a tese é',
    'o ponto de vista que o autor defende sobre o tema',
    [
      'a lista de fatos que o autor leu nos textos de apoio',
      'a solução que o autor propõe para o problema social',
      'a explicação do significado das palavras do título',
      'o resumo de tudo o que será dito na conclusão',
    ],
    'A tese é a opinião defendida. Ela deve aparecer de forma clara na introdução e ser retomada na conclusão.',
  ),
  o(
    'medio',
    'A Competência 1 do Enem avalia',
    'o domínio da modalidade escrita formal da língua portuguesa',
    [
      'a capacidade de elaborar uma proposta de intervenção social',
      'o uso de conectivos para ligar as partes do texto escrito',
      'a compreensão da proposta e o uso de repertório cultural',
      'a organização dos argumentos em defesa de um ponto de vista',
    ],
    'C1 = norma-padrão (ortografia, acentuação, pontuação, concordância, regência). C2 = tema e repertório; C3 = argumentação; C4 = coesão; C5 = proposta.',
  ),
  o(
    'medio',
    'A Competência 2 avalia principalmente',
    'a compreensão do tema e o uso de repertório sociocultural',
    [
      'a correção ortográfica, acentuação e pontuação do texto escrito',
      'a variedade de conectivos entre frases e parágrafos',
      'a presença dos cinco elementos na proposta de solução',
      'a letra legível e a organização visual da folha final',
    ],
    'C2 pede que você entenda o tema, não fuja dele e use conhecimentos de outras áreas (leis, filosofia, obras, fatos) dentro de um texto dissertativo-argumentativo.',
  ),
  o(
    'medio',
    'A Competência 4 do Enem está relacionada à',
    'coesão: os mecanismos que ligam as ideias do texto',
    [
      'coerência: a escolha de repertório pertinente',
      'proposta: a presença de agente, ação, meio e finalidade',
      'norma: o domínio de ortografia, crase e concordância',
      'tese: a clareza do ponto de vista defendido no início',
    ],
    'C4 mede o uso de conectivos, pronomes, sinônimos e outros recursos que dão fluidez ao texto.',
  ),
  o(
    'medio',
    'A proposta de intervenção completa, valorizada na Competência 5, apresenta',
    'agente, ação, meio ou modo, finalidade e detalhamento',
    [
      'tese, argumento, repertório, conectivo e título final',
      'problema, causa, consequência, exemplo e resumo geral',
      'autor, obra, data, citação e referência bibliográfica',
      'contexto, tese, argumento, retomada e frase de efeito',
    ],
    'Os cinco elementos: quem (agente), o quê (ação), como (meio/modo), para quê (finalidade) e uma informação extra explicando um deles (detalhamento).',
  ),
  o(
    'facil',
    'Cada competência do Enem vale até 200 pontos. Assim, a redação completa vale',
    'até 1.000 pontos, somando as cinco competências',
    [
      'até 500 pontos, somando as cinco competências',
      'até 800 pontos, somando as quatro primeiras',
      'até 2.000 pontos, somando as notas dos textos',
      'até 100 pontos, somando as notas de cada linha',
    ],
    '5 competências × 200 = 1.000 pontos.',
  ),
  o(
    'medio',
    'Qual conectivo inicia corretamente um parágrafo que apresenta uma ideia contrária à anterior?',
    'No entanto,',
    ['Portanto,', 'Além disso,', 'Por exemplo,', 'Logo,'],
    '"No entanto" indica oposição. "Portanto" e "Logo" concluem, "Além disso" adiciona e "Por exemplo" exemplifica.',
  ),
  o(
    'medio',
    'Para concluir o texto, indicando que o raciocínio chegou ao fim, o conectivo mais adequado é',
    'Em suma,',
    ['Todavia,', 'Ademais,', 'Embora,', 'Conforme,'],
    '"Em suma", "Portanto" e "Diante disso" são conectivos de conclusão.',
  ),
  o(
    'medio',
    'Um repertório sociocultural é produtivo quando',
    'se relaciona ao tema e sustenta o argumento do parágrafo',
    [
      'aparece só na introdução, sem relação com o restante',
      'é uma frase famosa colocada no fim do parágrafo todo',
      'é um dado inventado que parece bem convincente ao leitor',
      'copia a frase de um dos textos motivadores da prova',
    ],
    'Produtivo = pertinente, legitimado e usado dentro do argumento, com explicação.',
  ),
  o(
    'medio',
    'O conceito de "modernidade líquida", de Zygmunt Bauman, pode ser usado em uma redação sobre cancelamento para mostrar que',
    'as relações são frágeis e descartáveis, e pessoas são excluídas',
    [
      'as redes sociais substituíram completamente as leis e a Justiça',
      'o cancelamento sempre promove a justiça e a mudança de atitude',
      'a água é o elemento que representa a liberdade de expressão',
      'as pessoas passaram a se comunicar apenas pela fala e pela voz',
    ],
    'Bauman descreve relações líquidas: fluidas, efêmeras e descartáveis. O cancelamento "descarta" pessoas rapidamente.',
  ),
  o(
    'medio',
    'A Lei nº 14.811/2024, que pode servir de repertório na redação sobre cancelamento, trata, entre outros pontos, da',
    'criminalização da intimidação sistemática, inclusive a virtual',
    [
      'proibição total do uso de redes sociais por menores de idade',
      'criação de um tribunal digital para julgar casos de ofensa',
      'regulamentação da propaganda de produtos nas plataformas',
      'obrigação de as escolas ensinarem apenas conteúdo online',
    ],
    'A lei passou a punir como crime o bullying e o cyberbullying (intimidação sistemática virtual), relacionando-se diretamente ao tema.',
  ),
  o(
    'medio',
    'O Marco Civil da Internet (Lei nº 12.965/2014) estabelece',
    'princípios, direitos e deveres para o uso da internet no Brasil',
    [
      'regras de funcionamento exclusivas para as redes sociais',
      'punições automáticas para qualquer publicação ofensiva online',
      'limites de idade para a criação de contas pessoais online',
      'a criação de uma agência para vigiar todas as mensagens enviadas',
    ],
    'O Marco Civil é a "constituição da internet" no Brasil: liberdade de expressão, privacidade, neutralidade da rede e responsabilidades.',
  ),
  o(
    'medio',
    'Qual trecho apresenta uma proposta de intervenção COMPLETA para reduzir o cyberbullying?',
    'O Ministério da Educação deve incluir a educação midiática nas escolas, por meio de oficinas, a fim de formar jovens empáticos, com debates de casos reais',
    [
      'A sociedade deve se conscientizar sobre o problema e agir com urgência, de modo a evitar que o mal cresça cada vez mais em todo o nosso país hoje',
      'O governo precisa resolver o problema do cyberbullying o quanto antes, com leis mais duras e muito mais rigor com quem ofende outras pessoas na rede',
      'As pessoas precisam ser mais educadas nas redes sociais e pensar mais antes de publicar qualquer coisa que possa ferir a honra do outro',
      'Cabe às plataformas digitais cuidar da questão do cyberbullying, já que elas são as principais responsáveis pela situação atual das redes',
    ],
    'A primeira alternativa traz agente (MEC), ação (educação midiática), meio (oficinas), finalidade (formar jovens empáticos) e detalhamento (debates de casos reais). As outras são vagas.',
  ),
  o(
    'dificil',
    'Um aluno escreveu: "O cancelamento deve ser punido com a pena de morte virtual, com a exclusão permanente de qualquer pessoa da internet." Segundo os critérios do Enem, esse trecho',
    'desrespeita os direitos humanos, o que zera a Competência 5',
    [
      'valoriza a proposta, pois apresenta uma solução bem enérgica',
      'desrespeita a norma-padrão, o que zera a Competência 1',
      'mostra um bom repertório sociocultural, nota máxima em C2',
      'é adequado, pois toda opinião é bem aceita nesse exame',
    ],
    'Propostas que violam direitos humanos (punições cruéis, exclusão, linchamento) zeram a C5, mesmo que o restante do texto esteja bom.',
  ),
];

/* ============================================================ SIMULADO · TREINO POR PARÁGRAFO (4 dissertativas) */

const TEMA = 'O cancelamento nas redes sociais: justiça popular ou violência virtual?';

const PARAGRAFOS: QuestaoG2[] = [
  dq(
    'medio',
    `INTRODUÇÃO

Tema: "${TEMA}"

Escreva APENAS o 1º parágrafo (introdução) de um texto dissertativo-argumentativo sobre o tema. Escolha o seu posicionamento (positivo, negativo ou equilibrado).

Inclua: (a) contextualização com um repertório sociocultural, (b) tese clara e (c) anúncio dos dois argumentos que virão. Use a norma-padrão, entre 4 e 7 linhas.`,
    'Parágrafo de 4 a 7 linhas que contextualiza o tema com um repertório legítimo (por exemplo, a "cultura do cancelamento", Bauman, Foucault, a Constituição ou a Lei 14.811/2024), apresenta uma tese clara (por exemplo, "o cancelamento se tornou um linchamento virtual…") e antecipa dois argumentos (por exemplo, ausência de contraditório e danos à saúde mental). Linguagem formal e coesão com conectivos como "nesse contexto", "dessa forma".',
    [
      'Contextualiza o tema com repertório sociocultural real e pertinente',
      'Apresenta tese clara e posicionamento definido',
      'Antecipa (ou deixa claro) os dois argumentos',
      'Usa norma-padrão e conectivos adequados, sem oralidade',
    ],
    'Nota de 0 a 1: avalie contexto, tese, anúncio dos argumentos e linguagem.',
  ),
  dq(
    'medio',
    `DESENVOLVIMENTO 1

Tema: "${TEMA}"

Escreva APENAS o 2º parágrafo (primeiro desenvolvimento). Ele deve ter: (a) tópico frasal, (b) um argumento que defenda a sua tese, (c) um repertório sociocultural explicado e (d) um fecho que retome o tema. Use conectivos de abertura como "Em primeiro plano" ou "Primeiramente". De 6 a 9 linhas.`,
    'Parágrafo de 6 a 9 linhas com tópico frasal (por exemplo, "Em primeiro plano, o cancelamento…"), um único argumento (por exemplo, a ausência de contraditório), um repertório explicado (por exemplo, Byung-Chul Han e o "enxame digital", Foucault ou a Constituição) e um fecho ligado à tese. Boa coesão e norma-padrão.',
    [
      'Apresenta tópico frasal claro',
      'Desenvolve um único argumento coerente com a tese',
      'Usa repertório legítimo, pertinente e explicado',
      'Fecha o parágrafo retomando o tema; usa norma-padrão e coesão',
    ],
    'Nota de 0 a 1: avalie tópico frasal, argumento, repertório e coesão.',
  ),
  dq(
    'medio',
    `DESENVOLVIMENTO 2

Tema: "${TEMA}"

Escreva APENAS o 3º parágrafo (segundo desenvolvimento), com um argumento DIFERENTE do primeiro, sustentando a mesma tese. Use um conectivo de adição ("Ademais", "Além disso") e um exemplo, dado ou repertório. De 6 a 9 linhas.`,
    'Parágrafo de 6 a 9 linhas que abre com conectivo de adição ("Ademais…"), traz um segundo argumento distinto (por exemplo, o dano à saúde mental, a cultura do descarte ou a pressão social como responsabilização), sustentado por exemplo, dado ou repertório (Lei 14.811/2024, Bauman, caso Justine Sacco, lugar de fala) e conectado à tese.',
    [
      'Usa conectivo de adição e apresenta argumento diferente do anterior',
      'Sustenta a mesma tese do restante do texto',
      'Apoia o argumento em exemplo, dado ou repertório pertinente',
      'Mantém norma-padrão e boa coesão',
    ],
    'Nota de 0 a 1: avalie originalidade do argumento, ligação com a tese, apoio e linguagem.',
  ),
  dq(
    'dificil',
    `CONCLUSÃO COM PROPOSTA DE INTERVENÇÃO

Tema: "${TEMA}"

Escreva APENAS o 4º parágrafo (conclusão). Retome a tese com outras palavras e apresente uma proposta de intervenção completa, com os cinco elementos: agente, ação, meio/modo, finalidade e detalhamento. A proposta deve respeitar os direitos humanos. De 5 a 8 linhas.`,
    'Parágrafo que retoma a tese com outras palavras (por exemplo, "Portanto, o cancelamento exige proporção…") e apresenta proposta completa: agente (Ministério da Educação, plataformas digitais, escolas), ação (educação midiática, canais de denúncia e direito de resposta), meio (oficinas, debates, equipes de moderação), finalidade (formar jovens empáticos, reduzir o cyberbullying) e detalhamento (explica um dos itens). Sem violar direitos humanos.',
    [
      'Retoma a tese sem copiar a introdução',
      'Apresenta agente, ação e meio/modo',
      'Apresenta finalidade e detalhamento',
      'Respeita os direitos humanos, com norma-padrão e conectivo de conclusão',
    ],
    'Nota de 0 a 1: avalie retomada da tese e os cinco elementos da proposta.',
  ),
];

/* ============================================================ SIMULADO · REDAÇÃO COMPLETA (1 dissertativa) */

const REDACAO: QuestaoG2[] = [
  dq(
    'dificil',
    `PRODUÇÃO DE TEXTO · REDAÇÃO COMPLETA

Leia os textos de apoio (elaborados para este simulado).

TEXTO I: Cancelamento é a prática de retirar apoio, boicotar ou expor publicamente alguém, em geral uma figura pública, por falas ou atitudes consideradas ofensivas. Nas redes, a prática costuma se espalhar em poucas horas, com ataques coletivos e pedidos de desligamento de empregos e contratos.

TEXTO II: Um estudante relata que uma foto antiga, publicada quando tinha 13 anos, foi retirada de contexto e circulou em grupos da escola. Mesmo depois de apagar a publicação e pedir desculpas, continuou recebendo mensagens agressivas e passou a evitar a sala de aula.

TEXTO III: Defensores do cancelamento afirmam que ele dá voz a pessoas que antes não eram ouvidas e que obriga figuras com poder a assumir responsabilidade pelos seus atos.

PROPOSTA: A partir da leitura dos textos e dos seus conhecimentos, redija um texto dissertativo-argumentativo, em norma-padrão, sobre o tema "${TEMA}".

Organize o texto em 4 parágrafos: introdução com tese, dois de desenvolvimento (um argumento em cada, com repertório sociocultural) e conclusão com proposta de intervenção que apresente agente, ação, meio, finalidade e detalhamento, respeitando os direitos humanos. Dê um título ao texto. Não copie trechos dos textos de apoio.`,
    'Redação de 4 parágrafos com título. 1º: contextualiza o tema e apresenta tese clara (positiva, negativa ou equilibrada). 2º e 3º: dois argumentos distintos, cada um com repertório legítimo, pertinente e explicado (por exemplo, Constituição Federal, Lei 14.811/2024, Marco Civil da Internet, Bauman, Foucault, Han, Djamila Ribeiro, Black Mirror, caso Justine Sacco). 4º: retoma a tese com outras palavras e traz proposta completa com agente, ação, meio, finalidade e detalhamento, respeitando direitos humanos. Linguagem formal, coesão variada (conectivos), sem oralidade e sem cópia dos textos de apoio.',
    [
      'C1: domínio da norma-padrão (ortografia, pontuação, concordância, sem oralidade)',
      'C2: entende o tema "cancelamento" e usa repertório legítimo, pertinente e produtivo',
      'C3: defende um ponto de vista com argumentos coerentes e sem contradição, com autoria',
      'C4: usa conectivos variados e adequados entre frases e parágrafos',
      'C5: proposta com agente, ação, meio, finalidade e detalhamento, respeitando os direitos humanos',
      'Respeita a estrutura em 4 parágrafos e o gênero dissertativo-argumentativo',
    ],
    'Nota de 0 a 1 (proporcional aos 1.000 pontos do Enem): avalie as cinco competências.',
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

export const PACOTES_REDACAO_PB4: PacoteG2[] = [
  pacote(
    'pb4-redacao-s1-teoria',
    'Simulado · Teoria da redação Enem (PB4 Produção de Texto)',
    '15 questões objetivas: estrutura, 5 competências, conectivos e repertório',
    'Confira o que você sabe sobre o texto dissertativo-argumentativo: os 4 parágrafos, as cinco competências, a proposta de intervenção e os repertórios sobre cancelamento.',
    45,
    TEORIA,
  ),
  pacote(
    'pb4-redacao-s2-paragrafos',
    'Simulado · Treino por parágrafo (PB4 Produção de Texto)',
    '4 dissertativas: introdução, dois desenvolvimentos e conclusão',
    'Escreva a redação em partes, com a correção da IA em cada uma. Tema: cancelamento nas redes sociais.',
    60,
    PARAGRAFOS,
  ),
  pacote(
    'pb4-redacao-s3-completa',
    'Simulado · Redação completa sobre cancelamento (PB4 Produção de Texto)',
    'Texto dissertativo-argumentativo de 4 parágrafos, corrigido pelas 5 competências',
    'Redação completa no padrão Enem. A IA corrige com nota de 0 a 1, olhando as 5 competências.',
    50,
    REDACAO,
  ),
];
