import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageMain } from '@/components/layout/page-main';
import { AgendaView } from '@/features/agenda/components/agenda-view';
import { getAgenda, getUserToday } from '@/features/agenda/server/queries';
import { WeekPlanCard } from '@/features/agenda/components/week-plan-card';
import { buildWeekPlan } from '@/features/agenda/lib/week-plan';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Agenda',
  description: 'Provas, entregas e estudos das próximas semanas.',
};

export const dynamic = 'force-dynamic';

/** Janela carregada de uma vez: mês passado até três meses à frente. */
function windowAround(iso: string): { from: string; to: string } {
  const date = new Date(`${iso}T00:00:00Z`);
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 4, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default async function AgendaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // A janela depende do "hoje" do aluno, então esse valor vem primeiro — mas
  // por uma consulta trivial, não por uma varredura descartada.
  const today = await getUserToday(user.id);
  const { from, to } = windowAround(today);
  const agenda = await getAgenda(from, to, today);

  // Plano da semana: falha de qualquer leitura só tira o cartão, nunca a agenda.
  const supabase = await createClient();
  const mastery = await supabase.rpc('topic_mastery', { p_user_id: user.id });
  const plan = buildWeekPlan({
    today: agenda.today,
    weakTopics: (mastery.data ?? [])
      .filter((t) => t.status === 'revisar')
      .map((t) => ({ subjectId: t.subject_id, subjectName: t.subject_name, topicName: t.topic_name, masteryPercent: t.mastery_percent })),
    exams: agenda.events
      .filter((e) => e.kind === 'task' && e.taskKind === 'prova' && !e.isDone)
      .map((e) => ({ subjectId: e.subjectId, subjectName: e.subjectName, title: e.title, date: e.date })),
    dailyMinutes: 50,
  });

  return (
    <>
      {/* Sem AppHeader: no kit o título da Agenda É o mês, e ele vive dentro
          da visualização porque muda com as setas. */}
      <PageMain className="pt-4">
        <WeekPlanCard plan={plan} today={agenda.today} />
        <AgendaView events={agenda.events} today={agenda.today} />
      </PageMain>
    </>
  );
}
