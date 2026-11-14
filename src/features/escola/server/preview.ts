import { createClient } from '@/lib/supabase/server';
import { listAnnouncements } from '@/features/announcements/server/queries';
import { getAdminStudentReport } from '@/features/admin/server/queries';
import { listClassCards, listRoster } from './queries';

export interface StudentView {
  className: string;
  teachers: string;
  student: { name: string; xp: number; level: number; streak: number; hours: number; average: number | null } | null;
  notices: { id: string; title: string; body: string; pinned: boolean; createdAt: string }[];
  library: { counts: { kind: string; count: number }[]; recent: { id: string; title: string; kind: string; subject: string }[] };
}

/**
 * O que um aluno daquela turma enxerga hoje: avisos que chegam a ele, o acervo publicado
 * e (se escolhido um aluno) os números dele. Leitura apenas — ninguém "vira" o aluno.
 */
export async function getStudentView(opts: { classId?: string; studentId?: string }): Promise<StudentView | null> {
  const classes = await listClassCards();
  let classId = opts.classId;
  let studentName: string | null = null;

  if (opts.studentId) {
    const student = (await listRoster()).find((s) => s.id === opts.studentId);
    if (!student) return null;
    classId = student.classId;
    studentName = student.name;
  }
  const klass = classes.find((c) => c.id === classId);
  if (!klass) return null;

  const supabase = await createClient();
  const [notices, library, report] = await Promise.all([
    listAnnouncements(50),
    supabase
      .from('v_resource_library')
      .select('id, title, kind, subject_name, published_at')
      .order('published_at', { ascending: false })
      .limit(60),
    opts.studentId ? getAdminStudentReport(opts.studentId) : Promise.resolve(null),
  ]);

  const rows = library.data ?? [];
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);

  const graded = report?.subjectScores.filter((s) => s.blendedScore !== null) ?? [];
  const average = graded.length ? graded.reduce((sum, s) => sum + (s.blendedScore ?? 0), 0) / graded.length : null;

  return {
    className: klass.name,
    teachers: klass.teachers,
    student:
      report && studentName
        ? {
            name: studentName,
            xp: report.stats?.xp ?? 0,
            level: report.stats?.level ?? 1,
            streak: report.stats?.currentStreak ?? 0,
            hours: Math.round(((report.stats?.totalStudySeconds ?? 0) / 3600) * 10) / 10,
            average,
          }
        : null,
    notices: notices
      .filter((n) => n.className === null || n.className === klass.name)
      .slice(0, 6)
      .map((n) => ({ id: n.id, title: n.title, body: n.body, pinned: n.pinned, createdAt: n.createdAt })),
    library: {
      counts: [...counts.entries()].map(([kind, count]) => ({ kind, count })),
      recent: rows.slice(0, 6).map((r) => ({ id: r.id, title: r.title, kind: r.kind, subject: r.subject_name })),
    },
  };
}
