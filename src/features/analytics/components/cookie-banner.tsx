'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CONSENT_COOKIE,
  CONSENT_EVENT,
  CONSENT_OPEN_EVENT,
  googleConsentState,
  readConsentFromCookieString,
  serializeConsent,
} from '../lib/consent';

/** Aviso de cookies do Nexa padrão: "só o necessário" tem o mesmo peso de "aceitar", e nada de medição ou anúncio vale antes da escolha. */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const saved = readConsentFromCookieString(document.cookie);
    if (saved) {
      setAnalytics(saved.a);
      setAds(saved.p);
    } else {
      setOpen(true);
    }
    const reopen = () => {
      const current = readConsentFromCookieString(document.cookie);
      setAnalytics(current?.a ?? false);
      setAds(current?.p ?? false);
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  function save(a: boolean, p: boolean) {
    try {
      document.cookie = `${CONSENT_COOKIE}=${serializeConsent({ a, p })}; path=/; max-age=31536000; samesite=lax`;
      window.gtag?.('consent', 'update', googleConsentState({ a, p }));
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { a, p } }));
    } catch {
      // sem cookie: a escolha vale só até recarregar
    }
    setOpen(false);
    setCustomize(false);
  }

  if (!open) return null;

  const button = 'h-11 rounded-full px-5 text-sm font-semibold';
  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[60] md:right-auto md:bottom-4 md:left-4 md:max-w-md">
      <div className="bg-surface border-border rounded-3xl border p-5 shadow-2xl">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Cookie className="text-brand-text size-4" aria-hidden /> Cookies no Nexa
        </p>
        <p className="text-muted mt-1.5 text-sm leading-relaxed">
          Usamos cookies necessários para o app funcionar. Com a sua permissão, também medimos o uso (Google Analytics) e mostramos anúncios (Google AdSense). Menores de 18 anos devem pedir ajuda a um responsável.{' '}
          <Link href="/politica-de-privacidade" className="text-brand-text underline">Saiba mais</Link>.
        </p>

        {customize && (
          <div className="mt-3 space-y-2 text-sm">
            <label className="bg-surface-2 flex items-center gap-3 rounded-2xl px-4 py-3 opacity-70">
              <input type="checkbox" checked disabled className="size-4" />
              <span><b>Necessários</b> — sempre ativos</span>
            </label>
            <label className="bg-surface-2 flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3">
              <input type="checkbox" className="size-4" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              <span><b>Medição</b> — como o app é usado</span>
            </label>
            <label className="bg-surface-2 flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3">
              <input type="checkbox" className="size-4" checked={ads} onChange={(e) => setAds(e.target.checked)} />
              <span><b>Publicidade</b> — anúncios (não personalizados)</span>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {customize ? (
            <button type="button" onClick={() => save(analytics, ads)} className={cn(button, 'bg-brand text-brand-fg flex-1')}>Salvar escolha</button>
          ) : (
            <>
              <button type="button" onClick={() => save(true, true)} className={cn(button, 'bg-brand text-brand-fg flex-1')}>Aceitar tudo</button>
              <button type="button" onClick={() => save(false, false)} className={cn(button, 'border-border bg-surface flex-1 border')}>Só o necessário</button>
              <button type="button" onClick={() => setCustomize(true)} className="text-muted h-11 w-full text-sm font-medium underline">Escolher</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Botão discreto para reabrir a escolha (rodapé da página inicial e da política). */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      Preferências de cookies
    </button>
  );
}
