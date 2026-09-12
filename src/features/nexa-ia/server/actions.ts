'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getChatMessages } from './queries';

/**
 * Resposta da Nexa IA.
 *
 * Groq é o provedor (troca do Gemini da ADR-039 — chave gratuita, inferência
 * rápida, API compatível com o formato "chat completions" da OpenAI). A
 * chave é opcional em tempo de execução (nunca em `src/lib/env.ts`, que falha
 * o build inteiro se faltar algo) — sem `GROQ_API_KEY`, cai no texto fixo de
 * sempre em vez de derrubar a Nexa IA inteira. O mesmo vale para qualquer erro
 * da chamada (rede, filtro de conteúdo, resposta vazia): a conversa do aluno
 * já está salva de qualquer forma, então uma falha aqui vira uma mensagem
 * educada, nunca uma tela quebrada.
 *
 * `llama-3.3-70b-versatile` saiu do catálogo da Groq (passou a devolver
 * `model_not_found`, visto no painel da própria Groq) — `gpt-oss-120b` é o
 * maior modelo de chat de propósito geral disponível na conta atual.
 */
const GROQ_MODEL = 'openai/gpt-oss-120b';

const SYSTEM_INSTRUCTION = `Você é a Nexa IA, a assistente de estudos do Nexa Study — um app usado por estudantes brasileiros do ensino fundamental e médio.
Responda sempre em português do Brasil, de forma clara, objetiva e didática, como um professor particular paciente.
Foque em ajudar a entender conceitos, resolver dúvidas de matérias escolares e sugerir como estudar — nunca apenas dê a resposta pronta de uma tarefa sem explicar o raciocínio.
Se a pergunta não tiver relação com estudos, responda com educação e traga a conversa de volta para como você pode ajudar nos estudos.
Mantenha as respostas concisas — o aluno está lendo num app, não um livro.`;

/**
 * Contexto do próprio aluno — notas por matéria (`subject_scores`) e os
 * assuntos mais fracos (`topic_mastery`, filtrado a `status = 'revisar'`,
 * top 3 — mais que isso vira ruído, e o pior sempre entra primeiro porque a
 * função já devolve ordenado por `mastery_percent`) — pra Nexa IA parar de
 * ser 100% genérica sem precisar de migration nova: as duas RPCs já existem
 * e já têm `grant execute to authenticated` desde o Loop Nexa/notas
 * automáticas.
 *
 * Falha (rede, RPC fora do ar) vira contexto vazio, nunca erro — a conversa
 * segue genérica em vez de quebrar.
 */
async function buildStudentContext(userId: string): Promise<string> {
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

async function replyTo(sessionId: string, userId: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return 'Nexa IA ainda não está conectada a um provedor de inteligência artificial — assim que estiver, esta resposta vai ser gerada de verdade. Sua pergunta já ficou salva aqui.';
  }

  const studentContext = await buildStudentContext(userId);
  const systemContent = studentContext
    ? `${SYSTEM_INSTRUCTION}\n\nContexto sobre este aluno — use com naturalidade para personalizar a ajuda (por exemplo, relacionando a dúvida a um assunto fraco dele), nunca liste os números como se estivesse lendo um relatório: ${studentContext}`
    : SYSTEM_INSTRUCTION;

  // Histórico da MESMA sessão vira contexto — sem isso, cada mensagem seria
  // uma conversa nova pra IA, e "e sobre o segundo item?" não faria sentido.
  // A mensagem do usuário que motivou esta resposta já foi gravada antes de
  // chegar aqui (ver `sendMessage`), então já está incluída neste histórico —
  // não é acrescentada de novo.
  const history = await getChatMessages(sessionId);
  const messages = [
    { role: 'system' as const, content: systemContent },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    })),
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 1024,
        temperature: 0.6,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Logado (não exposto ao aluno) para dar pra achar a causa real nos
      // logs da função — "não consegui pensar" sozinho não diz se foi chave
      // inválida, modelo descontinuado ou limite de uso.
      console.error('[nexa-ia] Groq respondeu erro', response.status, await response.text());
      return 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? '';

    if (!text.trim()) {
      // `finish_reason: 'content_filter'` é o caso mais comum de vir vazio —
      // a pergunta esbarrou no filtro de conteúdo do próprio provedor.
      return choice?.finish_reason === 'content_filter'
        ? 'Não posso responder isso. Bora voltar para as matérias?'
        : 'Não consegui pensar numa resposta agora — tenta de novo em instantes.';
    }

    return text.trim();
  } catch (err) {
    // Rede caída, timeout (AbortError) ou JSON inesperado — nunca deixa a
    // Server Action estourar por causa de um provedor externo fora do ar.
    console.error('[nexa-ia] falha ao chamar a Groq', err);
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
    .insert({ session_id: sessionId, role: 'assistant', content: await replyTo(sessionId, user.id) });

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
