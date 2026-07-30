import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Server client for Server Components, Server Actions and Route Handlers.
 *
 * Always `await` a fresh instance per request: caching one across requests
 * would leak one student's session into another's render.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. The middleware refreshes the
            // session, so swallowing this is correct rather than merely quiet.
          }
        },
      },
    },
  );
}

/**
 * The authenticated user, or `null`.
 *
 * Uses `getUser()` — which validates the JWT against Supabase — rather than
 * `getSession()`, whose payload comes from a cookie the client can edit.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
