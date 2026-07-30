'use client';

import { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatGrade } from '../lib/rounding';
import { requiredUniformScoreForPending } from '../lib/solver';
import type { GradeActivity, GradingScheme } from '../types';

/**
 * "Quanto falta para a média 8?"
 *
 * A Parte 1 lista essa entre as seis perguntas que o produto existe para
 * responder, e nada na especificação respondia. É a feature de melhor relação
 * valor/esforço do Nexa: os dados já estão todos ali, e é uma conta que o aluno
 * hoje faz no papel — errando, na véspera da prova.
 *
 * Roda inteiramente no cliente, sobre o mesmo motor que calcula a média, então
 * mexer na meta responde instantaneamente.
 */
export function TargetSolver({
  scheme,
  activities,
  initialTarget,
}: {
  scheme: GradingScheme;
  activities: GradeActivity[];
  initialTarget: number | null;
}) {
  const [target, setTarget] = useState<string>(
    initialTarget !== null ? String(initialTarget) : String(scheme.passingGrade),
  );

  const targetValue = Number(target.replace(',', '.'));
  const validTarget = Number.isFinite(targetValue) && targetValue > 0;

  const result = useMemo(() => {
    if (!validTarget) return null;
    return requiredUniformScoreForPending({ scheme, activities }, targetValue);
  }, [scheme, activities, targetValue, validTarget]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-brand size-4" aria-hidden />
          Quanto falta?
        </CardTitle>
        <CardDescription>
          Calculado a partir do que já foi lançado e do que ainda está pendente.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end gap-3">
          <div className="w-28">
            <Label htmlFor="target">Minha meta</Label>
            <Input
              id="target"
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="tabular text-center text-lg font-semibold"
            />
          </div>

          <p className="text-muted flex-1 pb-3 text-sm leading-relaxed">
            {!validTarget && 'Informe a média que você quer alcançar.'}

            {validTarget && result?.status === 'reached' && (
              <span className="text-success font-medium">
                Meta garantida, independentemente do que vier.
              </span>
            )}

            {validTarget && result?.status === 'possible' && (
              <>
                Você precisa de{' '}
                <strong className="tabular text-brand-text text-lg">
                  {formatGrade(result.requiredScore, 1)}
                </strong>{' '}
                {result.pendingCount === 1
                  ? 'na avaliação que falta.'
                  : `em cada uma das ${result.pendingCount} avaliações que faltam.`}
              </>
            )}

            {validTarget && result?.status === 'impossible' && (
              <>
                {result.pendingCount === 0
                  ? 'Não há mais avaliações pendentes neste período.'
                  : 'Essa meta não é mais alcançável neste período.'}{' '}
                O máximo possível é{' '}
                <strong className="tabular">{formatGrade(result.bestPossibleFinal, 1)}</strong>.
              </>
            )}
          </p>
        </div>

        {validTarget && result && result.pendingCount > 0 && (
          <div className="text-subtle border-border flex items-center justify-between border-t pt-3 text-xs">
            <span>
              Pior caso:{' '}
              <span className="tabular">{formatGrade(result.worstPossibleFinal, 1)}</span>
            </span>
            <span>
              Melhor caso:{' '}
              <span className="tabular">{formatGrade(result.bestPossibleFinal, 1)}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
