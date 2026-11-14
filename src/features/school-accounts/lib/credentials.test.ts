import { describe, expect, it } from 'vitest';
import { cleanTypedLogin, generatePassword, isValidLogin, loginToEmail, normalizeLogin, suggestLogin } from './credentials';

describe('login', () => {
  it('normaliza acento, espaço e símbolos', () => {
    expect(normalizeLogin('  João  Pedro!! ')).toBe('joao.pedro');
    expect(normalizeLogin('Ação_Ñ')).toBe('acao_n');
  });

  it('sugere primeiro.último ignorando partículas', () => {
    expect(suggestLogin('Ana Clara da Silva')).toBe('ana.silva');
    expect(suggestLogin('Maria')).toBe('maria');
    expect(suggestLogin('José de Souza')).toBe('jose.souza');
    expect(suggestLogin('')).toBe('');
  });

  it('valida o mesmo formato da coluna do banco', () => {
    for (const ok of ['ana', 'ana.silva', 'a-b_c.9']) expect(isValidLogin(ok)).toBe(true);
    for (const bad of ['an', 'Ana', '.ana', 'ana silva', 'ana@x', 'a'.repeat(31)]) expect(isValidLogin(bad)).toBe(false);
  });

  it('fabrica o e-mail com o endereço da escola e ignora maiúsculas do host', () => {
    expect(loginToEmail('ana.silva', 'AngloMorumbi.nexastudy.com.br')).toBe('ana.silva@anglomorumbi.nexastudy.com.br');
  });

  it('cleanTypedLogin aceita quem digita com maiúscula ou espaço', () => {
    expect(cleanTypedLogin('  Ana.Silva ')).toBe('ana.silva');
  });
});

describe('generatePassword', () => {
  it('tem o formato xxxx-xxxx sem caracteres ambíguos', () => {
    for (let i = 0; i < 200; i += 1) {
      const p = generatePassword();
      expect(p).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}$/);
      expect(p).not.toMatch(/[0o1li]/);
    }
  });

  it('não repete (entropia mínima)', () => {
    const seen = new Set(Array.from({ length: 500 }, () => generatePassword()));
    expect(seen.size).toBe(500);
  });

  it('descarta bytes que enviesariam a distribuição', () => {
    // 255 fica acima do limite e é ignorado; só os bytes 0..30 viram letras.
    let call = 0;
    const p = generatePassword(() => {
      call += 1;
      return call === 1 ? new Uint8Array(16).fill(255) : Uint8Array.from({ length: 16 }, (_, i) => i);
    });
    expect(call).toBeGreaterThan(1);
    expect(p).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}$/);
  });
});
