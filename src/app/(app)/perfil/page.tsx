import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Award, Clock, Flame, Trophy, Zap } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import { ProfileTabs } from '@/features/profile/components/profile-tabs';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { NotificationSettings } from '@/types/database.types';

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Seus dados, metas e conquistas.',
};

export const dynamic = 'force-dynamic';

/** Iniciais para o avatar: duas letras no máximo, como o kit desenha. */
function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const [{ data: profile }, { data: stats }, { data: unlocked }, { data: achievements }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'full_name, grade_level, class_name, timezone, daily_study_goal_minutes, weekly_study_goal_minutes, notification_settings',
        )
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_achievements').select('achievement_id').not('unlocked_at', 'is', null),
      supabase.from('achievements').select('*').order('sort_order'),
    ]);

  const unlockedIds = new Set((unlocked ?? []).map((row) => row.achievement_id));
  const totalHours = Math.floor((stats?.total_study_seconds ?? 0) / 3600);
  const notificationSettings: NotificationSettings = profile?.notification_settings ?? {
    dailyReminder: true,
    revisionReminder: true,
    achievementsAndGoals: true,
    newsUpdates: false,
  };

  return (
    <>
      <AppHeader title="Perfil" />

      <PageMain className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* Identidade, como no kit: avatar, quem é, e o que conquistou ----- */}
        <Card className="min-w-0 lg:col-span-2">
          <CardContent className="flex items-center gap-4 p-4">
            <span
              aria-hidden
              className="bg-brand-soft text-brand-text grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold"
            >
              {initials(profile?.full_name ?? user.email ?? '?')}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold">
                {profile?.full_name ?? user.email}
              </h2>
              <p className="text-muted truncate text-sm">
                {[profile?.grade_level, profile?.class_name].filter(Boolean).join(' · ') ||
                  user.email}
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="brand">
                  <Zap className="size-3" aria-hidden />
                  Nível {stats?.level ?? 1}
                </Badge>
                {(stats?.current_streak ?? 0) > 0 && (
                  <Badge variant="warning">
                    <Flame className="size-3" aria-hidden />
                    {stats?.current_streak} dias seguidos
                  </Badge>
                )}
                {totalHours > 0 && (
                  <Badge variant="neutral">
                    <Clock className="size-3" aria-hidden />
                    {totalHours}h estudadas
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conta/Notificações/Aparência/Privacidade -------------------------- */}
        <ProfileTabs
          email={user.email}
          fullName={profile?.full_name ?? ''}
          gradeLevel={profile?.grade_level ?? null}
          className={profile?.class_name ?? null}
          dailyGoal={profile?.daily_study_goal_minutes ?? 45}
          weeklyGoal={profile?.weekly_study_goal_minutes ?? 300}
          timezone={profile?.timezone ?? 'America/Sao_Paulo'}
          notificationSettings={notificationSettings}
        />

        {/* Conquistas ------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-brand size-4" aria-hidden />
              Conquistas
              <Badge variant="neutral" className="ml-auto">
                {unlockedIds.size}/{achievements?.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(achievements ?? []).length === 0 ? (
              <PopEmptyState
                size="sm"
                icon={<Trophy className="size-5 text-white" />}
                title="Suas conquistas aparecem aqui"
                description="Sequência de estudo, notas e marcos de uso desbloqueiam selos automaticamente."
              />
            ) : (
              <ul className="divide-border divide-y">
                {(achievements ?? []).map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  return (
                    <li key={achievement.id} className="flex items-center gap-3 py-2.5">
                      {/* Desbloqueada ganha o mesmo selo em degradê do resto do
                          app — uma conquista "elegante" (seção 23 do pedido)
                          pesa mais que um círculo plano da mesma cor de fundo. */}
                      <span
                        aria-hidden
                        className={
                          isUnlocked
                            ? 'from-warning to-warning/80 grid size-9 shrink-0 place-items-center rounded-[32%] bg-gradient-to-br shadow-sm'
                            : 'bg-surface-2 text-subtle grid size-9 shrink-0 place-items-center rounded-full'
                        }
                      >
                        <Award className={isUnlocked ? 'size-4 text-white' : 'size-4'} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            isUnlocked
                              ? 'truncate text-sm font-medium'
                              : 'text-muted truncate text-sm font-medium'
                          }
                        >
                          {achievement.name}
                        </p>
                        <p className="text-subtle truncate text-xs">{achievement.description}</p>
                      </div>
                      {isUnlocked && <Badge variant="success">Conquistada</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

      </PageMain>
    </>
  );
}
