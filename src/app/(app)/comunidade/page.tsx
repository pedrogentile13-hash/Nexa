import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { FeedView } from '@/features/community/components/feed-view';
import { listFeed } from '@/features/community/server/feed-queries';
import { getCommunitySidebarData } from '@/features/community/server/community-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Comunidade',
  description: 'Feed do Nexa Community — publique, curta, comente e salve.',
};

export const dynamic = 'force-dynamic';

export default async function ComunidadePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Mesma trava que esconde o item de navegação — sem ela, quem descobrisse
  // a URL enquanto a fase está desligada ainda conseguiria abrir a tela.
  if (!(await isFeatureEnabled('community_enabled'))) redirect('/hoje');

  const [initialFeed, sidebar, creatorEnabled] = await Promise.all([
    listFeed(),
    getCommunitySidebarData(),
    isFeatureEnabled('creator_enabled'),
  ]);

  return (
    <>
      <AppHeader title="Comunidade" subtitle="O que está rolando na sua escola" />
      <FeedView initialFeed={initialFeed} sidebar={sidebar} creatorEnabled={creatorEnabled} />
    </>
  );
}
