import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { CommunityDetailView } from '@/features/community/components/community-detail-view';
import { getCommunity, listCommunityMembers } from '@/features/community/server/community-queries';
import { listCommunityFeed } from '@/features/community/server/feed-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

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

  const [feed, members] = await Promise.all([listCommunityFeed(id), listCommunityMembers(id)]);

  return (
    <>
      <AppHeader title={community.name} />
      <CommunityDetailView community={community} initialFeed={feed} initialMembers={members} />
    </>
  );
}
