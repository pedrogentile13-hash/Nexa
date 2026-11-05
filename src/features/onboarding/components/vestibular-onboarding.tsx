'use client';

import { useActionState, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { completeVestibularOnboarding } from '../server/actions';
import {
  GRADE_LEVELS,
  PREP_CONTEXTS,
  VESTIBULAR_GOAL_PRESETS,
  type Journey,
  type OnboardingState,
} from '../schemas';

/**
 * O onboarding de quem está se preparando pra um vestibular.
 *
 * O que ele NÃO pergunta é tão importante quanto o que pergunta: não pede
 * série (boa parte já terminou o ensino médio), não pede a grade de
 * disciplinas da escola (um vestibulando estuda tudo o que cai na prova) e
 * não fala em bimestre. Em troca pergunta o que só esta pessoa tem: qual
 * prova, que ano, qual curso, onde estuda e quanto do dia sobra.
 *
 * O curso-alvo é opcional de propósito. Muita gente presta vestibular
 * ainda decidindo o que quer fazer, e exigir a resposta transformaria a
 * primeira tela do app numa cobrança.
 */

interface ExamOption {
  id: string;
  name: string;
  organization: string | null;
}

const INITIAL: OnboardingState = { status: 'idle' };
const STEPS = 5;

const DAYS = [3, 4, 5, 6, 7] as const;

export function VestibularOnboardingFlow({
  journey,
  exams,
  defaultName,
  fallbackTimezone,
  onBack,
}: {
  journey: Extract<Journey, 'vestibular' | 'both'>;
  exams: ExamOption[];
  defaultName: string;
  fallbackTimezone: string;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [timezone, setTimezone] = useState(fallbackTimezone);
  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) setTimezone(resolved);
  }, []);

  const currentYear = new Date().getFullYear();

  const [fullName, setFullName] = useState(defaultName);
  const [mainExamId, setMainExamId] = useState(exams[0]?.id ?? '');
  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetCourse, setTargetCourse] = useState('');
  const [targetInstitution, setTargetInstitution] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(5);
  // A jornada 'both' já diz que a pessoa está na escola — a pergunta seria
  // redundante, e a resposta, sempre a mesma.
  const [prepContext, setPrepContext] = useState<string>(
    journey === 'both' ? 'escola' : 'cursinho',
  );
  const [finishedHighSchool, setFinishedHighSchool] = useState(journey !== 'both');
  const [gradeLevel, setGradeLevel] = useState('3ª série EM');

  const [state, formAction, isPending] = useActionState(completeVestibularOnboarding, INITIAL);

  const identityValid = fullName.trim().length >= 2;
  const examValid = mainExamId.length > 0 && targetYear >= currentYear;

  const canAdvance =
    (step === 0 && identityValid) || (step === 1 && examValid) || step > 1 || step === 0;

  const payload = JSON.stringify({
    journey,
    fullName: fullName.trim(),
    mainExamId,
    targetYear,
    targetCourse: targetCourse.trim(),
    targetInstitution: targetInstitution.trim(),
    dailyGoalMinutes,
    studyDaysPerWeek,
    prepContext,
    finishedHighSchool,
    gradeLevel: journey === 'both' ? gradeLevel : '',
    timezone,
  });

  function go(next: number) {
    if (next < 0) {
      onBack();
      return;
    }
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  const isLast = step === STEPS - 1;
  const examName = exams.find((e) => e.id === mainExamId)?.name ?? 'sua prova';

  return (
    <div className="pt-safe pb-safe bg-surface-2/40 flex min-h-dvh flex-col px-5">
      <header className="py-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-subtle text-xs font-medium">
            Passo {step + 1} de {STEPS}
          </span>
          <button
            type="button"
            onClick={() => go(step - 1)}
            className="text-muted hover:text-text -mr-2 flex items-center gap-1 px-2 py-1 text-xs"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Voltar
          </button>
        </div>
        <StepDots total={STEPS} current={step} />
      </header>

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
            {step === 0 && (
              <Section
                title="Como te chamo?"
                subtitle="Vou usar seu nome nas telas — nada disso aparece pra mais ninguém sem você querer."
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Seu nome</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Como você quer ser chamado"
                    autoComplete="name"
                  />
                </div>
              </Section>
            )}

            {step === 1 && (
              <Section
                title="Qual é a sua prova?"
                subtitle="Dá pra acrescentar outras depois. Essa é a que manda no seu plano e na contagem regressiva."
              >
                <div className="space-y-2">
                  {exams.map((exam) => (
                    <Choice
                      key={exam.id}
                      active={mainExamId === exam.id}
                      onClick={() => setMainExamId(exam.id)}
                      title={exam.name}
                      hint={exam.organization ?? undefined}
                    />
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Em que ano você presta?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[currentYear, currentYear + 1, currentYear + 2].map((year) => (
                      <Pill
                        key={year}
                        active={targetYear === year}
                        onClick={() => setTargetYear(year)}
                      >
                        {year}
                      </Pill>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {step === 2 && (
              <Section
                title="O que você quer cursar?"
                subtitle="Pode deixar em branco. Muita gente presta ainda decidindo — e tudo bem."
              >
                <div className="space-y-2">
                  <Label htmlFor="targetCourse">Curso</Label>
                  <Input
                    id="targetCourse"
                    value={targetCourse}
                    onChange={(e) => setTargetCourse(e.target.value)}
                    placeholder="Medicina, Direito, Engenharia…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetInstitution">Instituição dos sonhos</Label>
                  <Input
                    id="targetInstitution"
                    value={targetInstitution}
                    onChange={(e) => setTargetInstitution(e.target.value)}
                    placeholder="USP, UFMG, Unicamp…"
                  />
                </div>
              </Section>
            )}

            {step === 3 && (
              <Section
                title="Como é a sua rotina hoje?"
                subtitle="Isso ajusta o tamanho do plano diário. Você muda quando quiser."
              >
                {journey !== 'both' && (
                  <div className="space-y-2">
                    <Label>Onde você estuda</Label>
                    <div className="space-y-2">
                      {PREP_CONTEXTS.map((ctx) => (
                        <Choice
                          key={ctx.value}
                          active={prepContext === ctx.value}
                          onClick={() => {
                            setPrepContext(ctx.value);
                            // "Ainda estou no ensino médio" e "já terminei" são
                            // a mesma informação dita de dois jeitos; deixar as
                            // duas perguntas soltas gera resposta contraditória.
                            if (ctx.value === 'escola') setFinishedHighSchool(false);
                          }}
                          title={ctx.label}
                          hint={ctx.hint}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {journey === 'both' && (
                  <div className="space-y-2">
                    <Label>Sua série</Label>
                    <div className="flex flex-wrap gap-2">
                      {GRADE_LEVELS.map((level) => (
                        <Pill
                          key={level}
                          active={gradeLevel === level}
                          onClick={() => setGradeLevel(level)}
                        >
                          {level}
                        </Pill>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quantos dias por semana você consegue estudar?</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <Pill
                        key={d}
                        active={studyDaysPerWeek === d}
                        onClick={() => setStudyDaysPerWeek(d)}
                      >
                        {d === 7 ? 'Todos' : `${d} dias`}
                      </Pill>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {step === 4 && (
              <Section
                title="Quanto tempo por dia?"
                subtitle="Seja honesto — uma meta que você cumpre vale mais que uma que te faz desistir na segunda semana."
              >
                <div className="space-y-2">
                  {VESTIBULAR_GOAL_PRESETS.map((preset) => (
                    <Choice
                      key={preset.minutes}
                      active={dailyGoalMinutes === preset.minutes}
                      onClick={() => setDailyGoalMinutes(preset.minutes)}
                      title={preset.label}
                      hint={preset.hint}
                    />
                  ))}
                </div>

                <div className="border-brand/30 bg-brand-soft mt-4 rounded-2xl border p-4">
                  <p className="text-brand-text flex items-center gap-2 text-sm font-semibold">
                    <Target className="size-4" aria-hidden />
                    Seu Nexa vai abrir assim
                  </p>
                  <p className="text-brand-text/90 mt-1 text-sm leading-snug">
                    {examName} {targetYear}
                    {targetCourse.trim() ? ` · ${targetCourse.trim()}` : ''} ·{' '}
                    {Math.round(dailyGoalMinutes / 60)}h por dia, {studyDaysPerWeek} dias por semana.
                  </p>
                </div>
              </Section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

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
            Continuar
          </Button>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="payload" value={payload} />
            <Button
              type="submit"
              variant="pop"
              size="lg"
              className="w-full"
              disabled={!identityValid || !examValid || isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Sparkles aria-hidden />
              )}
              {isPending ? 'Preparando tudo…' : 'Começar minha preparação'}
            </Button>
          </form>
        )}
      </footer>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── chrome ────── */

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`Progresso da configuração: passo ${current + 1} de ${total}`}
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      className="flex gap-1.5"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            i <= current ? 'bg-brand' : 'bg-surface-2',
          )}
        />
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 py-4">
      <div className="space-y-1.5">
        <h1 className="text-2xl leading-tight font-bold">{title}</h1>
        <p className="text-muted text-sm leading-snug">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
        active ? 'border-brand bg-brand-soft' : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
          active ? 'border-brand bg-brand text-brand-fg' : 'border-border-strong',
        )}
      >
        {active && <Check className="size-3.5" />}
      </span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-semibold', active && 'text-brand-text')}>
          {title}
        </span>
        {hint && <span className="text-muted block text-xs leading-snug">{hint}</span>}
      </span>
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center rounded-full border px-4 text-sm transition-colors',
        active
          ? 'border-brand bg-brand-soft text-brand-text font-semibold'
          : 'border-border bg-surface text-muted hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}
