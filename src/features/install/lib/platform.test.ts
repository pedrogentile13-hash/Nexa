import { describe, expect, it } from 'vitest';
import { detectPlatform, isIOS, isSafari, shouldOffer, MAX_DISMISSALS } from './platform';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const DESKTOP_FIREFOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0';

describe('detectPlatform', () => {
  it('usa o instalador nativo quando o navegador o oferece', () => {
    expect(
      detectPlatform({ userAgent: ANDROID_CHROME, isStandalone: false, hasNativePrompt: true }),
    ).toBe('prompt');
  });

  it('ensina o caminho manual no iOS, onde o evento nativo nunca existe', () => {
    // O Safari não implementa beforeinstallprompt e a Apple não oferece API.
    // Oferecer um botão de instalar ali seria um botão que não faz nada.
    expect(detectPlatform({ userAgent: IPHONE, isStandalone: false, hasNativePrompt: false })).toBe(
      'ios',
    );
  });

  it('some quando o app já está instalado', () => {
    expect(detectPlatform({ userAgent: IPHONE, isStandalone: true, hasNativePrompt: false })).toBe(
      'installed',
    );
    expect(
      detectPlatform({ userAgent: ANDROID_CHROME, isStandalone: true, hasNativePrompt: true }),
    ).toBe('installed');
  });

  it('não oferece nada onde instalar não é possível', () => {
    expect(
      detectPlatform({ userAgent: DESKTOP_FIREFOX, isStandalone: false, hasNativePrompt: false }),
    ).toBe('unsupported');
  });

  it('o Chrome no Android antes do evento chegar ainda não convida', () => {
    // O evento pode demorar alguns segundos. Mostrar "instalar" antes dele
    // seria um botão sem nada para chamar.
    expect(
      detectPlatform({ userAgent: ANDROID_CHROME, isStandalone: false, hasNativePrompt: false }),
    ).toBe('unsupported');
  });
});

describe('isIOS / isSafari', () => {
  it('reconhece iPhone e recusa Android', () => {
    expect(isIOS(IPHONE)).toBe(true);
    expect(isIOS(ANDROID_CHROME)).toBe(false);
  });

  it('não confunde Chrome com Safari — os dois trazem "Safari" na string', () => {
    expect(isSafari(IPHONE)).toBe(true);
    expect(isSafari(ANDROID_CHROME)).toBe(false);
  });
});

describe('shouldOffer', () => {
  const now = new Date('2026-09-04T12:00:00Z');

  it('convida quem nunca recusou', () => {
    expect(shouldOffer(null, 0, now)).toBe(true);
  });

  it('não insiste na semana seguinte à recusa', () => {
    expect(shouldOffer('2026-09-01T12:00:00Z', 1, now)).toBe(false);
  });

  it('volta a convidar depois de duas semanas', () => {
    expect(shouldOffer('2026-08-20T12:00:00Z', 1, now)).toBe(true);
  });

  it('para de perguntar depois da segunda recusa, mesmo passado o prazo', () => {
    // Duas recusas são uma resposta. Continuar perguntando é o que ensina as
    // pessoas a fechar banner sem ler.
    expect(shouldOffer('2020-01-01T00:00:00Z', MAX_DISMISSALS, now)).toBe(false);
  });

  it('trata data corrompida como se nunca tivesse recusado', () => {
    expect(shouldOffer('não é data', 0, now)).toBe(true);
  });
});
