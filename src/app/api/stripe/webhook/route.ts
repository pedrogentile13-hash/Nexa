import { verifyStripeSignature } from '@/lib/stripe/signature';
import { applyStripeEvent } from '@/features/billing/server/stripe-sync';

export const dynamic = 'force-dynamic';

/**
 * Webhook do Stripe. Não tem login (quem chama é o Stripe): a proteção é a ASSINATURA do corpo cru.
 * Responde 200 também para eventos repetidos ou que não nos interessam, para o Stripe parar de reenviar;
 * 5xx só quando algo nosso falhou (aí o Stripe tenta de novo).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook não configurado', { status: 503 });

  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), secret)) {
    return new Response('Assinatura inválida', { status: 400 });
  }

  let event: Parameters<typeof applyStripeEvent>[0];
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response('Corpo inválido', { status: 400 });
  }

  const result = await applyStripeEvent(event);
  return new Response(result, { status: result === 'unavailable' ? 503 : 200 });
}
