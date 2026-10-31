import { describe, expect, it } from 'vitest';
import { adAllowed, adsPersonalized } from './placement';

describe('adAllowed', () => {
  it.each(['/hoje', '/estudar', '/agenda', '/desempenho', '/vestibular/trilhas'])('permite em %s', (p) => expect(adAllowed(p)).toBe(true));
  it.each(['/nexa-ia', '/pro', '/revisoes', '/estudar/abc/simulado', '/estudar/abc/quiz/1', '/perfil', '/escola', '/admin'])('bloqueia em %s', (p) => expect(adAllowed(p)).toBe(false));
});

describe('adsPersonalized', () => {
  it('desligado por padrão', () => {
    expect(adsPersonalized({})).toBe(false);
    expect(adsPersonalized({ NEXT_PUBLIC_ADS_PERSONALIZED: '1' })).toBe(true);
  });
});
