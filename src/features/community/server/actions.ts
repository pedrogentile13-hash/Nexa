'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const socialProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, 'Use de 3 a 24 letras minúsculas, números ou "_", sem espaço.')
    .nullable(),
  bio: z.string().trim().max(280, 'Até 280 caracteres.').nullable(),
  visibility: z.enum(['private', 'friends', 'school', 'public']),
});

export type SocialProfileState =
  | { status: 'idle' }
  | { status: 'saved' }
  | { status: 'error'; message: string };

export async function saveSocialProfile(
  _prev: SocialProfileState,
  formData: FormData,
): Promise<SocialProfileState> {
  const parsed = socialProfileSchema.safeParse({
    username: (formData.get('username') as string | null)?.trim() || null,
    bio: (formData.get('bio') as string | null)?.trim() || null,
    visibility: formData.get('visibility'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const { username, bio, visibility } = parsed.data;
  const { error } = await supabase.from('social_profiles').upsert({
    id: user.id,
    username,
    bio,
    visibility,
  });

  if (error) {
    // Índice único é sobre lower(username) — a mensagem do Postgres não diz
    // isso em português, então traduzimos o caso mais provável de falha.
    return error.code === '23505'
      ? { status: 'error', message: 'Esse nome de usuário já está em uso.' }
      : { status: 'error', message: 'Não consegui salvar o perfil social.' };
  }

  revalidatePath('/perfil');
  return { status: 'saved' };
}

export async function followUser(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('follow_user', { p_target_id: targetUserId });
  revalidatePath('/perfil');
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('unfollow_user', { p_target_id: targetUserId });
  revalidatePath('/perfil');
}
