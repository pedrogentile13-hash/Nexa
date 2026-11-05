import { createClient } from '@/lib/supabase/server';

export interface SchoolOverview {
  students: number;
  teachers: number;
  managedAccounts: number;
  studentsWithoutClass: number;
  activeLast7Days: number;
  neverEntered: number;
  pendingQuestions: number;
  upcomingEvents: number;
  aiUsesToday: number;
}

export interface TeacherRow {
  teacherId: string;
  fullName: string;
  classes: string;
  faqCount: number;
  pendingCount: number;
}

/**
 * Visão geral da escola. Antes do SQL do painel rodar (ou para quem não é
 * coordenação), a função não existe/recusa e isto devolve `null` — a tela
 * simplesmente não mostra o bloco, em vez de quebrar.
 */
export async function getSchoolOverview(schoolId: string): Promise<{ overview: SchoolOverview; teachers: TeacherRow[] } | null> {
  const supabase = await createClient();
  const [o, t] = await Promise.all([
    supabase.rpc('school_overview', { p_school_id: schoolId }),
    supabase.rpc('school_teacher_overview', { p_school_id: schoolId }),
  ]);
  const row = o.data?.[0];
  if (o.error || !row) return null;

  return {
    overview: {
      students: row.students,
      teachers: row.teachers,
      managedAccounts: row.managed_accounts,
      studentsWithoutClass: row.students_without_class,
      activeLast7Days: row.active_last_7_days,
      neverEntered: row.never_entered,
      pendingQuestions: row.pending_questions,
      upcomingEvents: row.upcoming_events,
      aiUsesToday: row.ai_uses_today,
    },
    teachers: (t.data ?? []).map((x) => ({
      teacherId: x.teacher_id,
      fullName: x.full_name,
      classes: x.classes,
      faqCount: x.faq_count,
      pendingCount: x.pending_count,
    })),
  };
}
