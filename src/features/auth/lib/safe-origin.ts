import { env } from '@/lib/env';

/** IPv4 cru (com ou sem porta) — nunca é um domínio público real, sempre indício de
 * proxy repassando o endereço interno onde o servidor escuta (ex.: `0.0.0.0`). */
const RAW_IPV4_HOST = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;

/**
 * Origem pública confiável do request atual.
 *
 * `x-forwarded-host` só é usado quando parece um domínio de verdade — alguns
 * proxies (visto na Hostinger) repassam o endereço interno de bind do
 * servidor (`0.0.0.0`) nesse cabeçalho em vez do host público, o que mandaria
 * qualquer redirect (OAuth, confirmação de e-mail, redefinição de senha)
 * para um endereço que o navegador do usuário não alcança.
 * `NEXT_PUBLIC_SITE_URL`, configurada à mão, nunca tem esse problema — por
 * isso é sempre o fallback.
 */
export function safeOrigin(forwardedHost: string | null, forwardedProto: string | null): string {
  if (forwardedHost && !RAW_IPV4_HOST.test(forwardedHost)) {
    return `${forwardedProto ?? 'https'}://${forwardedHost}`;
  }
  return env.NEXT_PUBLIC_SITE_URL;
}
