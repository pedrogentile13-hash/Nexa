import { createClient } from '@/lib/supabase/server';

/**
 * Leituras da NexaAI.
 *
 * Estrutura pronta, sem provedor de IA ligado ainda (falta a chave — decisão
 * do usuário, fora do código). Sessões e mensagens são reais e persistem
 * normalmente; só a resposta do "assistente" é fixa por enquanto.
 */

export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export async function getChatSessions(userId: string): Promise<ChatSessionSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_chat_sessions')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at');

  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}
