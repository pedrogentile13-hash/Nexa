import { describe, expect, it } from 'vitest';
import { openPassword, sealPassword } from './secret';

describe('sealPassword / openPassword', () => {
  it('volta ao original com a mesma chave', () => {
    expect(openPassword(sealPassword('abcd-1234', 'k1'), 'k1')).toBe('abcd-1234');
  });

  it('não repete o texto cifrado (iv novo a cada vez) e não expõe a senha', () => {
    const a = sealPassword('abcd-1234', 'k1');
    expect(a).not.toBe(sealPassword('abcd-1234', 'k1'));
    expect(a).not.toContain('abcd-1234');
  });

  it('recusa chave errada, formato errado e texto adulterado', () => {
    const sealed = sealPassword('abcd-1234', 'k1');
    expect(openPassword(sealed, 'k2')).toBeNull();
    expect(openPassword('lixo', 'k1')).toBeNull();
    const parts = sealed.split('.');
    parts[3] = Buffer.from('outra coisa').toString('base64url');
    expect(openPassword(parts.join('.'), 'k1')).toBeNull();
  });
});
