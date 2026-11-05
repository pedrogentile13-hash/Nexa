'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeApp } from '@/lib/native';
import { adAllowed, adsPersonalized } from '../lib/placement';
import { ADSENSE_CLIENT as CLIENT, ADSENSE_SLOT as SLOT } from '../lib/config';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[] & { requestNonPersonalizedAds?: number };
  }
}


/**
 * Banner do AdSense, só no Nexa padrão gratuito (o layout só o monta quando `adsEnabled`).
 * Sem `NEXT_PUBLIC_ADSENSE_CLIENT` e o bloco de anúncio configurados, não renderiza nada.
 * O script do AdSense já vem no `<head>` do app (layout raiz). No aplicativo instalado (APK) o anúncio é o AdMob, que é nativo — ver `docs/MONETIZACAO.md`.
 */
export function AdBanner() {
  const pathname = usePathname();
  const pushed = useRef(false);
  // No app Android o anúncio é o AdMob (o AdSense não é permitido em aplicativos).
  const show = Boolean(CLIENT && SLOT) && adAllowed(pathname) && !isNativeApp();

  useEffect(() => {
    if (!show || pushed.current) return;
    pushed.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      if (!adsPersonalized()) window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.push({});
    } catch {
      // anúncio é opcional: nunca derruba a tela
    }
  }, [show]);

  if (!show) return null;
  return (
    <aside aria-label="Publicidade" className="mx-auto w-full max-w-3xl px-4 pb-6">
      <p className="text-subtle mb-1 text-center text-[10px] tracking-wide uppercase">Publicidade</p>
      {/* Key por rota: o AdSense preenche cada <ins> uma única vez. */}
      <ins key={pathname} className="adsbygoogle block min-h-[60px]" style={{ display: 'block' }} data-ad-client={CLIENT} data-ad-slot={SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}
