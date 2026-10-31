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

const SLUG = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * "Entrar pela escola", sem sair do Nexa padrão (usado no app): código da escola + login + senha na mesma tela.
 * Faz o mesmo que `signInWithLogin`, só que o endereço da escola vem do código digitado e não do endereço do site.
 * Mesmas travas: mensagem única de erro, freio de tentativas e conferência do vínculo com a escola.
 */
export async function signInWithSchoolCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const root = process.env.TENANT_ROOT_DOMAIN?.trim().toLowerCase();
  if (!root) return fail('Entrada por escola ainda não está disponível.');

  const raw = String(formData.get('code') ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(`.${root}`, '');
  const login = cleanTypedLogin(String(formData.get('login') ?? ''));
  const password = String(formData.get('password') ?? '');
  if (!raw || !login || !password) return fail('Digite o código da escola, o login e a senha.');
  if (!SLUG.test(raw) || !isValidLogin(login)) return fail('Código da escola, login ou senha incorretos.');

  const host = `${raw}.${root}`;
  const WRONG_ALL = 'Código da escola, login ou senha incorretos.';

  const throttleKey = `school:${clientIp(await headers())}:${host}:${login}`;
  const gate = loginThrottle.hit(throttleKey);
  if (!gate.allowed) return fail(`Muitas tentativas. Espere ${Math.ceil(gate.retryAfterSec / 60)} min e tente de novo.`);

  const supabase = await createClient();
  const { data: school } = await supabase.rpc('resolve_school_host', { p_host: host });
  const schoolId = (school as { school_id?: string }[] | null)?.[0]?.school_id;
  if (!schoolId) return fail(WRONG_ALL);

  let error;
  let userId: string | undefined;
  try {
    const result = await supabase.auth.signInWithPassword({ email: loginToEmail(login, host), password });
    error = result.error;
    userId = result.data.user?.id;
  } catch (err) {
    error = toAuthErrorLike(err);
  }
  if (error) return fail(isConfigurationError(error) ? 'Não consegui entrar agora. Tente de novo em instantes.' : WRONG_ALL);

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', userId ?? '').maybeSingle();
  if (profile?.school_id !== schoolId) {
    await supabase.auth.signOut();
    return fail(WRONG_ALL);
  }

  loginThrottle.reset(throttleKey);
  redirect('/hoje');
}
