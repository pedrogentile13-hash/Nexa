'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { safeNext } from '../lib/safe-next';
import { authErrorMessage } from '../lib/auth-errors';
import {
  magicLinkSchema,
  parseAuthMode,
  signInSchema,
  signUpSchema,
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

/** Origem da requisição atual, para deploys de preview redirecionarem para si mesmos. */
async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get('x-forwarded-host');
  const forwardedProto = headerList.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return env.NEXT_PUBLIC_SITE_URL;
}

function invalid(message: string, mode: AuthMode, field?: 'email' | 'password'): AuthFormState {
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

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

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

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return invalid(authErrorMessage(error), 'signin');

  redirect(next as Route);
}

/** Envia o link mágico. Nunca revela se o e-mail já tem conta. */
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

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return invalid(authErrorMessage(error), 'magic');

  return { status: 'sent', email: parsed.data.email };
}

/** Mantido como Server Action própria: o botão do Google é um form separado. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = await currentOrigin();
  const next = safeNext(formData.get('next')?.toString());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error || !data.url) {
    const message = error
      ? authErrorMessage(error)
      : 'Não consegui abrir o login do Google. Verifique se o provedor está habilitado no Supabase.';
    redirect(`/login?erro=${encodeURIComponent(message)}`);
  }

  // `data.url` aponta para o accounts.google.com — externo por definição, então
  // não é (nem pode ser) uma rota tipada do app.
  redirect(data.url as Route);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
