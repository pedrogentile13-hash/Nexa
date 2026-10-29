'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { clientIp, loginThrottle } from '@/lib/security/throttle';
import { getTenant } from '@/lib/tenant/server';
import { cleanTypedLogin, isValidLogin, loginToEmail } from '@/features/school-accounts/lib/credentials';
import { safeNext } from '../lib/safe-next';
import { isConfigurationError, toAuthErrorLike } from '../lib/auth-errors';
import type { AuthFormState } from '../schemas';

/**
 * Entrada por login e senha — a ÚNICA forma de entrar no endereço de uma escola.
 *
 * O Supabase Auth exige um e-mail, então o login vira o e-mail fabricado
 * `login@endereço-da-escola`. O aluno nunca o vê. A resposta de erro é sempre a
 * mesma ("login ou senha incorretos"): dizer qual dos dois errou transformaria
 * a tela num verificador de logins da escola.
 */

const WRONG = 'Login ou senha incorretos.';

function fail(message: string): AuthFormState {
  return { status: 'error', message, mode: 'signin' };
}

export async function signInWithLogin(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const tenant = await getTenant();
  if (!tenant) return fail('Este acesso só existe no endereço da escola.');

  const login = cleanTypedLogin(String(formData.get('login') ?? ''));
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next')?.toString());

  if (!login || !password) return fail('Digite o login e a senha.');
  if (!isValidLogin(login)) return fail(WRONG);

  // Freio: 8 tentativas por login e aparelho a cada 10 minutos (adivinhar senha em fila não passa).
  const throttleKey = `school:${clientIp(await headers())}:${tenant.host}:${login}`;
  const gate = loginThrottle.hit(throttleKey);
  if (!gate.allowed) return fail(`Muitas tentativas. Espere ${Math.ceil(gate.retryAfterSec / 60)} min e tente de novo.`);

  const supabase = await createClient();

  let error;
  let userId: string | undefined;
  try {
    const result = await supabase.auth.signInWithPassword({
      email: loginToEmail(login, tenant.host),
      password,
    });
    error = result.error;
    userId = result.data.user?.id;
  } catch (err) {
    error = toAuthErrorLike(err);
  }

  if (error) {
    return fail(isConfigurationError(error) ? 'Não consegui entrar agora. Tente de novo em instantes.' : WRONG);
  }

  // Cinto e suspensório: a conta TEM que ser desta escola. O e-mail fabricado
  // já leva o endereço, mas o vínculo de verdade é o `school_id` do perfil.
  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', userId ?? '').maybeSingle();
  if (profile?.school_id !== tenant.id) {
    await supabase.auth.signOut();
    return fail(WRONG);
  }

  loginThrottle.reset(throttleKey);
  redirect(next as Route);
}
