import { describe, expect, it } from 'vitest';
import { googleConsentState, parseConsent, readConsentFromCookieString, serializeConsent } from './consent';

describe('consent', () => {
  it('ida e volta', () => {
    const raw = serializeConsent({ a: true, p: false });
    expect(parseConsent(raw)).toEqual({ v: 1, a: true, p: false });
  });
  it('lê do texto de cookies do navegador', () => {
    const cookies = `foo=1; nx_consent=${serializeConsent({ a: false, p: true })}; bar=2`;
    expect(readConsentFromCookieString(cookies)).toEqual({ v: 1, a: false, p: true });
    expect(readConsentFromCookieString('foo=1')).toBeNull();
  });
  it('lixo, versão antiga ou campos errados viram "sem consentimento"', () => {
    expect(parseConsent('%7Bxx')).toBeNull();
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: 0, a: true, p: true })))).toBeNull();
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: 1, a: 'sim', p: true })))).toBeNull();
    expect(parseConsent(null)).toBeNull();
  });
  it('sem consentimento tudo é negado; personalização nunca é concedida', () => {
    expect(googleConsentState(null)).toEqual({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    const all = googleConsentState({ a: true, p: true });
    expect(all.analytics_storage).toBe('granted');
    expect(all.ad_storage).toBe('granted');
    expect(all.ad_personalization).toBe('denied');
  });
});
