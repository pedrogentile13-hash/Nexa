/** Código público do AdSense (aparece no HTML de qualquer site; não é segredo). Pode ser trocado pela variável de ambiente. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-1522563448244366';
/** Bloco de anúncio (criado em AdSense → Anúncios → Por bloco de anúncios). Sem ele, o banner não aparece. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;
export const ADSENSE_SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
