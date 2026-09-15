'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { safeNext } from '../lib/safe-next';
import { authErrorMessage, isConfigurationError, toAuthErrorLike } from '../lib/auth-errors';
import {
  magicLinkSchema,
  newPasswordSchema,
  parseAuthMode,
  recoverSchema,
  signInSchema,
  signUpSchema,
  verifyCodeSchema,
  type AuthFormState,
  type AuthMode,
} from '../schemas';

/**
 * Entradas de autenticação. Os três caminhos terminam no mesmo lugar, então o
 * resto do app nunca precisa saber como alguém entrou.
 *
 * Existem três porque cada um falha por um motivo diferente e fora do código:
 *   • e-mail + senha  — funciona sem nenhuma configuração além do projeto criado
 *   • link mágico     — depende do SMTP do projeto (o padrão é bem limitado)
 *   • Google          — depende do provider habilitado no painel
 *
 * A versão anterior só tinha os dois últimos, e por isso um projeto novo ficava
 * sem nenhuma forma de criar conta até alguém mexer no painel do Supabase.
 *
 * Todo `next` passa por `safeNext` antes de encostar em um redirect — veja
 * aquele módulo para entender por que um `next` solto é vetor de phishing.
 */

/** IPv4 cru (com ou sem porta) — nunca é um domínio público real, sempre indício de
 * proxy repassando o endereço interno onde o servidor escuta (ex.: `0.0.0.0`). */
const RAW_IPV4_HOST = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;

/**
 * Origem da requisição atual, para deploys de preview redirecionarem para si mesmos.
 *
 * `x-forwarded-host` só é confiável quando parece um domínio de verdade — alguns
 * proxies (visto na Hostinger) repassam o endereço interno de bind do servidor
 * (`0.0.0.0`) nesse cabeçalho em vez do host público, o que mandaria o
 * `redirectTo` do OAuth para um endereço que o navegador do usuário não alcança.
 * `NEXT_PUBLIC_SITE_URL`, configurada à mão, nunca tem esse problema.
 */
async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get('x-forwarded-host');
  const forwardedProto = headerList.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost && !RAW_IPV4_HOST.test(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return env.NEXT_PUBLIC_SITE_URL;
}

function invalid(
  message: string,
  mode: AuthMode,
  field?: 'email' | 'password' | 'code',
): AuthFormState {
  return { status: 'error', message, mode, field };
}


/**
 * Ponto único do formulário de login. O modo vem em um campo escondido, então
 * a tela inteira usa um `useActionState` só e nunca fica com dois estados de
 * erro competindo pela mesma área.
 */
export async function authenticate(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const mode = parseAuthMode(formData.get('mode'));

  if (mode === 'magic') return sendMagicLink(formData);
  if (mode === 'signup') return createAccount(formData);
  return enterWithPassword(formData);
}

/** Cria a conta. Se o projeto exigir confirmação, avisa em vez de fingir sucesso. */
async function createAccount(formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(
      issue?.message ?? 'Confira os dados informados.',
      'signup',
      issue?.path[0] === 'password' ? 'password' : 'email',
    );
  }

  const supabase = await createClient();
  const origin = await currentOrigin();
  const next = safeNext(parsed.data.next);

  let signUpResult;
  try {
    signUpResult = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
  } catch (err) {
    return invalid(authErrorMessage(toAuthErrorLike(err)), 'signup');
  }
  const { data, error } = signUpResult;

  if (error) {
    return invalid(
      authErrorMessage(error),
      'signup',
      /senha/i.test(authErrorMessage(error)) ? 'password' : 'email',
    );
  }

  // Confirmação de e-mail ligada: o Supabase devolve o usuário sem sessão.
  // Mandar para /hoje aqui faria o middleware jogar de volta para /login sem
  // explicação nenhuma — que é exatamente o "não funciona" sem mensagem.
  if (!data.session) {
    return { status: 'confirm', email: parsed.data.email };
  }

  redirect(next as Route);
}

/** Entra com e-mail e senha. Não revela qual dos dois está errado. */
async function enterWithPassword(formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(
      issue?.message ?? 'Confira os dados informados.',
      'signin',
      issue?.path[0] === 'password' ? 'password' : 'email',
    );
  }

  const supabase = await createClient();
  const next = safeNext(parsed.data.next);

  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    }));
  } catch (err) {
    error = toAuthErrorLike(err);
  }

  if (error) return invalid(authErrorMessage(error), 'signin');

  redirect(next as Route);
}

/**
 * Envia o link mágico. Nunca revela se o e-mail já tem conta.
 *
 * O mesmo envio (`signInWithOtp`) gera, do lado do Supabase, tanto o link
 * quanto um código de 6 dígitos — qual dos dois aparece no e-mail depende só
 * do template configurado no painel. `verifyMagicCode` abaixo confirma o
 * código sem depender de o aluno abrir o e-mail no mesmo aparelho.
 */
async function sendMagicLink(formData: FormData): Promise<AuthFormState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get('email'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message ?? 'Verifique o e-mail informado.', 'magic');
  }

  const supabase = await createClient();
  const origin = await currentOrigin();
  const next = safeNext(parsed.data.next);

  let error;
  try {
    ({ error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    }));
  } catch (err) {
    error = toAuthErrorLike(err);
  }

  if (error) return invalid(authErrorMessage(error), 'magic');

  return { status: 'code', email: parsed.data.email };
}

/** Confirma o código de 6 dígitos enviado por `sendMagicLink`. */
export async function verifyMagicCode(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = verifyCodeSchema.safeParse({
    email: formData.get('email'),
    code: formData.get('code'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(issue?.message ?? 'Confira o código.', 'magic', 'code');
  }

  const supabase = await createClient();
  const next = safeNext(parsed.data.next);

  let error;
  try {
    ({ error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.code,
      type: 'email',
    }));
  } catch (err) {
    error = toAuthErrorLike(err);
  }

  if (error) return invalid(authErrorMessage(error), 'magic', 'code');

  redirect(next as Route);
}

/** Mantido como Server Action própria: o botão do Google é um form separado. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = await currentOrigin();
  const next = safeNext(formData.get('next')?.toString());

  let oauthResult;
  try {
    oauthResult = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  } catch (err) {
    oauthResult = { data: { url: null }, error: toAuthErrorLike(err) };
  }
  const { data, error } = oauthResult;

  if (error || !data?.url) {
    const message = error
      ? authErrorMessage(error)
      : 'Não consegui abrir o login do Google. Verifique se o provedor está habilitado no Supabase.';
    redirect(`/login?erro=${encodeURIComponent(message)}`);
  }

  // `data.url` aponta para o accounts.google.com — externo por definição, então
  // não é (nem pode ser) uma rota tipada do app.
  redirect(data.url as Route);
}

/**
 * Pede o e-mail de recuperação.
 *
 * Responde 'sent' mesmo quando o e-mail não tem conta. Dizer "esse e-mail não
 * existe" transforma a tela num verificador de cadastro: qualquer pessoa
 * descobriria quais endereços têm conta no Nexa, um por vez.
 */
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = recoverSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message ?? 'Verifique o e-mail.', 'signin', 'email');
  }

  const supabase = await createClient();
  const origin = await currentOrigin();

  let error;
  try {
    ({ error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/redefinir-senha')}`,
    }));
  } catch (err) {
    error = toAuthErrorLike(err);
  }

  // Só erro de infraestrutura aparece — limite de envio, SMTP fora do ar. Um
  // "não encontrei esse e-mail" seria a fuga de informação descrita acima.
  if (error && isConfigurationError(error)) {
    return invalid(authErrorMessage(error), 'signin');
  }

  return { status: 'sent', email: parsed.data.email };
}

/**
 * Grava a nova senha.
 *
 * Depende da sessão de recuperação que o link do e-mail acabou de criar — por
 * isso não pede a senha antiga: quem esquece não tem como informá-la, e exigir
 * isso tornaria a recuperação impossível justamente para quem precisa dela.
 */
export async function setNewPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return invalid(
      issue?.message ?? 'Confira a senha.',
      'signin',
      issue?.path[0] === 'confirm' ? 'password' : 'password',
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return invalid('Este link expirou. Peça um novo e-mail de recuperação.', 'signin');
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return invalid(authErrorMessage(error), 'signin', 'password');

  redirect('/hoje');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
