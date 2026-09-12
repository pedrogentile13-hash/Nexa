import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Envio de push de verdade — o outro lado de `push_subscriptions`
 * (`20260908000800_notifications.sql`), gravada desde a fase de notificações
 * mas nunca lida por nada até agora.
 *
 * Efeito colateral A MAIS, nunca substituto: quem chama isto já gravou a
 * notificação in-app (via `notify_subject_students`/`notify_class`/
 * `notify_user`) antes — o aluno sempre vê o aviso no sininho mesmo sem
 * push configurado, sem permissão concedida, ou sem nenhuma assinatura ativa.
 *
 * VAPID/`SUPABASE_SERVICE_ROLE_KEY` ausentes = no-op silencioso, mesmo
 * espírito do `GROQ_API_KEY` ausente na Nexa IA — a feature nunca derruba o
 * que já funciona.
 */

export interface PushPayload {
  title: string;
  body?: string;
  link?: string;
}

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  if (!ensureConfigured()) return;

  const supabase = createAdminClient();
  if (!supabase) return;

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .in('user_id', userIds);
  if (!subscriptions || subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  const deadIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          body,
        );
      } catch (err) {
        // 404/410 = o navegador cancelou a assinatura (desinstalou, limpou
        // dados, trocou de aparelho) — a linha em `push_subscriptions` virou
        // lixo e nunca mais vai funcionar sozinha.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) deadIds.push(sub.id);
        else console.error('[push] falha ao enviar', status, err);
      }
    }),
  );

  if (deadIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', deadIds);
  }
}
