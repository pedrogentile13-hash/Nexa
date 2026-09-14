'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { getSavedPosts } from '../server/feed-actions';
import { getCommunitiesList } from '../server/community-actions';
import { getEventsList } from '../server/event-actions';
import type { FeedPost } from '../server/feed-queries';
import type { CommunitySidebarData, CommunitySummary } from '../server/community-queries';
import type { EventSummary } from '../server/event-queries';
import { PostComposer } from './post-composer';
import { PostCard } from './post-card';
import { CommunityList } from './community-list';
import { CommunitySidebar } from './community-sidebar';
import { EventsList } from './events-list';

type Tab = 'feed' | 'salvos' | 'comunidades' | 'eventos';

const TABS: { value: Tab; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'salvos', label: 'Salvos' },
  { value: 'comunidades', label: 'Comunidades' },
  { value: 'eventos', label: 'Eventos' },
];

export function FeedView({
  initialFeed,
  sidebar,
}: {
  initialFeed: FeedPost[];
  sidebar: CommunitySidebarData;
}) {
  const [tab, setTab] = useState<Tab>('feed');
  const [feed, setFeed] = useState(initialFeed);
  const [saved, setSaved] = useState<FeedPost[] | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [communities, setCommunities] = useState<CommunitySummary[] | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  function handleChangeTab(next: Tab) {
    setTab(next);
    if (next === 'salvos' && saved === null) {
      setLoadingSaved(true);
      getSavedPosts().then((result) => {
        setSaved(result);
        setLoadingSaved(false);
      });
    }
    if (next === 'comunidades' && communities === null) {
      setLoadingCommunities(true);
      getCommunitiesList().then((result) => {
        setCommunities(result);
        setLoadingCommunities(false);
      });
    }
    if (next === 'eventos' && events === null) {
      setLoadingEvents(true);
      getEventsList().then((result) => {
        setEvents(result);
        setLoadingEvents(false);
      });
    }
  }

  function handleRemoved(postId: string) {
    setFeed((prev) => prev.filter((p) => p.id !== postId));
    setSaved((prev) => prev?.filter((p) => p.id !== postId) ?? prev);
  }

  const visiblePosts = tab === 'feed' ? feed : (saved ?? []);

  return (
    <PageMain>
      {/* Mesmo padrão de duas colunas de `/ranking`: conteúdo à esquerda com
          largura de leitura confortável, sidebar de descoberta à direita, só
          a partir de `lg`. Antes disto o feed inteiro ficava preso a
          `max-w-xl` (medida de TEXTO CORRIDO) mesmo no desktop — sobrava tanta
          margem vazia dos dois lados que a tela lia como fora de proporção. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
        <div className="mx-auto w-full max-w-xl space-y-4 py-4 lg:mx-0">
          <UnderlineTabs
            label="Seções da Comunidade"
            value={tab}
            onChange={handleChangeTab}
            options={TABS}
          />

          {tab === 'comunidades' ? (
            loadingCommunities || communities === null ? (
              <div className="flex justify-center py-10">
                <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
              </div>
            ) : (
              <CommunityList initial={communities} />
            )
          ) : tab === 'eventos' ? (
            loadingEvents || events === null ? (
              <div className="flex justify-center py-10">
                <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
              </div>
            ) : (
              <EventsList initial={events} />
            )
          ) : (
            <>
              {tab === 'feed' && <PostComposer />}

              {tab === 'salvos' && loadingSaved ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
                </div>
              ) : visiblePosts.length === 0 ? (
                <p className="text-muted py-10 text-center text-sm">
                  {tab === 'feed'
                    ? 'Nada por aqui ainda — seja a primeira pessoa a publicar.'
                    : 'Você ainda não salvou nenhum post.'}
                </p>
              ) : (
                <ul className="space-y-3">
                  {visiblePosts.map((post) => (
                    <li key={post.id}>
                      <PostCard post={post} onRemoved={handleRemoved} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="hidden py-4 lg:block">
          <CommunitySidebar data={sidebar} />
        </div>
      </div>
    </PageMain>
  );
}
