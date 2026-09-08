'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Escritas da Nexa IA.
 *
 * `replyTo` é o único ponto que muda quando existir um provedor de IA de
 * verdade — hoje devolve sempre o mesmo texto fixo em vez de chamar qualquer
 * API, porque a chave ainda não existe (decisão do usuário, não do código).
 */
function replyTo(_userMessage: string): string {
  return 'Nexa IA ainda não está conectada a um provedor de inteligência artificial — assim que estiver, esta resposta vai ser gerada de verdade. Sua pergunta já ficou salva aqui.';
}

function titleFrom(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

/** Sessão vazia, sem mensagem — usada pelo botão "Nova conversa" da lista. */
export async function createChatSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert({ user_id: user.id })
    .select('id')
    .single();
  if (error) return;

  redirect(`/nexa-ia?sessao=${data.id}`);
}

const sendMessageSchema = z.object({
  // Vazio = ainda não existe conversa selecionada; cria uma na hora.
  sessionId: z.string().uuid().or(z.literal('')),
  content: z.string().trim().min(1, 'Escreva algo antes de enviar.').max(2000),
});

export type SendMessageState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; message: string };

export async function sendMessage(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const parsed = sendMessageSchema.safeParse({
    sessionId: formData.get('sessionId') ?? '',
    content: formData.get('content'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise a mensagem.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const { content } = parsed.data;
  let sessionId = parsed.data.sessionId;
  let isNewSession = false;

  if (!sessionId) {
    const { data: created, error } = await supabase
      .from('ai_chat_sessions')
      .insert({ user_id: user.id, title: titleFrom(content) })
      .select('id')
      .single();
    if (error || !created) return { status: 'error', message: 'Não consegui iniciar a conversa.' };
    sessionId = created.id;
    isNewSession = true;
  }

  const { error: userError } = await supabase
    .from('ai_chat_messages')
    .insert({ session_id: sessionId, role: 'user', content });
  if (userError) return { status: 'error', message: 'Não consegui enviar sua mensagem.' };

  await supabase
    .from('ai_chat_messages')
    .insert({ session_id: sessionId, role: 'assistant', content: replyTo(content) });

  if (!isNewSession) {
    await supabase
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  revalidatePath('/nexa-ia');
  if (isNewSession) redirect(`/nexa-ia?sessao=${sessionId}`);
  return { status: 'sent' };
}
