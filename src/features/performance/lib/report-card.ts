import { SERIES } from '@/lib/design/serie';

export interface GradeRow {
  grade_level: string;
  subject_catalog_id: string;
  subject_name: string;
  subject_color: string;
  assessment_score: number | null;
  quizzes_done: number;
  simulados_done: number;
  content_completed: number;
}

export interface GradeCard {
  grade: string;
  rows: GradeRow[];
  /** Média das notas com avaliação (ignora matérias só com conteúdo lido). `null` se ninguém tem nota. */
  average: number | null;
}

/** Agrupa o boletim por série, na ordem do 6º ano ao 3º EM; séries desconhecidas vão ao fim. */
export function groupReportCard(rows: readonly GradeRow[]): GradeCard[] {
  const by = new Map<string, GradeRow[]>();
  for (const r of rows) by.set(r.grade_level, [...(by.get(r.grade_level) ?? []), r]);
  const order = (g: string) => {
    const i = SERIES.findIndex((s) => s.value === g);
    return i === -1 ? 99 : i;
  };
  return [...by.entries()]
    .sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([grade, list]) => {
      const rowsSorted = [...list].sort((a, b) => a.subject_name.localeCompare(b.subject_name, 'pt-BR'));
      const graded = rowsSorted.filter((r) => r.assessment_score !== null);
      const average = graded.length ? graded.reduce((s, r) => s + (r.assessment_score ?? 0), 0) / graded.length : null;
      return { grade, rows: rowsSorted, average };
    });
}
