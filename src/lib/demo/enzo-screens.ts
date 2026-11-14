import type {
  PerformanceData,
  SimuladoAttempt,
  SubjectScore,
  StudyWeek,
} from '@/features/performance/server/queries';
import type { GradeRow } from '@/features/performance/lib/report-card';
import type { SimuladoCatalogItem } from '@/features/simulados/server/queries';
import type { ReviewItem } from '@/features/revisoes/server/queries';
import type { LongTermGoal, MetasOverview } from '@/features/metas/server/queries';
import type { TrilhasOverview } from '@/features/trilhas/server/queries';
import { levelForXp, xpToNextLevel } from '@/features/performance/lib/level';

/** Telas de estudo do Enzo (modo demonstração). Todos os números batem com `enzo.ts`: 65 dias e 48 h. */

const MAT = { id: 'demo-mat', name: 'Matemática', color: 'blue' };
const POR = { id: 'demo-por', name: 'Português', color: 'purple' };
const BIO = { id: 'demo-bio', name: 'Biologia', color: 'green' };
const FIS = { id: 'demo-fis', name: 'Física', color: 'orange' };
const HIS = { id: 'demo-his', name: 'História', color: 'rose' };

// ---- Desempenho ----------------------------------------------------------------------------

function subject(
  s: typeof MAT,
  assessment: number,
  empenho: number,
  quizzes: number,
  simulados: number,
  content: number,
  target: number,
): SubjectScore {
  return {
    subjectId: s.id,
    subjectName: s.name,
    subjectColor: s.color,
    hasContent: true,
    assessmentScore: assessment,
    empenhoIndex: empenho,
    blendedScore: assessment,
    quizzesDone: quizzes,
    simuladosDone: simulados,
    contentCompleted: content,
    targetGrade: target,
    passingGrade: 6,
  };
}

// Segunda-feira de cada semana, da mais antiga para a atual. A soma é 2.880 min = 48 h.
const WEEKS: [string, string, number][] = [
  ['2026-09-07', '07/09', 150],
  ['2026-09-14', '14/09', 270],
  ['2026-09-21', '21/09', 220],
  ['2026-09-28', '28/09', 260],
  ['2026-10-05', '05/10', 280],
  ['2026-10-12', '12/10', 300],
  ['2026-10-19', '19/10', 320],
  ['2026-10-26', '26/10', 340],
  ['2026-11-02', '02/11', 330],
  ['2026-11-09', '09/11', 410],
];

const XP = 6850;

export function enzoPerformance(): PerformanceData {
  const studyWeeks: StudyWeek[] = WEEKS.map(([weekStart, label, minutes]) => ({
    weekStart,
    label,
    minutes,
  }));
  const evolution = [6.9, 7.0, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8];
  return {
    subjectScores: [
      subject(MAT, 8.1, 88, 21, 4, 18, 8.5),
      subject(POR, 7.6, 74, 14, 3, 12, 8),
      subject(BIO, 8.4, 90, 17, 2, 15, 8),
      subject(FIS, 7.4, 70, 12, 3, 10, 8),
      subject(HIS, 7.5, 76, 9, 1, 8, 7.5),
    ],
    overallScore: 7.8,
    scoreEvolution: WEEKS.slice(2).map(([weekStart, label], i) => ({
      weekStart,
      label,
      assessmentScore: evolution[i]!,
      empenhoIndex: 78 + i * 0.8,
      blendedScore: evolution[i]!,
    })),
    simuladoHistory: enzoSimuladoHistory(),
    studyWeeks,
    level: levelForXp(XP),
    xp: XP,
    xpToNextLevel: xpToNextLevel(XP),
    totalStudySeconds: 48 * 3600,
    currentStreak: 65,
    longestStreak: 65,
    topicMastery: [
      {
        subjectId: MAT.id,
        subjectName: MAT.name,
        subjectColor: MAT.color,
        topicId: 'demo-top-funcoes',
        topicName: 'Funções do 2º grau',
        correctCount: 46,
        totalCount: 52,
        masteryPercent: 88,
        status: 'dominado',
      },
      {
        subjectId: BIO.id,
        subjectName: BIO.name,
        subjectColor: BIO.color,
        topicId: 'demo-top-celula',
        topicName: 'Célula e organelas',
        correctCount: 38,
        totalCount: 42,
        masteryPercent: 90,
        status: 'dominado',
      },
      {
        subjectId: POR.id,
        subjectName: POR.name,
        subjectColor: POR.color,
        topicId: 'demo-top-crase',
        topicName: 'Crase',
        correctCount: 22,
        totalCount: 31,
        masteryPercent: 71,
        status: 'desenvolvimento',
      },
      {
        subjectId: FIS.id,
        subjectName: FIS.name,
        subjectColor: FIS.color,
        topicId: 'demo-top-cinematica',
        topicName: 'Cinemática',
        correctCount: 25,
        totalCount: 38,
        masteryPercent: 66,
        status: 'desenvolvimento',
      },
      {
        subjectId: HIS.id,
        subjectName: HIS.name,
        subjectColor: HIS.color,
        topicId: 'demo-top-revind',
        topicName: 'Revolução Industrial',
        correctCount: 12,
        totalCount: 22,
        masteryPercent: 55,
        status: 'revisar',
      },
      {
        subjectId: FIS.id,
        subjectName: FIS.name,
        subjectColor: FIS.color,
        topicId: 'demo-top-dinamica',
        topicName: 'Leis de Newton',
        correctCount: 9,
        totalCount: 18,
        masteryPercent: 50,
        status: 'revisar',
      },
    ],
    skillMastery: [
      {
        skill: 'Interpretação de texto',
        correctCount: 52,
        totalCount: 64,
        masteryPercent: 81,
        status: 'dominado',
      },
      {
        skill: 'Cálculo mental',
        correctCount: 41,
        totalCount: 58,
        masteryPercent: 71,
        status: 'desenvolvimento',
      },
      {
        skill: 'Análise de gráficos',
        correctCount: 18,
        totalCount: 33,
        masteryPercent: 55,
        status: 'revisar',
      },
    ],
    commonErrorTypes: [
      { errorType: 'Falta de atenção ao enunciado', occurrences: 14 },
      { errorType: 'Conceito não dominado', occurrences: 11 },
      { errorType: 'Erro de cálculo', occurrences: 8 },
    ],
  };
}

export function enzoSimuladoHistory(): SimuladoAttempt[] {
  const row = (
    n: number,
    title: string,
    s: typeof MAT,
    ok: number,
    total: number,
    min: number,
    at: string,
  ): SimuladoAttempt => ({
    attemptId: `demo-att-${n}`,
    resourceId: `demo-sim-${n}`,
    resourceTitle: title,
    subjectId: s.id,
    subjectName: s.name,
    subjectColor: s.color,
    correctCount: ok,
    totalCount: total,
    percent: Math.round((ok / total) * 100),
    durationSeconds: min * 60,
    finishedAt: at,
  });
  return [
    row(1, 'Simulado: matemática básica', MAT, 17, 20, 52, '2026-11-10T21:10:00-03:00'),
    row(2, 'Simulado: física e cinemática', FIS, 11, 15, 38, '2026-11-06T20:30:00-03:00'),
    row(3, 'Simulado ENEM: linguagens', POR, 19, 25, 58, '2026-11-01T16:05:00-03:00'),
    row(4, 'Simulado: citologia', BIO, 13, 15, 33, '2026-10-24T19:40:00-03:00'),
    row(5, 'Simulado: Revolução Industrial', HIS, 8, 12, 27, '2026-10-17T18:15:00-03:00'),
  ];
}

export const ENZO_REPORT_CARD: GradeRow[] = [MAT, POR, BIO, FIS, HIS].map((s, i) => ({
  grade_level: '1ª série EM',
  subject_catalog_id: s.id,
  subject_name: s.name,
  subject_color: s.color,
  assessment_score: [8.1, 7.6, 8.4, 7.4, 7.5][i]!,
  quizzes_done: [21, 14, 17, 12, 9][i]!,
  simulados_done: [4, 3, 2, 3, 1][i]!,
  content_completed: [18, 12, 15, 10, 8][i]!,
}));

// ---- Simulados -----------------------------------------------------------------------------

export function enzoSimuladoCatalog(): SimuladoCatalogItem[] {
  const it = (
    id: string,
    title: string,
    s: typeof MAT,
    topic: string,
    q: number,
    min: number,
    xp: number,
    d: SimuladoCatalogItem['difficulty'] = 'medio',
  ): SimuladoCatalogItem => ({
    id,
    title,
    subtitle: null,
    subjectId: s.id,
    subjectName: s.name,
    subjectColor: s.color,
    topicName: topic,
    questionCount: q,
    difficulty: d,
    durationSeconds: min * 60,
    xpReward: xp,
  });
  return [
    it('demo-sim-1', 'Simulado: matemática básica', MAT, 'Funções', 20, 60, 60),
    it('demo-sim-2', 'Simulado: física e cinemática', FIS, 'Cinemática', 15, 45, 50),
    it('demo-sim-3', 'Simulado ENEM: linguagens', POR, 'Interpretação', 25, 60, 70, 'anglo'),
    it('demo-sim-4', 'Simulado: citologia', BIO, 'Célula', 15, 40, 45, 'facil'),
    it('demo-sim-5', 'Simulado: Revolução Industrial', HIS, 'Industrialização', 12, 35, 40),
    it('demo-sim-6', 'Simulado: genética básica', BIO, 'Genética', 18, 50, 55, 'dificil'),
  ];
}

// ---- Revisões ------------------------------------------------------------------------------

export function enzoReviewQueue(): ReviewItem[] {
  const base = (
    n: number,
    bucket: ReviewItem['bucket'],
    s: typeof MAT,
    kind: ReviewItem['kind'],
    title: string,
    topic: string,
    due: string,
    extra: Partial<ReviewItem> = {},
  ): ReviewItem => ({
    kind,
    bucket,
    questionId: kind === 'erro' ? `demo-q-${n}` : null,
    resourceId: `demo-rev-${n}`,
    resourceTitle: title,
    subjectId: s.id,
    subjectName: s.name,
    subjectColor: s.color,
    topicName: topic,
    statement: null,
    explanation: null,
    chosenBody: null,
    correctBody: null,
    answeredAt: null,
    dueDate: due,
    nextIntervalStep: 2,
    resourceKind: kind === 'erro' ? 'quiz' : 'resumo',
    ...extra,
  });
  return [
    base(1, 'atrasada', FIS, 'erro', 'Simulado: física e cinemática', 'Cinemática', '2026-11-11', {
      statement: 'Um carro passa de 20 m/s para 30 m/s em 5 s. Qual é a sua aceleração média?',
      chosenBody: '10 m/s²',
      correctBody: '2 m/s²',
      explanation: 'a = Δv / Δt = (30 − 20) / 5 = 2 m/s².',
      answeredAt: '2026-11-06T20:12:00-03:00',
    }),
    base(2, 'hoje', MAT, 'erro', 'Quiz: funções do 2º grau', 'Funções', '2026-11-13', {
      statement: 'Qual é o vértice da parábola y = x² − 4x + 3?',
      chosenBody: '(1, 0)',
      correctBody: '(2, −1)',
      explanation: 'xv = −b / 2a = 2; yv = 4 − 8 + 3 = −1.',
      answeredAt: '2026-11-10T21:00:00-03:00',
    }),
    base(3, 'hoje', HIS, 'conteudo', 'Revolução Industrial', 'Industrialização', '2026-11-13'),
    base(4, 'proxima', POR, 'erro', 'Quiz: crase', 'Crase', '2026-11-15', {
      statement: 'Assinale a frase em que o uso da crase está correto.',
      chosenBody: 'Fui à pé até a escola.',
      correctBody: 'Fui à escola a pé.',
      explanation: 'Não há crase antes de palavra masculina.',
      answeredAt: '2026-11-12T18:45:00-03:00',
    }),
    base(5, 'proxima', BIO, 'conteudo', 'Célula e organelas', 'Citologia', '2026-11-17'),
    base(6, 'concluida', MAT, 'erro', 'Simulado: matemática básica', 'Equações', '2026-11-09', {
      answeredAt: '2026-11-03T20:00:00-03:00',
    }),
  ];
}

// ---- Metas ---------------------------------------------------------------------------------

export function enzoMetas(): MetasOverview {
  return {
    monthHours: 21.5,
    monthHoursGoal: 30,
    monthSubjectsActive: 5,
    monthSubjectsGoal: 5,
    monthActivities: 38,
    monthActivitiesGoal: 50,
    currentStreak: 65,
    weeklyMinutes: WEEKS.slice(-8).map(([weekStart, label, minutes]) => ({
      weekStart,
      label,
      minutes,
    })),
    bySubject: [
      { subjectId: MAT.id, subjectName: MAT.name, subjectColor: MAT.color, minutes: 410 },
      { subjectId: BIO.id, subjectName: BIO.name, subjectColor: BIO.color, minutes: 320 },
      { subjectId: POR.id, subjectName: POR.name, subjectColor: POR.color, minutes: 290 },
      { subjectId: FIS.id, subjectName: FIS.name, subjectColor: FIS.color, minutes: 170 },
      { subjectId: HIS.id, subjectName: HIS.name, subjectColor: HIS.color, minutes: 100 },
    ],
  };
}

export function enzoLongTermGoals(): LongTermGoal[] {
  return [
    {
      id: 'demo-meta-1',
      title: 'Passar em Engenharia na USP',
      icon: '🎯',
      progressPercent: 62,
      createdAt: '2026-03-02T10:00:00-03:00',
    },
    {
      id: 'demo-meta-2',
      title: 'Fechar o ano com média 8 em todas as matérias',
      icon: '📈',
      progressPercent: 78,
      createdAt: '2026-02-10T10:00:00-03:00',
    },
    {
      id: 'demo-meta-3',
      title: 'Chegar a 100 dias de ofensiva',
      icon: '🔥',
      progressPercent: 65,
      createdAt: '2026-09-08T10:00:00-03:00',
    },
  ];
}

// ---- Trilhas -------------------------------------------------------------------------------

export function enzoTrilhas(): TrilhasOverview {
  const tracks: TrilhasOverview['tracks'] = [
    {
      id: 'demo-trilha-mat',
      title: 'Funções e gráficos',
      description: 'Do conceito de função ao gráfico da parábola.',
      subjectId: MAT.id,
      subjectName: MAT.name,
      subjectColor: MAT.color,
      category: 'enem',
      done: 3,
      total: 5,
    },
    {
      id: 'demo-trilha-bio',
      title: 'Citologia',
      description: 'Membrana, núcleo e organelas, do zero ao simulado.',
      subjectId: BIO.id,
      subjectName: BIO.name,
      subjectColor: BIO.color,
      category: 'fundamental',
      done: 4,
      total: 4,
    },
    {
      id: 'demo-trilha-fis',
      title: 'Cinemática',
      description: 'Velocidade, aceleração e movimento uniformemente variado.',
      subjectId: FIS.id,
      subjectName: FIS.name,
      subjectColor: FIS.color,
      category: 'enem',
      done: 1,
      total: 6,
    },
    {
      id: 'demo-trilha-por',
      title: 'Gramática para a redação',
      description: 'Crase, concordância e pontuação aplicadas ao texto.',
      subjectId: POR.id,
      subjectName: POR.name,
      subjectColor: POR.color,
      category: 'reforco',
      done: 2,
      total: 5,
    },
    {
      id: 'demo-trilha-his',
      title: 'Revolução Industrial',
      description: 'Causas, fases e consequências sociais.',
      subjectId: HIS.id,
      subjectName: HIS.name,
      subjectColor: HIS.color,
      category: 'fundamental',
      done: 0,
      total: 4,
    },
  ];
  return {
    tracks,
    continueTrackId: 'demo-trilha-mat',
    recommendedTrackIds: ['demo-trilha-fis', 'demo-trilha-his'],
    totalDone: tracks.reduce((a, t) => a + t.done, 0),
    totalLessons: tracks.reduce((a, t) => a + t.total, 0),
  };
}
