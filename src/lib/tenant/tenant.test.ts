import { describe, expect, it } from 'vitest';
import { classifyHost, effectiveHost, normalizeHost } from './host';
import { contrastRatio, safeBrandVars } from './brand';

describe('normalizeHost', () => {
  it('tira porta, ponto final, maiúsculas e pega o primeiro de uma lista', () => {
    expect(normalizeHost('Anglo.NexaStudy.com.br:443')).toBe('anglo.nexastudy.com.br');
    expect(normalizeHost('a.b.com.')).toBe('a.b.com');
    expect(normalizeHost('x.com, y.com')).toBe('x.com');
    expect(normalizeHost(null)).toBe('');
  });
});

describe('effectiveHost', () => {
  const base = { host: 'nexastudy.com.br', forwardedHost: 'anglo.nexastudy.com.br', expectedSecret: 's3gredo' };

  it('aceita o cabeçalho encaminhado quando o segredo confere', () => {
    expect(effectiveHost({ ...base, secretHeader: 's3gredo' })).toBe('anglo.nexastudy.com.br');
  });

  it('IGNORA o cabeçalho com segredo errado, ausente ou sem segredo configurado', () => {
    expect(effectiveHost({ ...base, secretHeader: 'errado' })).toBe('nexastudy.com.br');
    expect(effectiveHost({ ...base, secretHeader: undefined })).toBe('nexastudy.com.br');
    expect(effectiveHost({ ...base, secretHeader: 'x', expectedSecret: undefined })).toBe('nexastudy.com.br');
  });
});

describe('classifyHost', () => {
  const root = 'nexastudy.com.br';

  it('é desligado sem domínio raiz e para o próprio domínio / localhost', () => {
    expect(classifyHost('anglo.nexastudy.com.br', undefined)).toEqual({ kind: 'none' });
    expect(classifyHost('nexastudy.com.br', root)).toEqual({ kind: 'none' });
    expect(classifyHost('localhost', root)).toEqual({ kind: 'none' });
    expect(classifyHost('evil-nexastudy.com.br', root)).toEqual({ kind: 'none' });
  });

  it('subdomínio simples vira candidato; reservado não', () => {
    expect(classifyHost('anglomorumbi.nexastudy.com.br', root)).toEqual({ kind: 'candidate', host: 'anglomorumbi.nexastudy.com.br' });
    expect(classifyHost('www.nexastudy.com.br', root)).toEqual({ kind: 'reserved' });
    expect(classifyHost('admin.nexastudy.com.br', root)).toEqual({ kind: 'reserved' });
  });

  it('só um nível de subdomínio', () => {
    expect(classifyHost('a.b.nexastudy.com.br', root)).toEqual({ kind: 'none' });
  });
});

describe('safeBrandVars', () => {
  it('aceita roxo escuro, que passa nos três contrastes', () => {
    const vars = safeBrandVars({ brand: '#6d28d9', brand_text: '#5b21b6', brand_soft: '#f1ebfd' });
    expect(vars).toMatchObject({ '--brand': '#6d28d9', '--brand-fg': '#ffffff' });
  });

  it('recusa amarelo claro (texto branco ilegível) e cores faltando ou inválidas', () => {
    expect(safeBrandVars({ brand: '#ffe066', brand_text: '#5b21b6', brand_soft: '#f1ebfd' })).toBeNull();
    expect(safeBrandVars({ brand: '#6d28d9', brand_text: null, brand_soft: '#f1ebfd' })).toBeNull();
    expect(safeBrandVars({ brand: 'red', brand_text: '#5b21b6', brand_soft: '#f1ebfd' })).toBeNull();
  });

  it('contraste preto/branco é 21', () => {
    expect(Math.round(contrastRatio('#000000', '#ffffff'))).toBe(21);
  });
});
