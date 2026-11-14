import { createClient } from '@/lib/supabase/server';

export interface MyTeacher {
  teacherId: string;
  fullName: string;
  subjects: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'bot' | 'teacher';
  content: string;
  status: 'answered' | 'unanswered' | 'resolved' | null;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string | null;
  active: boolean;
  className: string | null;
}

export interface PendingQuestion {
  messageId: string;
  studentName: string;
  question: string | null;
  askedAt: string;
}

/**
 * Antes do SQL do chat rodar, as funções não existem e o PostgREST responde
 * erro (sem lançar). Todas as leituras abaixo tratam isso como "vazio" — a tela
 * abre com o estado vazio em vez de quebrar.
 */

export async function listMyTeachers(): Promise<MyTeacher[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('my_teachers');
  if (error || !data) return [];
  return data.map((t) => ({ teacherId: t.teacher_id, fullName: t.full_name, subjects: t.subjects }));
}

export async function getConversation(teacherId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: conv } = await supabase
    .from('bot_conversations')
    .select('id')
    .eq('student_id', user.id)
    .eq('teacher_id', teacherId)
    .maybeSingle();
  if (!conv) return [];

  const { data } = await supabase
    .from('bot_messages')
    .select('id, sender, content, status, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at')
    .limit(300);

  return (data ?? []).map((m) => ({
    id: m.id,
    sender: m.sender,
    content: m.content,
    status: m.status,
    createdAt: m.created_at,
  }));
}

export async function listMyFaq(): Promise<FaqItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('teacher_faq')
    .select('id, question, answer, keywords, active, classes(name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });
  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string; question: string; answer: string; keywords: string | null; active: boolean; classes: { name: string } | null;
  }>).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    keywords: f.keywords,
    active: f.active,
    className: f.classes?.name ?? null,
  }));
}

export async function listPendingQuestions(): Promise<PendingQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('my_pending_questions');
  if (error || !data) return [];
  return data.map((q) => ({
    messageId: q.message_id,
    studentName: q.student_name,
    question: q.question,
    askedAt: q.asked_at,
  }));
}
