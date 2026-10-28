'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI, type AIAttachment } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { buildTutorSystemPrompt } from '../tutor';
import { classifyUpload, MAX_FILE_BYTES } from '../lib/material';
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

export async function widgetSend(formData: FormData): Promise<WidgetReply> {
  const parsed = z
    .object({
      sessionId: z.string().uuid().or(z.literal('')),
      content: z.string().trim().max(2000),
    })
    .safeParse({ sessionId: formData.get('sessionId') ?? '', content: formData.get('content') ?? '' });
  if (!parsed.success) return { ok: false, message: 'Revise a mensagem.' };

  const file = formData.get('file');
  const attachedFile = file instanceof File && file.size > 0 ? file : null;
  const content = parsed.data.content || (attachedFile ? 'Explique este arquivo.' : '');
  if (!content) return { ok: false, message: 'Escreva algo antes de enviar.' };

  let attachment: AIAttachment | undefined;
  if (attachedFile) {
    if (!classifyUpload(attachedFile.type) || classifyUpload(attachedFile.type) === 'text') {
      return { ok: false, message: 'Anexe um PDF ou uma imagem (PNG, JPG, WebP).' };
    }
    if (attachedFile.size > MAX_FILE_BYTES) return { ok: false, message: 'Arquivo grande demais (máx. 6 MB).' };
    attachment = { mimeType: attachedFile.type, data: Buffer.from(await attachedFile.arrayBuffer()).toString('base64') };
  }

  const { supabase, user } = await me();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  let sessionId = parsed.data.sessionId;
  if (!sessionId) {
    const { data: created, error } = await supabase
      .from('ai_chat_sessions')
      .insert({ user_id: user.id, title: content.slice(0, 48) })
      .select('id')
      .single();
    if (error || !created) return { ok: false, message: 'Não consegui iniciar a conversa.' };
    sessionId = created.id;
  }

  const stored = attachedFile ? `📎 ${attachedFile.name}\n${content}` : content;
  const { error: insertError } = await supabase.from('ai_chat_messages').insert({ session_id: sessionId, role: 'user', content: stored });
  if (insertError) return { ok: false, message: 'Não consegui enviar sua mensagem.' };

  const quota = await checkAiQuota(supabase, attachment ? 'material' : 'nexa_ia');
  let reply: string;
  if (!quota.ok) {
    reply = quota.message;
  } else {
    const history = await getChatMessages(sessionId);
    const messages = [
      { role: 'system' as const, content: buildTutorSystemPrompt({ mode: 'explicar', journey: null, studentContext: '' }) },
      ...history.map((m, i) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
        // O arquivo só vale para a última pergunta (as anteriores já foram respondidas).
        ...(attachment && i === history.length - 1 ? { attachments: [attachment] } : {}),
      })),
    ];
    const r = await completeWithAI(messages, { maxTokens: 1024, temperature: 0.6, timeoutMs: 40_000 });
    reply = r.ok
      ? r.text
      : r.reason === 'unsupported'
        ? 'Para ler imagens e PDFs eu preciso do Gemini, que está fora do ar agora. Tente de novo em instantes.'
        : r.reason === 'content_filter'
          ? 'Não posso responder isso. Bora voltar para as matérias?'
          : 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
  }

  await supabase.from('ai_chat_messages').insert({ session_id: sessionId, role: 'assistant', content: reply });
  await supabase.from('ai_chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

  return { ok: true, sessionId, messages: await getChatMessages(sessionId) };
}
