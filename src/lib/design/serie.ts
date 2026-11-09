/**
 * Séries do Nexa Study (6º ano do Fundamental II ao 3º ano do Ensino Médio) e a idade aproximada de cada uma.
 * `value` é exatamente o texto gravado em `resources.grade_levels` e em `profiles.grade_level`.
 */
export interface Serie {
  value: string;
  label: string;
  /** Idade aproximada de quem cursa a série na idade certa. */
  age: number;
}

export const SERIES: Serie[] = [
  { value: '6º ano', label: '6º ano', age: 11 },
  { value: '7º ano', label: '7º ano', age: 12 },
  { value: '8º ano', label: '8º ano', age: 13 },
  { value: '9º ano', label: '9º ano', age: 14 },
  { value: '1ª série EM', label: '1º ano do Médio', age: 15 },
  { value: '2ª série EM', label: '2º ano do Médio', age: 16 },
  { value: '3ª série EM', label: '3º ano do Médio', age: 17 },
];

/** "6º ano · ~11 anos". */
export function serieOptionLabel(serie: Serie): string {
  return `${serie.label} · ~${serie.age} anos`;
}

export function findSerie(value: string | null | undefined): Serie | null {
  return SERIES.find((s) => s.value === value) ?? null;
}

/** Um conteúdo sem série marcada vale para todas; com séries, só para elas. */
export function matchesSerie(gradeLevels: readonly string[], serie: string): boolean {
  return gradeLevels.length === 0 || gradeLevels.includes(serie);
}
