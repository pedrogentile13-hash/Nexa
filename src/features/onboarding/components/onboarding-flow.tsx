'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { completeOnboarding } from '../server/actions';
import { DEFAULT_CATEGORIES, GRADE_LEVELS, TERM_MODELS, type OnboardingState } from '../schemas';
import { AREA_LABELS, type CatalogSubject } from '../types';
import type { SubjectArea } from '@/types/database.types';

/**
 * The 60-second onboarding.
 *
 * Three steps, each answering one question, because the alternative — dropping
 * a new student into six empty screens — is the worst first impression the
 * product can make and the single biggest lever on whether they come back.
 *
 * Every step ships with a sensible default already chosen, so a student who
 * just taps "Continuar" three times ends up with a working setup.
 */

interface Props {
  catalog: [SubjectArea, CatalogSubject[]][];
  coreSubjectIds: string[];
  defaultName: string;
  /** Used until the browser reports the real one on mount. */
  fallbackTimezone: string;
}

interface Category {
  name: string;
  shortCode: string;
  weightPercent: number;
}

const INITIAL: OnboardingState = { status: 'idle' };
const STEPS = 3;

export function OnboardingFlow({ catalog, coreSubjectIds, defaultName, fallbackTimezone }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Read the real timezone instead of asking for it: it is a step the student
  // would get wrong, and a wrong one silently breaks streaks and "hoje".
  const [timezone, setTimezone] = useState(fallbackTimezone);
  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) setTimezone(resolved);
  }, []);

  const [fullName, setFullName] = useState(defaultName);
  const [gradeLevel, setGradeLevel] = useState<string>('9º ano');
  const [className, setClassName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(coreSubjectIds));
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState('');
  const [termCount, setTermCount] = useState(4);
  const [categories, setCategories] = useState<Category[]>(
    DEFAULT_CATEGORIES.map((c) => ({ ...c })),
  );

  const [state, formAction, isPending] = useActionState(completeOnboarding, INITIAL);

  const subjectCount = selected.size + customSubjects.length;
  const weightTotal = categories.reduce((sum, c) => sum + (c.weightPercent || 0), 0);

  const canAdvance = useMemo(() => {
    if (step === 0) return fullName.trim().length >= 2 && gradeLevel.length > 0;
    if (step === 1) return subjectCount > 0;
    return categories.length > 0 && categories.every((c) => c.name.trim().length > 0);
  }, [step, fullName, gradeLevel, subjectCount, categories]);

  const payload = JSON.stringify({
    fullName: fullName.trim(),
    gradeLevel,
    className: className.trim() || null,
    termCount,
    catalogIds: [...selected],
    customSubjects,
    categories: categories.map((c) => ({
      name: c.name.trim(),
      shortCode: c.shortCode.trim() || null,
      weightPercent: Number(c.weightPercent) || 0,
    })),
    timezone,
  });

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function toggleSubject(id: string) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function addCustom() {
    const value = customDraft.trim();
    if (!value) return;
    if (customSubjects.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setCustomDraft('');
      return;
    }
    setCustomSubjects((prev) => [...prev, value]);
    setCustomDraft('');
  }

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col px-5">
      {/* Progress ------------------------------------------------------- */}
      <header className="py-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-subtle text-xs font-medium">
            Passo {step + 1} de {STEPS}
          </span>
          {step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="text-muted hover:text-text -mr-2 flex items-center gap-1 px-2 py-1 text-xs"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Voltar
            </button>
          )}
        </div>
        <Progress
          value={((step + 1) / STEPS) * 100}
          label={`Progresso da configuração: passo ${step + 1} de ${STEPS}`}
          size="sm"
        />
      </header>

      {/* Steps ----------------------------------------------------------- */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {step === 0 && (
              <StepIdentity
                fullName={fullName}
                onFullName={setFullName}
                gradeLevel={gradeLevel}
                onGradeLevel={setGradeLevel}
                className={className}
                onClassName={setClassName}
              />
            )}

            {step === 1 && (
              <StepSubjects
                catalog={catalog}
                selected={selected}
                onToggle={toggleSubject}
                customSubjects={customSubjects}
                customDraft={customDraft}
                onCustomDraft={setCustomDraft}
                onAddCustom={addCustom}
                onRemoveCustom={(name) =>
                  setCustomSubjects((prev) => prev.filter((s) => s !== name))
                }
                total={subjectCount}
              />
            )}

            {step === 2 && (
              <StepGrading
                termCount={termCount}
                onTermCount={setTermCount}
                categories={categories}
                onCategories={setCategories}
                weightTotal={weightTotal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer ---------------------------------------------------------- */}
      <footer className="space-y-3 py-5">
        {state.status === 'error' && (
          <p role="alert" className="text-danger text-center text-sm">
            {state.message}
          </p>
        )}

        {step < STEPS - 1 ? (
          <Button size="lg" className="w-full" disabled={!canAdvance} onClick={() => go(step + 1)}>
            Continuar
            <ArrowRight aria-hidden />
          </Button>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="payload" value={payload} />
            <Button type="submit" size="lg" className="w-full" disabled={!canAdvance || isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Sparkles aria-hidden />
              )}
              {isPending ? 'Preparando tudo…' : 'Começar a usar o Nexa'}
            </Button>
          </form>
        )}
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── step 1 ────── */

function StepIdentity({
  fullName,
  onFullName,
  gradeLevel,
  onGradeLevel,
  className,
  onClassName,
}: {
  fullName: string;
  onFullName: (v: string) => void;
  gradeLevel: string;
  onGradeLevel: (v: string) => void;
  className: string;
  onClassName: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vamos começar</h1>
        <p className="text-muted mt-1.5 text-sm">Só o essencial. Leva menos de um minuto.</p>
      </div>

      <div>
        <Label htmlFor="fullName">Como você se chama?</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => onFullName(e.target.value)}
          placeholder="Seu nome"
          autoComplete="name"
          autoFocus
        />
      </div>

      <div>
        <Label>Em que série você está?</Label>
        <div className="flex flex-wrap gap-2">
          {GRADE_LEVELS.map((level) => (
            <Chip
              key={level}
              selected={gradeLevel === level}
              onClick={() => onGradeLevel(level)}
              label={level}
            />
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="className">
          Turma <span className="text-subtle font-normal">(opcional)</span>
        </Label>
        <Input
          id="className"
          value={className}
          onChange={(e) => onClassName(e.target.value)}
          placeholder="9A"
          maxLength={20}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── step 2 ────── */

function StepSubjects({
  catalog,
  selected,
  onToggle,
  customSubjects,
  customDraft,
  onCustomDraft,
  onAddCustom,
  onRemoveCustom,
  total,
}: {
  catalog: [SubjectArea, CatalogSubject[]][];
  selected: Set<string>;
  onToggle: (id: string) => void;
  customSubjects: string[];
  customDraft: string;
  onCustomDraft: (v: string) => void;
  onAddCustom: () => void;
  onRemoveCustom: (name: string) => void;
  total: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Suas disciplinas</h1>
        <p className="text-muted mt-1.5 text-sm">
          Já marquei as mais comuns. Toque para ajustar —{' '}
          <strong className="text-text font-medium">
            {total} selecionada{total === 1 ? '' : 's'}
          </strong>
          .
        </p>
      </div>

      <div className="space-y-5">
        {catalog.map(([area, subjects]) => (
          <div key={area}>
            <p className="text-subtle mb-2 text-xs font-semibold tracking-wide uppercase">
              {AREA_LABELS[area]}
            </p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Chip
                  key={subject.id}
                  selected={selected.has(subject.id)}
                  onClick={() => onToggle(subject.id)}
                  label={subject.name}
                  colorToken={subject.color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="custom">Falta alguma?</Label>
        <div className="flex gap-2">
          <Input
            id="custom"
            value={customDraft}
            onChange={(e) => onCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddCustom();
              }
            }}
            placeholder="Ex.: Robótica"
            maxLength={80}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={onAddCustom}
            disabled={!customDraft.trim()}
            aria-label="Adicionar disciplina"
          >
            <Plus aria-hidden />
          </Button>
        </div>

        {customSubjects.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {customSubjects.map((name) => (
              <li
                key={name}
                className="bg-brand-soft text-brand-text flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-sm font-medium"
              >
                {name}
                <button
                  type="button"
                  onClick={() => onRemoveCustom(name)}
                  aria-label={`Remover ${name}`}
                  className="hover:bg-brand/15 grid size-6 place-items-center rounded-full"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── step 3 ────── */

function StepGrading({
  termCount,
  onTermCount,
  categories,
  onCategories,
  weightTotal,
}: {
  termCount: number;
  onTermCount: (v: number) => void;
  categories: Category[];
  onCategories: (v: Category[]) => void;
  weightTotal: number;
}) {
  function update(index: number, patch: Partial<Category>) {
    onCategories(categories.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Como sua escola avalia</h1>
        <p className="text-muted mt-1.5 text-sm">
          Pode mudar tudo isso depois, a qualquer momento.
        </p>
      </div>

      <div>
        <Label>Divisão do ano</Label>
        <div className="flex gap-2">
          {TERM_MODELS.map((model) => (
            <button
              key={model.count}
              type="button"
              onClick={() => onTermCount(model.count)}
              aria-pressed={termCount === model.count}
              className={cn(
                'flex-1 rounded-md border px-3 py-3 text-center transition-colors',
                termCount === model.count
                  ? 'border-brand bg-brand-soft text-brand-text'
                  : 'border-border bg-surface text-muted hover:bg-surface-2',
              )}
            >
              <span className="block text-sm font-medium">{model.label}</span>
              <span className="text-subtle block text-xs">{model.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <Label className="mb-0">Categorias de nota</Label>
          <span
            className={cn(
              'tabular text-xs font-medium',
              weightTotal === 100 ? 'text-success' : 'text-warning',
            )}
          >
            {weightTotal}%
          </span>
        </div>

        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {categories.map((category, index) => (
            <li key={index} className="bg-surface flex items-center gap-2 p-2.5">
              <Input
                value={category.shortCode}
                onChange={(e) => update(index, { shortCode: e.target.value.toUpperCase() })}
                aria-label={`Sigla da categoria ${index + 1}`}
                maxLength={4}
                className="tabular h-11 w-16 shrink-0 text-center font-semibold"
              />
              <Input
                value={category.name}
                onChange={(e) => update(index, { name: e.target.value })}
                aria-label={`Nome da categoria ${index + 1}`}
                className="h-11 min-w-0 flex-1"
              />
              <div className="relative shrink-0">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  value={category.weightPercent}
                  onChange={(e) => update(index, { weightPercent: Number(e.target.value) })}
                  aria-label={`Peso da categoria ${index + 1} em porcento`}
                  className="tabular h-11 w-20 pr-7 text-right"
                />
                <span className="text-subtle pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm">
                  %
                </span>
              </div>
              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => onCategories(categories.filter((_, i) => i !== index))}
                  aria-label={`Remover ${category.name || 'categoria'}`}
                  className="text-subtle hover:text-danger grid size-9 shrink-0 place-items-center rounded-md"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>

        {weightTotal !== 100 && (
          <p className="text-muted mt-2 text-xs leading-relaxed">
            Os pesos somam {weightTotal}%. Não tem problema — o Nexa calcula a média proporcional ao
            total. Se quiser o padrão, deixe em 100%.
          </p>
        )}

        {categories.length < 10 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() =>
              onCategories([...categories, { name: '', shortCode: '', weightPercent: 0 }])
            }
          >
            <Plus aria-hidden />
            Adicionar categoria
          </Button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── chip ────── */

function Chip({
  selected,
  onClick,
  label,
  colorToken,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  colorToken?: string;
}) {
  // A selected subject wears its own palette, so the grid reads as the set of
  // colors the student will see everywhere else in the app.
  const colored = Boolean(colorToken) && selected;
  const style = colored
    ? {
        ...subjectColorVars(colorToken),
        backgroundColor: 'var(--subject-soft)',
        color: 'var(--subject-on-soft)',
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={style}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
        colored && 'border-transparent',
        !colored && selected && 'border-brand bg-brand-soft text-brand-text',
        !selected && 'border-border bg-surface text-muted hover:bg-surface-2',
      )}
    >
      {colored ? (
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: 'var(--subject-base)' }}
        />
      ) : (
        selected && <Check className="size-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}
