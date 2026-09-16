import { createClient } from '@/lib/supabase/server';
import type { AdminIdentity, ContentIdentity } from './guard';
import type { Difficulty, ResourceKind, TrackCategory } from '@/types/database.types';
import {
  groupByWeek,
  mapSimuladoAttempt,
  mapSubjectScore,
  weekLabel,
  type ScoreEvolutionPoint,
  type SimuladoAttempt,
  type StudyWeek,
  type SubjectScore,
} from '@/features/performance/server/queries';

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
  contentFormat: 'markdown' | 'pdf' | 'html';
  bimestre: number | null;
}

export interface ResourceFilters {
  kind?: ResourceKind | 'todos';
  /** Uma matéria (seletor do admin) ou várias (professor, restrito às atribuídas a ele). */
  subjectId?: string | string[];
  schoolId?: string;
  status?: 'todos' | 'publicado' | 'rascunho';
  search?: string;
  bimestre?: number;
}

export async function listResources(filters: ResourceFilters = {}): Promise<AdminResource[]> {
  const supabase = await createClient();

  let query = supabase
    .from('resources')
    // Literal única, sem concatenação: o postgrest-js infere o tipo do
    // resultado a partir do TEXTO do select, e uma soma de strings vira
    // `string` genérico — aí a linha inteira resolve para erro em vez de linha.
    .select(
      'id, kind, title, subtitle, school_id, is_published, difficulty, duration_seconds, updated_at, content_format, bimestre, subject_catalog(name, default_color), content_topics(name), schools(name)',
    )
    .order('updated_at', { ascending: false })
    .limit(200);

  if (filters.kind && filters.kind !== 'todos') query = query.eq('kind', filters.kind);
  if (Array.isArray(filters.subjectId)) query = query.in('subject_catalog_id', filters.subjectId);
  else if (filters.subjectId) query = query.eq('subject_catalog_id', filters.subjectId);
  if (filters.schoolId === 'global') query = query.is('school_id', null);
  else if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
  if (filters.status === 'publicado') query = query.eq('is_published', true);
  if (filters.status === 'rascunho') query = query.eq('is_published', false);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  if (filters.bimestre) query = query.eq('bimestre', filters.bimestre);

  const { data } = await query;

  // Só as questões dos recursos que já vieram na página — a tabela de
  // questões cresce sem parar (uma por pergunta de cada simulado/quiz já
  // cadastrado), e trazer ela inteira aqui era o request mais pesado desta
  // tela sem nenhum ganho: no máximo 200 recursos entram no `.limit()` acima.
  const resourceIds = (data ?? []).map((r) => r.id);
  const { data: questionsData } =
    resourceIds.length > 0
      ? await supabase.from('questions').select('resource_id').in('resource_id', resourceIds)
      : { data: [] };

  const questionCount = new Map<string, number>();
  for (const q of questionsData ?? []) {
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
      contentFormat: r.content_format,
      bimestre: r.bimestre,
    };
  });
}

export interface EssayForGrading {
  essayId: string;
  attemptId: string;
  writingTaskId: string;
  writingTaskTitle: string;
  studentName: string | null;
  content: string;
  wordCount: number;
  submittedAt: string | null;
  totalScore: number | null;
  scores: Record<string, number> | null;
  evaluationCriteria: { id: string; name: string; maxScore: number }[];
}

/** Redações entregues de um recurso — usado na tela de correção. */
export async function listEssaysForGrading(resourceId: string): Promise<EssayForGrading[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('list_essays_for_grading', { p_resource_id: resourceId });

  return (data ?? []).map((e) => ({
    essayId: e.essay_id,
    attemptId: e.attempt_id,
    writingTaskId: e.writing_task_id,
    writingTaskTitle: e.writing_task_title,
    studentName: e.student_name,
    content: e.content,
    wordCount: e.word_count,
    submittedAt: e.submitted_at,
    totalScore: e.total_score,
    scores: e.scores,
    evaluationCriteria: e.evaluation_criteria,
  }));
}

/** Tudo que o formulário de conteúdo precisa para montar os seletores. */
export interface ResourceFormOptions {
  subjects: { id: string; name: string; slug: string }[];
  topics: { id: string; name: string; subjectId: string; schoolId: string | null }[];
  schools: { id: string; name: string }[];
}

export async function getResourceFormOptions(
  identity: AdminIdentity | ContentIdentity,
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

  // Professor: a lista de matérias encolhe pra só as atribuídas a ele — o
  // resto da função (tópicos, escolas) não muda, é o mesmo recorte que
  // `assertSubjectAllowed` já reforça na escrita.
  const allowedSubjectIds =
    'allowedSubjectCatalogIds' in identity ? identity.allowedSubjectCatalogIds : 'all';
  const subjects =
    allowedSubjectIds === 'all'
      ? (subjectsRes.data ?? [])
      : (subjectsRes.data ?? []).filter((s) => allowedSubjectIds.includes(s.id));

  return {
    subjects,
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
    .select('id, position, statement, explanation, difficulty, points, topic_id, group_id, resource_refs')
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
  category: TrackCategory;
  isPublished: boolean;
  lessonCount: number;
}

export async function listTracks(): Promise<AdminTrack[]> {
  const supabase = await createClient();

  const [tracksRes, lessonsRes] = await Promise.all([
    supabase
      .from('tracks')
      .select('id, title, description, category, is_published, subject_catalog(name), schools(name)')
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
      category: t.category,
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
    supabase.from('resources').select('id, title, kind, is_published').order('title'),
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

export async function listPeople(search?: string, schoolId?: string): Promise<AdminPerson[]> {
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, school_id, created_at, schools(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search) query = query.ilike('full_name', `%${search}%`);
  if (schoolId) query = query.eq('school_id', schoolId);

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

/** Um único perfil administrado — base do relatório individual e da checagem de escola. */
export async function getPersonById(userId: string): Promise<AdminPerson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, school_id, created_at, schools(name)')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;
  const school = data.schools as unknown as { name: string } | null;
  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    schoolId: data.school_id,
    schoolName: school?.name ?? null,
    createdAt: data.created_at,
  };
}

// ------------------------------------------------------------ professores --

export interface AdminTeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string | null;
  schoolId: string;
  schoolName: string | null;
  subjectCatalogId: string;
  subjectName: string;
  classId: string;
  className: string;
}

/** Todo vínculo professor→matéria+turma que este admin pode gerenciar (a RLS já escopa por escola). */
export async function listTeacherAssignments(): Promise<AdminTeacherAssignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('teacher_assignments')
    .select(
      'id, teacher_id, school_id, subject_catalog_id, class_id, profiles(full_name), schools(name), subject_catalog(name), classes(name)',
    )
    .order('created_at');

  return (data ?? []).map((row) => {
    const teacher = row.profiles as unknown as { full_name: string | null } | null;
    const school = row.schools as unknown as { name: string } | null;
    const subject = row.subject_catalog as unknown as { name: string } | null;
    const klass = row.classes as unknown as { name: string } | null;
    return {
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: teacher?.full_name ?? null,
      schoolId: row.school_id,
      schoolName: school?.name ?? null,
      subjectCatalogId: row.subject_catalog_id,
      subjectName: subject?.name ?? '—',
      classId: row.class_id,
      className: klass?.name ?? '—',
    };
  });
}

export interface AdminClassOption {
  id: string;
  name: string;
  schoolName: string | null;
}

/** Todas as turmas de todas as escolas — só pro admin geral (escolhe a escola no próprio formulário). */
export async function listAllClasses(): Promise<AdminClassOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('classes').select('id, name, schools(name)').order('name');

  return (data ?? []).map((row) => {
    const school = row.schools as unknown as { name: string } | null;
    return { id: row.id, name: row.name, schoolName: school?.name ?? null };
  });
}

export interface AdminClass {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string | null;
  studentCount: number;
}

/** CRUD de `/admin/turmas` — a RLS já restringe school_admin à própria escola. */
export async function listClasses(): Promise<AdminClass[]> {
  const supabase = await createClient();
  const [{ data }, { data: studentCounts }] = await Promise.all([
    supabase.from('classes').select('id, name, school_id, schools(name)').order('name'),
    supabase.from('profiles').select('class_id').eq('role', 'student').not('class_id', 'is', null),
  ]);

  const countByClass = new Map<string, number>();
  for (const row of studentCounts ?? []) {
    if (row.class_id) countByClass.set(row.class_id, (countByClass.get(row.class_id) ?? 0) + 1);
  }

  return (data ?? []).map((row) => {
    const school = row.schools as unknown as { name: string } | null;
    return {
      id: row.id,
      name: row.name,
      schoolId: row.school_id,
      schoolName: school?.name ?? null,
      studentCount: countByClass.get(row.id) ?? 0,
    };
  });
}

/** Só os professores (papel `teacher_admin`) — pra popular o seletor do formulário de atribuição. */
export async function listTeachers(schoolId?: string): Promise<AdminPerson[]> {
  const supabase = await createClient();
  let query = supabase
    .from('profiles')
    .select('id, full_name, role, school_id, created_at, schools(name)')
    .eq('role', 'teacher_admin')
    .order('full_name');

  if (schoolId) query = query.eq('school_id', schoolId);

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

// ----------------------------------------------------------- relatórios --

export interface AdminStudentReport {
  person: AdminPerson;
  stats: {
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    totalStudySeconds: number;
    lastActiveLocalDate: string | null;
  } | null;
  subjectScores: SubjectScore[];
  scoreEvolution: ScoreEvolutionPoint[];
  simuladoHistory: SimuladoAttempt[];
  studyWeeks: StudyWeek[];
}

/**
 * Desempenho de UM aluno, para o admin — nunca chamado sem passar antes por
 * `admin_subject_scores`/`admin_user_stats`/etc., que checam por dentro se
 * quem pediu é admin geral ou admin da escola DELE. `null` quando o perfil
 * não existe; a RPC de autorização é quem barra escola errada (o chamador
 * trata isso como 404, não como lista vazia).
 */
export async function getAdminStudentReport(userId: string): Promise<AdminStudentReport | null> {
  const person = await getPersonById(userId);
  if (!person) return null;

  const supabase = await createClient();
  const [statsRes, scoresRes, evolutionRes, simuladosRes, sessionsRes] = await Promise.all([
    supabase.rpc('admin_user_stats', { p_target_user_id: userId }),
    supabase.rpc('admin_subject_scores', { p_target_user_id: userId }),
    supabase.rpc('admin_performance_evolution', { p_target_user_id: userId }),
    supabase.rpc('admin_simulado_history', { p_target_user_id: userId }),
    supabase.rpc('admin_study_sessions', { p_target_user_id: userId }),
  ]);

  const statsRow = statsRes.data?.[0];

  return {
    person,
    stats: statsRow
      ? {
          xp: statsRow.xp,
          level: statsRow.level,
          currentStreak: statsRow.current_streak,
          longestStreak: statsRow.longest_streak,
          totalStudySeconds: Number(statsRow.total_study_seconds),
          lastActiveLocalDate: statsRow.last_active_local_date,
        }
      : null,
    subjectScores: (scoresRes.data ?? []).map(mapSubjectScore),
    scoreEvolution: (evolutionRes.data ?? []).map((row) => ({
      weekStart: row.week_start,
      label: weekLabel(row.week_start),
      assessmentScore: row.assessment_score,
      empenhoIndex: row.empenho_index,
      blendedScore: row.blended_score,
    })),
    simuladoHistory: (simuladosRes.data ?? []).map(mapSimuladoAttempt),
    studyWeeks: groupByWeek(sessionsRes.data ?? []),
  };
}

export interface AdminSchoolSummary {
  schoolId: string | null;
  schoolName: string;
  studentCount: number;
  activeLast7dCount: number;
  totalStudySeconds: number;
  avgCurrentStreak: number;
  quizzesDone30d: number;
  simuladosDone30d: number;
}

export interface AdminReportsOverview {
  bySchool: AdminSchoolSummary[];
  contentOverview: AdminOverview;
}

/**
 * Relatório geral. Admin de escola vê só a própria; admin geral vê cada
 * escola cadastrada mais uma linha "todas as escolas" (`schoolId: null`).
 */
export async function getAdminReportsOverview(
  identity: AdminIdentity,
): Promise<AdminReportsOverview> {
  const supabase = await createClient();

  if (!identity.isGlobal) {
    const [summaryRes, contentOverview] = await Promise.all([
      supabase.rpc('admin_school_summary', { p_school_id: identity.schoolId }),
      getAdminOverview(),
    ]);
    const row = summaryRes.data?.[0];
    return {
      bySchool: row
        ? [
            {
              schoolId: identity.schoolId,
              schoolName: identity.schoolName ?? 'Sua escola',
              studentCount: row.student_count,
              activeLast7dCount: row.active_last_7d_count,
              totalStudySeconds: Number(row.total_study_seconds),
              avgCurrentStreak: Number(row.avg_current_streak),
              quizzesDone30d: row.quizzes_done_30d,
              simuladosDone30d: row.simulados_done_30d,
            },
          ]
        : [],
      contentOverview,
    };
  }

  const [schools, contentOverview] = await Promise.all([listSchools(), getAdminOverview()]);

  const [allSchoolsRes, ...perSchoolRes] = await Promise.all([
    supabase.rpc('admin_school_summary', { p_school_id: null }),
    ...schools.map((s) => supabase.rpc('admin_school_summary', { p_school_id: s.id })),
  ]);

  function toSummary(
    schoolId: string | null,
    schoolName: string,
    row: {
      student_count: number;
      active_last_7d_count: number;
      total_study_seconds: number;
      avg_current_streak: number;
      quizzes_done_30d: number;
      simulados_done_30d: number;
    },
  ): AdminSchoolSummary {
    return {
      schoolId,
      schoolName,
      studentCount: row.student_count,
      activeLast7dCount: row.active_last_7d_count,
      totalStudySeconds: Number(row.total_study_seconds),
      avgCurrentStreak: Number(row.avg_current_streak),
      quizzesDone30d: row.quizzes_done_30d,
      simuladosDone30d: row.simulados_done_30d,
    };
  }

  const bySchool: AdminSchoolSummary[] = [];
  const allRow = allSchoolsRes.data?.[0];
  if (allRow) bySchool.push(toSummary(null, 'Todas as escolas', allRow));

  schools.forEach((school, index) => {
    const row = perSchoolRes[index]?.data?.[0];
    if (row) bySchool.push(toSummary(school.id, school.name, row));
  });

  return { bySchool, contentOverview };
}
