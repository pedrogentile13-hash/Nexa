import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Porta da área do professor.
 *
 * Mesmo raciocínio de `admin/server/guard.ts`: a RLS já recusaria cada
 * escrita de quem não é `teacher_admin`, mas quem não é professor não deve
 * nem VER `/professor`. Um professor é sempre de UMA escola (a da própria
 * `profiles.school_id`) — diferente do admin, não existe versão "global".
 */

export interface TeacherIdentity {
  userId: string;
  schoolId: string;
  schoolName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface TeacherAssignment {
  id: string;
  subjectCatalogId: string;
  subjectName: string;
  classId: string;
  className: string;
}

export const getTeacherIdentity = cache(async (): Promise<TeacherIdentity | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role, school_id, full_name, avatar_url, schools(name)')
    .eq('id', user.id)
    .maybeSingle();

  if (!data || data.role !== 'teacher_admin' || !data.school_id) return null;

  const school = data.schools as unknown as { name: string } | null;

  return {
    userId: user.id,
    schoolId: data.school_id,
    schoolName: school?.name ?? null,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
  };
});

/** Versão que corta o render. Use em toda page e Server Action de `/professor`. */
export async function requireTeacher(): Promise<TeacherIdentity> {
  const identity = await getTeacherIdentity();
  if (!identity) redirect('/hoje');
  return identity;
}

/** As matérias+turmas atribuídas ao professor — a base de tudo que ele vê. */
export const getTeacherAssignments = cache(
  async (teacherId: string): Promise<TeacherAssignment[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('teacher_assignments')
      .select('id, subject_catalog_id, class_id, subject_catalog(name), classes(name)')
      .eq('teacher_id', teacherId)
      .order('created_at');

    return (data ?? []).map((row) => {
      const subject = row.subject_catalog as unknown as { name: string } | null;
      const klass = row.classes as unknown as { name: string } | null;
      return {
        id: row.id,
        subjectCatalogId: row.subject_catalog_id,
        subjectName: subject?.name ?? '—',
        classId: row.class_id,
        className: klass?.name ?? '—',
      };
    });
  },
);
