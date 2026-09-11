import { createClient } from '@/lib/supabase/server';
import type { ResourceKind } from '@/types/database.types';
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
  const classNames = [...new Set(assignments.map((a) => a.className))];
  if (classNames.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, class_name')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .in('class_name', classNames)
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
    return {
      id: s.id,
      fullName: s.full_name,
      avatarUrl: s.avatar_url,
      className: s.class_name ?? '—',
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

export interface TeacherResource {
  id: string;
  kind: ResourceKind;
  title: string;
  subjectName: string;
  isPublished: boolean;
  updatedAt: string;
}

export async function getTeacherContent(assignments: TeacherAssignment[]): Promise<TeacherResource[]> {
  const subjectIds = [...new Set(assignments.map((a) => a.subjectCatalogId))];
  if (subjectIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('resources')
    .select('id, kind, title, is_published, updated_at, subject_catalog(name)')
    .in('subject_catalog_id', subjectIds)
    .order('updated_at', { ascending: false })
    .limit(200);

  return (data ?? []).map((r) => {
    const subject = r.subject_catalog as unknown as { name: string } | null;
    return {
      id: r.id,
      kind: r.kind,
      title: r.title,
      subjectName: subject?.name ?? '—',
      isPublished: r.is_published,
      updatedAt: r.updated_at,
    };
  });
}

export async function getTeacherResource(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('resources').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function getTeacherResourceQuestions(resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('questions')
    .select('id, position, statement, explanation, difficulty, points')
    .eq('resource_id', resourceId)
    .order('position');

  const ids = (data ?? []).map((q) => q.id);
  const { data: optionsData } =
    ids.length > 0
      ? await supabase
          .from('question_options')
          .select('id, question_id, position, body, is_correct')
          .in('question_id', ids)
          .order('position')
      : { data: [] };

  return (data ?? []).map((q) => ({
    ...q,
    options: (optionsData ?? []).filter((o) => o.question_id === q.id),
  }));
}

/** Nome+id de cada matéria do professor — pra popular o seletor do formulário. */
export function teacherSubjectOptions(assignments: TeacherAssignment[]) {
  const seen = new Map<string, string>();
  for (const a of assignments) seen.set(a.subjectCatalogId, a.subjectName);
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}

export function teacherClassOptions(assignments: TeacherAssignment[]): string[] {
  return [...new Set(assignments.map((a) => a.className))];
}

export function teacherSummary(identity: TeacherIdentity, assignments: TeacherAssignment[]) {
  return {
    schoolName: identity.schoolName,
    subjectCount: teacherSubjectOptions(assignments).length,
    classCount: teacherClassOptions(assignments).length,
  };
}
