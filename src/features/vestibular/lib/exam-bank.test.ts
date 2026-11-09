import { describe, expect, it } from 'vitest';
import { buildExamBank, coverLabel } from './exam-bank';
import type { VestibularResource } from '../server/queries';

const res = (over: Partial<VestibularResource>): VestibularResource => ({
  id: 'r1',
  kind: 'simulado',
  title: 'ENEM 2024 — Dia 1',
  description: null,
  subjectName: 'Linguagens',
  subjectColor: 'rose',
  examName: 'ENEM',
  editionYear: 2024,
  difficulty: 'medio',
  questionCount: 90,
  timeLimitSeconds: null,
  myBestPercent: null,
  ...over,
});

describe('coverLabel', () => {
  it('tira a prova e o ano do título', () => {
    expect(coverLabel('ENEM 2024 — Dia 1', 'ENEM', 2024)).toBe('Dia 1');
    expect(coverLabel('FUVEST 2026 - Prova I', 'FUVEST', 2026)).toBe('Prova I');
  });
  it('devolve null quando não sobra nada', () => {
    expect(coverLabel('ENEM 2024', 'ENEM', 2024)).toBeNull();
  });
});

describe('buildExamBank', () => {
  it('edição sem questões vira cartão "Em breve"; com questões não duplica', () => {
    const bank = buildExamBank(
      [res({})],
      [
        { id: 'e1', year: 2024, examName: 'ENEM', coverUrl: null },
        { id: 'e2', year: 2026, examName: 'FUVEST', coverUrl: null },
      ],
    );
    expect(bank.filter((b) => b.examName === 'ENEM')).toHaveLength(1);
    const soon = bank.find((b) => b.examName === 'FUVEST')!;
    expect(soon.resourceId).toBeNull();
    expect(soon.coverLabel).toBe('Em breve');
  });

  it('ordena do ano mais novo para o mais antigo, com a prova que já tem conteúdo antes', () => {
    const bank = buildExamBank(
      [res({ id: 'a', editionYear: 2023, title: 'ENEM 2023 — Dia 1' }), res({ id: 'b', editionYear: 2025, title: 'ENEM 2025 — Dia 1' })],
      [{ id: 'e', year: 2025, examName: 'FUVEST', coverUrl: null }],
    );
    expect(bank.map((b) => b.year)).toEqual([2025, 2025, 2023]);
    expect(bank[0]!.resourceId).toBe('b');
  });

  it('simulado sem edição não é prova oficial', () => {
    const bank = buildExamBank([res({ id: 's', editionYear: null, examName: null, title: 'Simulado de Matemática' })], []);
    expect(bank[0]!.official).toBe(false);
  });
});
