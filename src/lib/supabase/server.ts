import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';
import type { User } from '@supabase/supabase-js';
import { DEMO_COOKIE, DEMO_STAFF_ID, DEMO_USER_ID, demoUserIdFor } from '@/lib/demo/flags';

/** Aluno fictício do modo demonstração (só com NEXA_DEMO=1 fora de produção). */
const DEMO_USERS: Record<
  string,
  { id: string; email: string; user_metadata: { full_name: string } }
> = {
  [DEMO_USER_ID]: {
    id: DEMO_USER_ID,
    email: 'enzo@demo.nexa',
    user_metadata: { full_name: 'Enzo' },
  },
  [DEMO_STAFF_ID]: {
    id: DEMO_STAFF_ID,
    email: 'marina@demo.nexa',
    user_metadata: { full_name: 'Marina Souza' },
  },
};

async function demoUserOrNull() {
  const id = demoUserIdFor((await cookies()).get(DEMO_COOKIE)?.value);
  return id ? (DEMO_USERS[id] ?? null) : null;
}

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
 *
 * `getUser()` is a real network round-trip to Supabase's Auth server, not a
 * local cookie read. Without `cache()`, every layout/page/action on the
 * critical path that needs the session paid its own round-trip — up to three
 * of them stacked on a single navigation (middleware, `(app)/layout.tsx`,
 * the page itself), which is both slow and, when Supabase or the Netlify
 * function is having a transient hiccup, three independent chances to fail.
 * `cache()` dedupes repeated calls within the same request's render pass —
 * it never persists across requests, so this does not reintroduce the
 * cross-request leak `createClient()`'s own comment warns about.
 */
export const getCurrentUser = cache(async () => {
  const demoUser = await demoUserOrNull();
  if (demoUser) return demoUser as unknown as User;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Jornada + flag do vestibular, deduplicadas por requisição.
 *
 * O shell já lê isso pra escolher a navegação, e o cabeçalho precisa do
 * mesmo dado pro seletor de plataforma. Sem `cache()` seriam duas leituras
 * por tela; com ele, a segunda chamada devolve o resultado da primeira.
 */
export const getNavContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { journey: 'school' as const, vestibularEnabled: false };

  const supabase = await createClient();
  const [{ data }, { data: flag }] = await Promise.all([
    supabase.from('profiles').select('journey').eq('id', user.id).maybeSingle(),
    supabase.from('feature_flags').select('enabled').eq('key', 'vestibular_enabled').maybeSingle(),
  ]);

  // Sem `journey` no banco ainda, `data` volta null (o PostgREST recusa a
  // consulta) — e 'school' é a resposta certa: é o que toda conta existente
  // é, e o padrão da coluna quando ela for criada.
  return {
    journey: data?.journey ?? ('school' as const),
    vestibularEnabled: Boolean(flag?.enabled),
  };
});
