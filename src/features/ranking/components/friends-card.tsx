'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Search, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  respondFriendRequest,
  removeFriend,
  searchSchoolmates,
  sendFriendRequest,
  type SchoolmateResult,
} from '../server/friend-actions';
import type { FriendRequestSummary, FriendSummary } from '../server/queries';

function Avatar({ url, name, size = 8 }: { url: string | null; name: string; size?: 8 | 9 }) {
  const dim = size === 9 ? 'size-9' : 'size-8';
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${dim} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      className={`bg-brand-soft text-brand-text grid ${dim} shrink-0 place-items-center rounded-full text-xs font-semibold`}
    >
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

/**
 * Card "Amigos" da sidebar do ranking: pedidos pendentes (aceitar/recusar),
 * busca de colegas da mesma escola pra adicionar, e a lista dos já
 * confirmados. Sem Realtime — cada ação chama `revalidatePath('/ranking')`
 * (mesmo mecanismo de "atualiza sozinho ao voltar pra tela" da Fase 1) e o
 * `router.refresh()` local dá o feedback imediato pra quem está agindo.
 */
export function FriendsCard({
  friends,
  incomingRequests,
  onOpenProfile,
}: {
  friends: FriendSummary[];
  incomingRequests: FriendRequestSummary[];
  onOpenProfile: (userId: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SchoolmateResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [runSearch] = useDebouncedCallback((value: string) => {
    setSearching(true);
    searchSchoolmates(value).then((found) => {
      setResults(found);
      setSearching(false);
    });
  }, 300);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    runSearch(value);
  }

  function patchResult(userId: string, status: SchoolmateResult['friendshipStatus']) {
    setResults((prev) => prev.map((r) => (r.userId === userId ? { ...r, friendshipStatus: status } : r)));
  }

  function handleAdd(userId: string) {
    startTransition(async () => {
      const result = await sendFriendRequest(userId);
      patchResult(userId, result === 'accepted' ? 'accepted' : 'pending_sent');
      router.refresh();
    });
  }

  function handleRespond(requesterId: string, accept: boolean) {
    startTransition(async () => {
      await respondFriendRequest(requesterId, accept);
      patchResult(requesterId, accept ? 'accepted' : 'none');
      router.refresh();
    });
  }

  function handleRemove(otherId: string) {
    startTransition(async () => {
      await removeFriend(otherId);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="text-brand size-4" aria-hidden />
          Amigos
          {friends.length > 0 && <Badge variant="neutral" className="ml-auto">{friends.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {incomingRequests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted text-xs font-semibold tracking-wide uppercase">
              Pedidos pendentes
            </h3>
            <ul className="space-y-2">
              {incomingRequests.map((r) => (
                <li key={r.requesterId} className="flex items-center gap-2">
                  <Avatar url={r.avatarUrl} name={r.fullName} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.fullName}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="soft"
                    disabled={pending}
                    onClick={() => handleRespond(r.requesterId, true)}
                    aria-label={`Aceitar pedido de ${r.fullName}`}
                  >
                    <Check aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => handleRespond(r.requesterId, false)}
                    aria-label={`Recusar pedido de ${r.fullName}`}
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <div className="relative">
            <Search
              className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar colega pra adicionar"
              aria-label="Buscar colega pra adicionar"
              className="border-border bg-surface-2 text-text placeholder:text-subtle focus-visible:ring-brand/30 h-10 w-full rounded-full border-none pl-9 pr-3 text-sm outline-none focus-visible:ring-2"
            />
          </div>

          {query.trim().length >= 2 && (
            <ul className="border-border bg-surface divide-border divide-y rounded-lg border">
              {searching ? (
                <li className="text-muted flex items-center gap-2 p-3 text-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Buscando…
                </li>
              ) : results.length === 0 ? (
                <li className="text-muted p-3 text-sm">Ninguém encontrado.</li>
              ) : (
                results.map((r) => (
                  <li key={r.userId} className="flex items-center gap-2 p-2.5">
                    <Avatar url={r.avatarUrl} name={r.fullName} />
                    <span className="min-w-0 flex-1 truncate text-sm">{r.fullName}</span>
                    {r.friendshipStatus === 'none' && (
                      <Button type="button" size="sm" disabled={pending} onClick={() => handleAdd(r.userId)}>
                        Adicionar
                      </Button>
                    )}
                    {r.friendshipStatus === 'pending_sent' && (
                      <span className="text-subtle shrink-0 text-xs">Pedido enviado</span>
                    )}
                    {r.friendshipStatus === 'pending_received' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="soft"
                        disabled={pending}
                        onClick={() => handleRespond(r.userId, true)}
                      >
                        Aceitar
                      </Button>
                    )}
                    {r.friendshipStatus === 'accepted' && (
                      <span className="text-success shrink-0 text-xs font-medium">Amigos</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {friends.length === 0 ? (
          <p className="text-subtle text-xs">
            Adicione colegas da sua escola pra comparar XP e torcer juntos.
          </p>
        ) : (
          <ul className="divide-border -mx-1 divide-y">
            {friends.map((f) => (
              <li key={f.userId} className="flex items-center gap-2 px-1 py-2">
                <button
                  type="button"
                  onClick={() => onOpenProfile(f.userId)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Avatar url={f.avatarUrl} name={f.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{f.fullName}</span>
                    <span className="text-muted block truncate text-xs">
                      Nível {f.level} · {f.xp.toLocaleString('pt-BR')} XP
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => handleRemove(f.userId)}
                  aria-label={`Remover ${f.fullName} dos amigos`}
                >
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
