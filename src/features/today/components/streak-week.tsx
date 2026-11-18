import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WeekDay } from '../server/queries';

const WEEKDAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

/**
 * A sequência de dias, em destaque — pedido explícito do redesign de Hoje.
 *
 * "Dia com atividade" usa `xp_events` (calculado em `getTodaySnapshot`), o
 * mesmo sinal que já alimenta `touch_streak`: quiz, lição, rotina, tarefa ou
 * sessão de estudo, todos contam. Não é uma métrica nova, só a primeira vez
 * que ela vira um componente visual em vez de um número solto.
 */
export function StreakWeek({
  weekDays,
  currentStreak,
  longestStreak,
  weeklyGoalMinutes,
  weekStudiedMinutes,
}: {
  weekDays: WeekDay[];
  currentStreak: number;
  longestStreak: number;
  weeklyGoalMinutes: number;
  weekStudiedMinutes: number;
}) {
  const weekPercent =
    weeklyGoalMinutes > 0 ? Math.min(100, (weekStudiedMinutes / weeklyGoalMinutes) * 100) : null;

  return (
    <Card className="border-brand/30 bg-brand-soft min-w-0">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="bg-brand grid size-9 shrink-0 place-items-center rounded-full">
            <Flame className="size-4.5 text-white" />
          </span>
          <div className="min-w-0">
            <p className="tabular text-lg leading-none font-semibold">
              {currentStreak} {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
            </p>
            <p className="text-muted mt-1 text-xs">Melhor sequência: {longestStreak} dias</p>
          </div>
        </div>

        <ol className="flex justify-between gap-1">
          {weekDays.map((day, i) => (
            <li key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-subtle text-[10px] font-semibold tracking-wide">
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                aria-label={
                  day.active
                    ? 'Dia com atividade'
                    : day.isFuture
                      ? 'Ainda por vir'
                      : 'Sem atividade nesse dia'
                }
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                  day.active
                    ? 'bg-brand text-white'
                    : day.isToday
                      ? 'border-brand text-brand-text border-2'
                      : day.isFuture
                        ? 'bg-surface-2 text-subtle'
                        : 'bg-surface-2 text-muted',
                )}
              >
                {new Date(`${day.date}T12:00:00Z`).getUTCDate()}
              </span>
            </li>
          ))}
        </ol>

        {weekPercent !== null && (
          <Progress
            value={weekPercent}
            size="sm"
            label={`Meta semanal de estudo: ${weekStudiedMinutes} de ${weeklyGoalMinutes} minutos`}
          />
        )}
      </CardContent>
    </Card>
  );
}
