/** Código público do AdSense (aparece no HTML de qualquer site; não é segredo). Pode ser trocado pela variável de ambiente. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-1522563448244366';
/** Bloco de anúncio (criado em AdSense → Anúncios → Por bloco de anúncios). Sem ele, o banner não aparece. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;
export const ADSENSE_SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/** Google Analytics 4 (código público de medição). Só no Nexa padrão: nunca no endereço de uma escola. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-LP9BK2R9GD';
export const GA_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
/**
 * Analytics só depois da permissão, e com o Consent Mode do Google: tudo "negado" até a pessoa escolher.
 * Configuração conservadora, porque boa parte do público é menor de idade: sem sinais do Google para publicidade,
 * sem personalização e sem parâmetros no endereço da página (podem carregar ids).
 */
export const GA_INIT = `
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  var started = false;
  function start() {
    if (started) return;
    started = true;
    window.__nxAnalytics = true;
    gtag('js', new Date());
    gtag('config', '${GA_ID}', { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname });
    var s = document.createElement('script');
    s.async = true;
    s.src = '${GA_SCRIPT}';
    document.head.appendChild(s);
  }
  function apply(c) {
    gtag('consent', 'update', { analytics_storage: c.a ? 'granted' : 'denied', ad_storage: c.p ? 'granted' : 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    if (c.a) start();
  }
  try {
    var m = document.cookie.match(/(?:^|; )nx_consent=([^;]+)/);
    if (m) { var c = JSON.parse(decodeURIComponent(m[1])); if (c && c.v === 1) apply(c); }
  } catch (e) {}
  window.addEventListener('nx:consent', function (e) { if (e.detail) apply(e.detail); });
})();
`;
