import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/features/auth/lib/safe-next';

/**
 * OAuth landing (Google). Supabase sends back a `code`, which is exchanged for
 * a session cookie here — on the server, so the token never sits in a URL the
 * browser history keeps.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) {
    const message = searchParams.get('error_description') ?? 'Login cancelado.';
    return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent('Não consegui concluir o login. Tente de novo.')}`,
    );
  }

  // The middleware decides between /bem-vindo and the destination based on
  // whether onboarding is done, so this only has to get the session set.
  return NextResponse.redirect(`${origin}${next}`);
}
