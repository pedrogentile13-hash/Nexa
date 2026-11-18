import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Confere a assinatura do webhook do Stripe (cabeçalho `Stripe-Signature`:
 * `t=<timestamp>,v1=<hmac>[,v1=<hmac>]`, com HMAC-SHA256 de `"<t>.<corpo>"`).
 * Sem a biblioteca oficial de propósito: é uma conta curta e não traz dependência nova.
 * O corpo precisa ser o TEXTO CRU da requisição — reserializar o JSON muda os bytes e invalida a assinatura.
 */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('=') as [string, string]);
  const t = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || signatures.length === 0) return false;
  if (!/^\d+$/.test(t) || Math.abs(nowSec - Number(t)) > toleranceSec) return false;

  const expected = createHmac('sha256', secret).update(`${t}.${payload}`, 'utf8').digest();
  return signatures.some((sig) => {
    if (!/^[0-9a-f]{64}$/i.test(sig)) return false;
    return timingSafeEqual(expected, Buffer.from(sig, 'hex'));
  });
}
