'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Globe, Loader2, Lock, LogOut, Plus, School, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent } from '@/components/ui/card';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import type { CommunityVisibility } from '@/types/database.types';
import {
  deleteCommunity,
  getCommunityFeed,
  leaveCommunity,
  removeMember,
  setMemberRole,
} from '../server/community-actions';
import { createCommunityEvent, getEventsList, type CreateEventState } from '../server/event-actions';
import type { CommunityDetail, CommunityMember } from '../server/community-queries';
import type { FeedPost } from '../server/feed-queries';
import type { EventSummary } from '../server/event-queries';
import { PostComposer } from './post-composer';
import { PostCard } from './post-card';
import { ChatView } from './chat-view';
import { EventsList } from './events-list';

type Tab = 'feed' | 'chat' | 'eventos';

const TABS: { value: Tab; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'chat', label: 'Chat' },
  { value: 'eventos', label: 'Eventos' },
];

const VISIBILITY_ICON: Record<CommunityVisibility, typeof Globe> = {
  public: Globe,
  school: School,
  private: Lock,
};

const VISIBILITY_LABEL: Record<CommunityVisibility, string> = {
  public: 'Pública',
  school: 'Minha escola',
  private: 'Privada',
};

export function CommunityDetailView({
  community,
  initialFeed,
  initialMembers,
}: {
  community: CommunityDetail;
  initialFeed: FeedPost[];
  initialMembers: CommunityMember[];
}) {
  const router = useRouter();
  const [feed, setFeed] = useState(initialFeed);
  const [members, setMembers] = useState(initialMembers);
  const [showMembers, setShowMembers] = useState(false);
  const [tab, setTab] = useState<Tab>('feed');
  const [pending, startTransition] = useTransition();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);

  const Icon = VISIBILITY_ICON[community.visibility];
  const canModerate = community.myRole === 'owner' || community.myRole === 'moderator';

  function handleRemoved(postId: string) {
    setFeed((prev) => prev.filter((p) => p.id !== postId));
  }

  function handlePosted() {
    getCommunityFeed(community.id).then(setFeed);
  }

  function loadEvents() {
    setLoadingEvents(true);
    getEventsList().then((all) => {
      setEvents(all.filter((e) => e.communityId === community.id));
      setLoadingEvents(false);
    });
  }

  function handleChangeTab(next: Tab) {
    setTab(next);
    if (next === 'eventos' && events === null) loadEvents();
  }

  function handleEventCreated() {
    setCreatingEvent(false);
    loadEvents();
  }

  function handleLeave() {
    if (!window.confirm('Sair desta comunidade?')) return;
    startTransition(async () => {
      await leaveCommunity(community.id);
      router.push('/comunidade');
    });
  }

  function handleDelete() {
    if (!window.confirm('Apagar esta comunidade? Isso não pode ser desfeito.')) return;
    startTransition(async () => {
      await deleteCommunity(community.id);
      router.push('/comunidade');
    });
  }

  function handleRemoveMember(userId: string) {
    startTransition(async () => {
      await removeMember(community.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    });
  }

  function handlePromote(userId: string, currentRole: CommunityMember['role']) {
    const nextRole = currentRole === 'moderator' ? 'member' : 'moderator';
    startTransition(async () => {
      await setMemberRole(community.id, userId, nextRole);
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: nextRole } : m)));
    });
  }

  return (
    <PageMain variant="reading" className="space-y-4 py-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">{community.name}</h1>
              {community.description && (
                <p className="text-muted mt-0.5 text-sm">{community.description}</p>
              )}
            </div>
            {community.myRole === 'owner' ? (
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleDelete}>
                <Trash2 aria-hidden />
              </Button>
            ) : community.isMember ? (
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleLeave}>
                <LogOut aria-hidden />
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">
              <Icon className="size-3" aria-hidden />
              {VISIBILITY_LABEL[community.visibility]}
            </Badge>
            <button
              type="button"
              onClick={() => setShowMembers((v) => !v)}
              className="text-subtle hover:text-text flex items-center gap-1 text-xs font-medium"
            >
              <Users className="size-3.5" aria-hidden />
              {community.memberCount} {community.memberCount === 1 ? 'membro' : 'membros'}
            </button>
          </div>

          {community.rules && (
            <div className="border-border bg-surface-2 rounded-lg border p-3">
              <p className="text-muted mb-1 text-xs font-semibold tracking-wide uppercase">Regras</p>
              <p className="text-sm whitespace-pre-wrap">{community.rules}</p>
            </div>
          )}

          {showMembers && (
            <ul className="divide-border divide-y">
              {members.map((member) => (
                <li key={member.userId} className="flex items-center gap-2 py-2">
                  <span className="bg-brand-soft text-brand-text grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold">
                    {(member.fullName ?? '').trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{member.fullName}</span>
                  {member.role !== 'member' && (
                    <Badge variant={member.role === 'owner' ? 'brand' : 'neutral'}>
                      {member.role === 'owner' ? 'Dono' : 'Moderador'}
                    </Badge>
                  )}
                  {canModerate && member.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePromote(member.userId, member.role)}
                        disabled={pending}
                        className="text-subtle hover:text-text text-xs"
                      >
                        {member.role === 'moderator' ? 'Rebaixar' : 'Promover'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={pending}
                        className="text-subtle hover:text-danger text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {community.isMember && (
        <UnderlineTabs label="Seções do grupo" value={tab} onChange={handleChangeTab} options={TABS} />
      )}

      {tab === 'chat' && community.isMember ? (
        <Card>
          <CardContent className="p-3">
            <ChatView communityId={community.id} canModerate={canModerate} />
          </CardContent>
        </Card>
      ) : tab === 'eventos' && community.isMember ? (
        <div className="space-y-3">
          {canModerate && (
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={() => setCreatingEvent(true)}>
                <Plus aria-hidden />
                Criar evento
              </Button>
            </div>
          )}
          {loadingEvents || events === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
            </div>
          ) : (
            <EventsList initial={events} />
          )}
          {creatingEvent && (
            <CreateEventDialog communityId={community.id} onClose={() => setCreatingEvent(false)} onCreated={handleEventCreated} />
          )}
        </div>
      ) : (
        <>
          {community.isMember && <PostComposer communityId={community.id} onPosted={handlePosted} />}

          {feed.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">Nenhum post nesta comunidade ainda.</p>
          ) : (
            <ul className="space-y-3">
              {feed.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} onRemoved={handleRemoved} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {pending && (
        <div className="fixed right-4 bottom-20 md:bottom-4">
          <Loader2 className="text-muted size-5 animate-spin" aria-hidden />
        </div>
      )}
    </PageMain>
  );
}

const CREATE_EVENT_INITIAL: CreateEventState = { status: 'idle' };

function CreateEventDialog({
  communityId,
  onClose,
  onCreated,
}: {
  communityId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const boundAction = createCommunityEvent.bind(null, communityId);
  const [state, formAction] = useActionState(boundAction, CREATE_EVENT_INITIAL);

  useEffect(() => {
    if (state.status === 'ok') onCreated();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à mudança de `state`
  }, [state]);

  return (
    <Dialog open onClose={onClose} title="Criar evento">
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="event-title">Título</Label>
          <Input id="event-title" name="title" required maxLength={120} placeholder="Feira de Ciências" />
        </div>
        <div>
          <Label htmlFor="event-starts">Data e hora</Label>
          <Input id="event-starts" name="startsAt" type="datetime-local" required />
        </div>
        <div>
          <Label htmlFor="event-location">Local</Label>
          <Input id="event-location" name="location" maxLength={200} placeholder="opcional" />
        </div>
        <div>
          <Label htmlFor="event-capacity">Vagas</Label>
          <Input id="event-capacity" name="capacity" type="number" min={1} placeholder="sem limite" />
        </div>
        <div>
          <Label htmlFor="event-description">Descrição</Label>
          <Input id="event-description" name="description" maxLength={2000} placeholder="opcional" />
        </div>
        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <CreateEventSubmitButton />
        </div>
      </form>
    </Dialog>
  );
}

function CreateEventSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      Criar
    </Button>
  );
}
