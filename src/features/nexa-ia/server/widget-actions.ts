'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getChatMessages, getChatSessions, type ChatMessage, type ChatSessionSummary } from './queries';

/**
 * Balão flutuante da NexaAI. Mesmas tabelas do chat da página (histórico é um
 * só), mas as ações DEVOLVEM os dados em vez de redirecionar, porque o balão
 * vive em cima de qualquer tela.
 */

export type WidgetReply =
  | { ok: true; sessionId: string; messages: ChatMessage[] }
  | { ok: false; message: string };

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function widgetHistory(): Promise<ChatSessionSummary[]> {
  const { user } = await me();
  return user ? getChatSessions(user.id) : [];
}

export async function widgetOpenSession(sessionId: string): Promise<ChatMessage[]> {
  if (!z.string().uuid().safeParse(sessionId).success) return [];
  // RLS já limita a mensagens da própria sessão.
  return getChatMessages(sessionId);
}
