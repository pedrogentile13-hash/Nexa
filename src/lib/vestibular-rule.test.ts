import { describe, expect, it } from 'vitest';
import { vestibularAllowed } from './vestibular-rule';

describe('vestibularAllowed', () => {
  it('chave geral desligada: ninguém vê', () => {
    expect(
      vestibularAllowed({ globalEnabled: false, schoolAccount: true, schoolEnabled: true }),
    ).toBe(false);
    expect(
      vestibularAllowed({ globalEnabled: false, schoolAccount: false, schoolEnabled: null }),
    ).toBe(false);
  });
  it('conta fora de escola só depende da chave geral', () => {
    expect(
      vestibularAllowed({ globalEnabled: true, schoolAccount: false, schoolEnabled: false }),
    ).toBe(true);
  });
  it('conta de escola segue a escolha da escola', () => {
    expect(
      vestibularAllowed({ globalEnabled: true, schoolAccount: true, schoolEnabled: true }),
    ).toBe(true);
    expect(
      vestibularAllowed({ globalEnabled: true, schoolAccount: true, schoolEnabled: false }),
    ).toBe(false);
  });
  it('sem a coluna no banco (SQL pendente), continua ligado como antes', () => {
    expect(
      vestibularAllowed({ globalEnabled: true, schoolAccount: true, schoolEnabled: null }),
    ).toBe(true);
  });
});
