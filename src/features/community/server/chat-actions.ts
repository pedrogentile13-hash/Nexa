'use server';

import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { listMessages, type ChatMessage } from './chat-queries';

/** Wrapper de Server Action — `chat-queries.ts` não é `'use server'`. */
export async function getMessages(communityId: string): Promise<ChatMessage[]> {
  return listMessages(communityId);
}

export async function sendMessage(
  communityId: string,
  content: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await isFeatureEnabled('chat_enabled'))) {
    return { ok: false, message: 'O chat ainda não está disponível.' };
  }
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, message: 'Escreva algo antes de enviar.' };
  if (trimmed.length > 1000) return { ok: false, message: 'Mensagem muito longa (máximo 1000 caracteres).' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('send_message', { p_community_id: communityId, p_content: trimmed });
  if (error) return { ok: false, message: 'Não consegui enviar agora — tenta de novo.' };
  return { ok: true };
}

export async function editMessage(messageId: string, content: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('edit_message', { p_message_id: messageId, p_content: content.trim() });
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('delete_message', { p_message_id: messageId });
}
