import { describe, expect, it } from 'vitest';
import { clientIp, createThrottle } from './throttle';

describe('createThrottle', () => {
  it('deixa passar até o limite e barra a próxima, dizendo quanto esperar', () => {
    let t = 0;
    const th = createThrottle({ max: 3, windowMs: 60_000, now: () => t });
    expect(th.hit('a').allowed).toBe(true);
    expect(th.hit('a').allowed).toBe(true);
    expect(th.hit('a').allowed).toBe(true);
    t = 10_000;
    const blocked = th.hit('a');
    expect(blocked).toEqual({ allowed: false, retryAfterSec: 50 });
  });

  it('cada chave tem o seu contador e a janela expira', () => {
    let t = 0;
    const th = createThrottle({ max: 1, windowMs: 1_000, now: () => t });
    expect(th.hit('a').allowed).toBe(true);
    expect(th.hit('b').allowed).toBe(true);
    expect(th.hit('a').allowed).toBe(false);
    t = 1_001;
    expect(th.hit('a').allowed).toBe(true);
  });

  it('login certo zera o contador', () => {
    const th = createThrottle({ max: 1, windowMs: 60_000 });
    th.hit('a');
    th.reset('a');
    expect(th.hit('a').allowed).toBe(true);
  });
});

describe('clientIp', () => {
  it('pega o primeiro IP da lista do proxy', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
    expect(clientIp(new Headers())).toBe('desconhecido');
  });
});
