'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { matchFaq } from '../lib/match';

/**
 * Chat da escola com o bot do professor.
 *
 * O bot não escreve nada: esta action só ESCOLHE uma entrada da base do
 * professor (`matchFaq`) e entrega o id ao banco, que copia o texto da tabela.
 * Sem entrada boa, a pergunta cai na fila do professor.
 */

export type AskState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'sent' };

const askSchema = z.object({
  teacherId: z.string().uuid(),
  question: z.string().trim().min(2, 'Escreva sua pergunta.').max(1000, 'Pergunta longa demais.'),
});

export async function askTeacherBot(_prev: AskState, formData: FormData): Promise<AskState> {
  const parsed = askSchema.safeParse({
    teacherId: formData.get('teacherId'),
    question: formData.get('question'),
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise a pergunta.' };

  const supabase = await createClient();

  // A RLS já limita a base ao que ESTE aluno pode ver (professor dele, turma dele).
  const { data: faqs } = await supabase
    .from('teacher_faq')
    .select('id, question, keywords')
    .eq('teacher_id', parsed.data.teacherId)
    .eq('active', true);

  const match = matchFaq(
    parsed.data.question,
    (faqs ?? []).map((f) => ({ id: f.id, question: f.question, keywords: f.keywords })),
  );

  const { error } = await supabase.rpc('ask_teacher_bot', {
    p_teacher_id: parsed.data.teacherId,
    p_question: parsed.data.question,
    p_faq_id: match?.faqId ?? null,
  });

  if (error) {
    if (error.code === '54000') return { status: 'error', message: 'Muitas perguntas seguidas. Tente de novo daqui a pouco.' };
    if (error.code === '42501') return { status: 'error', message: 'Este professor não leciona na sua turma.' };
    return { status: 'error', message: 'Não consegui enviar agora. Tente de novo.' };
  }

  revalidatePath(`/chat/${parsed.data.teacherId}`);
  return { status: 'sent' };
}

// ---------------------------------------------------------------- professor --

export type FaqState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'saved' };

const faqSchema = z.object({
  question: z.string().trim().min(3, 'Escreva a pergunta (mín. 3 letras).').max(300),
  answer: z.string().trim().min(1, 'Escreva a resposta.').max(2000),
  keywords: z.string().trim().max(300).optional(),
  classId: z.string().uuid().optional(),
});

export async function saveFaq(_prev: FaqState, formData: FormData): Promise<FaqState> {
  const parsed = faqSchema.safeParse({
    question: formData.get('question'),
    answer: formData.get('answer'),
    keywords: formData.get('keywords') || undefined,
    classId: formData.get('classId') || undefined,
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).maybeSingle();
  if (!profile?.school_id) return { status: 'error', message: 'Seu perfil não está ligado a uma escola.' };

  const { error } = await supabase.from('teacher_faq').insert({
    teacher_id: user.id,
    school_id: profile.school_id,
    class_id: parsed.data.classId ?? null,
    question: parsed.data.question,
    answer: parsed.data.answer,
    keywords: parsed.data.keywords ?? null,
  });
  if (error) {
    return {
      status: 'error',
      message: error.code === '42P01' || error.code === 'PGRST205'
        ? 'Aplique o SQL do chat da escola no Supabase antes de cadastrar respostas.'
        : 'Não consegui salvar. Confira se você leciona nessa turma.',
    };
  }

  revalidatePath('/professor/respostas');
  return { status: 'saved' };
}

export async function toggleFaq(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  const { data } = await supabase.from('teacher_faq').select('active').eq('id', id.data).maybeSingle();
  if (!data) return;
  await supabase.from('teacher_faq').update({ active: !data.active }).eq('id', id.data);
  revalidatePath('/professor/respostas');
}

export async function deleteFaq(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('teacher_faq').delete().eq('id', id.data);
  revalidatePath('/professor/respostas');
}

export async function replyToPending(_prev: FaqState, formData: FormData): Promise<FaqState> {
  const messageId = z.string().uuid().safeParse(formData.get('messageId'));
  const reply = z.string().trim().min(1, 'Escreva a resposta.').max(2000).safeParse(formData.get('reply'));
  if (!messageId.success) return { status: 'error', message: 'Pergunta inválida.' };
  if (!reply.success) return { status: 'error', message: reply.error.issues[0]?.message ?? 'Escreva a resposta.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('reply_unanswered', {
    p_message_id: messageId.data,
    p_reply: reply.data,
    p_save_as_faq: formData.get('saveAsFaq') === 'on',
  });
  if (error) return { status: 'error', message: 'Não consegui enviar. A pergunta pode já ter sido respondida.' };

  revalidatePath('/professor/respostas');
  return { status: 'saved' };
}
