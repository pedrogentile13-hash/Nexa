import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NexaShell } from '@/features/nexa-ia/components/nexa-shell';
import { NexaIaView } from '@/features/nexa-ia/components/nexa-ia-view';
import { getChatMessages, getChatSessions } from '@/features/nexa-ia/server/queries';
import { MaterialPanel } from '@/features/nexa-ia/components/material-panel';
import { MyCreations } from '@/features/nexa-ia/components/my-creations';
import { listMyCreations, listStudyDocuments } from '@/features/nexa-ia/server/material-queries';
import { listCreatorSubjects } from '@/features/community/server/creator-queries';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'NexaAI',
  description: 'Seu assistente de estudos.',
};

export const dynamic = 'force-dynamic';

export default async function NexaIaPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string; aba?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { sessao, aba } = await searchParams;
  const tab = aba === 'material' || aba === 'conteudos' ? aba : 'conversar';
  const sessions = await getChatSessions(user.id);

  const activeSessionId = sessao && sessions.some((s) => s.id === sessao) ? sessao : null;
  const messages = activeSessionId ? await getChatMessages(activeSessionId) : [];

  return (
    <NexaShell sessions={sessions} activeSessionId={activeSessionId} tab={tab}>
      {tab === 'conversar' && <NexaIaView activeSessionId={activeSessionId} messages={messages} />}
      {tab === 'material' && (
        <PageScroll
          title="Material de estudo"
          subtitle="Envie um PDF, foto ou texto. A NexaAI lê, tira dúvidas e cria resumo e simulado só com o que está no seu material."
        >
          <MaterialTab />
        </PageScroll>
      )}
      {tab === 'conteudos' && (
        <PageScroll
          title="Meus conteúdos"
          subtitle="Resumos e simulados que a NexaAI criou para você. Só você vê, até a escola aprovar a publicação."
        >
          <CreationsTab userId={user.id} />
        </PageScroll>
      )}
    </NexaShell>
  );
}

function PageScroll({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-10 md:pt-14">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted mt-1.5 mb-6 text-sm">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

async function MaterialTab() {
  const [documents, subjects] = await Promise.all([listStudyDocuments(), listCreatorSubjects()]);
  return <MaterialPanel documents={documents} subjects={subjects} />;
}

async function CreationsTab({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [items, profile] = await Promise.all([
    listMyCreations(),
    supabase.from('profiles').select('school_id').eq('id', userId).maybeSingle(),
  ]);
  return <MyCreations items={items} hasSchool={Boolean(profile.data?.school_id)} />;
}
