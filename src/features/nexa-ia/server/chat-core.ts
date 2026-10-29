import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI, streamWithAI, type AIAttachment } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { reportError } from '@/features/observability/server/actions';
import { getChatMessages, type ChatMessage } from './queries';
import { maybeCreateFromChat } from './chat-create';
import { checkChatFile, loadDocsMentioned } from './chat-material';
import { docsContextBlock } from '../lib/doc-refs';
import { buildTutorSystemPrompt, parseTutorMode } from '../tutor';

/**
 * Núcleo do chat da NexaAI. Fica FORA de `actions.ts` ('use server') de propósito:
 * tudo que é exportado de lá vira endpoint público, e estas funções recebem ids de usuário.
 */

/**
 * Contexto do próprio aluno — notas por matéria (`subject_scores`) e os
 * assuntos mais fracos (`topic_mastery`, filtrado a `status = 'revisar'`,
 * top 3 — mais que isso vira ruído, e o pior sempre entra primeiro porque a
 * função já devolve ordenado por `mastery_percent`) — pra NexaAI parar de
 * ser 100% genérica sem precisar de migration nova: as duas RPCs já existem
 * e já têm `grant execute to authenticated` desde o Loop Nexa/notas
 * automáticas.
 *
 * Falha (rede, RPC fora do ar) vira contexto vazio, nunca erro — a conversa
 * segue genérica em vez de quebrar.
 */
export async function buildStudentContext(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const [scoresRes, masteryRes] = await Promise.all([
      supabase.rpc('subject_scores', { p_user_id: userId }),
      supabase.rpc('topic_mastery', { p_user_id: userId }),
    ]);

    const scores = (scoresRes.data ?? []).filter((s) => s.blended_score !== null);
    const weakTopics = (masteryRes.data ?? [])
      .filter((t) => t.status === 'revisar')
      .slice(0, 3);

    if (scores.length === 0 && weakTopics.length === 0) return '';

    const lines: string[] = [];
    if (scores.length > 0) {
      lines.push(
        `Notas atuais do aluno (0 a 10): ${scores
          .map((s) => `${s.subject_name} ${s.blended_score?.toFixed(1)}`)
          .join(', ')}.`,
      );
    }
    if (weakTopics.length > 0) {
      lines.push(
        `Assuntos em que o aluno está com mais dificuldade agora: ${weakTopics
          .map((t) => `${t.topic_name} (${t.subject_name}, ${t.mastery_percent}% de acerto recente)`)
          .join(', ')}.`,
      );
    }
    return lines.join(' ');
  } catch {
    return '';
  }
}

export async function readJourney(userId: string): Promise<string | null> {
  // `journey` é coluna nova: se a migração ainda não rodou o PostgREST devolve
  // erro (sem lançar) e o data vem null — tratado como "escola".
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('journey').eq('id', userId).maybeSingle();
  return (data as { journey?: string | null } | null)?.journey ?? null;
}

export function titleFrom(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

export type ChatSendResult =
  | { ok: true; sessionId: string; isNewSession: boolean; assistant: ChatMessage }
  | { ok: false; message: string };

const chatSendSchema = z.object({
  sessionId: z.string().uuid().or(z.literal('')),
  content: z.string().trim().max(2000),
  mode: z.string().optional(),
});

/** `formData`: sessionId, content, mode e (opcional) file — PDF ou imagem anexado. */
export async function runChat(formData: FormData, onDelta?: (text: string) => void): Promise<ChatSendResult> {
  const parsed = chatSendSchema.safeParse({
    sessionId: formData.get('sessionId') ?? '',
    content: formData.get('content') ?? '',
    mode: formData.get('mode') ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: 'Revise a mensagem.' };

  const rawFile = formData.get('file');
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  if (file) {
    const check = checkChatFile(file);
    if (!check.ok) return { ok: false, message: check.message };
  }
  const content = parsed.data.content || (file ? 'Explique este arquivo.' : '');
  if (!content) return { ok: false, message: 'Escreva algo antes de enviar.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const userAt = new Date();
  let sessionId = parsed.data.sessionId;
  const isNewSession = !sessionId;
  const stored = file ? `📎 ${file.name}\n${content}` : content;

  if (isNewSession) {
    const { data: created, error } = await supabase
      .from('ai_chat_sessions')
      .insert({ user_id: user.id, title: titleFrom(content) })
      .select('id')
      .single();
    if (error || !created) return { ok: false, message: 'Não consegui iniciar a conversa.' };
    sessionId = created.id;
  }

  const [quota, history, studentContext, journey, docs] = await Promise.all([
    checkAiQuota(supabase, file ? 'material' : 'nexa_ia'),
    isNewSession ? Promise.resolve([] as ChatMessage[]) : getChatMessages(sessionId),
    buildStudentContext(user.id),
    readJourney(user.id),
    loadDocsMentioned(supabase, content),
  ]);

  let reply: string;
  const created = quota.ok ? await maybeCreateFromChat(supabase, content, { userId: user.id, file }) : null;
  if (created) {
    reply = created;
  } else if (!quota.ok) {
    reply = quota.message;
  } else {
    const mode = parseTutorMode(parsed.data.mode);
    const attachment: AIAttachment | undefined = file
      ? { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()).toString('base64') }
      : undefined;
    const library = docsContextBlock(docs);
    const aiMessages = [
      {
        role: 'system' as const,
        content: [buildTutorSystemPrompt({ mode, journey, studentContext }), library].filter(Boolean).join('\n\n'),
      },
      ...history.map((m) => ({ role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const), content: m.content })),
      { role: 'user' as const, content, ...(attachment ? { attachments: [attachment] } : {}) },
    ];
    const aiOptions = { maxTokens: 1024, temperature: 0.6, timeoutMs: 40_000 };
    const result = onDelta ? await streamWithAI(aiMessages, aiOptions, onDelta) : await completeWithAI(aiMessages, aiOptions);
    if (result.ok) {
      reply = result.text;
    } else if (result.reason === 'missing_api_key') {
      reply = 'NexaAI ainda não está conectada a um provedor de inteligência artificial.';
    } else if (result.reason === 'content_filter') {
      reply = 'Não posso responder isso. Bora voltar para as matérias?';
    } else if (result.reason === 'unsupported') {
      reply = 'Para ler imagens e PDFs eu preciso do Gemini, que está fora do ar agora. Tente de novo em instantes.';
    } else {
      void reportError({
        origin: 'server',
        message: `NexaAI falhou: ${result.reason}${'status' in result ? ` (HTTP ${result.status})` : ''}${'detail' in result && result.detail ? ` — ${result.detail}` : ''}`,
        pathname: '/nexa-ia',
      });
      reply = 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
    }
  }

  const assistantAt = new Date(Math.max(Date.now(), userAt.getTime() + 1));
  const [{ data: rows }] = await Promise.all([
    supabase
      .from('ai_chat_messages')
      .insert([
        { session_id: sessionId, role: 'user', content: stored, created_at: userAt.toISOString() },
        { session_id: sessionId, role: 'assistant', content: reply, created_at: assistantAt.toISOString() },
      ])
      .select('id, role, content, created_at'),
    supabase.from('ai_chat_sessions').update({ updated_at: assistantAt.toISOString() }).eq('id', sessionId),
  ]);

  const saved = rows?.find((r) => r.role === 'assistant');
  return {
    ok: true,
    sessionId,
    isNewSession,
    assistant: {
      id: saved?.id ?? `a-${assistantAt.getTime()}`,
      role: 'assistant',
      content: reply,
      createdAt: saved?.created_at ?? assistantAt.toISOString(),
    },
  };
}
