'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GRADE_LEVELS } from '@/features/onboarding/schemas';
import { cn } from '@/lib/utils';
import { updateProfile, type ProfileState } from '../server/actions';

const INITIAL: ProfileState = { status: 'idle' };

export function ProfileForm({
  fullName,
  gradeLevel,
  className,
  dailyGoal,
  weeklyGoal,
  timezone,
}: {
  fullName: string;
  gradeLevel: string | null;
  className: string | null;
  dailyGoal: number;
  weeklyGoal: number;
  timezone: string;
}) {
  const [state, formAction] = useActionState(updateProfile, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nome</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} autoComplete="name" required />
      </div>

      <div>
        <Label htmlFor="gradeLevel">Série</Label>
        <select
          id="gradeLevel"
          name="gradeLevel"
          defaultValue={gradeLevel ?? ''}
          className={cn(
            'border-border bg-surface text-text h-12 w-full rounded-md border px-3 text-base',
            'focus-visible:border-brand focus-visible:ring-brand/25 outline-none focus-visible:ring-2',
            'sm:h-11 sm:text-sm',
          )}
        >
          <option value="">Não informado</option>
          {GRADE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="className">Turma</Label>
        <Input id="className" name="className" defaultValue={className ?? ''} maxLength={20} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="dailyStudyGoalMinutes">Meta diária (min)</Label>
          <Input
            id="dailyStudyGoalMinutes"
            name="dailyStudyGoalMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            defaultValue={dailyGoal}
            className="tabular"
          />
        </div>
        <div>
          <Label htmlFor="weeklyStudyGoalMinutes">Meta semanal (min)</Label>
          <Input
            id="weeklyStudyGoalMinutes"
            name="weeklyStudyGoalMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={10080}
            defaultValue={weeklyGoal}
            className="tabular"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="timezone">Fuso horário</Label>
        <Input id="timezone" name="timezone" defaultValue={timezone} />
        <p className="text-subtle mt-1.5 text-xs leading-relaxed">
          Define quando seu dia vira. Se estiver errado, a sequência quebra sozinha à noite.
        </p>
      </div>

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
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      Salvar alterações
    </Button>
  );
}
