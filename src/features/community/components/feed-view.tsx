'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { getSavedPosts } from '../server/feed-actions';
import { getCommunitiesList } from '../server/community-actions';
import type { FeedPost } from '../server/feed-queries';
import type { CommunitySummary } from '../server/community-queries';
import { PostComposer } from './post-composer';
import { PostCard } from './post-card';
import { CommunityList } from './community-list';

type Tab = 'feed' | 'salvos' | 'comunidades';

const TABS: { value: Tab; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'salvos', label: 'Salvos' },
  { value: 'comunidades', label: 'Comunidades' },
];

export function FeedView({ initialFeed }: { initialFeed: FeedPost[] }) {
  const [tab, setTab] = useState<Tab>('feed');
  const [feed, setFeed] = useState(initialFeed);
  const [saved, setSaved] = useState<FeedPost[] | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [communities, setCommunities] = useState<CommunitySummary[] | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

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
  }

  function handleRemoved(postId: string) {
    setFeed((prev) => prev.filter((p) => p.id !== postId));
    setSaved((prev) => prev?.filter((p) => p.id !== postId) ?? prev);
  }

  const visiblePosts = tab === 'feed' ? feed : (saved ?? []);

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
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
  );
}
