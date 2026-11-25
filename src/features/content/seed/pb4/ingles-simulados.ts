import { dq, o, type PacoteG2, type QuestaoG2 } from '../grande2/types';

/**
 * PB4 · Inglês (9º ano, Teacher Betina): Unit 05. Vocabulary (pp. 62-63), Passive voice (p. 66),
 * Be allowed to, make e let (p. 68) e Quick Review (p. 71). Três simulados objetivos e um dissertativo no estilo
 * da Prova Bimestral dela (completar, transformar, responder por escrito, com a norma padrão).
 * REGRA DE ESCRITA: a alternativa certa nunca pode ser reconhecida pelo tamanho (ver `balanco-alternativas.ts`).
 */

const MATERIA = 'ingles';
const SERIE = '9º ano' as const;

/* ============================================================ SIMULADO 1 · VOCABULARY: THE ENVIRONMENT (14) */

const S1: QuestaoG2[] = [
  o(
    'facil',
    'What does "global warming" mean?',
    'Aquecimento global',
    ['Mudança de estação', 'Efeito estufa natural', 'Poluição do ar', 'Energia renovável'],
    'Global warming é o aquecimento global. Climate change é mudanças climáticas, e greenhouse effect é efeito estufa.',
  ),
  o(
    'facil',
    'What does "endangered species" mean?',
    'Espécies ameaçadas',
    ['Espécies extintas', 'Vida selvagem', 'Recursos naturais', 'Espécies marinhas'],
    'Endangered species são espécies ameaçadas de extinção. Wildlife é vida selvagem.',
  ),
  o(
    'facil',
    'What does "waste" mean?',
    'Resíduos ou lixo',
    ['Energia solar', 'Água potável', 'Combustíveis fósseis', 'Efeito estufa'],
    'Waste são os resíduos, o lixo. "Reduce waste" é reduzir o lixo.',
  ),
  o(
    'facil',
    'What does "deforestation" mean?',
    'Desmatamento',
    ['Reflorestamento', 'Poluição', 'Desperdício', 'Plantação'],
    'Deforestation é o desmatamento, a destruição de florestas. Plant trees é plantar árvores.',
  ),
  o(
    'facil',
    'What does "renewable energy" mean?',
    'Energia renovável',
    ['Energia nuclear', 'Combustível fóssil', 'Energia elétrica', 'Recursos naturais'],
    'Renewable energy é energia renovável, como a solar e a eólica. Fossil fuels são combustíveis fósseis.',
  ),
  o(
    'medio',
    'What are "fossil fuels"?',
    'Combustíveis fósseis',
    [
      'Combustíveis vegetais',
      'Recursos renováveis',
      'Gases de efeito estufa',
      'Energia dos ventos',
    ],
    'Fossil fuels (petróleo, carvão e gás) são combustíveis fósseis, ao contrário da energia renovável.',
  ),
  o(
    'facil',
    'Which action helps to protect the planet?',
    'Turn off the lights',
    ['Waste more water', 'Cut down more trees', 'Burn plastic waste', 'Leave the TV on'],
    'Turn off the lights (apagar as luzes) economiza energia. As outras opções prejudicam o meio ambiente.',
  ),
  o(
    'facil',
    'Complete: We should ____ plastic.',
    'recycle',
    ['pollute', 'waste', 'destroy', 'burn'],
    'We should recycle plastic: devemos reciclar plástico.',
  ),
  o(
    'facil',
    'How do you say "plantar árvores" in English?',
    'Plant trees',
    ['Cut trees', 'Save trees', 'Burn trees', 'Climb trees'],
    'Plant trees é plantar árvores.',
  ),
  o(
    'medio',
    'What does "save energy" mean?',
    'Economizar energia',
    ['Desperdiçar energia', 'Produzir energia', 'Comprar energia', 'Gerar energia solar'],
    'Save energy é economizar energia; save water é economizar água.',
  ),
  o(
    'medio',
    'What does "reduce, reuse, recycle" mean?',
    'Reduzir, reutilizar, reciclar',
    [
      'Reutilizar, queimar, reciclar',
      'Reduzir, jogar fora, reciclar',
      'Recolher, reutilizar, replantar',
      'Reciclar, reduzir, desperdiçar',
    ],
    'Os três erres da sustentabilidade: reduce (reduzir), reuse (reutilizar) e recycle (reciclar).',
  ),
  o(
    'facil',
    'What does "greenhouse effect" mean?',
    'Efeito estufa',
    ['Efeito solar', 'Estufa de plantas', 'Efeito colateral', 'Aquecimento da água'],
    'Greenhouse effect é o efeito estufa, ligado ao aquecimento global.',
  ),
  o(
    'medio',
    'Choose the correct sentence.',
    'We must protect endangered species.',
    [
      'We must protects endangered species.',
      'We must to protect endangered species.',
      'We must protecting endangered species.',
      'We must protected endangered species.',
    ],
    'Depois do verbo modal must, o verbo fica no infinitivo, sem to e sem -s: We must protect endangered species.',
  ),
  o(
    'facil',
    'What does "pollution" mean?',
    'Poluição',
    ['Solução', 'Produção', 'População', 'Preservação'],
    'Pollution é poluição. Cuidado com as palavras parecidas em português.',
  ),
];

/* ============================================================ SIMULADO 2 · PASSIVE VOICE (14) */

const S2: QuestaoG2[] = [
  o(
    'facil',
    'Passive voice: People recycle paper.',
    'Paper is recycled.',
    ['Paper recycle is.', 'Paper are recycled.', 'Paper was recycled.', 'Paper is recycle.'],
    'Present: is + V3. A frase ativa está no presente e o sujeito da passiva (paper) é singular: Paper is recycled.',
  ),
  o(
    'facil',
    'Passive voice: They planted trees.',
    'Trees were planted.',
    ['Trees are planted.', 'Trees was planted.', 'Trees were plant.', 'Trees will be planted.'],
    'A frase ativa está no passado, então a passiva usa were + V3, e o sujeito trees é plural: Trees were planted.',
  ),
  o(
    'medio',
    'Passive voice: They will protect animals.',
    'Animals will be protected.',
    [
      'Animals will protected.',
      'Animals are protected.',
      'Animals were protected.',
      'Animals will be protect.',
    ],
    'Futuro: will be + V3. O tempo da frase ativa é mantido: Animals will be protected.',
  ),
  o(
    'medio',
    'Passive voice: We must recycle bottles.',
    'Bottles must be recycled.',
    [
      'Bottles must recycled.',
      'Bottles must be recycle.',
      'Bottles must be recycles.',
      'Bottles must been recycled.',
    ],
    'Modal: modal + be + V3. Bottles must be recycled.',
  ),
  o(
    'facil',
    'Complete: Cars will ____ produced.',
    'be',
    ['is', 'are', 'was', 'were'],
    'Futuro passivo: will be + V3. Cars will be produced.',
  ),
  o(
    'facil',
    'Complete: Trees ____ planted yesterday.',
    'were',
    ['are', 'is', 'will be', 'am'],
    'Yesterday indica passado e trees é plural: were planted.',
  ),
  o(
    'medio',
    'What is the past participle (V3) of "write"?',
    'written',
    ['wrote', 'writed', 'write'],
    'Write, wrote, written. Wrote é o simple past, e written é o V3.',
  ),
  o(
    'medio',
    'What is the past participle (V3) of "take"?',
    'taken',
    ['took', 'taked', 'take'],
    'Take, took, taken.',
  ),
  o(
    'medio',
    'What is the past participle (V3) of "break"?',
    'broken',
    ['broke', 'breaked', 'break'],
    'Break, broke, broken.',
  ),
  o(
    'medio',
    'What is the past participle (V3) of "build"?',
    'built',
    ['builded', 'build', 'builten'],
    'Build, built, built.',
  ),
  o(
    'medio',
    'Qual é a fórmula da voz passiva?',
    'Sujeito + to be + particípio (V3)',
    [
      'Sujeito + to have + infinitivo (V1)',
      'Sujeito + verbo + ing + objeto',
      'Sujeito + to be + verbo no passado',
      'Sujeito + will + verbo no gerúndio',
    ],
    'A passiva é formada por sujeito + verbo to be (no mesmo tempo da ativa) + particípio (V3).',
  ),
  o(
    'medio',
    'Which sentence is in the passive voice in the past?',
    'The bottle was broken.',
    [
      'The bottle is breaking.',
      'The bottle broke.',
      'The bottle has break.',
      'The bottle were broken.',
    ],
    'Was broken é passiva no passado (was + V3). Were não concorda com bottle, que é singular.',
  ),
  o(
    'medio',
    'Por que usamos a voz passiva?',
    'Para destacar quem recebe a ação',
    [
      'Para destacar só quem pratica a ação',
      'Para falar apenas de ações do futuro',
      'Para ligar duas orações da frase',
      'Para indicar ações sempre habituais',
    ],
    'Usamos a passiva quando queremos destacar quem recebe a ação, e não necessariamente quem a realiza.',
  ),
  o(
    'dificil',
    'O que se pode dizer do agente (by + agent) na passiva?',
    'Pode ser omitido se for desconhecido',
    [
      'É sempre obrigatório em qualquer passiva',
      'Vem antes do verbo to be na frase',
      'Substitui o particípio V3 do verbo',
      'Só aparece em frases no tempo futuro',
    ],
    'O agente com by pode ser omitido quando é desconhecido ou irrelevante: Trees are planted.',
  ),
];

/* ============================================================ SIMULADO 3 · BE ALLOWED TO, MAKE, LET E REVISÃO (14) */

const S3: QuestaoG2[] = [
  o(
    'facil',
    'Complete: My parents let me ____.',
    'play',
    ['to play', 'playing', 'played'],
    'Depois de let (na ativa), usa-se o verbo sem to: My parents let me play.',
  ),
  o(
    'facil',
    'Complete: The teacher makes us ____.',
    'study',
    ['to study', 'studying', 'studied'],
    'Make na voz ativa também é seguido de verbo sem to: The teacher makes us study.',
  ),
  o(
    'facil',
    'Complete: We ____ allowed to use dictionaries.',
    'are',
    ['is', 'am', 'be'],
    'O sujeito we pede are: We are allowed to use dictionaries.',
  ),
  o(
    'facil',
    "Complete: You aren't allowed ____ litter.",
    'to',
    ['for', 'in', 'of', 'at'],
    "Be allowed to é seguido de to + verbo: You aren't allowed to litter.",
  ),
  o(
    'medio',
    'Choose the correct sentence.',
    'She makes me study.',
    [
      'She makes me to study.',
      'She makes me studying.',
      'She make me study.',
      'She makes I study.',
    ],
    'Make + pessoa + verbo sem to. Com she, o verbo leva -s (makes), e após o verbo vem me.',
  ),
  o(
    'medio',
    'Choose the correct sentence.',
    'They let me play.',
    ['They let me to play.', 'They let me playing.', 'They lets me play.', 'They let I play.'],
    'Let + pessoa + verbo sem to. Com they, o verbo não leva -s.',
  ),
  o(
    'medio',
    'Choose the correct sentence.',
    'I am allowed to play.',
    ['I am allowed play.', 'I allowed to play.', 'I am allow to play.', 'I am allowed playing.'],
    'Be allowed to usa o verbo to be, o particípio allowed e to + verbo.',
  ),
  o(
    'facil',
    'What does "be allowed to" mean?',
    'Ter permissão',
    ['Ser obrigado', 'Fazer alguém', 'Deixar de', 'Ser proibido'],
    'Be allowed to é ter permissão para fazer algo.',
  ),
  o(
    'medio',
    'What does "make" mean in "She makes me study"?',
    'Obrigar ou fazer alguém fazer',
    [
      'Permitir que alguém faça algo',
      'Ter permissão para fazer algo',
      'Proibir alguém de fazer algo',
      'Criar algo novo com as mãos',
    ],
    'Make, nessa estrutura, indica obrigação ou causa: ela me faz estudar.',
  ),
  o(
    'facil',
    'What does "let" mean in "My parents let me play"?',
    'Deixar ou permitir',
    ['Obrigar a fazer', 'Impedir de fazer', 'Ser forçado a', 'Fazer algo à força'],
    'Let indica permissão: meus pais me deixam jogar.',
  ),
  o(
    'medio',
    'Complete the passive with make: I was ____ to study.',
    'made',
    ['make', 'makes', 'making'],
    'Na passiva com make, a construção é diferente e usa to: I was made to study.',
  ),
  o(
    'medio',
    'Complete: The film made me ____.',
    'cry',
    ['to cry', 'crying', 'cried'],
    'Make na ativa pede o verbo sem to: The film made me cry.',
  ),
  o(
    'dificil',
    'Choose the correct translation: "Students are allowed to use computers."',
    'Os estudantes têm permissão para usar computadores.',
    [
      'Os estudantes são obrigados a usar computadores.',
      'Os estudantes não têm permissão para usar computadores.',
      'Os estudantes fazem os computadores funcionarem.',
      'Os computadores deixam os estudantes estudarem.',
    ],
    'Are allowed to é "têm permissão para". A frase é afirmativa, e a negativa seria aren\'t allowed to.',
  ),
  o(
    'dificil',
    'Which sentence is in the passive voice?',
    'Energy is saved by students.',
    [
      'Students save energy every day.',
      'Students are saving energy now.',
      'Students will save energy soon.',
      'Students saved energy last week.',
    ],
    'Energy is saved by students tem sujeito paciente (energy) e é + particípio (saved). As outras estão na voz ativa.',
  ),
];

/* ============================================================ SIMULADO 4 · DISSERTATIVO NO ESTILO DA TEACHER BETINA */

const PROVA: QuestaoG2[] = [
  dq(
    'facil',
    "1. Vocabulary. Complete the sentences with the correct words from the box. (box: recycle, waste, endangered species, renewable energy, deforestation, save water, plant trees, global warming) a) We should ____ plastic bottles and paper. b) Solar and wind power are examples of ____. c) The ____ of the Amazon forest destroys the home of many animals. d) Turn off the tap to ____. e) Pandas and tigers are ____. f) ____ makes the Earth's temperature rise.",
    'a) recycle. b) renewable energy. c) deforestation. d) save water. e) endangered species. f) Global warming.',
    [
      'Completa as seis lacunas com as palavras do quadro',
      'Escreve as palavras corretamente (ortografia)',
      'Usa a forma adequada ao sentido de cada frase',
    ],
  ),
  dq(
    'medio',
    '2. Grammar: Passive voice. Rewrite the sentences in the passive voice, keeping the verb tense. a) People recycle paper. b) They planted trees. c) They will protect animals. d) We must recycle bottles.',
    'a) Paper is recycled (by people). b) Trees were planted (by them). c) Animals will be protected (by them). d) Bottles must be recycled (by us).',
    [
      'Usa o verbo to be no mesmo tempo da frase ativa',
      'Usa o particípio (V3) correto',
      'Coloca o objeto da ativa como sujeito da passiva',
      'Escreve frases completas, com letra maiúscula e ponto final',
    ],
  ),
  dq(
    'medio',
    '3. Grammar: Permission and obligation. Complete the sentences with the correct form (to or no to) of the verbs. a) My parents let me ____ (play) video games. b) The teacher makes us ____ (study) for the test. c) We ____ (be) allowed ____ (use) dictionaries. d) I was made ____ (study). e) Explain, in Portuguese, the difference between "make" and "let".',
    'a) play (let + verbo sem to). b) study (make + verbo sem to). c) are allowed to use. d) I was made to study (na passiva com make, usa to). e) Make significa obrigar ou fazer alguém fazer algo; let significa deixar, permitir. Os dois, na voz ativa, são seguidos do verbo sem to.',
    [
      'Completa let e make com o verbo sem to',
      'Completa be allowed to corretamente',
      'Completa a passiva com make (was made to)',
      'Explica a diferença entre make (obrigar) e let (permitir)',
    ],
  ),
  dq(
    'medio',
    '4. Reading. Read the text and answer. "Our school is running an environmental project. Students collect plastic bottles and paper and take them to the recycling bins. Water is saved because the taps are closed after use, and trees are planted in the school yard every year. The students are not allowed to leave the lights on in empty rooms. The teachers say that small actions make a big difference." a) What is the main idea of the text? b) Give two actions that are mentioned to protect the environment. c) What are the students not allowed to do?',
    'a) The main idea is that the school has a project to protect the environment and that small actions make a big difference. b) Two actions: students collect plastic bottles and paper for recycling; trees are planted in the school yard; taps are closed to save water. c) They are not allowed to leave the lights on in empty rooms.',
    [
      'Identifica a ideia principal (projeto ambiental da escola; pequenas ações fazem diferença)',
      'Cita duas ações mencionadas no texto',
      'Responde que os alunos não podem deixar as luzes acesas em salas vazias',
      'Escreve respostas completas, com letra maiúscula e ponto final',
    ],
  ),
  dq(
    'medio',
    '5. Writing. Write about how we can protect the planet. Write complete sentences, give some details and use the appropriate structures: a) one sentence in the passive voice (for example, with "must be" or "are"); b) one sentence with "be allowed to" or "not allowed to"; c) one sentence with "make" or "let"; d) one sentence with a vocabulary word from the unit.',
    'Resposta livre, por exemplo: a) Plastic bottles must be recycled. b) Students are not allowed to waste water at school. c) My parents make me turn off the lights when I leave my room. d) Deforestation destroys the habitat of endangered species. A resposta deve ter frases completas, estruturas corretas e vocabulário do meio ambiente.',
    [
      'Escreve uma frase correta na voz passiva (be + V3)',
      'Usa be allowed to (ou not allowed to) corretamente',
      'Usa make ou let sem to, na ativa',
      'Usa vocabulário da unidade (meio ambiente) corretamente',
      'Escreve frases completas, com letra maiúscula e ponto final',
    ],
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

export const PACOTES_INGLES_PB4: PacoteG2[] = [
  pacote(
    'pb4-ing-s1-vocabulary',
    'Simulado 1 · Vocabulary: the environment (PB4 Inglês)',
    '14 questões objetivas: meio ambiente e ações para proteger o planeta',
    'Unit 05, pp. 62-63: climate change, pollution, deforestation, endangered species, renewable energy, reduce, reuse, recycle.',
    25,
    S1,
  ),
  pacote(
    'pb4-ing-s2-passive',
    'Simulado 2 · Passive voice (PB4 Inglês)',
    '14 questões objetivas: to be + V3, tempos verbais e particípios',
    'Unit 05, p. 66: present, past, future e modal na voz passiva, com os particípios mais importantes.',
    25,
    S2,
  ),
  pacote(
    'pb4-ing-s3-allowed-make-let',
    'Simulado 3 · Be allowed to, make e let (PB4 Inglês)',
    '14 questões objetivas: com ou sem to, e revisão geral',
    'Unit 05, p. 68 e Quick Review (p. 71): permissão e obrigação, com as pegadinhas do to.',
    25,
    S3,
  ),
  pacote(
    'pb4-ing-s4-prova',
    'Simulado 4 · Dissertativo no estilo da Teacher Betina (PB4 Inglês)',
    '5 questões escritas: vocabulary, passive voice, make e let, reading e writing',
    'Como a prova bimestral dela: completar, transformar, ler e escrever. Respostas em frases completas, com letra maiúscula e ponto final. A IA corrige com o gabarito e os critérios.',
    60,
    PROVA,
  ),
];
