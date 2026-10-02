'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Calendar, Loader2, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cancelEventRegistration, registerForEvent } from '../server/event-actions';
import type { EventSummary } from '../server/event-queries';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_BADGE: Record<NonNullable<EventSummary['myStatus']>, { label: string; variant: 'success' | 'warning' }> = {
  registered: { label: 'Inscrito', variant: 'success' },
  waitlisted: { label: 'Lista de espera', variant: 'warning' },
  cancelled: { label: 'Cancelada', variant: 'warning' },
};

export function EventsList({ initial }: { initial: EventSummary[] }) {
  const [events, setEvents] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRegister(eventId: string) {
    setPendingId(eventId);
    startTransition(async () => {
      const result = await registerForEvent(eventId);
      setPendingId(null);
      if (result.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  myStatus: result.status,
                  registeredCount: result.status === 'registered' ? e.registeredCount + 1 : e.registeredCount,
                }
              : e,
          ),
        );
      }
    });
  }

  function handleCancel(eventId: string) {
    setPendingId(eventId);
    startTransition(async () => {
      await cancelEventRegistration(eventId);
      setPendingId(null);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, myStatus: null, registeredCount: Math.max(0, e.registeredCount - (e.myStatus === 'registered' ? 1 : 0)) }
            : e,
        ),
      );
    });
  }

  if (events.length === 0) {
    return <p className="text-muted py-10 text-center text-sm">Nenhum evento por aqui ainda.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {events.map((event) => {
        const full = event.capacity !== null && event.registeredCount >= event.capacity;
        return (
          <li key={event.id}>
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/comunidade/eventos/${event.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold hover:underline">{event.title}</p>
                  </Link>
                  {event.myStatus && event.myStatus !== 'cancelled' && (
                    <Badge variant={STATUS_BADGE[event.myStatus].variant}>{STATUS_BADGE[event.myStatus].label}</Badge>
                  )}
                </div>
                <div className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" aria-hidden />
                    {formatDate(event.startsAt)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden />
                    {event.registeredCount}
                    {event.capacity !== null && `/${event.capacity}`}
                  </span>
                  {event.communityName && <Badge variant="neutral">{event.communityName}</Badge>}
                </div>
                {!event.cancelledAt && (
                  <div className="flex justify-end pt-1">
                    {event.myStatus === 'registered' || event.myStatus === 'waitlisted' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingId === event.id}
                        onClick={() => handleCancel(event.id)}
                      >
                        {pendingId === event.id && <Loader2 className="animate-spin" aria-hidden />}
                        Cancelar inscrição
                      </Button>
                    ) : (
                      <Button type="button" size="sm" disabled={pendingId === event.id} onClick={() => handleRegister(event.id)}>
                        {pendingId === event.id && <Loader2 className="animate-spin" aria-hidden />}
                        {full ? 'Entrar na lista de espera' : 'Inscrever-se'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
