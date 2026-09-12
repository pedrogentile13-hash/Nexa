'use client';

import { useState, useTransition } from 'react';
import { Check, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSubjectTargetGrade } from '../server/actions';

/**
 * "Quero tirar 8." Um campo só — nada de resolver "quanto preciso tirar na
 * próxima prova": a nota agora nasce de dezenas de pequenas atividades, não
 * de 3 provas pesadas, então essa conta deixou de fazer sentido.
 */
export function TargetGradeForm({
  subjectId,
  initialTarget,
}: {
  subjectId: string;
  initialTarget: number | null;
}) {
  const [value, setValue] = useState(initialTarget?.toString() ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setSaved(false);
    const trimmed = value.trim();
    const parsed = trimmed === '' ? null : Number(trimmed.replace(',', '.'));
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 10)) {
      setError('A meta é um número entre 0 e 10.');
      return;
    }
    startTransition(async () => {
      const result = await updateSubjectTargetGrade(subjectId, parsed);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="target-grade">
            <Target className="mr-1 inline size-3.5" aria-hidden />
            Sua meta nesta matéria
          </Label>
          <Input
            id="target-grade"
            inputMode="decimal"
            placeholder="Ex.: 8"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </div>
        <Button type="button" variant="secondary" onClick={submit} disabled={isPending}>
          {saved ? <Check className="text-success" aria-hidden /> : 'Salvar'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
