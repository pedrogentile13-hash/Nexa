'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import type { EventRegistrationStatus } from '@/types/database.types';
import { listEvents, type EventSummary } from './event-queries';

/** Wrapper de Server Action — `event-queries.ts` não é `'use server'` (é usado também de Server Components). */
export async function getEventsList(): Promise<EventSummary[]> {
  return listEvents();
}

const createEventSchema = z.object({
  title: z.string().trim().min(2, 'Dê um título ao evento.').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  startsAt: z.string().min(1, 'Escolha data e hora de início.'),
  endsAt: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().int().positive().optional(),
});

export type CreateEventState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; eventId: string };

/**
 * Cria um evento dentro de uma comunidade — a única origem exposta na UI
 * nesta rodada. `create_event` também aceita `p_school_id` para admin criar
 * evento fora de comunidade, mas essa tela fica para uma fase futura.
 */
export async function createCommunityEvent(
  communityId: string,
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  if (!(await isFeatureEnabled('events_enabled'))) {
    return { status: 'error', message: 'Eventos ainda não estão disponíveis.' };
  }

  const parsed = createEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || '',
    location: formData.get('location') || '',
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt') || '',
    capacity: formData.get('capacity') || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_event', {
    p_title: parsed.data.title,
    p_starts_at: new Date(parsed.data.startsAt).toISOString(),
    p_description: parsed.data.description || null,
    p_location: parsed.data.location || null,
    p_ends_at: parsed.data.endsAt ? new Date(parsed.data.endsAt).toISOString() : null,
    p_capacity: parsed.data.capacity ?? null,
    p_community_id: communityId,
  });
  if (error || !data) return { status: 'error', message: 'Não consegui criar o evento agora.' };

  revalidatePath('/comunidade');
  revalidatePath(`/comunidade/c/${communityId}`);
  return { status: 'ok', eventId: data };
}

export async function registerForEvent(eventId: string): Promise<{ ok: true; status: EventRegistrationStatus } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('register_for_event', { p_event_id: eventId });
  if (error || !data) return { ok: false, message: 'Não consegui confirmar sua inscrição agora.' };
  revalidatePath('/comunidade/eventos');
  revalidatePath(`/comunidade/eventos/${eventId}`);
  revalidatePath('/agenda');
  return { ok: true, status: data };
}

export async function cancelEventRegistration(eventId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('cancel_registration', { p_event_id: eventId });
  revalidatePath('/comunidade/eventos');
  revalidatePath(`/comunidade/eventos/${eventId}`);
  revalidatePath('/agenda');
}

export async function cancelEvent(eventId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('cancel_event', { p_event_id: eventId });
  revalidatePath('/comunidade/eventos');
  revalidatePath(`/comunidade/eventos/${eventId}`);
}

export async function checkInByCode(
  code: string,
): Promise<{ ok: true; fullName: string; eventTitle: string } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('check_in_by_code', { p_code: code });
  const row = data?.[0];
  if (error || !row) {
    return { ok: false, message: error?.message ?? 'Código inválido.' };
  }
  return { ok: true, fullName: row.full_name ?? 'Sem nome', eventTitle: row.event_title };
}

export async function checkInManually(eventId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('check_in_manually', { p_event_id: eventId, p_user_id: userId });
  revalidatePath(`/comunidade/eventos/${eventId}`);
}
