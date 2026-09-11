import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, Clock, Flame, Trophy, Zap } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from '@/features/profile/components/avatar-upload';
import { ProfileTabs } from '@/features/profile/components/profile-tabs';
import type { AchievementListItem } from '@/features/profile/components/achievements-list';
import { RARITY_LABEL } from '@/features/ranking/lib/rarity';
import { listSchoolClasses } from '@/features/classes/server/queries';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { NotificationSettings } from '@/types/database.types';

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Seus dados, metas e conquistas.',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const [{ data: profile }, { data: stats }, { data: userAchievements }, { data: achievements }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'full_name, avatar_url, grade_level, class_id, classes(name), daily_study_goal_minutes, weekly_study_goal_minutes, notification_settings, schools(id, name, city, state)',
        )
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_achievements').select('achievement_id, progress, unlocked_at'),
      supabase.from('achievements').select('*').order('sort_order'),
    ]);

  const progressById = new Map((userAchievements ?? []).map((row) => [row.achievement_id, row]));
  // Conquistas desativadas (ex.: ligadas a nota manual, removida) somem da
  // lista pra quem nunca desbloqueou — mas quem já tem o selo não o perde.
  const achievementItems: AchievementListItem[] = (achievements ?? [])
    .filter((a) => a.is_active || progressById.get(a.id)?.unlocked_at != null)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      rarity: a.rarity,
      progress: progressById.get(a.id)?.progress ?? 0,
      threshold: a.threshold,
      unlockedAt: progressById.get(a.id)?.unlocked_at ?? null,
    }));
  const unlockedCount = achievementItems.filter((a) => a.unlockedAt != null).length;
  const recentUnlocked = achievementItems
    .filter((a) => a.unlockedAt != null)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 8);
  const classInfo = profile?.classes as unknown as { name: string } | null;
  const school = profile?.schools as unknown as {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  } | null;
  const schoolClasses = school ? await listSchoolClasses(school.id) : [];
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
            <AvatarUpload
              userId={user.id}
              avatarUrl={profile?.avatar_url ?? null}
              fullName={profile?.full_name ?? user.email ?? '?'}
            />

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold">
                {profile?.full_name ?? user.email}
              </h2>
              <p className="text-muted truncate text-sm">
                {[profile?.grade_level, classInfo?.name].filter(Boolean).join(' · ') || user.email}
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
          dailyGoal={profile?.daily_study_goal_minutes ?? 45}
          weeklyGoal={profile?.weekly_study_goal_minutes ?? 300}
          currentSchool={school}
          currentClassId={profile?.class_id ?? null}
          currentClassName={classInfo?.name ?? null}
          schoolClasses={schoolClasses}
          notificationSettings={notificationSettings}
        />

        {/* Conquistas — resumo só; a lista completa (com raridade e progresso
            das bloqueadas) já tem página própria em /conquistas. Repetir a
            lista inteira aqui era o mesmo conteúdo em dois lugares, e o card
            acabava sobrando sozinho numa coluna (nada pra ocupar a outra). */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-brand size-4" aria-hidden />
              Conquistas
              <Badge variant="neutral" className="ml-auto">
                {unlockedCount}/{achievementItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUnlocked.length === 0 ? (
              <p className="text-muted text-sm">
                Nenhuma conquista desbloqueada ainda — comece estudando pra desbloquear a primeira.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2.5">
                {recentUnlocked.map((a) => (
                  <li key={a.id} title={`${a.name} · ${RARITY_LABEL[a.rarity]}`}>
                    <span className="from-warning to-warning/80 grid size-11 place-items-center rounded-[32%] bg-gradient-to-br shadow-sm">
                      <Award className="size-5 text-white" aria-hidden />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/conquistas"
              className="text-brand mt-4 inline-block text-sm font-medium hover:underline"
            >
              Ver todas as conquistas →
            </Link>
          </CardContent>
        </Card>
      </PageMain>
    </>
  );
}
