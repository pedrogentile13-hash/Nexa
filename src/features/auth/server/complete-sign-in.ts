import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { authErrorMessage } from '@/features/auth/lib/auth-errors';
import { safeNext } from '@/features/auth/lib/safe-next';

/**
 * Fecha qualquer volta de autenticação: link de e-mail ou OAuth.
 *
 * As duas rotas usam este mesmo handler porque o formato do link NÃO é uma
 * decisão do app — é uma decisão do template de e-mail do projeto Supabase, que
 * muda por painel e por versão:
 *
 *   • `?token_hash=…&type=…`  → template moderno, verificado com `verifyOtp`
 *   • `?code=…`               → fluxo PKCE, trocado por sessão
 *   • `#access_token=…`       → template antigo; o fragmento não chega ao
 *                                servidor, então precisa ser resolvido no browser
 *
 * Antes, `/auth/confirm` só entendia o primeiro e `/auth/callback` só o segundo.
 * Um projeto com o template padrão manda o aluno para `/auth/confirm?code=…`,
 * que caía em "link inválido" — a conta existia, mas era impossível entrar.
 * Aceitar os três em qualquer uma das rotas remove essa classe inteira de erro.
 */
export async function completeSignIn(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get('next'));

  // O Supabase pode voltar com erro explícito (link expirado, acesso negado).
  // Repassar o motivo dele é melhor que inventar um genérico por cima.
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');
  if (providerError) return toLogin(origin, providerError);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return toLogin(origin, 'Esse link expirou ou já foi usado. Peça um novo.');
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return toLogin(origin, authErrorMessage(error));
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Sobrou o template antigo, cujos tokens vêm no fragmento `#…`. O servidor
  // nunca os vê, então a página cliente termina o trabalho.
  return NextResponse.redirect(`${origin}/auth/finalizar?next=${encodeURIComponent(next)}`);
}

function toLogin(origin: string, message: string): NextResponse {
  return NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(message)}`);
}
