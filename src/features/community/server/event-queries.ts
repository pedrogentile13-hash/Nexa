import { createClient } from '@/lib/supabase/server';
import type { EventDetailRpcRow, EventListRpcRow, EventRegistrantRpcRow, EventRegistrationStatus } from '@/types/database.types';

export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  communityId: string | null;
  communityName: string | null;
  cancelledAt: string | null;
  registeredCount: number;
  myStatus: EventRegistrationStatus | null;
  canManage: boolean;
}

export interface EventDetail extends EventSummary {
  waitlistedCount: number;
}

export interface EventRegistrant {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  status: EventRegistrationStatus;
  registeredAt: string;
  checkedInAt: string | null;
}

function mapSummary(row: EventListRpcRow): EventSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    communityId: row.community_id,
    communityName: row.community_name,
    cancelledAt: row.cancelled_at,
    registeredCount: row.registered_count,
    myStatus: row.my_status,
    canManage: row.can_manage,
  };
}

/**
 * Eventos escolares (Fases 7-10). `list_events`/`get_event` já resolvem
 * visibilidade (escola/comunidade/pública) e o status de inscrição de quem
 * chama — nada aqui precisa consultar `events`/`event_registrations` direto.
 */
export async function listEvents(upcomingOnly = true): Promise<EventSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_events', { p_upcoming_only: upcomingOnly });
  if (error || !data) return [];
  return data.map(mapSummary);
}

export async function getEvent(eventId: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_event', { p_event_id: eventId });
  const row = (data as EventDetailRpcRow[] | null)?.[0];
  if (error || !row) return null;
  return { ...mapSummary(row), waitlistedCount: row.waitlisted_count };
}

export async function listEventRegistrants(eventId: string): Promise<EventRegistrant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_event_registrants', { p_event_id: eventId });
  if (error || !data) return [];
  return data.map((row: EventRegistrantRpcRow) => ({
    userId: row.user_id,
    fullName: row.full_name ?? 'Sem nome',
    avatarUrl: row.avatar_url,
    status: row.status,
    registeredAt: row.registered_at,
    checkedInAt: row.checked_in_at,
  }));
}

export interface EventTicket {
  status: EventRegistrationStatus;
  checkInCode: string | null;
  checkedInAt: string | null;
}

export async function getMyEventTicket(eventId: string): Promise<EventTicket | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_my_event_ticket', { p_event_id: eventId });
  const row = data?.[0];
  if (error || !row) return null;
  return { status: row.status, checkInCode: row.check_in_code, checkedInAt: row.checked_in_at };
}

export interface EventCertificate {
  issuedAt: string;
  eventTitle: string;
  fullName: string;
  eventDate: string;
}

export async function getMyCertificate(eventId: string): Promise<EventCertificate | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_my_certificate', { p_event_id: eventId });
  // A RPC já devolve a mensagem certa em português pra cada caso (evento não
  // terminou, sem check-in) — repassa direto em vez de traduzir de novo aqui.
  if (error) return { error: error.message };
  const row = data?.[0];
  if (!row) return { error: 'Certificado não encontrado.' };
  return {
    issuedAt: row.issued_at,
    eventTitle: row.event_title,
    fullName: row.full_name ?? 'Sem nome',
    eventDate: row.event_date,
  };
}
