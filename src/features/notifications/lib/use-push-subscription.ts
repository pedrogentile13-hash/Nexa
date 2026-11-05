'use client';

import { useCallback, useEffect, useState } from 'react';
import { removePushSubscription, savePushSubscription } from '../server/actions';

/**
 * Assinatura de push do navegador atual — registra o service worker, pede
 * permissão, assina via `pushManager` e grava em `push_subscriptions`.
 *
 * `unsupported` cobre Safari antigo/iOS sem PWA instalado e qualquer
 * navegador sem Push API — o botão que usa este hook simplesmente não
 * aparece nesse caso, em vez de mostrar um erro.
 */

export type PushSubscriptionState = 'unsupported' | 'unsubscribed' | 'subscribed' | 'denied';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [state, setState] = useState<PushSubscriptionState>('unsubscribed');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'subscribed' : 'unsubscribed'))
      .catch(() => setState('unsubscribed'));
  }, []);

  const subscribe = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

      await savePushSubscription({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        authKey: json.keys.auth,
      });
      setState('subscribed');
    } finally {
      setPending(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState('unsubscribed');
    } finally {
      setPending(false);
    }
  }, []);

  return { state, pending, subscribe, unsubscribe };
}
