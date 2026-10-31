/**
 * Consentimento de cookies do Nexa padrão (Nexa Escolas não usa cookies de medição nem de anúncio).
 * Três categorias: necessários (sempre), medição (Google Analytics) e publicidade (Google AdSense).
 * Guardado num cookie legível pelo servidor e pelo navegador. Módulo puro, para poder ser testado.
 */

export const CONSENT_COOKIE = 'nx_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'nx:consent';
export const CONSENT_OPEN_EVENT = 'nx:open-consent';

export interface Consent {
  v: number;
  /** medição (Analytics) */
  a: boolean;
  /** publicidade (AdSense) */
  p: boolean;
}

export function serializeConsent(c: { a: boolean; p: boolean }): string {
  return encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION, a: c.a, p: c.p } satisfies Consent));
}

export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    if (value.v !== CONSENT_VERSION || typeof value.a !== 'boolean' || typeof value.p !== 'boolean') return null;
    return { v: CONSENT_VERSION, a: value.a, p: value.p };
  } catch {
    return null;
  }
}

export function readConsentFromCookieString(cookies: string): Consent | null {
  const match = cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(match?.slice(CONSENT_COOKIE.length + 1));
}

/** Estado enviado ao Google (Consent Mode v2). */
export function googleConsentState(c: { a: boolean; p: boolean } | null) {
  return {
    analytics_storage: c?.a ? 'granted' : 'denied',
    ad_storage: c?.p ? 'granted' : 'denied',
    // Dados do usuário e personalização para anúncios ficam sempre negados (público majoritariamente menor de idade).
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  } as const;
}
