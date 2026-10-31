import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyStripeSignature } from './signature';

const secret = 'whsec_test';
const body = '{"id":"evt_1","type":"ping"}';
const sign = (t: number, payload = body) => createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');

describe('verifyStripeSignature', () => {
  const now = 1_800_000_000;
  it('aceita assinatura válida', () => {
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(now)}`, secret, 300, now)).toBe(true);
  });
  it('aceita se uma das assinaturas bate (troca de segredo)', () => {
    expect(verifyStripeSignature(body, `t=${now},v1=${'0'.repeat(64)},v1=${sign(now)}`, secret, 300, now)).toBe(true);
  });
  it('recusa corpo adulterado', () => {
    expect(verifyStripeSignature(body + ' ', `t=${now},v1=${sign(now)}`, secret, 300, now)).toBe(false);
  });
  it('recusa segredo errado, cabeçalho vazio e lixo', () => {
    expect(verifyStripeSignature(body, `t=${now},v1=${sign(now)}`, 'outro', 300, now)).toBe(false);
    expect(verifyStripeSignature(body, null, secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(body, 't=abc,v1=zzz', secret, 300, now)).toBe(false);
  });
  it('recusa evento velho demais (replay)', () => {
    expect(verifyStripeSignature(body, `t=${now - 1000},v1=${sign(now - 1000)}`, secret, 300, now)).toBe(false);
  });
});
