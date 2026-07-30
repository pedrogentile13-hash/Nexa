import { z } from 'zod';

/** Validated at the Server Action boundary, before anything reaches Supabase. */
export const magicLinkSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('Esse e-mail não parece válido.')
    .toLowerCase(),
  /** Where to land after the link is confirmed. Relative paths only — see actions.ts. */
  next: z.string().optional(),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

/** Shape returned by every auth Server Action, so the form renders one way. */
export type AuthFormState =
  { status: 'idle' } | { status: 'sent'; email: string } | { status: 'error'; message: string };
