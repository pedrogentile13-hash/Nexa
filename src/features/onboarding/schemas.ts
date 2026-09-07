import { z } from 'zod';

/**
 * Onboarding payload.
 *
 * Validated at the Server Action boundary so `bootstrap_student()` only ever
 * receives a shape it can commit. The RPC is one transaction — a payload that
 * fails halfway would leave a student with subjects but no calendar, which is a
 * state no screen can render.
 */

export const onboardingSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Diga seu nome para eu saber como te chamar.')
      .max(80, 'Nome muito longo.'),
    gradeLevel: z.string().trim().min(1, 'Escolha sua série.').max(40),
    className: z.string().trim().max(20).optional().nullable(),
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
