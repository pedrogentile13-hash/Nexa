import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';

/** Reachable without a session. */
const PUBLIC_PREFIXES = ['/login', '/auth', '/manifest.webmanifest', '/icon', '/apple-icon'];

const ONBOARDING_PATH = '/bem-vindo';
const HOME_PATH = '/hoje';

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session on every document request and gates the app.
 *
 * Three rules, enforced here so no screen has to remember them:
 *   • no session            → /login (remembering where they were going)
 *   • onboarding pending    → /bem-vindo
 *   • already in, hits /login → /hoje
 *
 * The second rule is why the app never renders an empty dashboard: a student
 * cannot reach a data screen before there is data to show.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase. getSession() would read it from a
  // cookie the client can edit, which is not a basis for an access decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user) {
    if (isPublic(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Signed in. One profile read decides between onboarding and the app; it is
  // the only query the middleware runs, and it is a primary-key lookup.
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle();

  const onboarded = Boolean(profile?.onboarded_at);

  if (!onboarded && pathname !== ONBOARDING_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = ONBOARDING_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (onboarded && (pathname === '/login' || pathname === ONBOARDING_PATH)) {
    const url = request.nextUrl.clone();
    url.pathname = HOME_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
