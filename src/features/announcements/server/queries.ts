import { createClient } from '@/lib/supabase/server';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorName: string;
  className: string | null;
  pinned: boolean;
  createdAt: string;
  isRead: boolean;
  canManage: boolean;
  readCount: number | null;
  audienceSize: number | null;
}

/** Antes do SQL do mural rodar, a função não existe: devolve vazio em vez de quebrar a tela. */
export async function listAnnouncements(limit = 50): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_announcements', { p_limit: limit });
  if (error || !data) return [];
  return data.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    authorName: a.author_name,
    className: a.class_name,
    pinned: a.pinned,
    createdAt: a.created_at,
    isRead: a.is_read,
    canManage: a.can_manage,
    readCount: a.read_count,
    audienceSize: a.audience_size,
  }));
}

export async function unreadAnnouncementsCount(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('unread_announcements_count');
  return error || typeof data !== 'number' ? 0 : data;
}
