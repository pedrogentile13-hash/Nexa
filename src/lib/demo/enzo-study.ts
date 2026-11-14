import type { LibraryItem, StudyHubData } from '@/features/study/server/queries';
import type { ResourceKind } from '@/types/database.types';

/** Biblioteca do Enzo: resumos, quizzes, simulados e um vídeo, nas matérias do 9º ano / 1º EM. */
const SUBJECT = {
  mat: { id: 'demo-mat', name: 'Matemática', color: 'blue' },
  por: { id: 'demo-por', name: 'Português', color: 'purple' },
  bio: { id: 'demo-bio', name: 'Biologia', color: 'green' },
  fis: { id: 'demo-fis', name: 'Física', color: 'orange' },
  his: { id: 'demo-his', name: 'História', color: 'rose' },
} as const;

type S = (typeof SUBJECT)[keyof typeof SUBJECT];

function item(
  id: string,
  kind: ResourceKind,
  title: string,
  subject: S,
  extra: Partial<LibraryItem> = {},
): LibraryItem {
  return {
    id,
    kind,
    title,
    subtitle: null,
    description: null,
    thumbnailUrl: null,
    durationSeconds: null,
    difficulty: 'medio',
    xpReward: 10,
    subjectId: subject.id,
    subjectName: subject.name,
    subjectColor: subject.color,
    topicName: null,
    questionCount: kind === 'resumo' ? 0 : 10,
    progressPercent: 0,
    bimestre: 4,
    gradeLevels: ['1ª série EM'],
    mine: false,
    ...extra,
  };
}

const ITEMS: LibraryItem[] = [
  item('demo-res-funcoes', 'resumo', 'Funções do 2º grau', SUBJECT.mat, {
    progressPercent: 60,
    topicName: 'Funções',
    durationSeconds: 900,
  }),
  item('demo-quiz-funcoes', 'quiz', 'Quiz: funções do 2º grau', SUBJECT.mat, {
    topicName: 'Funções',
    questionCount: 12,
  }),
  item('demo-sim-mat', 'simulado', 'Simulado: matemática básica', SUBJECT.mat, {
    questionCount: 20,
    durationSeconds: 3600,
  }),
  item('demo-res-cinematica', 'resumo', 'Cinemática: velocidade e aceleração', SUBJECT.fis, {
    progressPercent: 100,
    durationSeconds: 840,
  }),
  item('demo-sim-fis', 'simulado', 'Simulado: física e cinemática', SUBJECT.fis, {
    questionCount: 15,
    durationSeconds: 2700,
  }),
  item('demo-vid-cinematica', 'video', 'Cinemática em 10 minutos', SUBJECT.fis, {
    durationSeconds: 600,
    progressPercent: 35,
  }),
  item('demo-res-figuras', 'resumo', 'Figuras de linguagem', SUBJECT.por, { durationSeconds: 720 }),
  item('demo-quiz-crase', 'quiz', 'Quiz: crase', SUBJECT.por, { questionCount: 8 }),
  item('demo-sim-enem', 'simulado', 'Simulado ENEM: linguagens', SUBJECT.por, {
    questionCount: 25,
    durationSeconds: 3600,
  }),
  item('demo-res-celula', 'resumo', 'Célula e organelas', SUBJECT.bio, {
    progressPercent: 100,
    durationSeconds: 780,
  }),
  item('demo-quiz-genetica', 'quiz', 'Quiz: genética básica', SUBJECT.bio, { questionCount: 10 }),
  item('demo-res-revolucao', 'resumo', 'Revolução Industrial', SUBJECT.his, {
    durationSeconds: 660,
  }),
];

const COUNTS: Record<ResourceKind, number> = {
  resumo: 0,
  simulado: 0,
  quiz: 0,
  podcast: 0,
  video: 0,
  imagem: 0,
  musica: 0,
};
for (const i of ITEMS) COUNTS[i.kind] += 1;

/** Biblioteca do Enzo (ignora filtros: é só para a tela ficar cheia). */
export function enzoStudyHub(): StudyHubData {
  return {
    items: ITEMS,
    countsByKind: COUNTS,
    subjects: Object.values(SUBJECT).map((s) => ({ id: s.id, name: s.name, color: s.color })),
    series: [{ value: '1ª série EM', count: ITEMS.length }],
    mySerie: '1ª série EM',
    continueItem: null,
    tracks: [
      {
        id: 'demo-trilha-mat',
        title: 'Funções e gráficos',
        subjectName: 'Matemática',
        done: 2,
        total: 5,
      },
      { id: 'demo-trilha-bio', title: 'Citologia', subjectName: 'Biologia', done: 4, total: 4 },
    ],
  };
}
