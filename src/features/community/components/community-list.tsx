'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Plus, School, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { CommunityVisibility } from '@/types/database.types';
import { createCommunity, getCommunitiesList, joinCommunity, type CreateCommunityState } from '../server/community-actions';
import type { CommunitySummary } from '../server/community-queries';

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

export function CommunityList({ initial }: { initial: CommunitySummary[] }) {
  const router = useRouter();
  const [communities, setCommunities] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  function handleJoin(id: string) {
    setJoiningId(id);
    setJoinError(null);
    joinCommunity(id).then((result) => {
      setJoiningId(null);
      if (!result.ok) {
        setJoinError(result.message);
        return;
      }
      setCommunities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c)),
      );
      router.push(`/comunidade/c/${id}`);
    });
  }

  function handleCreated() {
    setCreating(false);
    getCommunitiesList().then(setCommunities);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Criar comunidade
        </Button>
      </div>

      {joinError && <p className="text-danger text-sm">{joinError}</p>}

      {communities.length === 0 ? (
        <p className="text-muted py-10 text-center text-sm">Nenhuma comunidade por aqui ainda.</p>
      ) : (
        <ul className="space-y-2.5">
          {communities.map((community) => {
            const Icon = VISIBILITY_ICON[community.visibility];
            return (
              <li key={community.id}>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Link href={`/comunidade/c/${community.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{community.name}</p>
                      {community.description && (
                        <p className="text-muted truncate text-xs">{community.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant="neutral">
                          <Icon className="size-3" aria-hidden />
                          {VISIBILITY_LABEL[community.visibility]}
                        </Badge>
                        <span className="text-subtle text-xs">
                          {community.memberCount} {community.memberCount === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>
                    </Link>
                    {community.isMember ? (
                      <Link href={`/comunidade/c/${community.id}`}>
                        <Button type="button" size="sm" variant="outline">
                          Ver
                        </Button>
                      </Link>
                    ) : community.visibility === 'private' ? (
                      <span className="text-subtle text-xs">Só por convite</span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={joiningId === community.id}
                        onClick={() => handleJoin(community.id)}
                      >
                        {joiningId === community.id && <Loader2 className="animate-spin" aria-hidden />}
                        Entrar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {creating && <CreateCommunityDialog onClose={() => setCreating(false)} onCreated={handleCreated} />}
    </div>
  );
}

const INITIAL: CreateCommunityState = { status: 'idle' };

function CreateCommunityDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createCommunity, INITIAL);

  useEffect(() => {
    if (state.status === 'ok') {
      onCreated();
      router.push(`/comunidade/c/${state.communityId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à mudança de `state`
  }, [state]);

  return (
    <Dialog open onClose={onClose} title="Criar comunidade">
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="community-name">Nome</Label>
          <Input id="community-name" name="name" required maxLength={60} placeholder="Clube de Robótica" />
        </div>
        <div>
          <Label htmlFor="community-description">Descrição</Label>
          <Input id="community-description" name="description" maxLength={500} placeholder="opcional" />
        </div>
        <div>
          <Label htmlFor="community-visibility">Visibilidade</Label>
          <select
            id="community-visibility"
            name="visibility"
            defaultValue="school"
            className={cn(
              'border-border bg-surface text-text h-12 w-full rounded-md border px-3 text-base',
              'focus-visible:border-brand focus-visible:ring-brand/25 outline-none focus-visible:ring-2',
              'sm:h-11 sm:text-sm',
            )}
          >
            <option value="school">Minha escola</option>
            <option value="public">Pública</option>
            <option value="private">Privada (só por convite)</option>
          </select>
        </div>
        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <CreateSubmitButton />
        </div>
      </form>
    </Dialog>
  );
}

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      Criar
    </Button>
  );
}
