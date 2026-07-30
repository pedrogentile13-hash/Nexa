'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Browser client. Used for auth flows, realtime and Storage uploads only.
 *
 * Data WRITES do not go through here: they go through Server Actions, so Zod
 * validation, XP awards and cache revalidation live in exactly one place. RLS
 * is the security boundary either way, but a single write path is what keeps
 * business rules from being reimplemented per screen.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
