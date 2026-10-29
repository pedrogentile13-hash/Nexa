import { describe, expect, it } from 'vitest';
import { buildWeekPlan } from './week-plan';

const weak = (n: number, mastery: number, subjectId = 's1') => ({
  subjectId,
  subjectName: subjectId === 's1' ? 'Matemática' : 'História',
  topicName: `Tópico ${n}`,
  masteryPercent: mastery,
});

describe('buildWeekPlan', () => {
  it('gera 7 dias e prioriza o assunto mais fraco no primeiro dia', () => {
    const plan = buildWeekPlan({ today: '2026-10-28', weakTopics: [weak(1, 60), weak(2, 20)], exams: [], dailyMinutes: 50 });
    expect(plan).toHaveLength(7);
    expect(plan[0]!.date).toBe('2026-10-28');
    expect(plan[0]!.blocks[0]!.label).toBe('Tópico 2');
    expect(plan[1]!.blocks[0]!.label).toBe('Tópico 1');
  });

  it('respeita o tempo diário (2 blocos de 25 min em 50 min)', () => {
    const topics = Array.from({ length: 30 }, (_, i) => weak(i, 10 + i));
    const plan = buildWeekPlan({ today: '2026-10-28', weakTopics: topics, exams: [], dailyMinutes: 50 });
    expect(Math.max(...plan.map((d) => d.blocks.length))).toBe(2);
  });

  it('põe revisão final no dia anterior à prova e sobe o peso da matéria da prova', () => {
    const plan = buildWeekPlan({
      today: '2026-10-28',
      weakTopics: [weak(1, 30, 's1'), weak(2, 30, 's2')],
      exams: [{ subjectId: 's2', subjectName: 'História', title: 'Prova bimestral', date: '2026-11-02' }],
      dailyMinutes: 50,
    });
    const eve = plan.find((d) => d.date === '2026-11-01')!;
    expect(eve.blocks.some((b) => b.kind === 'prova' && b.minutes === 50)).toBe(true);
    expect(plan[0]!.blocks[0]!.subjectName).toBe('História');
  });

  it('ignora prova passada ou longe demais e funciona sem nada', () => {
    const plan = buildWeekPlan({
      today: '2026-10-28',
      weakTopics: [],
      exams: [
        { subjectId: 's1', subjectName: 'Matemática', title: 'Antiga', date: '2026-10-20' },
        { subjectId: 's1', subjectName: 'Matemática', title: 'Longe', date: '2026-12-20' },
      ],
      dailyMinutes: 30,
    });
    expect(plan.every((d) => d.blocks.length === 0)).toBe(true);
  });
});
