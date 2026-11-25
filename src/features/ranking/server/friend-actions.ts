'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUsers } from '@/lib/push/send';

export interface SchoolmateResult {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  className: string | null;
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  isFollowing: boolean;
}

export async function searchSchoolmates(query: string): Promise<SchoolmateResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_schoolmates', { p_query: query });
  if (error || !data) return [];

  // `follows` (Nexa Community, Fase 0) não tem RPC própria de leitura — a
  // policy já libera `select` pra qualquer autenticado (ver comentário na
  // migração), então uma consulta direta basta.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const followingIds = new Set<string>();
  if (user) {
    const ids = data.map((r) => r.user_id);
    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', ids);
    for (const row of followRows ?? []) followingIds.add(row.following_id);
  }

  return data.map((r) => ({
    userId: r.user_id,
    fullName: r.full_name ?? 'Sem nome',
    avatarUrl: r.avatar_url,
    className: r.class_name,
    friendshipStatus: r.friendship_status,
    isFollowing: followingIds.has(r.user_id),
  }));
}

export type SendFriendRequestResult =
  'pending' | 'accepted' | 'already_pending' | 'already_friends';

export async function sendFriendRequest(addresseeId: string): Promise<SendFriendRequestResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('send_friend_request', {
    p_addressee_id: addresseeId,
  });
  revalidatePath('/ranking');
  if (error) throw new Error(error.message);
  return data as SendFriendRequestResult;
}

export async function respondFriendRequest(requesterId: string, accept: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('respond_friend_request', {
    p_requester_id: requesterId,
    p_accept: accept,
  });
  revalidatePath('/ranking');
  if (error) throw new Error(error.message);

  // Quem pediu já sabe o destinatário (é o próprio argumento) — diferente de
  // `notify_subject_students`/`notify_class`, não precisa que o banco devolva
  // uma lista de ids pra saber pra quem mandar push.
  if (accept) {
    await sendPushToUsers([requesterId], {
      title: 'Pedido de amizade aceito',
      body: 'Você tem um novo amigo no ranking.',
      link: '/ranking',
    });
  }
}

export async function removeFriend(otherId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('remove_friend', { p_other_id: otherId });
  revalidatePath('/ranking');
  if (error) throw new Error(error.message);
}
