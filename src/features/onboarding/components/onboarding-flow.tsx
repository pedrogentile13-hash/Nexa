'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { completeOnboarding } from '../server/actions';
import { DAILY_GOAL_PRESETS, GRADE_LEVELS, type OnboardingState } from '../schemas';
import { AREA_LABELS, type CatalogSubject } from '../types';
import type { SubjectArea } from '@/types/database.types';

/**
 * O onboarding do Nexa, em seis telas curtas.
 *
 * A sequência e a moldura visual (mascote, barra de passos em pílulas,
 * botões-pílula 3D) seguem o guia de fluxo desenhado originalmente para o
 * Lidara Learning — mas a identidade é do Nexa: o mascote é o boné de
 * formatura da marca, não o personagem do outro produto, e a etapa de
 * "objetivos" do guia vira a etapa de matérias, porque é essa a escolha que
 * de fato personaliza o Nexa. "Tudo pronto" também não pede conta — o aluno
 * já entrou logado — então fecha com um resumo do que foi montado.
 *
 * Cada etapa que faz uma pergunta chega com uma resposta padrão já marcada,
 * de forma que tocar "Continuar" cinco vezes ainda produz uma conta funcional.
 */

interface Props {
  catalog: [SubjectArea, CatalogSubject[]][];
  coreSubjectIds: string[];
  defaultName: string;
  /** Used until the browser reports the real one on mount. */
  fallbackTimezone: string;
}

const INITIAL: OnboardingState = { status: 'idle' };
const STEPS = 5;

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
  const [selected, setSelected] = useState<Set<string>>(new Set(coreSubjectIds));
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(45);

  const [state, formAction, isPending] = useActionState(completeOnboarding, INITIAL);

  const subjectCount = selected.size + customSubjects.length;

  const identityValid = fullName.trim().length >= 2 && gradeLevel.length > 0;
  const subjectsValid = subjectCount > 0;

  const canAdvance = useMemo(() => {
    if (step === 1) return identityValid;
    if (step === 2) return subjectsValid;
    return true;
  }, [step, identityValid, subjectsValid]);

  const canSubmit = identityValid && subjectsValid;

  const payload = JSON.stringify({
    fullName: fullName.trim(),
    gradeLevel,
    catalogIds: [...selected],
    customSubjects,
    dailyGoalMinutes,
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

  const isLast = step === STEPS - 1;
  const ctaLabel = step === 0 ? 'Vamos lá' : 'Continuar';

  return (
    <div className="pt-safe pb-safe bg-surface-2/40 flex min-h-dvh flex-col px-5">
      {/* Progresso ------------------------------------------------------- */}
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
        <StepProgress total={STEPS} current={step} />
      </header>

      {/* Etapas ------------------------------------------------------------ */}
      {/* `flex` + `flex-1` nos três níveis (aqui, no motion.div, e dentro das
          telas centralizadas) em vez de `h-full`: a altura desta faixa vem de
          flex-grow, e a propriedade `height` dela continua computando `auto` —
          um filho com `height: 100%` não enxerga esse "auto" como definido e
          desiste, ficando do tamanho do próprio conteúdo. É por isso que Vamos
          organizar seus estudos e Tudo pronto apareciam coladas no topo em vez
          de centralizadas na tela. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            {step === 0 && <StepIntro />}

            {step === 1 && (
              <StepIdentity
                fullName={fullName}
                onFullName={setFullName}
                gradeLevel={gradeLevel}
                onGradeLevel={setGradeLevel}
              />
            )}

            {step === 2 && (
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

            {step === 3 && (
              <StepGoal dailyGoalMinutes={dailyGoalMinutes} onDailyGoalMinutes={setDailyGoalMinutes} />
            )}

            {step === 4 && <StepDone subjectCount={subjectCount} dailyGoalMinutes={dailyGoalMinutes} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rodapé -------------------------------------------------------------- */}
      <footer className="space-y-3 py-6">
        {state.status === 'error' && (
          <p role="alert" className="text-danger text-center text-sm">
            {state.message}
          </p>
        )}

        {!isLast ? (
          <Button
            variant="pop"
            size="lg"
            className="w-full"
            disabled={!canAdvance}
            onClick={() => go(step + 1)}
          >
            {ctaLabel}
          </Button>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="payload" value={payload} />
            <Button
              type="submit"
              variant="pop"
              size="lg"
              className="w-full"
              disabled={!canSubmit || isPending}
            >
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

/* ───────────────────────────────────────────────────────── chrome ────── */

/** Barra de passos em pílulas, no lugar de uma barra contínua: cada etapa é
 * um segmento que acende quando é concluído, então o aluno vê de relance
 * quantas perguntas faltam — não só uma fração abstrata. */
function StepProgress({ total, current }: { total: number; current: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`Progresso da configuração: passo ${current + 1} de ${total}`}
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      className="flex gap-1.5"
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full transition-colors duration-300',
            i <= current ? 'bg-brand' : 'bg-surface-2',
          )}
        />
      ))}
    </div>
  );
}

/** O emblema do Nexa: o boné de formatura da marca dentro de um blob em
 * degradê, com o mesmo espírito do mascote do guia (forma arredondada,
 * brilho no canto, sombra solta embaixo) sem repetir o personagem de outro
 * produto. */
function Mascot({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center', className)} aria-hidden>
      <div className="from-brand to-brand-hover relative grid size-24 place-items-center rounded-[32%] bg-gradient-to-br shadow-lg">
        <GraduationCap className="text-brand-fg size-11" strokeWidth={2.25} />
        <Sparkles className="text-warning fill-warning absolute -top-3 -right-1 size-6 drop-shadow-sm" />
      </div>
      <span className="bg-text/10 -mt-1 h-2.5 w-16 rounded-full blur-[3px]" />
    </div>
  );
}

function StepHeading({
  title,
  subtitle,
  center,
}: {
  title: string;
  subtitle: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? 'text-center' : undefined}>
      <h1 className="text-[28px] leading-[1.15] font-extrabold tracking-tight">{title}</h1>
      <p className="text-muted mt-2 text-sm leading-relaxed">{subtitle}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── step 0 ────── */

function StepIntro() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 pb-10 text-center">
      <Mascot />
      <StepHeading
        center
        title="Vamos organizar seus estudos"
        subtitle={
          'Matérias, notas e a rotina do dia — tudo num só lugar, montado do seu jeito em menos de um minuto.'
        }
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── step 1 ────── */

function StepIdentity({
  fullName,
  onFullName,
  gradeLevel,
  onGradeLevel,
}: {
  fullName: string;
  onFullName: (v: string) => void;
  gradeLevel: string;
  onGradeLevel: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeading title="Vamos começar" subtitle="Só o essencial. Leva menos de um minuto." />

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
      <StepHeading
        title="Suas matérias"
        subtitle={
          <>
            Já marquei as mais comuns. Toque para ajustar —{' '}
            <strong className="text-text font-semibold">
              {total} selecionada{total === 1 ? '' : 's'}
            </strong>
            .
          </>
        }
      />

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
            aria-label="Adicionar matéria"
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

function StepGoal({
  dailyGoalMinutes,
  onDailyGoalMinutes,
}: {
  dailyGoalMinutes: number;
  onDailyGoalMinutes: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeading title="Qual sua meta diária?" subtitle="Você pode mudar depois, no seu perfil." />

      <ul className="space-y-2.5">
        {DAILY_GOAL_PRESETS.map((preset) => {
          const isSelected = dailyGoalMinutes === preset.minutes;
          return (
            <li key={preset.minutes}>
              <button
                type="button"
                onClick={() => onDailyGoalMinutes(preset.minutes)}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
                  isSelected
                    ? 'border-brand bg-brand-soft'
                    : 'border-border bg-surface hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'w-14 shrink-0 text-center text-lg leading-tight font-bold tabular-nums',
                    isSelected ? 'text-brand-text' : 'text-brand',
                  )}
                >
                  {preset.minutes}
                  <span className="block text-[11px] font-semibold tracking-wide uppercase">
                    min
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{preset.label}</span>
                  <span className="text-muted block text-xs">{preset.hint}</span>
                </span>

                <span
                  aria-hidden
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border-2',
                    isSelected
                      ? 'border-brand bg-brand text-brand-fg'
                      : 'border-border-strong text-transparent',
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── step 4 ────── */

function StepDone({
  subjectCount,
  dailyGoalMinutes,
}: {
  subjectCount: number;
  dailyGoalMinutes: number;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 pb-10 text-center">
      <Mascot />
      <StepHeading
        center
        title="Tudo pronto!"
        subtitle={`${subjectCount} matéria${subjectCount === 1 ? '' : 's'} organizada${subjectCount === 1 ? '' : 's'} e meta de ${dailyGoalMinutes} min por dia. É só tocar em começar.`}
      />
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
        'flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-all',
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
        selected && <Check className="size-3.5" strokeWidth={3} aria-hidden />
      )}
      {label}
    </button>
  );
}
