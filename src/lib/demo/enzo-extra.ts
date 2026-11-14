import type { AchievementListItem } from '@/features/profile/components/achievements-list';
import type { AgendaEvent, AgendaRange } from '@/features/agenda/server/queries';
import type { RankingPage, RankingRow } from '@/features/ranking/server/queries';
import type { CoinBalance } from '@/features/billing/server/coins';
import { COIN_LABEL } from '@/lib/ai/coins';

/** Perfil, conquistas, agenda, ranking e moedas do Enzo (modo demonstração). */

export const ENZO_PROFILE = {
  full_name: 'Enzo Martins',
  avatar_url: null,
  role: 'student',
  grade_level: '1ª série EM',
  class_id: null,
  classes: { name: '1ª série EM A' },
  daily_study_goal_minutes: 90,
  weekly_study_goal_minutes: 600,
  notification_settings: {
    dailyReminder: true,
    revisionReminder: true,
    achievementsAndGoals: true,
    newsUpdates: false,
  },
  schools: { id: 'demo-school', name: 'Colégio Modelo', city: 'São Paulo', state: 'SP' },
};

export const ENZO_STATS = {
  user_id: 'demo',
  level: 9,
  xp: 6850,
  total_study_seconds: 48 * 3600,
  current_streak: 65,
  longest_streak: 65,
};

export function enzoAchievements(): AchievementListItem[] {
  const a = (
    n: number,
    name: string,
    description: string,
    rarity: AchievementListItem['rarity'],
    progress: number,
    threshold: number,
    unlocked: string | null,
  ): AchievementListItem => ({
    id: `demo-ach-${n}`,
    name,
    description,
    rarity,
    progress,
    threshold,
    unlockedAt: unlocked,
  });
  return [
    a(
      1,
      'Primeiro passo',
      'Conclua o seu primeiro conteúdo.',
      'comum',
      1,
      1,
      '2026-09-08T19:00:00-03:00',
    ),
    a(2, 'Semana de fogo', 'Estude 7 dias seguidos.', 'comum', 7, 7, '2026-09-14T21:00:00-03:00'),
    a(
      3,
      'Um mês de foco',
      'Mantenha 30 dias de ofensiva.',
      'rara',
      30,
      30,
      '2026-10-08T21:00:00-03:00',
    ),
    a(
      4,
      'Dois meses sem parar',
      'Mantenha 60 dias de ofensiva.',
      'epica',
      60,
      60,
      '2026-11-07T21:00:00-03:00',
    ),
    a(5, 'Maratonista', 'Acumule 40 horas de estudo.', 'rara', 40, 40, '2026-11-02T20:00:00-03:00'),
    a(6, 'Quiz master', 'Faça 50 quizzes.', 'rara', 50, 50, '2026-10-26T19:00:00-03:00'),
    a(
      7,
      'Simulado de ouro',
      'Acerte 85% em um simulado.',
      'epica',
      1,
      1,
      '2026-11-10T21:10:00-03:00',
    ),
    a(
      8,
      'Redação nota 800',
      'Tire 800 ou mais em uma redação.',
      'epica',
      1,
      1,
      '2026-11-01T16:10:00-03:00',
    ),
    a(9, '100 dias de ofensiva', 'Chegue a 100 dias seguidos.', 'lendaria', 65, 100, null),
    a(10, '100 horas de estudo', 'Acumule 100 horas de estudo.', 'lendaria', 48, 100, null),
    a(11, 'Mestre das questões', 'Responda 1.000 questões.', 'epica', 486, 1000, null),
    a(12, 'Nota 9 em todas', 'Chegue a média 9 em todas as matérias.', 'rara', 2, 5, null),
  ];
}

export function enzoCoinBalance(): CoinBalance {
  const row = (feature: keyof typeof COIN_LABEL, coins: number, uses: number) => ({
    feature,
    label: COIN_LABEL[feature],
    coins,
    uses,
  });
  return {
    allowance: 300,
    spent: 118,
    remaining: 182,
    byFeature: [
      row('nexa_ia', 54, 27),
      row('explain', 36, 18),
      row('summary', 18, 6),
      row('hint', 10, 10),
    ],
  };
}

export function enzoAgenda(from: string, to: string, today: string): AgendaRange {
  const e = (
    id: string,
    kind: AgendaEvent['kind'],
    title: string,
    date: string,
    subject: [string, string] | null,
    done: boolean,
    taskKind: string | null = null,
  ): AgendaEvent => ({
    id,
    kind,
    taskKind,
    title,
    date,
    subjectId: subject ? `demo-${subject[0]}` : null,
    subjectName: subject ? subject[1] : null,
    subjectColor: subject ? subject[0] : 'blue',
    isDone: done,
  });
  const all: AgendaEvent[] = [
    e(
      'a1',
      'task',
      'Prova de Física: cinemática',
      '2026-11-16',
      ['orange', 'Física'],
      false,
      'prova',
    ),
    e(
      'a2',
      'task',
      'Lista de exercícios de funções',
      '2026-11-14',
      ['blue', 'Matemática'],
      false,
      'homework',
    ),
    e(
      'a3',
      'task',
      'Redação: texto dissertativo',
      '2026-11-19',
      ['purple', 'Português'],
      false,
      'homework',
    ),
    e(
      'a4',
      'task',
      'Prova de Biologia: genética',
      '2026-11-23',
      ['green', 'Biologia'],
      false,
      'prova',
    ),
    e('a5', 'event', 'Simulado bimestral', '2026-11-19', null, false),
    e('a6', 'event', 'Reunião de pais', '2026-11-21', null, false),
    e(
      'a7',
      'task',
      'Resumo de Revolução Industrial',
      '2026-11-12',
      ['rose', 'História'],
      true,
      'homework',
    ),
    e('a8', 'study', 'Estudo: Matemática', '2026-11-13', ['blue', 'Matemática'], true),
    e('a9', 'study', 'Estudo: Biologia', '2026-11-12', ['green', 'Biologia'], true),
    e('a10', 'study', 'Estudo: Física', '2026-11-11', ['orange', 'Física'], true),
    e('a11', 'study', 'Estudo: Português', '2026-11-10', ['purple', 'Português'], true),
    e('a12', 'study', 'Estudo: Matemática', '2026-11-09', ['blue', 'Matemática'], true),
  ];
  return { from, to, today, events: all.filter((x) => x.date >= from && x.date <= to) };
}

const NAMES = [
  'Mariana Alves',
  'Lucas Ferreira',
  'Isabela Rocha',
  'Pedro Lima',
  'Laura Gomes',
  'Gabriel Souza',
  'Sofia Barros',
  'Thiago Mendes',
  'Beatriz Nunes',
];

export function enzoRanking(): RankingPage {
  const rows: RankingRow[] = [
    ...NAMES.slice(0, 3).map((n, i) => ({
      userId: `demo-r${i}`,
      fullName: n,
      avatarUrl: null,
      className: '1ª série EM A',
      xp: 8400 - i * 520,
      level: 10 - (i > 1 ? 1 : 0),
      currentStreak: 70 - i * 9,
      questionsAnswered: 640 - i * 40,
      studyHours: 56 - i * 3,
      rank: i + 1,
      previousRank: i + 1,
    })),
    {
      userId: 'demo-me',
      fullName: 'Enzo Martins',
      avatarUrl: null,
      className: '1ª série EM A',
      xp: 6850,
      level: 9,
      currentStreak: 65,
      questionsAnswered: 486,
      studyHours: 48,
      rank: 4,
      previousRank: 6,
    },
    ...NAMES.slice(3).map((n, i) => ({
      userId: `demo-r${i + 3}`,
      fullName: n,
      avatarUrl: null,
      className: i % 2 ? '1ª série EM B' : '1ª série EM A',
      xp: 6500 - i * 450,
      level: 9 - Math.floor(i / 3),
      currentStreak: 40 - i * 5,
      questionsAnswered: 450 - i * 35,
      studyHours: 44 - i * 3,
      rank: i + 5,
      previousRank: i + 5,
    })),
  ];
  const me = rows[3]!;
  return {
    rows,
    me,
    aboveMe: rows[2]!,
    belowMe: rows[4]!,
    evolution: [
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
    ].map((day, i) => ({
      day,
      meXp: 5900 + i * 140,
      schoolAvgXp: 3400 + i * 50,
      top1Xp: 7500 + i * 150,
    })),
    stats: {
      questionsAnswered: 486,
      studyHours: 48,
      summariesRead: 63,
      videosWatched: 19,
      simuladosDone: 13,
      accuracyPercent: 72,
    },
    hasSchool: true,
    lifetimeXp: 6850,
    friends: [
      {
        userId: 'demo-f1',
        fullName: 'Mariana Alves',
        avatarUrl: null,
        className: '1ª série EM A',
        level: 10,
        xp: 8400,
        currentStreak: 70,
      },
      {
        userId: 'demo-f2',
        fullName: 'Pedro Lima',
        avatarUrl: null,
        className: '1ª série EM A',
        level: 9,
        xp: 6500,
        currentStreak: 41,
      },
    ],
    incomingRequests: [],
  };
}
