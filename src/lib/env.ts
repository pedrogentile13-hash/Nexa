import { z } from 'zod';

/**
 * Environment contract, validated at import time.
 *
 * A missing Supabase URL should fail the build with a readable message, not
 * surface later as `fetch failed` inside a Server Component where the real
 * cause is three stack frames away.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so they must be referenced
 * literally — `process.env[key]` does not work for them.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment configuration:\n${details}\n\nCopy .env.example to .env.local and fill it in.`,
  );
}

export const env = parsed.data;
