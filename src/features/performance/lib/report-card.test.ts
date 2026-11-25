import { describe, expect, it } from 'vitest';
import { groupReportCard, type GradeRow } from './report-card';

const row = (grade_level: string, subject_name: string, assessment_score: number | null): GradeRow => ({
  grade_level, subject_catalog_id: subject_name, subject_name, subject_color: 'blue', assessment_score, quizzes_done: 1, simulados_done: 0, content_completed: 0,
});

describe('groupReportCard', () => {
  it('ordena as séries do 6º ano ao 3º EM e as matérias por nome', () => {
    const g = groupReportCard([row('8º ano', 'Matemática', 7), row('6º ano', 'Português', 8), row('6º ano', 'Matemática', 6), row('1ª série EM', 'Física', 5)]);
    expect(g.map((x) => x.grade)).toEqual(['6º ano', '8º ano', '1ª série EM']);
    expect(g[0]!.rows.map((r) => r.subject_name)).toEqual(['Matemática', 'Português']);
  });
  it('média só das matérias com nota', () => {
    const g = groupReportCard([row('7º ano', 'A', 8), row('7º ano', 'B', 6), row('7º ano', 'C', null)]);
    expect(g[0]!.average).toBe(7);
  });
  it('sem nenhuma nota, a média é nula; sem linhas, não há séries', () => {
    expect(groupReportCard([row('9º ano', 'A', null)])[0]!.average).toBeNull();
    expect(groupReportCard([])).toEqual([]);
  });
});
