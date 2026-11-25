'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUsers } from '@/lib/push/send';
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

/**
 * Grava a assinatura de push do navegador atual — chamada pelo hook
 * `use-push-subscription` depois que `pushManager.subscribe()` já rodou no
 * cliente. `onConflict: 'endpoint'` reatribui a mesma assinatura a quem
 * estiver logado agora, caso o mesmo navegador troque de conta.
 */
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  authKey: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.authKey },
      { onConflict: 'endpoint' },
    );
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
}

/**
 * Botão de autoteste em `/perfil` — não há como testar entrega de push de
 * dentro do ambiente de desenvolvimento (não tem HTTPS público), então quem
 * confirma que a configuração (VAPID + service role) está certa é o próprio
 * usuário, no aparelho dele.
 */
export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const { count } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (!count) {
    return { ok: false, message: 'Ative os avisos no sino (ícone no topo) antes de testar.' };
  }

  await sendPushToUsers([user.id], {
    title: 'Teste da Nexa Study',
    body: 'Se você está vendo isto, o push está funcionando.',
    link: '/perfil',
  });
  return { ok: true, message: 'Enviado — confira as notificações do sistema em alguns segundos.' };
}
