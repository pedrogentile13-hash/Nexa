'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { listPostComments, listSavedPosts, type FeedPost, type PostComment } from './feed-queries';

/** Wrappers de Server Action — `feed-queries.ts` não é `'use server'` (é usado também de Server Components), então o client chama por aqui. */
export async function getPostComments(postId: string): Promise<PostComment[]> {
  return listPostComments(postId);
}

export async function getSavedPosts(): Promise<FeedPost[]> {
  return listSavedPosts();
}

/**
 * Ações do feed do Nexa Community (Fase 2). Toda escrita passa pelas RPCs
 * `security definer` da migração `20260913000300_feed.sql` — a autorização
 * (quem pode ver/editar/apagar um post ou comentário) mora lá, uma vez só,
 * não duplicada aqui.
 *
 * `isFeatureEnabled('posts_enabled')` é a mesma trava de "esconder atrás de
 * um botão" e "recusar mesmo que alguém adivinhe a URL" — a flag desligada
 * bloqueia a escrita mesmo que a rota em si já não apareça na navegação.
 */

const createPostSchema = z.object({
  content: z.string().trim().min(1, 'Escreva algo antes de publicar.').max(2000),
  visibility: z.enum(['private', 'friends', 'school', 'public']),
});

export type CreatePostState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok' };

export async function createPost(_prev: CreatePostState, formData: FormData): Promise<CreatePostState> {
  if (!(await isFeatureEnabled('posts_enabled'))) {
    return { status: 'error', message: 'O feed da Comunidade ainda não está disponível.' };
  }

  const parsed = createPostSchema.safeParse({
    content: formData.get('content'),
    visibility: formData.get('visibility'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise o post.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_post', {
    p_content: parsed.data.content,
    p_visibility: parsed.data.visibility,
  });
  if (error) return { status: 'error', message: 'Não consegui publicar agora — tenta de novo.' };

  revalidatePath('/comunidade');
  return { status: 'ok' };
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('delete_post', { p_post_id: postId });
  revalidatePath('/comunidade');
}

export async function toggleLike(postId: string, isLiked: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc(isLiked ? 'unlike_post' : 'like_post', { p_post_id: postId });
  revalidatePath('/comunidade');
}

export async function toggleSave(postId: string, isSaved: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc(isSaved ? 'unsave_post' : 'save_post', { p_post_id: postId });
  revalidatePath('/comunidade');
}

const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Escreva um comentário.').max(500),
});

export async function createComment(
  postId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = createCommentSchema.safeParse({ content: formData.get('content') });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revise o comentário.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_comment', {
    p_post_id: postId,
    p_content: parsed.data.content,
  });
  if (error) return { ok: false, message: 'Não consegui comentar agora — tenta de novo.' };

  revalidatePath('/comunidade');
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('delete_comment', { p_comment_id: commentId });
  revalidatePath('/comunidade');
}
