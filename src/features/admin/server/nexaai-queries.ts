import { createClient } from '@/lib/supabase/server';
import { getTeacherAssignments } from '@/features/teacher/server/guard';
import { getTeacherRoster, teacherClassOptions, teacherSubjectOptions } from '@/features/teacher/server/queries';
import { listAllClasses, listPeople, listSchools } from './queries';
import type { ContentIdentity } from './guard';

/**
 * Opções/busca da NexaAI de admin/professor — sempre a partir da mesma
 * `ContentIdentity` normalizada de `requireContentManager()`. Nada aqui é
 * consulta nova de baixo nível: cada ramo reaproveita o que já existe
 * (`listAllClasses`/`listPeople` do lado admin, `getTeacherAssignments`/
 * `getTeacherRoster`/`teacher*Options` do lado professor) — só decide QUAL
 * chamar de acordo com `identity.kind`.
 */

export interface NexaAiOptions {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string; schoolName: string | null }[];
  /** Já definida (school_admin/professor) ou `null` — admin geral escolhe entre `schools` abaixo. */
  schoolId: string | null;
  /** Só preenchida pro admin geral (`isGlobal`) — os outros já têm escola fixa. */
  schools: { id: string; name: string }[];
}

export async function getNexaAiOptions(identity: ContentIdentity): Promise<NexaAiOptions> {
  if (identity.kind === 'teacher') {
    const assignments = await getTeacherAssignments(identity.userId);
    return {
      subjects: teacherSubjectOptions(assignments),
      classes: teacherClassOptions(assignments).map((c) => ({ ...c, schoolName: null })),
      schoolId: identity.schoolId,
      schools: [],
    };
  }

  const supabase = await createClient();
  const [{ data: subjects }, classes, schools] = await Promise.all([
    supabase.from('subject_catalog').select('id, name').eq('is_active', true).order('sort_order'),
    listAllClasses(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return {
    subjects: subjects ?? [],
    classes,
    schoolId: identity.schoolId,
    schools: schools.map((s) => ({ id: s.id, name: s.name })),
  };
}

export interface NexaAiStudentOption {
  id: string;
  fullName: string | null;
  subtitle: string;
}

export async function searchStudentsForAi(
  identity: ContentIdentity,
  query: string,
): Promise<NexaAiStudentOption[]> {
  if (identity.kind === 'teacher') {
    const assignments = await getTeacherAssignments(identity.userId);
    const roster = await getTeacherRoster(assignments, identity.schoolId ?? '');
    const q = query.trim().toLowerCase();
    return roster
      .filter((s) => !q || (s.fullName ?? '').toLowerCase().includes(q))
      .slice(0, 20)
      .map((s) => ({ id: s.id, fullName: s.fullName, subtitle: s.className }));
  }

  const people = await listPeople(query || undefined, identity.isGlobal ? undefined : (identity.schoolId ?? undefined));
  return people
    .filter((p) => p.role === 'student')
    .slice(0, 20)
    .map((p) => ({ id: p.id, fullName: p.fullName, subtitle: p.schoolName ?? '—' }));
}
