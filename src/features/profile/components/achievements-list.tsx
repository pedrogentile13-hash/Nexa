import { Award, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PopEmptyState } from '@/components/ui/empty-state';
import { RARITY_BADGE_VARIANT, RARITY_LABEL, RARITY_ORDER } from '@/features/ranking/lib/rarity';
import type { AchievementRarity } from '@/types/database.types';

export interface AchievementListItem {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  progress: number;
  threshold: number;
  unlockedAt: string | null;
}

function AchievementRow({
  achievement,
  showProgress,
}: {
  achievement: AchievementListItem;
  showProgress: boolean;
}) {
  const isUnlocked = achievement.unlockedAt != null;
  const percent = Math.min(100, (achievement.progress / Math.max(1, achievement.threshold)) * 100);

  return (
    <li className="flex items-center gap-3 py-2.5">
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
        <div className="flex flex-wrap items-center gap-1.5">
          <p
            className={
              isUnlocked
                ? 'truncate text-sm font-medium'
                : 'text-muted truncate text-sm font-medium'
            }
          >
            {achievement.name}
          </p>
          <Badge variant={RARITY_BADGE_VARIANT[achievement.rarity]}>
            {RARITY_LABEL[achievement.rarity]}
          </Badge>
        </div>
        <p className="text-subtle truncate text-xs">{achievement.description}</p>
        {showProgress && !isUnlocked && achievement.threshold > 1 && (
          <div className="mt-1.5 flex items-center gap-2">
            <Progress
              value={percent}
              label={`Progresso de ${achievement.name}`}
              size="sm"
              className="max-w-40"
            />
            <span className="text-subtle shrink-0 text-[11px]">
              {Math.min(achievement.progress, achievement.threshold)}/{achievement.threshold}
            </span>
          </div>
        )}
      </div>
      {isUnlocked && <Badge variant="success" className="shrink-0">Conquistada</Badge>}
    </li>
  );
}

/**
 * Lista de conquistas usada no Perfil (variante `compacta`, sem barra de
 * progresso) e em `/conquistas` (variante `completa`, agrupada por raridade
 * com barra de progresso pras bloqueadas).
 */
export function AchievementsList({
  achievements,
  variant = 'compacta',
}: {
  achievements: AchievementListItem[];
  variant?: 'compacta' | 'completa';
}) {
  if (achievements.length === 0) {
    return (
      <PopEmptyState
        size="sm"
        icon={<Trophy className="size-5 text-white" />}
        title="Suas conquistas aparecem aqui"
        description="Sequência de estudo, notas e marcos de uso desbloqueiam selos automaticamente."
      />
    );
  }

  if (variant === 'compacta') {
    return (
      <ul className="divide-border divide-y">
        {achievements.map((achievement) => (
          <AchievementRow key={achievement.id} achievement={achievement} showProgress={false} />
        ))}
      </ul>
    );
  }

  const groups = RARITY_ORDER.map((rarity) => ({
    rarity,
    items: achievements.filter((achievement) => achievement.rarity === rarity),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.rarity}>
          <h3 className="text-muted mb-1.5 text-xs font-semibold tracking-wide uppercase">
            {RARITY_LABEL[group.rarity]} · {group.items.filter((a) => a.unlockedAt).length}/
            {group.items.length}
          </h3>
          <ul className="divide-border divide-y">
            {group.items.map((achievement) => (
              <AchievementRow key={achievement.id} achievement={achievement} showProgress />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
