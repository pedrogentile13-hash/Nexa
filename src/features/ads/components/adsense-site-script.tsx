import Script from 'next/script';
import { getTenant } from '@/lib/tenant/server';
import { ADSENSE_CLIENT, ADSENSE_SCRIPT } from '../lib/config';

/**
 * O código do AdSense nas páginas PÚBLICAS do Nexa padrão (entrar, política, termos) — é onde o Google
 * confere o site para aprová-lo. Nunca no endereço de uma escola: lá não existe anúncio.
 * Nas telas do app, quem carrega o script é o `AdBanner`, e só para o plano grátis.
 */
export async function AdsenseSiteScript() {
  if (!ADSENSE_CLIENT || (await getTenant())) return null;
  return <Script async src={ADSENSE_SCRIPT} crossOrigin="anonymous" strategy="afterInteractive" />;
}
