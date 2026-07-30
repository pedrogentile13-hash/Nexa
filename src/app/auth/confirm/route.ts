import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/features/auth/lib/safe-next';

/**
 * Magic-link landing.
 *
 * Uses `token_hash` + `verifyOtp` rather than the older fragment-based flow:
 * the hash variant never puts the access token in the URL, so it cannot leak
 * through the Referer header or a shared link.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(searchParams.get('next'));

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent('Link inválido ou incompleto.')}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Almost always an expired or already-used link. Say that, instead of a
    // generic failure that makes the student think the app is broken.
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent('Esse link expirou ou já foi usado. Peça um novo.')}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
