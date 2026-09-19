import { createClient } from '@/lib/supabase/server';
import type { MessageRpcRow } from '@/types/database.types';

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  editedAt: string | null;
  isOwn: boolean;
}

function mapMessage(row: MessageRpcRow): ChatMessage {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name ?? 'Sem nome',
    authorAvatarUrl: row.author_avatar_url,
    content: row.content,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    isOwn: row.is_own,
  };
}

/**
 * Chat de grupo (Fase 4) — `list_messages` exige ser membro da comunidade
 * (`is_community_member`); sem Supabase Realtime (decisão da Fase 0), quem
 * atualiza a lista periodicamente é o componente cliente, chamando esta
 * função de novo a cada poucos segundos enquanto a tela está aberta.
 */
export async function listMessages(communityId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_messages', {
    p_community_id: communityId,
    p_limit: 50,
  });
  if (error || !data) return [];
  // A RPC devolve mais recente primeiro (mesmo padrão do feed) — o chat lê de cima pra baixo.
  return data.map(mapMessage).reverse();
}
