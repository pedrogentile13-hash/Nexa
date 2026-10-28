'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUsers } from '@/lib/push/send';

/**
 * Mural de avisos oficiais. A regra de QUEM publica e QUEM vê é do banco; estas
 * ações só repassam e cuidam do que o banco não faz (push no aparelho).
 */

export type PublishState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'published'; notified: number };

const publishSchema = z.object({
  title: z.string().trim().min(2, 'Dê um título ao aviso.').max(160),
  body: z.string().trim().min(1, 'Escreva o aviso.').max(4000),
  classId: z.string().uuid().optional(),
  pinned: z.boolean(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function publishAnnouncement(_prev: PublishState, formData: FormData): Promise<PublishState> {
  const parsed = publishSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    classId: formData.get('classId') || undefined,
    pinned: formData.get('pinned') === 'on',
    days: formData.get('days') || undefined,
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };

  const supabase = await createClient();
  const expiresAt = parsed.data.days ? new Date(Date.now() + parsed.data.days * 86_400_000).toISOString() : null;

  const { data, error } = await supabase.rpc('create_announcement', {
    p_title: parsed.data.title,
    p_body: parsed.data.body,
    p_class_id: parsed.data.classId ?? null,
    p_pinned: parsed.data.pinned,
    p_expires_at: expiresAt,
  });

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '42501'
          ? 'Você não pode publicar para esse público. Professores publicam só para as próprias turmas.'
          : error.code === '42883' || error.code === 'PGRST202'
            ? 'Aplique o SQL do mural no Supabase antes de publicar.'
            : 'Não consegui publicar agora. Tente de novo.',
    };
  }

  const row = data?.[0];
  const users = row?.notified_user_ids ?? [];
  if (users.length > 0) {
    // Best-effort: o aviso já está publicado; falha de push não desfaz isso.
    await sendPushToUsers(users, {
      title: parsed.data.title,
      body: parsed.data.body.slice(0, 140),
      link: '/avisos',
    }).catch(() => undefined);
  }

  revalidatePath('/avisos');
  revalidatePath('/admin/mural');
  revalidatePath('/professor/mural');
  return { status: 'published', notified: users.length };
}

/** "Li e entendi": a confirmação que a escola vê. */
export async function markAnnouncementRead(id: string): Promise<void> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc('mark_announcement_read', { p_id: parsed.data });
  revalidatePath('/avisos');
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc('delete_announcement', { p_id: id.data });
  revalidatePath('/avisos');
  revalidatePath('/admin/mural');
  revalidatePath('/professor/mural');
}

export interface Reader {
  userId: string;
  fullName: string;
  className: string | null;
  readAt: string | null;
}

export async function getAnnouncementReaders(id: string): Promise<Reader[]> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('announcement_readers', { p_id: parsed.data });
  if (error || !data) return [];
  return data.map((r) => ({ userId: r.user_id, fullName: r.full_name, className: r.class_name, readAt: r.read_at }));
}
