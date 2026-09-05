import { createClient } from '@/lib/supabase/server';
import type { AdminIdentity } from './guard';
import type { Difficulty, ResourceKind } from '@/types/database.types';

/**
 * Leituras do painel.
 *
 * Nenhuma delas filtra por escola no TypeScript: a RLS já devolve exatamente o
 * que este administrador pode ver. Filtrar de novo aqui daria a impressão de
 * duas defesas quando é uma só — e a que vale é a do banco, porque é a única
 * que continua valendo quando alguém chama a API por fora do app.
 */

export interface AdminOverview {
  publishedByKind: { kind: ResourceKind; count: number }[];
  draftCount: number;
  schoolCount: number;
  subjectCount: number;
  topicCount: number;
  trackCount: number;
  questionCount: number;
  recent: {
    id: string;
    title: string;
    kind: ResourceKind;
    isPublished: boolean;
    updatedAt: string;
  }[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();

  const [resourcesRes, schoolsRes, subjectsRes, topicsRes, tracksRes, questionsRes, recentRes] =
    await Promise.all([
      supabase.from('resources').select('kind, is_published'),
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      supabase.from('subject_catalog').select('id', { count: 'exact', head: true }),
      supabase.from('content_topics').select('id', { count: 'exact', head: true }),
      supabase.from('tracks').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase
        .from('resources')
        .select('id, title, kind, is_published, updated_at')
        .order('updated_at', { ascending: false })
        .limit(8),
    ]);

  const counts = new Map<ResourceKind, number>();
  let draftCount = 0;
  for (const row of resourcesRes.data ?? []) {
    if (!row.is_published) {
      draftCount += 1;
      continue;
    }
    counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
  }

  return {
    publishedByKind: [...counts.entries()].map(([kind, count]) => ({ kind, count })),
    draftCount,
    schoolCount: schoolsRes.count ?? 0,
    subjectCount: subjectsRes.count ?? 0,
    topicCount: topicsRes.count ?? 0,
    trackCount: tracksRes.count ?? 0,
    questionCount: questionsRes.count ?? 0,
    recent: (recentRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      isPublished: r.is_published,
      updatedAt: r.updated_at,
    })),
  };
}

export interface AdminSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  isVerified: boolean;
  resourceCount: number;
  studentCount: number;
}

export async function listSchools(): Promise<AdminSchool[]> {
  const supabase = await createClient();

  const [schoolsRes, resourcesRes, profilesRes] = await Promise.all([
    supabase.from('schools').select('id, name, city, state, is_verified').order('name'),
    supabase.from('resources').select('school_id'),
    supabase.from('profiles').select('school_id'),
  ]);

  const resourceBySchool = new Map<string, number>();
  for (const row of resourcesRes.data ?? []) {
    if (row.school_id)
      resourceBySchool.set(row.school_id, (resourceBySchool.get(row.school_id) ?? 0) + 1);
  }
  const studentsBySchool = new Map<string, number>();
  for (const row of profilesRes.data ?? []) {
    if (row.school_id)
      studentsBySchool.set(row.school_id, (studentsBySchool.get(row.school_id) ?? 0) + 1);
  }

  return (schoolsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    isVerified: s.is_verified,
    resourceCount: resourceBySchool.get(s.id) ?? 0,
    studentCount: studentsBySchool.get(s.id) ?? 0,
  }));
}

export interface AdminSubject {
  id: string;
  slug: string;
  name: string;
  area: string;
  defaultColor: string;
  defaultIcon: string;
  isActive: boolean;
  sortOrder: number;
  topics: { id: string; name: string; slug: string; schoolId: string | null; sortOrder: number }[];
}

export async function listSubjectsWithTopics(): Promise<AdminSubject[]> {
  const supabase = await createClient();

  const [catalogRes, topicsRes] = await Promise.all([
    supabase
      .from('subject_catalog')
      .select('id, slug, name, area, default_color, default_icon, is_active, sort_order')
      .order('sort_order'),
    supabase
      .from('content_topics')
      .select('id, name, slug, school_id, sort_order, subject_catalog_id')
      .order('sort_order'),
  ]);

  const topicsBySubject = new Map<string, AdminSubject['topics']>();
  for (const t of topicsRes.data ?? []) {
    const list = topicsBySubject.get(t.subject_catalog_id) ?? [];
    list.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      schoolId: t.school_id,
      sortOrder: t.sort_order,
    });
    topicsBySubject.set(t.subject_catalog_id, list);
  }

  return (catalogRes.data ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    area: s.area,
    defaultColor: s.default_color,
    defaultIcon: s.default_icon,
    isActive: s.is_active,
    sortOrder: s.sort_order,
    topics: topicsBySubject.get(s.id) ?? [],
  }));
}

export interface AdminResource {
  id: string;
  kind: ResourceKind;
  title: string;
  subtitle: string | null;
  subjectName: string;
  subjectColor: string;
  topicName: string | null;
  schoolId: string | null;
  schoolName: string | null;
  isPublished: boolean;
  difficulty: Difficulty;
  durationSeconds: number | null;
  questionCount: number;
  updatedAt: string;
}

export interface ResourceFilters {
  kind?: ResourceKind | 'todos';
  subjectId?: string;
  schoolId?: string;
  status?: 'todos' | 'publicado' | 'rascunho';
  search?: string;
}

export async function listResources(filters: ResourceFilters = {}): Promise<AdminResource[]> {
  const supabase = await createClient();

  let query = supabase
    .from('resources')
    // Literal única, sem concatenação: o postgrest-js infere o tipo do
    // resultado a partir do TEXTO do select, e uma soma de strings vira
    // `string` genérico — aí a linha inteira resolve para erro em vez de linha.
    .select(
      'id, kind, title, subtitle, school_id, is_published, difficulty, duration_seconds, updated_at, subject_catalog(name, default_color), content_topics(name), schools(name)',
    )
    .order('updated_at', { ascending: false })
    .limit(200);

  if (filters.kind && filters.kind !== 'todos') query = query.eq('kind', filters.kind);
  if (filters.subjectId) query = query.eq('subject_catalog_id', filters.subjectId);
  if (filters.schoolId === 'global') query = query.is('school_id', null);
  else if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
  if (filters.status === 'publicado') query = query.eq('is_published', true);
  if (filters.status === 'rascunho') query = query.eq('is_published', false);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  const [{ data }, questionsRes] = await Promise.all([
    query,
    supabase.from('questions').select('resource_id'),
  ]);

  const questionCount = new Map<string, number>();
  for (const q of questionsRes.data ?? []) {
    questionCount.set(q.resource_id, (questionCount.get(q.resource_id) ?? 0) + 1);
  }

  return (data ?? []).map((r) => {
    const subject = r.subject_catalog as unknown as { name: string; default_color: string } | null;
    const topic = r.content_topics as unknown as { name: string } | null;
    const school = r.schools as unknown as { name: string } | null;
    return {
      id: r.id,
      kind: r.kind,
      title: r.title,
      subtitle: r.subtitle,
      subjectName: subject?.name ?? '—',
      subjectColor: subject?.default_color ?? 'blue',
      topicName: topic?.name ?? null,
      schoolId: r.school_id,
      schoolName: school?.name ?? null,
      isPublished: r.is_published,
      difficulty: r.difficulty,
      durationSeconds: r.duration_seconds,
      questionCount: questionCount.get(r.id) ?? 0,
      updatedAt: r.updated_at,
    };
  });
}

/** Tudo que o formulário de conteúdo precisa para montar os seletores. */
export interface ResourceFormOptions {
  subjects: { id: string; name: string; slug: string }[];
  topics: { id: string; name: string; subjectId: string; schoolId: string | null }[];
  schools: { id: string; name: string }[];
}

export async function getResourceFormOptions(
  identity: AdminIdentity,
): Promise<ResourceFormOptions> {
  const supabase = await createClient();

  const [subjectsRes, topicsRes, schoolsRes] = await Promise.all([
    supabase
      .from('subject_catalog')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('content_topics')
      .select('id, name, subject_catalog_id, school_id')
      .order('sort_order'),
    identity.isGlobal
      ? supabase.from('schools').select('id, name').order('name')
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  return {
    subjects: subjectsRes.data ?? [],
    topics: (topicsRes.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      subjectId: t.subject_catalog_id,
      schoolId: t.school_id,
    })),
    schools: schoolsRes.data ?? [],
  };
}

export async function getResource(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('resources').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function getResourceQuestions(resourceId: string) {
  const supabase = await createClient();

  // Aqui o gabarito PODE ser lido: quem chega nesta tela é admin, e a RLS de
  // `questions`/`question_options` só libera para ele.
  const { data } = await supabase
    .from('questions')
    .select('id, position, statement, explanation, difficulty, points, topic_id')
    .eq('resource_id', resourceId)
    .order('position');

  const ids = (data ?? []).map((q) => q.id);
  const { data: options } = ids.length
    ? await supabase
        .from('question_options')
        .select('id, question_id, position, body, is_correct')
        .in('question_id', ids)
        .order('position')
    : { data: [] };

  return (data ?? []).map((q) => ({
    ...q,
    options: (options ?? []).filter((o) => o.question_id === q.id),
  }));
}

export interface AdminTrack {
  id: string;
  title: string;
  description: string | null;
  subjectName: string;
  schoolName: string | null;
  isPublished: boolean;
  lessonCount: number;
}

export async function listTracks(): Promise<AdminTrack[]> {
  const supabase = await createClient();

  const [tracksRes, lessonsRes] = await Promise.all([
    supabase
      .from('tracks')
      .select('id, title, description, is_published, subject_catalog(name), schools(name)')
      .order('sort_order'),
    supabase.from('v_track_lessons_resolved').select('track_id'),
  ]);

  const lessonCount = new Map<string, number>();
  for (const l of lessonsRes.data ?? []) {
    lessonCount.set(l.track_id, (lessonCount.get(l.track_id) ?? 0) + 1);
  }

  return (tracksRes.data ?? []).map((t) => {
    const subject = t.subject_catalog as unknown as { name: string } | null;
    const school = t.schools as unknown as { name: string } | null;
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      subjectName: subject?.name ?? '—',
      schoolName: school?.name ?? null,
      isPublished: t.is_published,
      lessonCount: lessonCount.get(t.id) ?? 0,
    };
  });
}

export async function getTrackDetail(trackId: string) {
  const supabase = await createClient();

  const [trackRes, sectionsRes, lessonsRes, linksRes, resourcesRes] = await Promise.all([
    supabase
      .from('tracks')
      .select(
        'id, title, description, is_published, subject_catalog_id, school_id, subject_catalog(name)',
      )
      .eq('id', trackId)
      .maybeSingle(),
    supabase
      .from('track_sections')
      .select('id, position, title')
      .eq('track_id', trackId)
      .order('position'),
    supabase.from('track_lessons').select('*').order('position'),
    supabase.from('track_lesson_resources').select('*').order('position'),
    supabase.from('resources').select('id, title, kind').order('title'),
  ]);

  const sectionIds = new Set((sectionsRes.data ?? []).map((s) => s.id));
  const lessons = (lessonsRes.data ?? []).filter((l) => sectionIds.has(l.section_id));
  const lessonIds = new Set(lessons.map((l) => l.id));

  return {
    track: trackRes.data,
    sections: sectionsRes.data ?? [],
    lessons,
    links: (linksRes.data ?? []).filter((l) => lessonIds.has(l.lesson_id)),
    resources: resourcesRes.data ?? [],
  };
}

export interface AdminPerson {
  id: string;
  fullName: string | null;
  role: string;
  schoolId: string | null;
  schoolName: string | null;
  createdAt: string;
}

export async function listPeople(search?: string): Promise<AdminPerson[]> {
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, school_id, created_at, schools(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search) query = query.ilike('full_name', `%${search}%`);

  const { data } = await query;

  return (data ?? []).map((p) => {
    const school = p.schools as unknown as { name: string } | null;
    return {
      id: p.id,
      fullName: p.full_name,
      role: p.role,
      schoolId: p.school_id,
      schoolName: school?.name ?? null,
      createdAt: p.created_at,
    };
  });
}
