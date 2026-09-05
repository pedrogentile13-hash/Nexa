import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';

/** Reachable without a session. */
const PUBLIC_PREFIXES = ['/login', '/auth', '/manifest.webmanifest', '/icon', '/apple-icon'];

const ONBOARDING_PATH = '/bem-vindo';
const HOME_PATH = '/hoje';

/**
 * O painel não passa pelo onboarding.
 *
 * Onboarding monta a vida acadêmica de um ALUNO — matérias, bimestres, metas.
 * Um administrador que só publica conteúdo não tem nada disso, e exigir que ele
 * invente um boletim para chegar ao painel seria pedir dado falso. Quem pode
 * entrar é decidido em `/admin/layout.tsx`, com o papel do perfil.
 */
const ADMIN_PREFIX = '/admin';

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
  //
  // O try/catch cobre o Supabase inalcançável — rede caída, projeto pausado,
  // URL errada. Sem ele o middleware lança e o comportamento do app inteiro
  // passa a depender de como o runtime trata um middleware que explodiu, o que
  // não é uma decisão de produto e muda entre versões. Sem sessão verificável,
  // a resposta correta é a mesma de sempre: manda para o login.
  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

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

  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) return response;

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
