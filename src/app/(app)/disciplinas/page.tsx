import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import {
  AddSubjectButton,
  SubjectsView,
  type SubjectCard,
} from '@/features/subjects/components/subjects-view';
import { formatGrade } from '@/lib/format/grade';
import { gradeHint, gradeTone, subjectRisk } from '@/features/performance/lib/status';
import { getSubjectScores } from '@/features/performance/server/queries';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Matérias',
  description: 'Suas matérias e a nota automática de cada uma.',
};

export const dynamic = 'force-dynamic';

const RISK_ORDER = { critical: 0, watch: 1, unknown: 2, ok: 3 } as const;
const PASSING_GRADE = 6;

/**
 * A próxima prova agendada, em duas formas.
 *
 * `badge` é a etiqueta curta do cartão ("prova amanhã"); `phrase` é o pedaço
 * que entra na frase do alerta ("a prova é amanhã"). Provas agora são só
 * `tasks` de `kind = 'prova'` — sem peso, sem categoria, só uma data.
 */
function nextAssessmentLabels(today: string, dueDate: string): { badge: string; phrase: string } {
  const days = Math.round(
    (Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );

  const [, month, day] = dueDate.split('-');
  const when =
    days < 0 ? 'atrasada' : days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `${day}/${month}`;

  const verb = days < 0 ? 'está' : 'é';
  const complement = days > 1 ? `dia ${when}` : when;

  return { badge: `prova ${when}`, phrase: `a prova ${verb} ${complement}` };
}

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: user.id });
  const today = (todayValue as string | null) ?? new Date().toISOString().slice(0, 10);

  const [scores, subjectsRes, provasRes] = await Promise.all([
    getSubjectScores(user.id),
    supabase.from('subjects').select('id, teacher_name').is('archived_at', null),
    supabase
      .from('tasks')
      .select('subject_id, due_date')
      .eq('kind', 'prova')
      .is('completed_at', null)
      .not('subject_id', 'is', null)
      .not('due_date', 'is', null)
      .gte('due_date', today)
      .order('due_date'),
  ]);

  const teacherBySubject = new Map(
    (subjectsRes.data ?? []).map((s) => [s.id, s.teacher_name as string | null]),
  );

  // A primeira prova pendente de cada matéria — a consulta já vem ordenada
  // por data, então basta guardar a primeira que aparecer.
  const nextBySubject = new Map<string, { badge: string; phrase: string }>();
  for (const prova of provasRes.data ?? []) {
    if (!prova.subject_id || !prova.due_date || nextBySubject.has(prova.subject_id)) continue;
    nextBySubject.set(prova.subject_id, nextAssessmentLabels(today, prova.due_date));
  }

  const subjects: SubjectCard[] = scores.map((row) => {
    const grade = row.blendedScore;
    const target = row.targetGrade;

    return {
      id: row.subjectId,
      name: row.subjectName,
      color: row.subjectColor,
      teacher: teacherBySubject.get(row.subjectId) ?? null,
      grade: grade === null ? '—' : formatGrade(grade, 1),
      gradeValue: grade,
      target: target === null ? null : formatGrade(target, 1),
      tone: gradeTone(grade, PASSING_GRADE, target),
      hint: row.hasContent
        ? gradeHint(grade, PASSING_GRADE, target)
        : { label: 'sem conteúdo do Nexa ainda', tone: 'neutral' as const },
      nextAssessment: nextBySubject.get(row.subjectId)?.badge ?? null,
      riskOrder: RISK_ORDER[subjectRisk(grade, PASSING_GRADE, target)],
    };
  });

  // O alerta nomeia a matéria por onde começar. "Duas matérias abaixo da
  // aprovação" informa; "comece por Física, a prova é amanhã" resolve.
  const below = subjects.filter((s) => s.tone === 'danger' || s.tone === 'warning');
  const first = below[0];
  const firstNext = first ? nextBySubject.get(first.id) : undefined;

  const alert = !first
    ? null
    : `${below.length === 1 ? 'Uma matéria abaixo' : `${below.length} matérias abaixo`} da média de aprovação.` +
      ` Comece por ${first.name}${firstNext ? `: ${firstNext.phrase}` : ''}.`;

  return (
    <>
      {/* No celular o título fica no cabeçalho fixo; no desktop ele desce para
          dentro da tela, dividindo a linha com os filtros. */}
      <div className="md:hidden">
        <AppHeader title="Minhas matérias" action={<AddSubjectButton />} />
      </div>
      <PageMain className="pt-4 md:pt-6">
        <SubjectsView
          subjects={subjects}
          alert={alert}
          title="Minhas matérias"
          addButton={
            <span className="hidden md:inline-flex">
              <AddSubjectButton />
            </span>
          }
        />
      </PageMain>
    </>
  );
}
