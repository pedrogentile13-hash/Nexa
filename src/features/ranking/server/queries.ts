import { createClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * Ranking de XP.
 *
 * Sem tabela própria: tudo sai ao vivo de `school_ranking()`/
 * `ranking_evolution()` (RPCs, migração 20260910000200) — as mesmas que já
 * resolvem escopo (aluno nunca escolhe a escola, só a própria) e cálculo de
 * XP por período direto no banco. Este arquivo só monta o resto que a tela
 * precisa: estatísticas de conteúdo e a posição de quem está logado dentro
 * da lista que a RPC já devolveu ordenada.
 */

export type RankingScope = 'escola' | 'turma';
export type RankingPeriod = 'hoje' | 'semana' | 'mes' | 'geral';
export type RankingOrderBy = 'xp' | 'streak' | 'questoes' | 'horas';

export interface RankingRow {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  className: string | null;
  xp: number;
  level: number;
  currentStreak: number;
  questionsAnswered: number;
  studyHours: number;
  rank: number;
  previousRank: number | null;
}

export interface RankingEvolutionPoint {
  day: string;
  meXp: number;
  schoolAvgXp: number;
  top1Xp: number;
}

export interface RankingStats {
  questionsAnswered: number;
  studyHours: number;
  summariesRead: number;
  videosWatched: number;
  simuladosDone: number;
  /** 0–100. `null` sem nenhuma questão respondida — não é 0% de acerto, é "sem dado". */
  accuracyPercent: number | null;
}

export interface FriendSummary {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  className: string | null;
  level: number;
  xp: number;
  currentStreak: number;
}

export interface FriendRequestSummary {
  requesterId: string;
  fullName: string;
  avatarUrl: string | null;
  className: string | null;
  createdAt: string;
}

export interface RankingPage {
  rows: RankingRow[];
  me: RankingRow | null;
  aboveMe: RankingRow | null;
  belowMe: RankingRow | null;
  evolution: RankingEvolutionPoint[];
  stats: RankingStats;
  hasSchool: boolean;
  /** XP/nível de sempre (`user_stats`) — não filtrado por período, pro cartão de Nível. */
  lifetimeXp: number;
  friends: FriendSummary[];
  incomingRequests: FriendRequestSummary[];
}

const ORDER_KEY: Record<RankingOrderBy, keyof RankingRow> = {
  xp: 'xp',
  streak: 'currentStreak',
  questoes: 'questionsAnswered',
  horas: 'studyHours',
};

export async function getRankingPage(filters: {
  scope: RankingScope;
  classId: string | null;
  period: RankingPeriod;
  orderBy: RankingOrderBy;
}): Promise<RankingPage | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  const [
    profileRes,
    rankingRes,
    evolutionRes,
    answersRes,
    sessionsRes,
    progressRes,
    attemptsRes,
    friendsRes,
    friendRequestsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('school_id').eq('id', user.id).maybeSingle(),
    supabase.rpc('school_ranking', {
      p_scope: filters.scope,
      p_class_id: filters.scope === 'turma' ? filters.classId : null,
      p_period: filters.period,
    }),
    supabase.rpc('ranking_evolution', { p_user_id: user.id, p_days: 30 }),
    // Sem `.eq('user_id', ...)`: `quiz_answers` não tem essa coluna direto
    // (só via `attempt_id` → `quiz_attempts`) — a RLS de `quiz_answers`
    // (`exists (... a.user_id = auth.uid())`) já restringe às próprias
    // respostas, então a consulta nem precisa saber disso.
    supabase.from('quiz_answers').select('is_correct'),
    supabase
      .from('user_stats')
      .select('xp, total_study_seconds')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('resource_progress')
      .select('resource_id, resources(kind)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
    supabase
      .from('quiz_attempts')
      .select('id, resources(kind)')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null),
    supabase.rpc('list_friends'),
    supabase.rpc('list_friend_requests'),
  ]);

  const rows: RankingRow[] = (rankingRes.data ?? []).map((r) => ({
    userId: r.user_id,
    fullName: r.full_name ?? 'Sem nome',
    avatarUrl: r.avatar_url,
    className: r.class_name,
    xp: Number(r.xp),
    level: r.level,
    currentStreak: r.current_streak,
    questionsAnswered: r.questions_answered,
    studyHours: Number(r.study_hours),
    rank: Number(r.rank),
    previousRank: r.previous_rank === null ? null : Number(r.previous_rank),
  }));

  const key = ORDER_KEY[filters.orderBy];
  const sorted = [...rows].sort((a, b) => (b[key] as number) - (a[key] as number));

  const meIndex = sorted.findIndex((r) => r.userId === user.id);
  const me = meIndex >= 0 ? (sorted[meIndex] ?? null) : null;
  const aboveMe = meIndex > 0 ? (sorted[meIndex - 1] ?? null) : null;
  const belowMe =
    meIndex >= 0 && meIndex + 1 < sorted.length ? (sorted[meIndex + 1] ?? null) : null;

  const answers = answersRes.data ?? [];
  const correct = answers.filter((a) => a.is_correct).length;

  const summariesRead = (progressRes.data ?? []).filter(
    (p) => (p.resources as unknown as { kind: string } | null)?.kind === 'resumo',
  ).length;
  const videosWatched = (progressRes.data ?? []).filter(
    (p) => (p.resources as unknown as { kind: string } | null)?.kind === 'video',
  ).length;
  const simuladosDone = (attemptsRes.data ?? []).filter(
    (a) => (a.resources as unknown as { kind: string } | null)?.kind === 'simulado',
  ).length;

  const evolution: RankingEvolutionPoint[] = (evolutionRes.data ?? []).map((e) => ({
    day: e.day,
    meXp: Number(e.me_xp),
    schoolAvgXp: Number(e.school_avg_xp),
    top1Xp: Number(e.top1_xp),
  }));

  return {
    rows: sorted,
    me,
    aboveMe,
    belowMe,
    evolution,
    stats: {
      questionsAnswered: answers.length,
      studyHours: Math.round(((sessionsRes.data?.total_study_seconds ?? 0) / 3600) * 10) / 10,
      summariesRead,
      videosWatched,
      simuladosDone,
      accuracyPercent: answers.length > 0 ? Math.round((correct / answers.length) * 100) : null,
    },
    hasSchool: profileRes.data?.school_id != null,
    lifetimeXp: sessionsRes.data?.xp ?? 0,
    friends: (friendsRes.data ?? []).map((f) => ({
      userId: f.user_id,
      fullName: f.full_name ?? 'Sem nome',
      avatarUrl: f.avatar_url,
      className: f.class_name,
      level: f.level,
      xp: Number(f.xp),
      currentStreak: f.current_streak,
    })),
    incomingRequests: (friendRequestsRes.data ?? []).map((r) => ({
      requesterId: r.requester_id,
      fullName: r.full_name ?? 'Sem nome',
      avatarUrl: r.avatar_url,
      className: r.class_name,
      createdAt: r.created_at,
    })),
  };
}
