import { createClient } from '@/lib/supabase/server';
import { listAnnouncements } from '@/features/announcements/server/queries';
import { listPendingQuestions } from '@/features/school-chat/server/queries';
import { getSchoolOverview } from '@/features/school-panel/queries';
import { listPublicationRequests } from '@/features/nexa-ia/server/material-queries';
import type { StaffIdentity } from './guard';

export interface ClassCard {
  id: string;
  name: string;
  students: number;
  active7d: number;
  neverActive: number;
  avgXp: number;
  teachers: string;
}

export async function listClassCards(): Promise<ClassCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('staff_classes_overview');
  if (error || !data) return [];
  return data.map((c) => ({
    id: c.class_id,
    name: c.class_name,
    students: c.student_count,
    active7d: c.active_7d,
    neverActive: c.never_active,
    avgXp: c.avg_xp,
    teachers: c.teachers,
  }));
}

export interface RosterStudent {
  id: string;
  name: string;
  avatarUrl: string | null;
  classId: string;
  className: string;
  login: string | null;
  xp: number;
  level: number;
  streak: number;
  lastActive: string | null;
  weekMinutes: number;
}

export async function listRoster(classId?: string, search?: string): Promise<RosterStudent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('staff_roster', { p_class_id: classId ?? null, p_search: search?.trim() || null });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.user_id,
    name: r.full_name,
    avatarUrl: r.avatar_url,
    classId: r.class_id,
    className: r.class_name,
    login: r.school_login,
    xp: r.xp,
    level: r.level,
    streak: r.current_streak,
    lastActive: r.last_active,
    weekMinutes: r.week_minutes,
  }));
}

export async function listUnassigned(): Promise<{ id: string; name: string; login: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('staff_unassigned_students');
  return (data ?? []).map((s) => ({ id: s.user_id, name: s.full_name, login: s.school_login }));
}

export interface HomeData {
  overview: Awaited<ReturnType<typeof getSchoolOverview>>;
  classes: ClassCard[];
  pendingQuestions: number;
  pendingPublications: number;
  recentNotices: { id: string; title: string; className: string | null; createdAt: string; readCount: number | null; audience: number | null; eventDate: string | null }[];
}

export async function getHome(staff: StaffIdentity): Promise<HomeData> {
  const leader = staff.role !== 'teacher';
  const [overview, classes, pending, publications, notices] = await Promise.all([
    leader && staff.schoolId ? getSchoolOverview(staff.schoolId) : Promise.resolve(null),
    listClassCards(),
    staff.role === 'teacher' ? listPendingQuestions() : Promise.resolve([]),
    leader ? listPublicationRequests('pending') : Promise.resolve([]),
    listAnnouncements(5),
  ]);
  return {
    overview,
    classes,
    pendingQuestions: pending.length,
    pendingPublications: publications.length,
    recentNotices: notices
      .filter((n) => n.canManage)
      .slice(0, 4)
      .map((n) => ({ id: n.id, title: n.title, className: n.className, createdAt: n.createdAt, readCount: n.readCount, audience: n.audienceSize, eventDate: null })),
  };
}

export interface TeacherCard {
  id: string;
  name: string;
  faqCount: number;
  pending: number;
  assignments: { id: string; subject: string; className: string }[];
}

/** Professores da escola, com o que lecionam e o estado do bot de cada um. Só coordenação/direção (o banco confere). */
export async function listTeacherCards(schoolId: string): Promise<TeacherCard[]> {
  const supabase = await createClient();
  const [overview, assignments] = await Promise.all([
    getSchoolOverview(schoolId),
    supabase
      .from('teacher_assignments')
      .select('id, teacher_id, subject_catalog(name), classes(name)')
      .eq('school_id', schoolId)
      .order('created_at'),
  ]);

  const byTeacher = new Map<string, TeacherCard['assignments']>();
  for (const a of assignments.data ?? []) {
    const subject = a.subject_catalog as unknown as { name: string } | null;
    const klass = a.classes as unknown as { name: string } | null;
    byTeacher.set(a.teacher_id, [...(byTeacher.get(a.teacher_id) ?? []), { id: a.id, subject: subject?.name ?? '—', className: klass?.name ?? '—' }]);
  }

  return (overview?.teachers ?? []).map((t) => ({
    id: t.teacherId,
    name: t.fullName,
    faqCount: t.faqCount,
    pending: t.pendingCount,
    assignments: byTeacher.get(t.teacherId) ?? [],
  }));
}

export async function listSubjects(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('subject_catalog').select('id, name').eq('is_active', true).order('sort_order');
  return data ?? [];
}
