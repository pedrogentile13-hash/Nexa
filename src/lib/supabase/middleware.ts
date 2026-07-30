import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';

/** Routes reachable without a session. */
const PUBLIC_PREFIXES = ['/login', '/auth', '/manifest.webmanifest', '/icon', '/apple-icon'];

/**
 * Refreshes the Supabase session on every request and gates the app routes.
 *
 * Two rules, both enforced here so no screen has to remember them:
 *   • no session → /login
 *   • session but onboarding not finished → /bem-vindo
 *
 * The second one is why the app never has to render an empty dashboard.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && !isPublic && pathname !== '/bem-vindo') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = '/bem-vindo';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
