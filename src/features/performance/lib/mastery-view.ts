export type MasteryStatus = 'dominado' | 'desenvolvimento' | 'revisar';

export interface MasteryRow {
  name: string;
  group: string;
  correct: number;
  total: number;
  percent: number;
  status: MasteryStatus;
}

export const STATUS_ORDER: MasteryStatus[] = ['revisar', 'desenvolvimento', 'dominado'];

export function countByStatus(rows: MasteryRow[]): Record<MasteryStatus, number> {
  const out: Record<MasteryStatus, number> = { revisar: 0, desenvolvimento: 0, dominado: 0 };
  for (const r of rows) out[r.status] += 1;
  return out;
}

export interface MasteryGroup {
  name: string;
  rows: MasteryRow[];
  counts: Record<MasteryStatus, number>;
  /** Média simples do acerto dos assuntos do grupo (0–100). */
  average: number;
}

/** Agrupa por matéria; matérias com mais "revisar" primeiro, e dentro de cada uma o assunto mais fraco primeiro. */
export function groupMastery(rows: MasteryRow[]): MasteryGroup[] {
  const map = new Map<string, MasteryRow[]>();
  for (const row of rows) map.set(row.group, [...(map.get(row.group) ?? []), row]);

  return [...map.entries()]
    .map(([name, list]) => {
      const sorted = [...list].sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name, 'pt-BR'));
      return {
        name,
        rows: sorted,
        counts: countByStatus(sorted),
        average: Math.round(sorted.reduce((sum, r) => sum + r.percent, 0) / sorted.length),
      };
    })
    .sort((a, b) => b.counts.revisar - a.counts.revisar || a.average - b.average || a.name.localeCompare(b.name, 'pt-BR'));
}
