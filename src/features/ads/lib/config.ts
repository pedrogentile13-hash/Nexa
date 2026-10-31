/** Código público do AdSense (aparece no HTML de qualquer site; não é segredo). Pode ser trocado pela variável de ambiente. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-1522563448244366';
/** Bloco de anúncio (criado em AdSense → Anúncios → Por bloco de anúncios). Sem ele, o banner não aparece. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;
export const ADSENSE_SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/** Google Analytics 4 (código público de medição). Só no Nexa padrão: nunca no endereço de uma escola. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-LP9BK2R9GD';
export const GA_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
/**
 * Configuração conservadora, porque boa parte do público é menor de idade: sem sinais do Google para
 * publicidade, sem personalização de anúncios e sem endereço da página com parâmetros (que podem ter ids).
 */
export const GA_INIT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
  page_location: location.origin + location.pathname,
});
`;
