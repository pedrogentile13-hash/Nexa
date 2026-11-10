import { describe, expect, it } from 'vitest';
import { SIMULADOS_VESTIBULAR } from '../seed/vestibular';
import { buildVestibularSeed, placeCorrect } from './vestibular-seed';

const rows = buildVestibularSeed(null);

describe('simulados de vestibular (seed)', () => {
  it('são 8 simulados de 10 questões, de 4 bancas', () => {
    expect(SIMULADOS_VESTIBULAR).toHaveLength(8);
    expect(new Set(SIMULADOS_VESTIBULAR.map((s) => s.banca))).toEqual(new Set(['enem', 'fuvest', 'unicamp', 'unesp']));
    for (const s of SIMULADOS_VESTIBULAR) expect(s.questoes, s.slug).toHaveLength(10);
    expect(rows.resources).toHaveLength(8);
    expect(rows.questions).toHaveLength(80);
  });

  it('ids únicos e diferentes entre global e escola', () => {
    for (const list of [rows.resources, rows.questions, rows.options]) expect(new Set(list.map((r) => r.id)).size).toBe(list.length);
    const school = buildVestibularSeed('11111111-1111-1111-1111-111111111111');
    expect(school.resources[0]!.id).not.toBe(rows.resources[0]!.id);
  });

  it('toda questão tem 5 alternativas distintas (4 na Unicamp), uma correta e explicação', () => {
    for (const s of SIMULADOS_VESTIBULAR) {
      for (const q of s.questoes) {
        const label = `${s.slug}: ${q.s.slice(0, 40)}`;
        expect(q.o, label).toHaveLength(s.banca === 'unicamp' ? 4 : 5);
        expect(new Set(q.o).size, label).toBe(q.o.length);
        expect(q.c, label).toBeGreaterThanOrEqual(0);
        expect(q.c, label).toBeLessThan(q.o.length);
        expect(q.e.length, label).toBeGreaterThan(30);
        expect(q.s.length, label).toBeGreaterThan(20);
      }
    }
    const correct = new Map<string, number>();
    for (const o of rows.options) if (o.is_correct) correct.set(o.question_id, (correct.get(o.question_id) ?? 0) + 1);
    expect(correct.size).toBe(80);
    expect([...correct.values()].every((n) => n === 1)).toBe(true);
  });

  it('a alternativa certa roda de posição e continua sendo a mesma resposta', () => {
    expect(placeCorrect(['a', 'b', 'c', 'd', 'e'], 1, 4)).toEqual({ options: ['a', 'c', 'd', 'e', 'b'], correct: 4 });
    expect(placeCorrect(['a', 'b', 'c'], 0, 0)).toEqual({ options: ['a', 'b', 'c'], correct: 0 });
    for (const s of SIMULADOS_VESTIBULAR) {
      const id = rows.resources.find((r) => r.title === s.title)!.id;
      const qs = rows.questions.filter((q) => q.resource_id === id);
      const positions = qs.map((q) => rows.options.find((o) => o.question_id === q.id && o.is_correct)!.position);
      for (let p = 1; p <= (s.banca === 'unicamp' ? 4 : 5); p += 1) expect(positions.filter((x) => x === p).length, `${s.slug} posição ${p}`).toBeLessThanOrEqual(3);
      // a resposta certa continua sendo o mesmo texto
      qs.forEach((q, i) => {
        const text = rows.options.find((o) => o.question_id === q.id && o.is_correct)!.body;
        expect(text, s.slug).toBe(s.questoes[i]!.o[s.questoes[i]!.c]);
      });
    }
  });

  it('o comando da questão (último parágrafo) termina em pergunta ou complemento, e as matérias existem no catálogo', () => {
    const slugs = new Set(['lingua-portuguesa', 'matematica', 'ciencias', 'historia']);
    for (const s of SIMULADOS_VESTIBULAR) expect(slugs.has(s.subject), s.slug).toBe(true);
  });
});
