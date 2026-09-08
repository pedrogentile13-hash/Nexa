'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getChatMessages } from './queries';

/**
 * Resposta da Nexa IA.
 *
 * Google Gemini é o provedor decidido na ADR-039, mas a chave é opcional em
 * tempo de execução (nunca em `src/lib/env.ts`, que falha o build inteiro se
 * faltar algo) — sem `GEMINI_API_KEY`, cai no texto fixo de sempre em vez de
 * derrubar a Nexa IA inteira. O mesmo vale para qualquer erro da chamada
 * (rede, filtro de segurança, resposta vazia): a conversa do aluno já está
 * salva de qualquer forma, então uma falha aqui vira uma mensagem educada,
 * nunca uma tela quebrada.
 */
const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `Você é a Nexa IA, a assistente de estudos do Nexa Study — um app usado por estudantes brasileiros do ensino fundamental e médio.
Responda sempre em português do Brasil, de forma clara, objetiva e didática, como um professor particular paciente.
Foque em ajudar a entender conceitos, resolver dúvidas de matérias escolares e sugerir como estudar — nunca apenas dê a resposta pronta de uma tarefa sem explicar o raciocínio.
Se a pergunta não tiver relação com estudos, responda com educação e traga a conversa de volta para como você pode ajudar nos estudos.
Mantenha as respostas concisas — o aluno está lendo num app, não um livro.`;

async function replyTo(sessionId: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Nexa IA ainda não está conectada a um provedor de inteligência artificial — assim que estiver, esta resposta vai ser gerada de verdade. Sua pergunta já ficou salva aqui.';
  }

  // Histórico da MESMA sessão vira contexto — sem isso, cada mensagem seria
  // uma conversa nova pra IA, e "e sobre o segundo item?" não faria sentido.
  // A mensagem do usuário que motivou esta resposta já foi gravada antes de
  // chegar aqui (ver `sendMessage`), então já está incluída neste histórico —
  // não é acrescentada de novo.
  const history = await getChatMessages(sessionId);
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: { maxOutputTokens: 1024, temperature: 0.6 },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    if (!text.trim()) {
      // `finishReason: 'SAFETY'` é o caso mais comum de vir vazio — a
      // pergunta esbarrou no filtro de segurança do próprio Gemini.
      return candidate?.finishReason === 'SAFETY'
        ? 'Não posso responder isso. Bora voltar para as matérias?'
        : 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
    }

    return text.trim();
  } catch {
    // Rede caída, timeout (AbortError) ou JSON inesperado — nunca deixa a
    // Server Action estourar por causa de um provedor externo fora do ar.
    return 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
  } finally {
    clearTimeout(timeout);
  }
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
    .insert({ session_id: sessionId, role: 'assistant', content: await replyTo(sessionId) });

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
