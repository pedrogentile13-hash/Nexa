'use server';

import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { safeNext } from '../lib/safe-next';
import { magicLinkSchema, type AuthFormState } from '../schemas';

/**
 * Auth entry points. Both methods land on the same place, so the rest of the app
 * never has to care how someone signed in.
 *
 * Every `next` goes through `safeNext` before touching a redirect — see that
 * module for why an unchecked one is a phishing vector.
 */

/** Origin of the current request, so preview deployments redirect to themselves. */
async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get('x-forwarded-host');
  const forwardedProto = headerList.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return env.NEXT_PUBLIC_SITE_URL;
}

/** Sends the magic link. Never reveals whether the e-mail already has an account. */
export async function signInWithMagicLink(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get('email'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Verifique o e-mail informado.',
    };
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

  if (error) {
    // Rate limiting is the one failure worth naming: the generic message would
    // have the student retry immediately and get blocked for longer.
    const message =
      error.status === 429
        ? 'Muitas tentativas. Espere um minuto e tente de novo.'
        : 'Não consegui enviar o link agora. Tente novamente em instantes.';
    return { status: 'error', message };
  }

  return { status: 'sent', email: parsed.data.email };
}

/** Starts the Google flow. Redirects, so it never returns on success. */
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
    redirect(`/login?erro=${encodeURIComponent('Não consegui abrir o login do Google.')}`);
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
