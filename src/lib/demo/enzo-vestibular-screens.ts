import type {
  ExamEditionSummary,
  ExamFileItem,
  VestibularResource,
} from '@/features/vestibular/server/queries';
import type {
  PracticeFilters,
  PracticeSessionSummary,
} from '@/features/vestibular/server/practice-queries';
import type { StudyPlan } from '@/features/vestibular/server/plan-queries';
import type {
  SubjectPerformance,
  TopicPerformance,
} from '@/features/vestibular/server/performance-queries';
import type {
  EssayDetail,
  EssayHistoryItem,
  EssayThemeItem,
} from '@/features/essay/server/queries';
import type { EssayFeedback } from '@/features/essay/lib/essay';

/** Vestibular do Enzo (FUVEST 2027): provas, banco de questões, redações, desempenho e plano. */

const MAT = { id: 'demo-mat', name: 'Matemática', color: 'blue' };
const POR = { id: 'demo-por', name: 'Português', color: 'purple' };
const BIO = { id: 'demo-bio', name: 'Biologia', color: 'green' };
const FIS = { id: 'demo-fis', name: 'Física', color: 'orange' };
const HIS = { id: 'demo-his', name: 'História', color: 'rose' };
const QUI = { id: 'demo-qui', name: 'Química', color: 'teal' };

// ---- Provas --------------------------------------------------------------------------------

export function enzoExamEditions(): ExamEditionSummary[] {
  return [
    { id: 'demo-ed-fuvest-2026', year: 2026, examName: 'FUVEST', coverUrl: null },
    { id: 'demo-ed-fuvest-2025', year: 2025, examName: 'FUVEST', coverUrl: null },
    { id: 'demo-ed-enem-2025', year: 2025, examName: 'ENEM', coverUrl: null },
    { id: 'demo-ed-enem-2024', year: 2024, examName: 'ENEM', coverUrl: null },
    { id: 'demo-ed-unicamp-2026', year: 2026, examName: 'UNICAMP', coverUrl: null },
    { id: 'demo-ed-unesp-2025', year: 2025, examName: 'UNESP', coverUrl: null },
  ];
}

export function enzoExamFiles(editionId?: string): ExamFileItem[] {
  const files = enzoExamEditions().flatMap((e) => [
    {
      id: `${e.id}-caderno`,
      editionId: e.id,
      kind: 'caderno' as const,
      label: `Caderno ${e.examName} ${e.year}`,
      url: '#',
      source: e.examName,
    },
    {
      id: `${e.id}-gabarito`,
      editionId: e.id,
      kind: 'gabarito' as const,
      label: `Gabarito ${e.examName} ${e.year}`,
      url: '#',
      source: e.examName,
    },
  ]);
  return editionId ? files.filter((f) => f.editionId === editionId) : files;
}

export function enzoVestibularResources(): VestibularResource[] {
  const r = (
    id: string,
    kind: VestibularResource['kind'],
    title: string,
    s: typeof MAT,
    exam: string,
    year: number,
    q: number,
    min: number | null,
    best: number | null,
    d: VestibularResource['difficulty'] = 'medio',
  ): VestibularResource => ({
    id,
    kind,
    title,
    description: null,
    subjectName: s.name,
    subjectColor: s.color,
    examName: exam,
    editionYear: year,
    difficulty: d,
    questionCount: q,
    timeLimitSeconds: min ? min * 60 : null,
    myBestPercent: best,
  });
  return [
    r('demo-v-1', 'simulado', 'FUVEST 2026: 1ª fase', POR, 'FUVEST', 2026, 90, 300, 71, 'dificil'),
    r('demo-v-2', 'simulado', 'FUVEST 2025: 1ª fase', POR, 'FUVEST', 2025, 90, 300, 68, 'dificil'),
    r(
      'demo-v-3',
      'simulado',
      'ENEM 2025: Matemática e suas Tecnologias',
      MAT,
      'ENEM',
      2025,
      45,
      150,
      78,
    ),
    r('demo-v-4', 'simulado', 'ENEM 2025: Ciências da Natureza', BIO, 'ENEM', 2025, 45, 150, 74),
    r('demo-v-5', 'simulado', 'ENEM 2024: Linguagens e Códigos', POR, 'ENEM', 2024, 45, 150, 81),
    r(
      'demo-v-6',
      'simulado',
      'UNICAMP 2026: 1ª fase',
      POR,
      'UNICAMP',
      2026,
      72,
      240,
      null,
      'dificil',
    ),
    r('demo-v-7', 'simulado', 'UNESP 2025: 1ª fase', HIS, 'UNESP', 2025, 90, 300, null),
    r('demo-v-8', 'quiz', 'Quiz FUVEST: funções e logaritmos', MAT, 'FUVEST', 2026, 12, null, 83),
    r('demo-v-9', 'quiz', 'Quiz ENEM: genética', BIO, 'ENEM', 2025, 10, null, 90, 'facil'),
    r('demo-v-10', 'quiz', 'Quiz FUVEST: cinemática', FIS, 'FUVEST', 2025, 10, null, 60),
  ];
}

// ---- Banco de questões ---------------------------------------------------------------------

export function enzoPracticeFilters(): PracticeFilters {
  return {
    exams: [
      { id: 'demo-exam-fuvest', name: 'FUVEST', questionCount: 540 },
      { id: 'demo-exam-enem', name: 'ENEM', questionCount: 1260 },
      { id: 'demo-exam-unicamp', name: 'UNICAMP', questionCount: 380 },
      { id: 'demo-exam-unesp', name: 'UNESP', questionCount: 410 },
    ],
    subjects: [
      { id: MAT.id, name: MAT.name, questionCount: 620 },
      { id: POR.id, name: POR.name, questionCount: 540 },
      { id: BIO.id, name: BIO.name, questionCount: 480 },
      { id: FIS.id, name: FIS.name, questionCount: 410 },
      { id: QUI.id, name: QUI.name, questionCount: 390 },
      { id: HIS.id, name: HIS.name, questionCount: 360 },
    ],
  };
}

export function enzoPracticeSessions(): PracticeSessionSummary[] {
  const s = (
    n: number,
    exam: string | null,
    sub: string | null,
    ok: number,
    total: number,
    at: string,
  ): PracticeSessionSummary => ({
    id: `demo-prac-${n}`,
    examName: exam,
    subjectName: sub,
    correctCount: ok,
    totalCount: total,
    startedAt: at,
    finishedAt: at,
  });
  return [
    s(1, 'FUVEST', 'Matemática', 14, 20, '2026-11-12T20:00:00-03:00'),
    s(2, 'ENEM', 'Biologia', 17, 20, '2026-11-11T19:30:00-03:00'),
    s(3, null, 'Física', 9, 15, '2026-11-09T21:10:00-03:00'),
    s(4, 'UNICAMP', 'Português', 13, 20, '2026-11-07T18:20:00-03:00'),
  ];
}

// ---- Desempenho e plano --------------------------------------------------------------------

const SUBJECT_PERF: [typeof MAT, number, number][] = [
  [BIO, 90, 120],
  [MAT, 74, 150],
  [POR, 78, 110],
  [QUI, 66, 60],
  [FIS, 62, 90],
  [HIS, 55, 40],
];

const status = (p: number): SubjectPerformance['status'] =>
  p >= 80 ? 'dominado' : p >= 60 ? 'desenvolvimento' : 'revisar';

export function enzoSubjectPerformance(): SubjectPerformance[] {
  return SUBJECT_PERF.map(([s, pct, total]) => ({
    subjectId: s.id,
    subjectName: s.name,
    subjectColor: s.color,
    correctCount: Math.round((pct / 100) * total),
    totalCount: total,
    accuracyPercent: pct,
    status: status(pct),
  }));
}

export function enzoTopicPerformance(): TopicPerformance[] {
  const t = (
    s: typeof MAT,
    id: string,
    name: string,
    ok: number,
    total: number,
  ): TopicPerformance => {
    const pct = Math.round((ok / total) * 100);
    return {
      subjectId: s.id,
      subjectName: s.name,
      subjectColor: s.color,
      topicId: id,
      topicName: name,
      correctCount: ok,
      totalCount: total,
      accuracyPercent: pct,
      status: status(pct),
    };
  };
  return [
    t(BIO, 'demo-top-genetica', 'Genética', 32, 36),
    t(BIO, 'demo-top-celula', 'Citologia', 38, 42),
    t(MAT, 'demo-top-funcoes', 'Funções', 46, 52),
    t(MAT, 'demo-top-exp', 'Funções exponenciais', 14, 24),
    t(MAT, 'demo-top-geo', 'Geometria analítica', 15, 28),
    t(POR, 'demo-top-interp', 'Interpretação de texto', 52, 64),
    t(QUI, 'demo-top-estequio', 'Estequiometria', 12, 20),
    t(FIS, 'demo-top-cinematica', 'Cinemática', 25, 38),
    t(FIS, 'demo-top-newton', 'Leis de Newton', 9, 18),
    t(HIS, 'demo-top-revind', 'Revolução Industrial', 12, 22),
  ];
}

export function enzoStudyPlan(): StudyPlan {
  const i = (
    s: typeof MAT,
    id: string,
    name: string,
    freq: number,
    mastery: number | null,
    answered: number,
    priority: number,
    reason: StudyPlan['items'][number]['reason'],
  ): StudyPlan['items'][number] => ({
    topicId: id,
    topicName: name,
    subjectId: s.id,
    subjectName: s.name,
    subjectColor: s.color,
    frequencyPercent: freq,
    frequencySource: 'cadastrada',
    masteryPercent: mastery,
    answeredCount: answered,
    priorityScore: priority,
    reason,
  });
  return {
    phase: 'reta_final',
    daysUntil: 23,
    items: [
      i(MAT, 'demo-top-exp', 'Funções exponenciais', 8, 58, 24, 92, 'cai_muito_e_voce_erra'),
      i(FIS, 'demo-top-newton', 'Leis de Newton', 7, 50, 18, 88, 'cai_muito_e_voce_erra'),
      i(MAT, 'demo-top-geo', 'Geometria analítica', 6, 54, 28, 80, 'voce_erra'),
      i(QUI, 'demo-top-estequio', 'Estequiometria', 7, 60, 20, 76, 'cai_muito'),
      i(HIS, 'demo-top-revind', 'Revolução Industrial', 5, 55, 22, 70, 'voce_erra'),
      i(FIS, 'demo-top-cinematica', 'Cinemática', 6, 66, 38, 62, 'cai_muito'),
      i(POR, 'demo-top-crase', 'Crase e regência', 4, 71, 31, 48, 'voce_erra'),
    ],
  };
}

// ---- Redação -------------------------------------------------------------------------------

function feedback(scores: number[], strengths: string[], improvements: string[]): EssayFeedback {
  const names = [
    'Domínio da norma culta',
    'Compreensão da proposta',
    'Argumentação',
    'Coesão textual',
    'Proposta de intervenção',
  ];
  return {
    total: scores.reduce((a, b) => a + b, 0),
    competencies: scores.map((score, k) => ({
      id: k + 1,
      name: names[k]!,
      score,
      comment:
        score >= 160
          ? 'Bom desempenho, com poucos desvios.'
          : 'Há espaço para evoluir neste ponto.',
      ...(score < 200 ? { toImprove: 'Revise o parágrafo e reforce a ligação com o tema.' } : {}),
    })),
    strengths,
    improvements,
    excerpts: [
      {
        excerpt: 'A sociedade brasileira enfrenta, ainda hoje, grandes dificuldades.',
        problem: 'Abertura genérica.',
        suggestion: 'Comece com um dado ou uma referência histórica ligada ao tema.',
      },
    ],
    rewrite: 'Versão sugerida do segundo parágrafo, com repertório e ligação direta com a tese.',
    intervention: { agent: true, action: true, means: true, purpose: true, detail: false },
    repertoire: 'Constituição Federal de 1988 e dados do IBGE.',
    model: 'enem',
    tier: 'basic',
  };
}

const ESSAYS: [string, string, number[], string][] = [
  [
    'demo-red-1',
    'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil',
    [160, 200, 160, 200, 160],
    '2026-11-08T17:30:00-03:00',
  ],
  [
    'demo-red-2',
    'Desafios para a valorização de comunidades e povos tradicionais no Brasil',
    [160, 200, 160, 160, 160],
    '2026-11-01T16:10:00-03:00',
  ],
  [
    'demo-red-3',
    'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil',
    [160, 160, 160, 160, 160],
    '2026-10-20T18:00:00-03:00',
  ],
  [
    'demo-red-4',
    'O estigma associado às doenças mentais na sociedade brasileira',
    [120, 160, 160, 160, 160],
    '2026-10-06T15:40:00-03:00',
  ],
];

export function enzoEssays(): EssayHistoryItem[] {
  return ESSAYS.map(([id, theme, scores, createdAt]) => ({
    id,
    theme,
    scores,
    createdAt,
    total: scores.reduce((a, b) => a + b, 0),
    feedback: feedback(
      scores,
      ['Boa estrutura dissertativa.', 'Proposta de intervenção completa.'],
      ['Aprofundar o repertório sociocultural.', 'Variar os conectivos.'],
    ),
  }));
}

export function enzoEssay(id: string): EssayDetail | null {
  const e = enzoEssays().find((x) => x.id === id);
  return e
    ? {
        ...e,
        themeId: null,
        essay:
          'Texto da redação do Enzo (exemplo de demonstração).\n\nNo Brasil, a questão apresentada ainda é um desafio histórico, que exige ação conjunta do Estado e da sociedade.',
      }
    : null;
}

export function enzoEssayThemes(): EssayThemeItem[] {
  return ESSAYS.map(([id, theme], k) => ({
    id: `${id}-tema`,
    title: theme,
    kind: 'real' as const,
    year: 2023 - k,
    examName: 'ENEM',
    context: null,
    axis: null,
    genre: null,
    note: null,
    proposalNo: null,
    model: 'enem' as const,
  }));
}
