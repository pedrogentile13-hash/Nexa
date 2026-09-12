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
}

export async function searchSchoolmates(query: string): Promise<SchoolmateResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_schoolmates', { p_query: query });
  if (error || !data) return [];
  return data.map((r) => ({
    userId: r.user_id,
    fullName: r.full_name ?? 'Sem nome',
    avatarUrl: r.avatar_url,
    className: r.class_name,
    friendshipStatus: r.friendship_status,
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
