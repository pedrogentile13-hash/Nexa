import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import {
  AddSubjectButton,
  SubjectsView,
  type SubjectCard,
} from '@/features/grades/components/subjects-view';
import { formatGrade, gradeHint, gradeTone, subjectRisk } from '@/features/grades';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Matérias',
  description: 'Suas matérias, médias e o que falta lançar.',
};

export const dynamic = 'force-dynamic';

const RISK_ORDER = { critical: 0, watch: 1, unknown: 2, ok: 3 } as const;

/**
 * A próxima avaliação, em duas formas.
 *
 * `badge` é a etiqueta curta do cartão ("PB amanhã"); `phrase` é o pedaço que
 * entra na frase do alerta ("a PB é amanhã"). São textos diferentes porque uma
 * etiqueta não é uma oração — encaixar "PB amanhã" no meio de uma frase produz
 * "Comece por Física: PB amanhã", que lê como anotação, não como orientação.
 */
function nextAssessmentLabels(
  today: string,
  dueDate: string,
  code: string | null,
): { badge: string; phrase: string } {
  const days = Math.round(
    (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );

  const [, month, day] = dueDate.split('-');
  const when =
    days < 0 ? 'atrasada' : days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `${day}/${month}`;

  const noun = code ? `a ${code}` : 'a próxima avaliação';
  const verb = days < 0 ? 'está' : 'é';
  const complement = days > 1 ? `dia ${when}` : when;

  return {
    badge: code ? `${code} ${when}` : when,
    phrase: `${noun} ${verb} ${complement}`,
  };
}

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: currentTermId } = await supabase.rpc('current_term_id', { p_user_id: user.id });
  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: user.id });
  const today = (todayValue as string | null) ?? new Date().toISOString().slice(0, 10);

  const [averagesRes, subjectsRes, activitiesRes] = await Promise.all([
    supabase
      .from('v_subject_term_averages')
      .select('*')
      .eq('term_id', (currentTermId as string) ?? '')
      .order('subject_name'),
    supabase.from('subjects').select('id, teacher_name').is('archived_at', null),
    supabase
      .from('v_activities_effective')
      .select('subject_id, due_date, category_code, score')
      .is('score', null)
      .not('due_date', 'is', null)
      .gte('due_date', today)
      .order('due_date'),
  ]);

  const teacherBySubject = new Map(
    (subjectsRes.data ?? []).map((s) => [s.id, s.teacher_name as string | null]),
  );

  // A primeira avaliação pendente de cada matéria — a consulta já vem ordenada
  // por data, então basta guardar a primeira que aparecer.
  const nextBySubject = new Map<string, { badge: string; phrase: string }>();
  for (const activity of activitiesRes.data ?? []) {
    if (!activity.due_date || nextBySubject.has(activity.subject_id)) continue;
    nextBySubject.set(
      activity.subject_id,
      nextAssessmentLabels(today, activity.due_date, activity.category_code),
    );
  }

  const rows = averagesRes.data ?? [];
  const termName = rows[0]?.term_name ?? 'Período atual';

  const subjects: SubjectCard[] = rows.map((row) => {
    const grade = row.final_grade;
    const passing = row.passing_grade ?? 6;
    const target = row.target_grade;

    return {
      id: row.subject_id,
      subjectTermId: row.subject_term_id,
      name: row.subject_name,
      color: row.subject_color,
      teacher: teacherBySubject.get(row.subject_id) ?? null,
      grade: grade === null ? '—' : formatGrade(grade, row.decimals, row.rounding_mode),
      gradeValue: grade,
      target: target === null ? null : formatGrade(target, 1),
      tone: gradeTone(grade, passing, target),
      hint: gradeHint(grade, passing, target),
      nextAssessment: nextBySubject.get(row.subject_id)?.badge ?? null,
      riskOrder: RISK_ORDER[subjectRisk(row)],
    };
  });

  // O alerta nomeia a matéria por onde começar. "Duas matérias abaixo da média"
  // informa; "comece por Física, a PB é amanhã" resolve.
  const below = subjects.filter((s) => s.tone === 'danger' || s.tone === 'warning');
  const first = below[0];
  const firstNext = first ? nextBySubject.get(first.id) : undefined;

  const alert = !first
    ? null
    : `${below.length === 1 ? 'Uma matéria abaixo' : `${below.length} matérias abaixo`} da média de aprovação.` +
      ` Comece por ${first.name}${firstNext ? `: ${firstNext.phrase}` : ''}.`;

  return (
    <>
      <AppHeader title="Minhas matérias" action={<AddSubjectButton />} />
      <PageMain>
        <SubjectsView subjects={subjects} termName={termName} alert={alert} />
      </PageMain>
    </>
  );
}
