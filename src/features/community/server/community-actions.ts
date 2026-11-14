'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import {
  getCommunity,
  listCommunities,
  listCommunityMembers,
  type CommunityDetail,
  type CommunityMember,
  type CommunitySummary,
} from './community-queries';
import { listCommunityFeed } from './feed-queries';
import type { FeedPost } from './feed-queries';

/** Wrappers de Server Action — `*-queries.ts` não são `'use server'` (usados também de Server Components). */
export async function getCommunitiesList(query?: string): Promise<CommunitySummary[]> {
  return listCommunities(query);
}

export async function getCommunityDetail(communityId: string): Promise<CommunityDetail | null> {
  return getCommunity(communityId);
}

export async function getCommunityMembersList(communityId: string): Promise<CommunityMember[]> {
  return listCommunityMembers(communityId);
}

export async function getCommunityFeed(communityId: string): Promise<FeedPost[]> {
  return listCommunityFeed(communityId);
}

const createCommunitySchema = z.object({
  name: z.string().trim().min(2, 'Dê um nome à comunidade.').max(60),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  visibility: z.enum(['public', 'school', 'private']),
});

export type CreateCommunityState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; communityId: string };

export async function createCommunity(
  _prev: CreateCommunityState,
  formData: FormData,
): Promise<CreateCommunityState> {
  if (!(await isFeatureEnabled('community_enabled'))) {
    return { status: 'error', message: 'A Comunidade ainda não está disponível.' };
  }

  const parsed = createCommunitySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || '',
    visibility: formData.get('visibility'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_community', {
    p_name: parsed.data.name,
    p_description: parsed.data.description || null,
    p_visibility: parsed.data.visibility,
  });
  if (error || !data) return { status: 'error', message: 'Não consegui criar a comunidade agora.' };

  revalidatePath('/comunidade');
  return { status: 'ok', communityId: data };
}

export async function joinCommunity(communityId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('join_community', { p_community_id: communityId });
  if (error) return { ok: false, message: 'Não consegui entrar nessa comunidade.' };
  revalidatePath('/comunidade');
  return { ok: true };
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('leave_community', { p_community_id: communityId });
  revalidatePath('/comunidade');
}

export async function deleteCommunity(communityId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('delete_community', { p_community_id: communityId });
  revalidatePath('/comunidade');
}

export async function setMemberRole(
  communityId: string,
  userId: string,
  role: 'member' | 'moderator',
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('set_member_role', { p_community_id: communityId, p_user_id: userId, p_role: role });
  revalidatePath('/comunidade');
}

export async function removeMember(communityId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('remove_member', { p_community_id: communityId, p_user_id: userId });
  revalidatePath('/comunidade');
}

const createCommunityPostSchema = z.object({
  content: z.string().trim().min(1, 'Escreva algo antes de publicar.').max(2000),
});

export async function createCommunityPost(
  communityId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await isFeatureEnabled('posts_enabled'))) {
    return { ok: false, message: 'O feed da Comunidade ainda não está disponível.' };
  }

  const parsed = createCommunityPostSchema.safeParse({ content: formData.get('content') });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revise o post.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_post', {
    p_content: parsed.data.content,
    p_visibility: 'school',
    p_community_id: communityId,
  });
  if (error) return { ok: false, message: 'Não consegui publicar agora — tenta de novo.' };

  revalidatePath('/comunidade');
  return { ok: true };
}
