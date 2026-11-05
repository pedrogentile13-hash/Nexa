/**
 * Freio de tentativas (login). Em memória do processo: barra quem testa senhas em
 * sequência sem precisar de banco. Em vários servidores cada um conta o seu, o que
 * ainda limita o ataque; o Supabase tem o próprio limite por cima.
 */
export interface ThrottleResult {
  allowed: boolean;
  retryAfterSec: number;
}

export function createThrottle(options: { max: number; windowMs: number; now?: () => number }) {
  const { max, windowMs } = options;
  const now = options.now ?? Date.now;
  const hits = new Map<string, number[]>();

  function prune(key: string, t: number): number[] {
    const recent = (hits.get(key) ?? []).filter((at) => t - at < windowMs);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
    return recent;
  }

  return {
    /** Registra uma tentativa e diz se ela pode seguir. */
    hit(key: string): ThrottleResult {
      const t = now();
      const recent = prune(key, t);
      if (recent.length >= max) {
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((recent[0]! + windowMs - t) / 1000)) };
      }
      hits.set(key, [...recent, t]);
      // Limpeza preguiçosa: não deixa o mapa crescer sem fim.
      if (hits.size > 5_000) for (const k of hits.keys()) prune(k, t);
      return { allowed: true, retryAfterSec: 0 };
    },
    /** Login certo zera o contador da pessoa. */
    reset(key: string): void {
      hits.delete(key);
    },
  };
}

/** IP do pedido, pelos cabeçalhos do proxy. Só serve de chave do freio, nunca de decisão de acesso. */
export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'desconhecido';
}

export const loginThrottle = createThrottle({ max: 8, windowMs: 10 * 60_000 });
