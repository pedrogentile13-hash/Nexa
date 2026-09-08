'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getNotifications, type NotificationItem } from './queries';

/**
 * Ponto único de leitura para o sino, que é client component — precisa de uma
 * Server Action pra chamar, não pode importar `queries.ts` direto (usaria
 * `next/headers` no navegador). Devolve lista + contagem juntas: são sempre
 * consumidas juntas, então é uma ida ao servidor em vez de duas.
 */
export async function getNotificationsData(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const items = await getNotifications();
  return { items, unreadCount: items.filter((n) => !n.readAt).length };
}

export async function markNotificationRead(id: string): Promise<void> {
  if (typeof id !== 'string') return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('read_at', null);

  revalidatePath('/', 'layout');
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  revalidatePath('/', 'layout');
}
