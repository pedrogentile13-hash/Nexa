import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ONBOARDED_COOKIE } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

/**
 * Conta de escola que caiu no Vestibular (jornada antiga ou endereço digitado): volta a jornada para "escola",
 * apaga o cache de onboarding do middleware e leva ao início. Sem isso, o desvio de quem tem jornada "vestibular"
 * mandaria a pessoa de volta para cá em laço.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.from('profiles').update({ journey: 'school' }).eq('id', user.id);

  const response = NextResponse.redirect(new URL('/hoje', request.url));
  response.cookies.delete(ONBOARDED_COOKIE);
  return response;
}
