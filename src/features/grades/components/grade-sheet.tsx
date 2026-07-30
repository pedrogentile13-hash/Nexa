'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';
import { computeSubjectTerm } from '../lib/calc';
import { formatGrade } from '../lib/rounding';
import { createActivity, deleteActivity, updateActivity } from '../server/actions';
import type { GradeActivity, GradingScheme } from '../types';

/**
 * O caderno de notas.
 *
 * A média recalcula no cliente a cada tecla, usando o MESMO motor que as views
 * SQL espelham — é o retorno de ter construído aquilo na Etapa 1. O aluno digita
 * um 8 e vê a média final se mover no mesmo frame, sem esperar o servidor.
 *
 * O salvamento é automático e adiado: digitar "8,5" são três eventos de tecla,
 * e três escritas para um valor só. A confirmação do servidor aparece como um
 * check discreto — a especificação pede feedback imediato, não um diálogo.
 */

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  subjectTermId: string;
  scheme: GradingScheme;
  initialActivities: GradeActivity[];
  finalGradeOverride: number | null;
  targetGrade: number | null;
}

export function GradeSheet({
  subjectTermId,
  scheme,
  initialActivities,
  finalGradeOverride,
  targetGrade,
}: Props) {
  const [activities, setActivities] = useState(initialActivities);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // A média é derivada, nunca guardada em estado: um valor calculado que também
  // vive num useState é um valor que uma hora sai de sincronia.
  const result = useMemo(
    () => computeSubjectTerm({ scheme, activities, targetGrade, finalGradeOverride }),
    [scheme, activities, targetGrade, finalGradeOverride],
  );

  const [saveScore] = useDebouncedCallback(async (id: string, score: number | null) => {
    setSaveState('saving');
    const response = await updateActivity({ id, score });
    if (response.ok) {
      setSaveState('saved');
      setErrorMessage(null);
      window.setTimeout(() => setSaveState('idle'), 1600);
    } else {
      setSaveState('error');
      setErrorMessage(response.message);
    }
  }, 700);

  const handleScoreChange = useCallback(
    (id: string, raw: string) => {
      // Vírgula é como se escreve nota em português. Aceitar só ponto seria
      // fazer o aluno adaptar-se ao software.
      const normalized = raw.replace(',', '.').trim();
      const score = normalized === '' ? null : Number(normalized);
      if (score !== null && !Number.isFinite(score)) return;

      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, score } : a)));
      saveScore(id, score);
    },
    [saveScore],
  );

  return (
    <div className="space-y-4">
      {/* Média ao vivo -------------------------------------------------- */}
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-subtle text-xs">Média do período</p>
              <p className="tabular text-4xl leading-none font-semibold">
                {formatGrade(result.finalGrade, scheme.decimals, scheme.roundingMode)}
              </p>
            </div>
            <div className="text-right">
              {targetGrade !== null && (
                <>
                  <p className="text-subtle text-xs">Meta</p>
                  <p className="tabular text-brand-text text-xl font-semibold">
                    {formatGrade(targetGrade, 1)}
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-muted mb-1.5 flex items-center justify-between text-xs">
              <span>Período lançado</span>
              <span className="tabular">{Math.round(result.coveragePercent)}%</span>
            </div>
            <Progress
              value={result.coveragePercent}
              label="Percentual do período já lançado"
              tone={result.isBelowPassing ? 'danger' : result.isBelowTarget ? 'warning' : 'brand'}
            />
          </div>

          {result.weightTotal !== 100 && (
            <p className="text-muted text-xs leading-relaxed">
              As categorias somam {result.weightTotal}%. A média é calculada proporcional ao total,
              então continua correta — mas vale conferir no seu modelo de notas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Estado do salvamento ------------------------------------------- */}
      <div className="flex h-5 items-center justify-end px-1" aria-live="polite">
        {saveState === 'saving' && (
          <span className="text-subtle flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            salvando
          </span>
        )}
        {saveState === 'saved' && (
          <span className="text-success flex items-center gap-1.5 text-xs">
            <Check className="size-3.5" aria-hidden />
            salvo
          </span>
        )}
        {saveState === 'error' && (
          <span role="alert" className="text-danger text-xs">
            {errorMessage ?? 'Não consegui salvar.'}
          </span>
        )}
      </div>

      {/* Categorias ------------------------------------------------------ */}
      {result.categories.map((category) => (
        <CategorySection
          key={category.category.id}
          subjectTermId={subjectTermId}
          scheme={scheme}
          categoryId={category.category.id}
          categoryName={category.category.name}
          categoryCode={category.category.shortCode}
          weightPercent={category.category.weightPercent}
          average={category.average}
          activities={category.activities}
          onScoreChange={handleScoreChange}
          onAdded={(activity) => setActivities((prev) => [...prev, activity])}
          onDeleted={(id) => setActivities((prev) => prev.filter((a) => a.id !== id))}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── categoria ──── */

function CategorySection({
  subjectTermId,
  scheme,
  categoryId,
  categoryName,
  categoryCode,
  weightPercent,
  average,
  activities,
  onScoreChange,
  onAdded,
  onDeleted,
}: {
  subjectTermId: string;
  scheme: GradingScheme;
  categoryId: string;
  categoryName: string;
  categoryCode: string | null;
  weightPercent: number;
  average: number | null;
  activities: {
    id: string;
    title: string;
    score: number | null;
    weight: number;
    maxScore: number | null;
    isCounted: boolean;
  }[];
  onScoreChange: (id: string, raw: string) => void;
  onAdded: (activity: GradeActivity) => void;
  onDeleted: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState('1');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const weightValue = Number(weight.replace(',', '.')) || 1;

    startTransition(async () => {
      const response = await createActivity({
        subjectTermId,
        categoryId,
        title: trimmed,
        score: null,
        maxScore: null,
        weight: weightValue,
        dueDate: null,
        notes: null,
      });

      if (response.ok && response.id) {
        onAdded({
          id: response.id,
          categoryId,
          title: trimmed,
          score: null,
          maxScore: null,
          weight: weightValue,
          isDropped: false,
          replacesActivityId: null,
        });
        setTitle('');
        setWeight('1');
        setAdding(false);
        setError(null);
      } else if (!response.ok) {
        setError(response.message);
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">
            {categoryCode ?? categoryName}
            <span className="text-subtle ml-1.5 text-xs font-normal">{weightPercent}%</span>
          </h3>
          <span
            className={cn(
              'tabular text-xl font-semibold',
              average === null && 'text-subtle text-sm font-normal',
            )}
          >
            {average === null ? 'nada lançado' : formatGrade(average, scheme.decimals)}
          </span>
        </div>

        <ul className="divide-border divide-y">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm',
                    !activity.isCounted && activity.score !== null && 'text-subtle line-through',
                  )}
                >
                  {activity.title}
                </p>
                <p className="text-subtle text-xs">
                  peso {activity.weight}
                  {activity.maxScore ? ` · de ${activity.maxScore}` : ''}
                </p>
              </div>

              <Input
                type="text"
                inputMode="decimal"
                defaultValue={
                  activity.score !== null ? String(activity.score).replace('.', ',') : ''
                }
                onChange={(e) => onScoreChange(activity.id, e.target.value)}
                placeholder="—"
                aria-label={`Nota de ${activity.title}`}
                className="tabular h-11 w-20 shrink-0 text-center text-base font-semibold"
              />

              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    onDeleted(activity.id);
                    await deleteActivity(activity.id);
                  })
                }
                aria-label={`Remover ${activity.title}`}
                className="text-subtle hover:text-danger grid size-9 shrink-0 place-items-center rounded-md"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        {adding ? (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                  if (e.key === 'Escape') setAdding(false);
                }}
                placeholder="Nome da avaliação"
                autoFocus
                className="min-w-0 flex-1"
              />
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
                aria-label="Peso"
                className="tabular w-16 shrink-0 text-center"
              />
            </div>

            {error && (
              <p role="alert" className="text-danger text-xs">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={!title.trim() || isPending}>
                {isPending && <Loader2 className="animate-spin" aria-hidden />}
                Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            Adicionar avaliação
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
