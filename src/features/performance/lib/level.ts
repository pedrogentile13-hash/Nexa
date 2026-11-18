/**
 * A curva de nível, espelhada do banco.
 *
 * O Postgres decide o nível em `xp_to_level()`:
 *
 *   level = greatest(1, 1 + floor(sqrt(xp / 100)))
 *
 * ou seja, o nível L começa em `100 · (L − 1)²` de XP. Esta função existe
 * porque a tela precisa dizer QUANTO FALTA, e o banco só devolve o nível atual.
 *
 * As duas fórmulas têm que concordar: se a barra prometer um nível a 40 XP e o
 * banco só promover a 300, o aluno estuda, vê a barra encher e nada acontece —
 * um erro silencioso e desmoralizante. O teste em `level.test.ts` compara os
 * mesmos pontos que a função SQL produz.
 */

export function levelForXp(xp: number): number {
  return Math.max(1, 1 + Math.floor(Math.sqrt(Math.max(xp, 0) / 100)));
}

/** XP em que o nível informado começa. */
export function xpForLevel(level: number): number {
  return 100 * Math.max(0, level - 1) ** 2;
}

/** Quanto ainda falta para subir de nível. */
export function xpToNextLevel(xp: number): number {
  const safe = Math.max(0, xp);
  return Math.max(0, xpForLevel(levelForXp(safe) + 1) - safe);
}

/** Progresso dentro do nível atual, de 0 a 100 — é o que a barra desenha. */
export function levelProgressPercent(xp: number): number {
  const safe = Math.max(0, xp);
  const level = levelForXp(safe);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((safe - start) / (end - start)) * 100));
}
