import { createClient } from '@/lib/supabase/server';

export interface BotTeacher {
  teacherId: string;
  fullName: string;
  classes: string;
  faqCount: number;
  pendingCount: number;
  conversationCount: number;
}

export interface BotFaq {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  className: string | null;
}

export interface BotMessage {
  id: string;
  sender: 'student' | 'bot' | 'teacher';
  content: string;
  status: 'answered' | 'unanswered' | 'resolved' | null;
  createdAt: string;
}

export interface BotConversation {
  id: string;
  studentName: string;
  className: string | null;
  messages: BotMessage[];
}

/**
 * Os bots de cada professor de uma escola — o que a direção/coordenação
 * supervisiona. Tudo passa pela RLS (coordenação para cima da PRÓPRIA escola,
 * ou a plataforma); antes do SQL do chat rodar, as tabelas não existem e as
 * leituras viram "vazio" em vez de erro.
 */
export async function listBotTeachers(schoolId: string): Promise<BotTeacher[]> {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'teacher_admin')
    .order('full_name');
  if (!teachers || teachers.length === 0) return [];

  const ids = teachers.map((t) => t.id);
  const [faqs, convs, assignments] = await Promise.all([
    supabase.from('teacher_faq').select('teacher_id, active').in('teacher_id', ids),
    supabase.from('bot_conversations').select('id, teacher_id').in('teacher_id', ids),
    supabase.from('teacher_assignments').select('teacher_id, classes(name)').in('teacher_id', ids),
  ]);

  const convIds = (convs.data ?? []).map((c) => c.id);
  const pending = convIds.length
    ? await supabase.from('bot_messages').select('conversation_id').in('conversation_id', convIds).eq('status', 'unanswered')
    : { data: [] as { conversation_id: string }[] };

  const teacherOfConv = new Map((convs.data ?? []).map((c) => [c.id, c.teacher_id]));
  const count = (rows: { teacher_id: string }[] | null, pred: (r: never) => boolean = () => true) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) if (pred(r as never)) m.set(r.teacher_id, (m.get(r.teacher_id) ?? 0) + 1);
    return m;
  };
  const faqCount = count(faqs.data as { teacher_id: string; active: boolean }[] | null, (r: { active: boolean }) => r.active);
  const convCount = count(convs.data);
  const pendingCount = new Map<string, number>();
  for (const m of pending.data ?? []) {
    const t = teacherOfConv.get(m.conversation_id);
    if (t) pendingCount.set(t, (pendingCount.get(t) ?? 0) + 1);
  }
  const classNames = new Map<string, Set<string>>();
  for (const a of (assignments.data ?? []) as unknown as { teacher_id: string; classes: { name: string } | null }[]) {
    if (!a.classes) continue;
    (classNames.get(a.teacher_id) ?? classNames.set(a.teacher_id, new Set()).get(a.teacher_id)!).add(a.classes.name);
  }

  return teachers
    .map((t) => ({
      teacherId: t.id,
      fullName: t.full_name ?? 'Professor',
      classes: [...(classNames.get(t.id) ?? [])].sort().join(', '),
      faqCount: faqCount.get(t.id) ?? 0,
      pendingCount: pendingCount.get(t.id) ?? 0,
      conversationCount: convCount.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.pendingCount - a.pendingCount || a.fullName.localeCompare(b.fullName, 'pt-BR'));
}

export async function getBotDetail(teacherId: string): Promise<{
  teacherName: string;
  faqs: BotFaq[];
  conversations: BotConversation[];
} | null> {
  const supabase = await createClient();
  const { data: teacher } = await supabase.from('profiles').select('full_name, role').eq('id', teacherId).maybeSingle();
  if (!teacher || teacher.role !== 'teacher_admin') return null;

  const [faqs, convs] = await Promise.all([
    supabase.from('teacher_faq').select('id, question, answer, active, classes(name)').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
    supabase.from('bot_conversations').select('id, student_id').eq('teacher_id', teacherId).order('created_at', { ascending: false }).limit(40),
  ]);

  const convRows = convs.data ?? [];
  const studentIds = convRows.map((c) => c.student_id);
  const [students, messages] = await Promise.all([
    studentIds.length
      ? supabase.from('profiles').select('id, full_name, classes(name)').in('id', studentIds)
      : Promise.resolve({ data: [] as unknown[] }),
    convRows.length
      ? supabase.from('bot_messages').select('id, conversation_id, sender, content, status, created_at').in('conversation_id', convRows.map((c) => c.id)).order('created_at')
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const studentById = new Map(
    ((students.data ?? []) as { id: string; full_name: string | null; classes: { name: string } | null }[]).map((s) => [s.id, s]),
  );
  const byConv = new Map<string, BotMessage[]>();
  for (const m of (messages.data ?? []) as {
    id: string; conversation_id: string; sender: BotMessage['sender']; content: string; status: BotMessage['status']; created_at: string;
  }[]) {
    (byConv.get(m.conversation_id) ?? byConv.set(m.conversation_id, []).get(m.conversation_id)!).push({
      id: m.id, sender: m.sender, content: m.content, status: m.status, createdAt: m.created_at,
    });
  }

  return {
    teacherName: teacher.full_name ?? 'Professor',
    faqs: ((faqs.data ?? []) as unknown as { id: string; question: string; answer: string; active: boolean; classes: { name: string } | null }[]).map((f) => ({
      id: f.id, question: f.question, answer: f.answer, active: f.active, className: f.classes?.name ?? null,
    })),
    conversations: convRows
      .map((c) => {
        const s = studentById.get(c.student_id);
        return { id: c.id, studentName: s?.full_name ?? 'Aluno', className: s?.classes?.name ?? null, messages: byConv.get(c.id) ?? [] };
      })
      .filter((c) => c.messages.length > 0),
  };
}
