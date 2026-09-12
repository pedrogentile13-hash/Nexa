import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { NexaIaView } from '@/features/nexa-ia/components/nexa-ia-view';
import { getChatMessages, getChatSessions } from '@/features/nexa-ia/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'NexaAI',
  description: 'Seu assistente de estudos.',
};

export const dynamic = 'force-dynamic';

export default async function NexaIaPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { sessao } = await searchParams;
  const sessions = await getChatSessions(user.id);

  const activeSessionId = sessao && sessions.some((s) => s.id === sessao) ? sessao : null;
  const messages = activeSessionId ? await getChatMessages(activeSessionId) : [];

  return (
    <>
      <AppHeader title="NexaAI" subtitle="Seu assistente de estudos" />
      <PageMain className="pt-4 md:pt-6">
        <NexaIaView sessions={sessions} activeSessionId={activeSessionId} messages={messages} />
      </PageMain>
    </>
  );
}
