import { notFound, redirect } from 'next/navigation';
import { EventDetailView } from '@/features/community/components/event-detail-view';
import { getEvent, getMyEventTicket, listEventRegistrants } from '@/features/community/server/event-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('events_enabled'))) redirect('/comunidade');

  const event = await getEvent(id);
  if (!event) notFound();

  const [ticket, registrants] = await Promise.all([
    getMyEventTicket(id),
    event.canManage ? listEventRegistrants(id) : Promise.resolve(null),
  ]);

  return <EventDetailView event={event} ticket={ticket} registrants={registrants} />;
}
