import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { CommunityDetailView } from '@/features/community/components/community-detail-view';
import { getCommunity, listCommunityMembers } from '@/features/community/server/community-queries';
import { listCommunityFeed } from '@/features/community/server/feed-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Comunidade',
};

export const dynamic = 'force-dynamic';

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('community_enabled'))) redirect('/hoje');

  const { id } = await params;
  const community = await getCommunity(id);
  if (!community) notFound();

  // Evento é exclusivo da escola: o botão só aparece para quem a RPC autoriza,
  // não para qualquer dono/moderador de comunidade. A regra de verdade está no
  // `create_event`; isto só evita mostrar um botão que sempre daria erro.
  const supabase = await createClient();
  const [feed, members, canCreateEvent] = await Promise.all([
    listCommunityFeed(id),
    listCommunityMembers(id),
    supabase.rpc('can_create_any_event').then((r) => r.data === true),
  ]);

  return (
    <>
      <AppHeader title={community.name} />
      <CommunityDetailView community={community} initialFeed={feed} initialMembers={members} canCreateEvent={canCreateEvent} />
    </>
  );
}
