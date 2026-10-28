import type { Metadata } from 'next';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
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

  const tabs = [
    { key: 'conversar', label: 'Conversar', href: '/nexa-ia' },
    { key: 'material', label: 'Material de estudo', href: '/nexa-ia?aba=material' },
    { key: 'conteudos', label: 'Meus conteúdos', href: '/nexa-ia?aba=conteudos' },
  ] as const;

  return (
    <>
      <AppHeader title="NexaAI" subtitle="Seu assistente de estudos" />
      <PageMain className="pt-4 md:pt-6">
        <nav aria-label="Seções da NexaAI" className="mx-auto mb-4 flex max-w-3xl gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.key === tab ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap',
                t.key === tab ? 'bg-brand-soft text-brand-text font-semibold' : 'text-muted hover:text-text',
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === 'conversar' && (
          <NexaIaView sessions={sessions} activeSessionId={activeSessionId} messages={messages} />
        )}
        {tab === 'material' && <MaterialTab />}
        {tab === 'conteudos' && <CreationsTab userId={user.id} />}
      </PageMain>
    </>
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
