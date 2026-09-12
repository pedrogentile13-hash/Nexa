/**
 * Formata e arredonda notas — automáticas agora, mas a matemática de exibição
 * não mudou: continua escala-agnóstica, só não recebe mais um `RoundingMode`
 * por esquema, porque não existe mais esquema. Tudo aqui é half-up.
 */

/**
 * Arredonda uma nota para EXIBIÇÃO. Nunca realimente o resultado numa conta:
 * arredondar médias intermediárias é como um 6,95 vira 6,9 vira 7.
 *
 * O ingênuo `Math.round(v * 10 ** d) / 10 ** d` erra o suficiente pra importar
 * aqui — `1.005 * 100` é `100.49999999999999` em IEEE 754, então uma média de
 * 1,005 apareceria como 1,00 e o aluno juraria que o app está quebrado. O
 * empurrão de epsilon abaixo corrige os casos de valor representável.
 */
export function roundGrade(value: number, decimals = 1): number {
  if (!Number.isFinite(value)) return value;

  const factor = 10 ** decimals;
  const scaled = value * factor;
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4;
  const nudged = scaled + (scaled >= 0 ? epsilon : -epsilon);

  return Math.round(nudged) / factor;
}

/** Formata uma nota como ela aparece na UI, em pt-BR (vírgula decimal). */
export function formatGrade(
  value: number | null | undefined,
  decimals = 1,
  locale = 'pt-BR',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return roundGrade(value, decimals).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Confina um valor a um intervalo inclusivo. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
