import { createHash } from 'crypto';

/**
 * Deriva um uuid determinístico de `parts` (mesma entrada → sempre o mesmo
 * id). Usado como `source_id` de `award_xp` para recompensas que se repetem
 * por dia — ex.: um item de rotina concluído hoje e de novo amanhã precisa
 * de dois ids diferentes (senão a dedup de `award_xp` bloqueia o segundo dia
 * pra sempre), mas marcar/desmarcar o MESMO item no MESMO dia precisa do
 * mesmo id (senão cada toggle vira XP novo). Um hash de `parts` resolve as
 * duas coisas sem precisar de uma coluna nova nem de uma tabela auxiliar.
 */
export function dailySourceId(...parts: string[]): string {
  const hash = createHash('md5').update(parts.join(':')).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}
