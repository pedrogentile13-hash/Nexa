import { describe, expect, it } from 'vitest';
import { countByStatus, groupMastery, type MasteryRow } from './mastery-view';

const row = (group: string, name: string, percent: number, status: MasteryRow['status']): MasteryRow => ({
  group, name, correct: 1, total: 2, percent, status,
});

const rows = [
  row('História', 'Guerra Fria', 80, 'dominado'),
  row('História', 'Dia D', 20, 'revisar'),
  row('Matemática', 'Funções', 55, 'desenvolvimento'),
  row('Matemática', 'Geometria', 90, 'dominado'),
  row('Física', 'Ótica', 10, 'revisar'),
  row('Física', 'Cinemática', 30, 'revisar'),
];

describe('mastery view', () => {
  it('conta por situação', () => {
    expect(countByStatus(rows)).toEqual({ revisar: 3, desenvolvimento: 1, dominado: 2 });
  });

  it('agrupa por matéria: quem tem mais a revisar vem primeiro e o assunto mais fraco abre cada grupo', () => {
    const groups = groupMastery(rows);
    expect(groups.map((g) => g.name)).toEqual(['Física', 'História', 'Matemática']);
    expect(groups[0]!.rows[0]!.name).toBe('Ótica');
    expect(groups[1]!.average).toBe(50);
  });
});
