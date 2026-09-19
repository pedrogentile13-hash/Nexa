'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveVestibularProfile } from '../server/actions';
import type { VestibularFormState } from '../server/actions';
import type { ExamOption } from '../server/queries';

const INITIAL: VestibularFormState = { status: 'idle' };

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <GraduationCap aria-hidden />}
      {pending ? 'Salvando…' : label}
    </Button>
  );
}

/**
 * Primeira tela do Vestibular: qual prova, que ano, quanto por dia.
 *
 * São só três perguntas de propósito — é o mínimo pra existir contagem
 * regressiva e, mais pra frente, plano de estudo. Curso-alvo e nota-alvo
 * entram junto com a tela de objetivos múltiplos.
 */
export function VestibularSetup({
  exams,
  current,
}: {
  exams: ExamOption[];
  current?: { mainExamId: string | null; targetYear: number | null; dailyStudyMinutes: number | null };
}) {
  const [state, formAction] = useActionState(saveVestibularProfile, INITIAL);
  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="border-border bg-surface space-y-4 rounded-2xl border p-4">
      <div>
        <h2 className="text-base font-semibold">
          {current ? 'Seu objetivo' : 'Qual é o seu objetivo?'}
        </h2>
        <p className="text-muted text-sm">
          A partir daqui o Nexa monta sua contagem regressiva e o que estudar até a prova.
        </p>
      </div>

      <div>
        <Label htmlFor="mainExamId">Vestibular</Label>
        <select
          id="mainExamId"
          name="mainExamId"
          required
          defaultValue={current?.mainExamId ?? ''}
          className="border-border bg-surface text-text h-11 w-full rounded-md border px-3 text-sm outline-none"
        >
          <option value="" disabled>
            Escolha o vestibular
          </option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.organization ? ` — ${e.organization}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="targetYear">Ano da prova</Label>
          <Input
            id="targetYear"
            name="targetYear"
            type="number"
            min={currentYear}
            max={2100}
            defaultValue={current?.targetYear ?? currentYear}
            required
          />
        </div>
        <div>
          <Label htmlFor="dailyStudyMinutes">Minutos por dia</Label>
          <Input
            id="dailyStudyMinutes"
            name="dailyStudyMinutes"
            type="number"
            min={10}
            max={900}
            step={10}
            defaultValue={current?.dailyStudyMinutes ?? 60}
            required
          />
        </div>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm leading-relaxed">
          {state.message}
        </p>
      )}

      <SaveButton label={current ? 'Salvar objetivo' : 'Começar preparação'} />
    </form>
  );
}
