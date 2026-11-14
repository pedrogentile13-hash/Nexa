import type { TodaySnapshot } from '@/features/today/server/queries';

/**
 * Dados fictícios do aluno Enzo para o modo demonstração. Números redondos e coerentes entre as telas:
 * 65 dias de ofensiva e 48 horas de estudo acumuladas.
 */
export const ENZO = {
  name: 'Enzo',
  streakDays: 65,
  totalStudyMinutes: 48 * 60,
  today: '2026-11-13',
} as const;

const SUBJECTS = {
  matematica: { id: 'demo-mat', name: 'Matemática', color: 'blue' },
  portugues: { id: 'demo-por', name: 'Português', color: 'purple' },
  biologia: { id: 'demo-bio', name: 'Biologia', color: 'green' },
  fisica: { id: 'demo-fis', name: 'Física', color: 'orange' },
} as const;

/** Snapshot da tela Hoje. `today` vem do chamador, para a data acompanhar o banco quando o modo for ligado com dados reais. */
export function enzoTodaySnapshot(today: string = ENZO.today): TodaySnapshot {
  const weekDays = [
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
  ].map((date) => ({
    date,
    active: date <= today,
    isToday: date === today,
    isFuture: date > today,
  }));

  return {
    today,
    greetingName: ENZO.name,
    streak: ENZO.streakDays,
    longestStreak: ENZO.streakDays,
    avatarUrl: null,
    dailyGoalMinutes: 90,
    studiedTodayMinutes: 75,
    weeklyGoalMinutes: 600,
    weekStudiedMinutes: 410,
    previousWeekStudiedMinutes: 330,
    weekDays,
    overallScore: 7.8,
    routines: [
      {
        id: 'demo-rot-1',
        title: 'Revisar 10 cards',
        icon: '🧠',
        targetCount: 1,
        doneCount: 1,
        subjectName: SUBJECTS.biologia.name,
        subjectColor: SUBJECTS.biologia.color,
      },
      {
        id: 'demo-rot-2',
        title: 'Exercícios de funções',
        icon: '✏️',
        targetCount: 1,
        doneCount: 0,
        subjectName: SUBJECTS.matematica.name,
        subjectColor: SUBJECTS.matematica.color,
      },
      {
        id: 'demo-rot-3',
        title: 'Ler um resumo de gramática',
        icon: '📖',
        targetCount: 1,
        doneCount: 0,
        subjectName: SUBJECTS.portugues.name,
        subjectColor: SUBJECTS.portugues.color,
      },
    ],
    candidates: [
      {
        id: 'demo-task-1',
        kind: 'task',
        title: 'Prova de Física: cinemática',
        subjectId: SUBJECTS.fisica.id,
        subjectName: SUBJECTS.fisica.name,
        subjectColor: SUBJECTS.fisica.color,
        dueDate: '2026-11-16',
        subjectAverage: 7.4,
        subjectTarget: 8,
        passingGrade: 6,
      },
      {
        id: 'demo-task-2',
        kind: 'task',
        title: 'Lista de exercícios de funções',
        subjectId: SUBJECTS.matematica.id,
        subjectName: SUBJECTS.matematica.name,
        subjectColor: SUBJECTS.matematica.color,
        dueDate: '2026-11-14',
        subjectAverage: 8.1,
        subjectTarget: 8,
        passingGrade: 6,
      },
    ],
    upcoming: [
      {
        id: 'demo-up-1',
        title: 'Prova de Física: cinemática',
        dueDate: '2026-11-16',
        subjectName: SUBJECTS.fisica.name,
        subjectColor: SUBJECTS.fisica.color,
      },
      {
        id: 'demo-up-2',
        title: 'Redação: texto dissertativo',
        dueDate: '2026-11-19',
        subjectName: SUBJECTS.portugues.name,
        subjectColor: SUBJECTS.portugues.color,
      },
    ],
    classesToday: [
      {
        subjectId: SUBJECTS.matematica.id,
        subjectName: SUBJECTS.matematica.name,
        subjectColor: SUBJECTS.matematica.color,
        startsAt: '13:00:00',
        endsAt: '13:50:00',
        room: 'Sala 204',
      },
      {
        subjectId: SUBJECTS.biologia.id,
        subjectName: SUBJECTS.biologia.name,
        subjectColor: SUBJECTS.biologia.color,
        startsAt: '14:00:00',
        endsAt: '14:50:00',
        room: 'Lab 2',
      },
    ],
    runningSessionId: null,
    runningSessionStartedAt: null,
    resume: {
      id: 'demo-res-funcoes',
      title: 'Funções do 2º grau',
      kind: 'resumo',
      subjectName: SUBJECTS.matematica.name,
      progressPercent: 60,
    },
    resumeAudio: null,
    resumeVideo: null,
    recommendedQuiz: {
      id: 'demo-quiz-funcoes',
      title: 'Quiz: funções do 2º grau',
      kind: 'quiz',
      subjectName: SUBJECTS.matematica.name,
    },
  };
}
