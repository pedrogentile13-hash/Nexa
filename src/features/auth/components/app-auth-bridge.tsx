'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { createClient } from '@/lib/supabase/client';

/**
 * Ponte do login com Google no app Android.
 *
 * O Google não deixa o login acontecer dentro da janela do app, então ele abre no navegador do celular e volta
 * pelo link `br.com.nexastudy.app://auth#access_token=…`. Aqui o app recebe esse link, grava a sessão e entra.
 */
export function AppAuthBridge() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    void App.addListener('appUrlOpen', async ({ url }) => {
      try {
        if (!url.startsWith('br.com.nexastudy.app://auth')) return;
        const params = new URLSearchParams(url.split('#')[1] ?? '');
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (!access_token || !refresh_token) return;
        const { error } = await createClient().auth.setSession({ access_token, refresh_token });
        await Browser.close().catch(() => undefined);
        window.location.href = error ? '/login?erro=' + encodeURIComponent('Não consegui entrar com o Google. Tente de novo.') : '/hoje';
      } catch {
        // link inválido: ignora
      }
    }).then((handle) => {
      remove = () => void handle.remove();
    });
    return () => remove?.();
  }, []);

  return null;
}
