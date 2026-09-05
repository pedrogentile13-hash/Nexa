import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Award, Clock, Flame, LogOut, Trophy, Zap } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ThemeToggle } from '@/components/theme-toggle';
import { InstallCard } from '@/features/install/components/install-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut } from '@/features/auth/server/actions';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Seus dados, metas e conquistas.',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const [{ data: profile }, { data: stats }, { data: unlocked }, { data: achievements }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'full_name, grade_level, class_name, timezone, daily_study_goal_minutes, weekly_study_goal_minutes',
        )
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_achievements').select('achievement_id').not('unlocked_at', 'is', null),
      supabase.from('achievements').select('*').order('sort_order'),
    ]);

  const unlockedIds = new Set((unlocked ?? []).map((row) => row.achievement_id));
  const totalHours = Math.floor((stats?.total_study_seconds ?? 0) / 3600);

  return (
    <>
      <AppHeader title="Perfil" subtitle={profile?.full_name ?? user.email ?? undefined} />

      <PageMain className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* Números que o aluno conquistou --------------------------------- */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat Icon={Flame} label="Sequência" value={String(stats?.current_streak ?? 0)} />
          <MiniStat Icon={Zap} label="Nível" value={String(stats?.level ?? 1)} />
          <MiniStat Icon={Clock} label="Estudadas" value={`${totalHours}h`} />
        </div>

        {/* Dados ----------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="divide-border divide-y text-sm">
              <Row label="E-mail" value={user.email} />
            </dl>
            <ProfileForm
              fullName={profile?.full_name ?? ''}
              gradeLevel={profile?.grade_level ?? null}
              className={profile?.class_name ?? null}
              dailyGoal={profile?.daily_study_goal_minutes ?? 45}
              weeklyGoal={profile?.weekly_study_goal_minutes ?? 300}
              timezone={profile?.timezone ?? 'America/Sao_Paulo'}
            />
          </CardContent>
        </Card>

        {/* Aparência -------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">Tema</span>
              <ThemeToggle />
            </div>
            {/* O banner de instalação aparece uma vez e some. Quem recusou
                naquele momento e depois mudou de ideia precisa de um lugar
                previsível para procurar — e é aqui que as pessoas procuram. */}
            <InstallCard />
          </CardContent>
        </Card>

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
            <ul className="divide-border divide-y">
              {(achievements ?? []).map((achievement) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                return (
                  <li key={achievement.id} className="flex items-center gap-3 py-2.5">
                    <span
                      aria-hidden
                      className={
                        isUnlocked
                          ? 'bg-warning-soft text-warning grid size-9 shrink-0 place-items-center rounded-full'
                          : 'bg-surface-2 text-subtle grid size-9 shrink-0 place-items-center rounded-full'
                      }
                    >
                      <Award className="size-4" />
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
          </CardContent>
        </Card>

        {/* Sair ------------------------------------------------------------- */}
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full">
            <LogOut aria-hidden />
            Sair da conta
          </Button>
        </form>
      </PageMain>
    </>
  );
}

function MiniStat({ Icon, label, value }: { Icon: typeof Flame; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <Icon className="text-subtle mx-auto mb-1 size-4" aria-hidden />
        <p className="tabular text-xl leading-none font-semibold">{value}</p>
        <p className="text-subtle mt-1 text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value ?? '—'}</dd>
    </div>
  );
}
