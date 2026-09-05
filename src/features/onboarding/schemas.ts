import { z } from 'zod';

/**
 * Onboarding payload.
 *
 * Validated at the Server Action boundary so `bootstrap_student()` only ever
 * receives a shape it can commit. The RPC is one transaction — a payload that
 * fails halfway would leave a student with subjects but no calendar, which is a
 * state no screen can render.
 */

export const gradingCategorySchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome à categoria.').max(60),
  shortCode: z.string().trim().max(12).optional().nullable(),
  weightPercent: z.number().min(0, 'O peso não pode ser negativo.').max(100),
});

export const onboardingSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Diga seu nome para eu saber como te chamar.')
      .max(80, 'Nome muito longo.'),
    gradeLevel: z.string().trim().min(1, 'Escolha sua série.').max(40),
    className: z.string().trim().max(20).optional().nullable(),
    /** 2 = semestres · 3 = trimestres · 4 = bimestres */
    termCount: z.number().int().min(1).max(12),
    catalogIds: z.array(z.string().uuid()).max(40),
    customSubjects: z.array(z.string().trim().min(1).max(80)).max(20),
    categories: z.array(gradingCategorySchema).min(1, 'Mantenha ao menos uma categoria.').max(10),
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

/** Default grading model from README Parte 1 — pre-filled, still editable. */
export const DEFAULT_CATEGORIES = [
  { name: 'Prova Bimestral', shortCode: 'PB', weightPercent: 35 },
  { name: 'Verificação de Aprendizagem', shortCode: 'VA', weightPercent: 35 },
  { name: 'Qualitativa', shortCode: 'QL', weightPercent: 30 },
] as const;

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

export const TERM_MODELS = [
  { count: 4, label: 'Bimestral', hint: '4 períodos' },
  { count: 3, label: 'Trimestral', hint: '3 períodos' },
  { count: 2, label: 'Semestral', hint: '2 períodos' },
] as const;
