'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Trophy, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { joinCommunity } from '../server/community-actions';
import { followUser } from '../server/actions';
import type { CommunitySidebarData } from '../server/community-queries';

function Avatar({ url, name, size = 8 }: { url: string | null; name: string; size?: 8 | 9 | 10 }) {
  const dim = size === 10 ? 'size-10' : size === 9 ? 'size-9' : 'size-8';
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${dim} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      className={`bg-brand-soft text-brand-text grid ${dim} shrink-0 place-items-center rounded-full text-xs font-semibold`}
    >
      {(name ?? '').trim()[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

/**
 * Sidebar direita de /comunidade — só desktop (`lg:` pra cima). Os três
 * widgets vêm de `getCommunitySidebarData()`, cada um de uma RPC própria já
 * existente; nada aqui inventa dado novo, só organiza o que a Community já
 * calcula em outro lugar (destaque = mais membros entre quem não entrou
 * ainda, ranking = os mesmos 5 primeiros de `/ranking`, sugestões = a nova
 * `suggested_people`). "Próximos eventos" do mockup fica de fora — Eventos
 * ainda não é uma fase implementada (roadmap), não um card vazio de mentira.
 */
export function CommunitySidebar({
  data,
  creatorEnabled,
}: {
  data: CommunitySidebarData;
  creatorEnabled: boolean;
}) {
  return (
    <aside className="space-y-4">
      {creatorEnabled && (
        <Link
          href="/comunidade/criar"
          className="border-border bg-surface hover:bg-surface-2 flex items-center gap-2.5 rounded-2xl border p-3.5 text-sm font-medium transition-colors"
        >
          <span className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-xl">
            <Sparkles className="size-4" aria-hidden />
          </span>
          Criar com IA
        </Link>
      )}
      <FeaturedCommunities initial={data.featuredCommunities} />
      <SchoolRankingCard entries={data.schoolRanking} />
      <SuggestedPeopleCard initial={data.suggestedPeople} />
    </aside>
  );
}

function FeaturedCommunities({ initial: communities }: { initial: CommunitySidebarData['featuredCommunities'] }) {
  const router = useRouter();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  function handleJoin(id: string) {
    setJoiningId(id);
    joinCommunity(id).then((result) => {
      setJoiningId(null);
      if (result.ok) router.push(`/comunidade/c/${id}`);
    });
  }

  if (communities.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Comunidades em destaque</CardTitle>
        <Link href="/comunidade?tab=comunidades" className="text-brand text-xs font-medium hover:underline">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {communities.map((community) => (
          <div key={community.id} className="flex items-center gap-2.5">
            <span className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-xl">
              <Users className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/comunidade/c/${community.id}`} className="block truncate text-sm font-medium hover:underline">
                {community.name}
              </Link>
              <p className="text-muted text-xs">
                {community.memberCount.toLocaleString('pt-BR')} {community.memberCount === 1 ? 'membro' : 'membros'}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={joiningId === community.id}
              onClick={() => handleJoin(community.id)}
            >
              {joiningId === community.id ? <Loader2 className="animate-spin" aria-hidden /> : 'Entrar'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SchoolRankingCard({ entries }: { entries: CommunitySidebarData['schoolRanking'] }) {
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Ranking da escola</CardTitle>
        <Link href="/ranking" className="text-brand text-xs font-medium hover:underline">
          Ver tudo
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {entries.map((entry, i) => (
          <div key={entry.userId} className="flex items-center gap-2.5">
            <span
              className={
                i === 0
                  ? 'bg-warning-soft text-warning grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold'
                  : 'bg-surface-2 text-muted grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold'
              }
            >
              {i === 0 ? <Trophy className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <Avatar url={entry.avatarUrl} name={entry.fullName} size={8} />
            <span className="min-w-0 flex-1 truncate text-sm">{entry.fullName}</span>
            <span className="text-muted tabular text-xs font-semibold">{entry.xp.toLocaleString('pt-BR')} XP</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SuggestedPeopleCard({ initial: people }: { initial: CommunitySidebarData['suggestedPeople'] }) {
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  function handleFollow(userId: string) {
    setFollowingId(userId);
    followUser(userId).then(() => {
      setFollowingId(null);
      setFollowed((prev) => new Set(prev).add(userId));
    });
  }

  if (people.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Pessoas que você pode conhecer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {people.map((person) => (
          <div key={person.userId} className="flex items-center gap-2.5">
            <Avatar url={person.avatarUrl} name={person.fullName} size={9} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{person.fullName}</p>
              {person.className && <Badge variant="neutral">{person.className}</Badge>}
            </div>
            <Button
              type="button"
              size="sm"
              variant={followed.has(person.userId) ? 'outline' : 'primary'}
              disabled={followingId === person.userId || followed.has(person.userId)}
              onClick={() => handleFollow(person.userId)}
            >
              {followingId === person.userId ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : followed.has(person.userId) ? (
                'Seguindo'
              ) : (
                <>
                  <UserPlus aria-hidden />
                  Seguir
                </>
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
