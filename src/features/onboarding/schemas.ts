import { z } from 'zod';

/**
 * Onboarding payload.
 *
 * Validated at the Server Action boundary so `bootstrap_student()` only ever
 * receives a shape it can commit. The RPC is one transaction — a payload that
 * fails halfway would leave a student with subjects but no calendar, which is a
 * state no screen can render.
 */

/**
 * A jornada é a PRIMEIRA pergunta do onboarding, e a que muda todo o resto.
 *
 * Quem escolhe 'vestibular' não é perguntado sobre série nem sobre a grade
 * da escola — e não deveria mesmo ser, porque boa parte dos vestibulandos
 * já terminou o ensino médio. Por isso são dois payloads diferentes e dois
 * RPCs diferentes, não um formulário com metade dos campos escondidos.
 */
export const JOURNEYS = ['school', 'vestibular', 'both'] as const;
export type Journey = (typeof JOURNEYS)[number];

export const PREP_CONTEXTS = [
  { value: 'cursinho', label: 'Cursinho', hint: 'Pré-vestibular, presencial ou online' },
  { value: 'escola', label: 'Escola', hint: 'Ainda estou no ensino médio' },
  { value: 'sozinho', label: 'Por conta própria', hint: 'Estudo sozinho, no meu ritmo' },
  { value: 'outro', label: 'Outro', hint: 'Um jeito diferente desses' },
] as const;

/**
 * Metas diárias do vestibulando. Começam onde as da escola TERMINAM: 60
 * minutos é o teto de quem tem aula o dia todo e é o piso de quem está em
 * preparação. Mostrar "15 min — tranquilo" pra quem vai prestar Medicina
 * seria o app fingindo que a conta fecha.
 */
export const VESTIBULAR_GOAL_PRESETS = [
  { minutes: 60, label: '1 hora', hint: 'Conciliando com outras coisas' },
  { minutes: 120, label: '2 horas', hint: 'Ritmo de quem está na escola' },
  { minutes: 180, label: '3 horas', hint: 'Cursinho + estudo em casa' },
  { minutes: 300, label: '5 horas', hint: 'Dedicação integral' },
] as const;

export const vestibularOnboardingSchema = z.object({
  journey: z.enum(['vestibular', 'both']),
  fullName: z
    .string()
    .trim()
    .min(2, 'Diga seu nome para eu saber como te chamar.')
    .max(80, 'Nome muito longo.'),
  mainExamId: z.string().uuid('Escolha qual vestibular é o seu foco.'),
  targetYear: z
    .number()
    .int()
    .min(new Date().getFullYear(), 'O ano da prova não pode estar no passado.')
    .max(2100),
  targetCourse: z.string().trim().max(80).optional().or(z.literal('')),
  targetInstitution: z.string().trim().max(80).optional().or(z.literal('')),
  dailyGoalMinutes: z.number().int().min(10).max(900),
  studyDaysPerWeek: z.number().int().min(1).max(7),
  prepContext: z.enum(['cursinho', 'escola', 'sozinho', 'outro']),
  finishedHighSchool: z.boolean(),
  /** Só quando a jornada é 'both' — o vestibulando puro não tem série. */
  gradeLevel: z.string().trim().max(40).optional().or(z.literal('')),
  timezone: z.string().min(1).default('America/Sao_Paulo'),
});

export type VestibularOnboardingInput = z.input<typeof vestibularOnboardingSchema>;
export type VestibularOnboardingData = z.output<typeof vestibularOnboardingSchema>;

export const onboardingSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Diga seu nome para eu saber como te chamar.')
      .max(80, 'Nome muito longo.'),
    gradeLevel: z.string().trim().min(1, 'Escolha sua série.').max(40),
    catalogIds: z.array(z.string().uuid()).max(40),
    customSubjects: z.array(z.string().trim().min(1).max(80)).max(20),
    dailyGoalMinutes: z.number().int().min(0).max(1440),
    timezone: z.string().min(1).default('America/Sao_Paulo'),
  })
  .refine((data) => data.catalogIds.length + data.customSubjects.length > 0, {
    message: 'Escolha pelo menos uma disciplina.',
    path: ['catalogIds'],
  });

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingData = z.output<typeof onboardingSchema>;

export type OnboardingState =
  { status: 'idle' } | { status: 'error'; message: string; field?: string };

/** Brazilian grade levels, Fundamental II → Ensino Médio. */
export const GRADE_LEVELS = [
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
] as const;

/**
 * Metas diárias de estudo, em minutos.
 *
 * 45 é o default de `daily_study_goal_minutes` no banco — mantido aqui como
 * "Dedicado" para que quem só toca "Continuar" três vezes termine com o mesmo
 * número que já tinha antes desta etapa existir.
 */
export const DAILY_GOAL_PRESETS = [
  { minutes: 15, label: 'Tranquilo', hint: 'Pra manter o hábito' },
  { minutes: 30, label: 'Equilibrado', hint: 'Ritmo de todo dia' },
  { minutes: 45, label: 'Dedicado', hint: 'Progresso constante' },
  { minutes: 60, label: 'Intenso', hint: 'Foco total' },
] as const;
