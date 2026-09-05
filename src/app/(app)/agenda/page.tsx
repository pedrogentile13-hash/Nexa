import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { AgendaView } from '@/features/agenda/components/agenda-view';
import { getAgenda, getUserToday } from '@/features/agenda/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

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

  return (
    <>
      <AppHeader title="Agenda" subtitle="O que vem pela frente" />
      <PageMain>
        <AgendaView events={agenda.events} today={agenda.today} />
      </PageMain>
    </>
  );
}
