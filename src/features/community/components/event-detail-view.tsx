'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Award, Calendar, Loader2, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageMain } from '@/components/layout/page-main';
import {
  cancelEvent,
  cancelEventRegistration,
  checkInManually,
  registerForEvent,
} from '../server/event-actions';
import { EventTicketQr } from './event-ticket-qr';
import type { EventDetail, EventRegistrant, EventTicket } from '../server/event-queries';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
}

export function EventDetailView({
  event: initialEvent,
  ticket: initialTicket,
  registrants: initialRegistrants,
}: {
  event: EventDetail;
  ticket: EventTicket | null;
  registrants: EventRegistrant[] | null;
}) {
  const [event, setEvent] = useState(initialEvent);
  const [ticket, setTicket] = useState(initialTicket);
  const [registrants, setRegistrants] = useState(initialRegistrants);
  const [pending, startTransition] = useTransition();
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const hasEnded = event.endsAt ? new Date(event.endsAt) < new Date() : new Date(event.startsAt) < new Date();
  const full = event.capacity !== null && event.registeredCount >= event.capacity;

  function handleRegister() {
    startTransition(async () => {
      const result = await registerForEvent(event.id);
      if (result.ok) {
        setEvent((e) => ({
          ...e,
          myStatus: result.status,
          registeredCount: result.status === 'registered' ? e.registeredCount + 1 : e.registeredCount,
          waitlistedCount: result.status === 'waitlisted' ? e.waitlistedCount + 1 : e.waitlistedCount,
        }));
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelEventRegistration(event.id);
      setEvent((e) => ({ ...e, myStatus: null }));
      setTicket(null);
    });
  }

  function handleCancelEvent() {
    startTransition(async () => {
      await cancelEvent(event.id);
      setEvent((e) => ({ ...e, cancelledAt: new Date().toISOString() }));
    });
  }

  function handleManualCheckIn(userId: string) {
    setCheckingInId(userId);
    startTransition(async () => {
      await checkInManually(event.id, userId);
      setRegistrants((prev) =>
        (prev ?? []).map((r) => (r.userId === userId ? { ...r, checkedInAt: new Date().toISOString() } : r)),
      );
      setCheckingInId(null);
    });
  }

  return (
    <PageMain variant="reading" className="space-y-4 py-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">{event.title}</h1>
              {event.communityName && <Badge variant="neutral">{event.communityName}</Badge>}
            </div>
            {event.cancelledAt && <Badge variant="danger">Cancelado</Badge>}
          </div>

          {event.description && <p className="text-muted text-sm whitespace-pre-wrap">{event.description}</p>}

          <div className="text-muted space-y-1.5 text-sm">
            <p className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0" aria-hidden />
              {formatDateTime(event.startsAt)}
              {event.endsAt && ` – ${formatDateTime(event.endsAt)}`}
            </p>
            {event.location && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {event.location}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden />
              {event.registeredCount}
              {event.capacity !== null && `/${event.capacity}`} inscritos
              {event.waitlistedCount > 0 && ` · ${event.waitlistedCount} na lista de espera`}
            </p>
          </div>

          {!event.cancelledAt && (
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {event.canManage && (
                <Button type="button" variant="outline" disabled={pending} onClick={handleCancelEvent}>
                  Cancelar evento
                </Button>
              )}
              {event.myStatus === 'registered' || event.myStatus === 'waitlisted' ? (
                <Button type="button" variant="outline" disabled={pending} onClick={handleCancel}>
                  {pending && <Loader2 className="animate-spin" aria-hidden />}
                  Cancelar inscrição
                </Button>
              ) : (
                !hasEnded && (
                  <Button type="button" disabled={pending} onClick={handleRegister}>
                    {pending && <Loader2 className="animate-spin" aria-hidden />}
                    {full ? 'Entrar na lista de espera' : 'Inscrever-se'}
                  </Button>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {ticket?.status === 'registered' && ticket.checkInCode && !ticket.checkedInAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Seu ingresso</CardTitle>
          </CardHeader>
          <CardContent>
            <EventTicketQr eventId={event.id} code={ticket.checkInCode} />
            <p className="text-muted mt-3 text-center text-xs">
              Mostre esse QR pra quem está organizando o evento na entrada.
            </p>
          </CardContent>
        </Card>
      )}

      {ticket?.checkedInAt && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Award className="text-brand size-6 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Presença confirmada!</p>
              {hasEnded && (
                <Link href={`/comunidade/eventos/${event.id}/certificado`} className="text-brand text-sm hover:underline">
                  Ver certificado
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {event.canManage && registrants && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inscritos ({registrants.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {registrants.length === 0 ? (
              <p className="text-muted text-sm">Ninguém se inscreveu ainda.</p>
            ) : (
              registrants.map((r) => (
                <div key={r.userId} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.fullName}</p>
                    <p className="text-subtle text-xs">
                      {r.status === 'waitlisted' ? 'Lista de espera' : 'Inscrito'}
                      {r.checkedInAt && ' · check-in feito'}
                    </p>
                  </div>
                  {r.status === 'registered' && !r.checkedInAt && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={checkingInId === r.userId}
                      onClick={() => handleManualCheckIn(r.userId)}
                    >
                      {checkingInId === r.userId && <Loader2 className="animate-spin" aria-hidden />}
                      Check-in
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </PageMain>
  );
}
