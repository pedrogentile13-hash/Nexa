'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Clock, Flame, Loader2, Plus, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PopEmptyState } from '@/components/ui/empty-state';
import { StudyWeeksChart } from '@/features/performance/components/charts';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { GOAL_ICONS, goalIcon } from '@/lib/design/goal-icon';
import {
  createLongTermGoal,
  deleteLongTermGoal,
  updateGoalProgress,
  updateMonthlyGoals,
  type GoalsSettingsState,
} from '../server/actions';
import type { LongTermGoal, MetasOverview } from '../server/queries';

const INITIAL_GOALS_STATE: GoalsSettingsState = { status: 'idle' };

export function MetasView({
  overview,
  goals,
}: {
  overview: MetasOverview;
  goals: LongTermGoal[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Clock}
          value={`${overview.monthHours}h`}
          goal={`meta: ${overview.monthHoursGoal}h`}
          percent={ratio(overview.monthHours, overview.monthHoursGoal)}
        />
        <StatTile
          icon={Target}
          value={String(overview.monthSubjectsActive)}
          goal={`meta: ${overview.monthSubjectsGoal} matérias`}
          percent={ratio(overview.monthSubjectsActive, overview.monthSubjectsGoal)}
          label="Matérias no mês"
        />
        <StatTile
          icon={Check}
          value={String(overview.monthActivities)}
          goal={`meta: ${overview.monthActivitiesGoal}`}
          percent={ratio(overview.monthActivities, overview.monthActivitiesGoal)}
          label="Atividades no mês"
        />
        <StatTile icon={Flame} value={String(overview.currentStreak)} label="Sequência atual" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Estudo por semana</CardTitle>
        </CardHeader>
        <CardContent>
          <StudyWeeksChart weeks={overview.weeklyMinutes} />
        </CardContent>
      </Card>

      {overview.bySubject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por matéria este mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.bySubject.map((subject) => {
              const total = overview.bySubject.reduce((sum, s) => sum + s.minutes, 0);
              const percent = total === 0 ? 0 : Math.round((subject.minutes / total) * 100);
              return (
                <div key={subject.subjectId} style={subjectColorVars(subject.subjectColor)}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{subject.subjectName}</span>
                    <span className="text-muted shrink-0 text-xs tabular-nums">
                      {Math.round(subject.minutes / 60)}h ({percent}%)
                    </span>
                  </div>
                  <div className="bg-surface-2 h-2 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: 'var(--subject-base)' }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <MonthlyGoalsForm
        activitiesGoal={overview.monthActivitiesGoal}
        subjectsGoal={overview.monthSubjectsGoal}
      />

      <LongTermGoalsSection goals={goals} />
    </div>
  );
}

function ratio(value: number, goal: number): number | null {
  if (goal <= 0) return null;
  return Math.min(100, Math.round((value / goal) * 100));
}

function StatTile({
  icon: Icon,
  value,
  label,
  goal,
  percent,
}: {
  icon: typeof Clock;
  value: string;
  label?: string;
  goal?: string;
  percent?: number | null;
}) {
  return (
    <div className="border-border bg-surface space-y-2 rounded-2xl border p-3">
      <div className="flex items-center gap-2">
        <span className="bg-brand-soft text-brand-text grid size-8 shrink-0 place-items-center rounded-lg">
          <Icon className="size-4" aria-hidden />
        </span>
        <p className="tabular text-lg leading-none font-semibold">{value}</p>
      </div>
      {label && <p className="text-muted text-xs leading-tight">{label}</p>}
      {typeof percent === 'number' && (
        <Progress value={percent} label={`${label ?? value}: ${percent}%`} size="sm" />
      )}
      {goal && <p className="text-subtle text-xs">{goal}</p>}
    </div>
  );
}

function MonthlyGoalsForm({
  activitiesGoal,
  subjectsGoal,
}: {
  activitiesGoal: number;
  subjectsGoal: number;
}) {
  const [state, formAction] = useActionState(updateMonthlyGoals, INITIAL_GOALS_STATE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas metas do mês</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="monthlyActivitiesGoal">Atividades por mês</Label>
              <Input
                id="monthlyActivitiesGoal"
                name="monthlyActivitiesGoal"
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                defaultValue={activitiesGoal}
                className="tabular"
              />
            </div>
            <div>
              <Label htmlFor="monthlySubjectsGoal">Matérias por mês</Label>
              <Input
                id="monthlySubjectsGoal"
                name="monthlySubjectsGoal"
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                defaultValue={subjectsGoal}
                className="tabular"
              />
            </div>
          </div>
          <p className="text-subtle text-xs leading-relaxed">
            A meta de horas do mês segue sua meta semanal do perfil × 4 — mude ela lá para ajustar
            aqui também.
          </p>
          {state.status === 'error' && (
            <p role="alert" className="text-danger text-sm">
              {state.message}
            </p>
          )}
          <div className="flex items-center gap-3">
            <SaveButton />
            {state.status === 'saved' && (
              <span className="text-success flex items-center gap-1.5 text-sm" aria-live="polite">
                <Check className="size-4" aria-hidden />
                salvo
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      Salvar metas
    </Button>
  );
}

function LongTermGoalsSection({ goals }: { goals: LongTermGoal[] }) {
  const [icon, setIcon] = useState(GOAL_ICONS[0]!.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas de longo prazo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-subtle text-xs leading-relaxed">
          A única parte do Nexa onde você mesmo diz o quanto avançou — porque isto é uma meta de
          vida, não uma nota.
        </p>

        {goals.length === 0 ? (
          <PopEmptyState
            size="sm"
            icon={<Target className="size-5 text-white" />}
            title="Nenhuma meta de longo prazo ainda"
            description="Passar no ENEM, entrar na faculdade dos sonhos — o que for, cadastre abaixo."
          />
        ) : (
          <ul className="space-y-3">
            {goals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} />
            ))}
          </ul>
        )}

        <form action={createLongTermGoal} className="border-border space-y-3 border-t pt-4">
          <div>
            <Label htmlFor="goal-title">Nova meta</Label>
            <Input id="goal-title" name="title" placeholder="Passar no ENEM" required maxLength={120} />
          </div>
          <div>
            <Label>Ícone</Label>
            <input type="hidden" name="icon" value={icon} />
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIcon(option.value)}
                  aria-pressed={icon === option.value}
                  aria-label={option.label}
                  className={
                    icon === option.value
                      ? 'bg-brand text-brand-fg grid size-10 place-items-center rounded-xl'
                      : 'bg-surface-2 text-muted hover:text-text grid size-10 place-items-center rounded-xl'
                  }
                >
                  <option.Icon className="size-4.5" aria-hidden />
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" size="sm" variant="secondary">
            <Plus aria-hidden />
            Adicionar meta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GoalRow({ goal }: { goal: LongTermGoal }) {
  const [progress, setProgress] = useState(goal.progressPercent);
  const [, startTransition] = useTransition();
  const Icon = goalIcon(goal.icon);

  function onDelete() {
    startTransition(async () => {
      await deleteLongTermGoal(goal.id);
    });
  }

  function onCommitProgress(value: number) {
    startTransition(async () => {
      await updateGoalProgress(goal.id, value);
    });
  }

  return (
    <li className="border-border bg-surface rounded-2xl border p-3.5">
      <div className="flex items-center gap-3">
        <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{goal.title}</p>
          <Progress value={progress} label={`Progresso de ${goal.title}: ${progress}%`} size="sm" className="mt-1.5" />
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Excluir meta"
          className="text-subtle hover:text-danger shrink-0 p-1.5"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          onPointerUp={() => onCommitProgress(progress)}
          className="accent-brand h-2 flex-1"
          aria-label={`Ajustar progresso de ${goal.title}`}
        />
        <span className="tabular text-muted w-10 shrink-0 text-right text-xs">{progress}%</span>
      </div>
    </li>
  );
}
