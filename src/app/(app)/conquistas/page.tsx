import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Badge } from '@/components/ui/badge';
import { AchievementsList, type AchievementListItem } from '@/features/profile/components/achievements-list';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Conquistas',
  description: 'Todas as conquistas do Nexa Study, bloqueadas e desbloqueadas.',
};

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const [{ data: userAchievements }, { data: achievements }] = await Promise.all([
    supabase.from('user_achievements').select('achievement_id, progress, unlocked_at'),
    supabase.from('achievements').select('*').order('sort_order'),
  ]);

  const progressById = new Map((userAchievements ?? []).map((row) => [row.achievement_id, row]));
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

  return (
    <>
      <AppHeader title="Conquistas" subtitle="Sequência de estudo, notas e marcos de uso desbloqueiam selos automaticamente." />
      <PageMain>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted flex items-center gap-1.5 text-sm">
            <Trophy className="text-brand size-4" aria-hidden />
            Progresso geral
          </p>
          <Badge variant="neutral">
            {unlockedCount}/{achievementItems.length}
          </Badge>
        </div>
        <AchievementsList achievements={achievementItems} variant="completa" />
      </PageMain>
    </>
  );
}
