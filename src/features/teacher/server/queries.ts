import { createClient } from '@/lib/supabase/server';
import { getAdminStudentReport, type AdminStudentReport } from '@/features/admin/server/queries';
import type { TeacherAssignment, TeacherIdentity } from './guard';

/**
 * Leituras de `/professor`.
 *
 * Mesma disciplina do painel admin: nada filtra por escola/turma/matéria no
 * TypeScript além do que a própria RLS (`is_teacher_of`/`is_teacher_of_student`)
 * já garante — o professor nunca vê linha que a RLS não devolveria de
 * qualquer jeito, mesmo chamando a API por fora do app.
 */

export interface TeacherRosterStudent {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  className: string;
  xp: number;
  level: number;
  currentStreak: number;
  lastActiveLocalDate: string | null;
}

/** Um aluno por turma atribuída ao professor (sem duplicar quem está em mais de uma). */
export async function getTeacherRoster(
  assignments: TeacherAssignment[],
  schoolId: string,
): Promise<TeacherRosterStudent[]> {
  const classIds = [...new Set(assignments.map((a) => a.classId))];
  if (classIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, class_id, classes(name)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .in('class_id', classIds)
    .order('full_name');

  const students = data ?? [];
  const withStats = await Promise.all(
    students.map(async (s) => ({
      s,
      res: await supabase.rpc('admin_user_stats', { p_target_user_id: s.id }),
    })),
  );

  return withStats.map(({ s, res }) => {
    const row = res.data?.[0];
    const klass = s.classes as unknown as { name: string } | null;
    return {
      id: s.id,
      fullName: s.full_name,
      avatarUrl: s.avatar_url,
      className: klass?.name ?? '—',
      xp: row?.xp ?? 0,
      level: row?.level ?? 1,
      currentStreak: row?.current_streak ?? 0,
      lastActiveLocalDate: row?.last_active_local_date ?? null,
    };
  });
}

/** Reaproveita o MESMO relatório do painel admin — `admin_*` já autoriza professor. */
export async function getTeacherStudentReport(studentId: string): Promise<AdminStudentReport | null> {
  return getAdminStudentReport(studentId);
}

/** Nome+id de cada matéria do professor — pra popular o seletor do formulário. */
export function teacherSubjectOptions(assignments: TeacherAssignment[]) {
  const seen = new Map<string, string>();
  for (const a of assignments) seen.set(a.subjectCatalogId, a.subjectName);
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}

export function teacherClassOptions(assignments: TeacherAssignment[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const a of assignments) seen.set(a.classId, a.className);
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}

export function teacherSummary(identity: TeacherIdentity, assignments: TeacherAssignment[]) {
  return {
    schoolName: identity.schoolName,
    subjectCount: teacherSubjectOptions(assignments).length,
    classCount: teacherClassOptions(assignments).length,
  };
}
