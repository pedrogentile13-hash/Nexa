import { describe, expect, it } from 'vitest';
import { PACOTES, TOPICOS } from '../seed';
import { buildStudySeed, uuidV5 } from './study-seed';

describe('conteúdo inicial do Nexa Study', () => {
  const rows = buildStudySeed(null);

  it('uuid v5 é determinístico e tem o formato certo', () => {
    expect(uuidV5('a')).toBe(uuidV5('a'));
    expect(uuidV5('a')).not.toBe(uuidV5('b'));
    expect(uuidV5('a')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('tem os 132 tópicos, sem slug repetido por matéria', () => {
    expect(TOPICOS).toHaveLength(132);
    const keys = TOPICOS.map(([subject, , , slug]) => `${subject}/${slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('cada pacote aponta para um tópico existente, da mesma série', () => {
    for (const p of PACOTES) {
      const t = TOPICOS.find(([, , , slug]) => slug === p.topic);
      expect(t, p.topic).toBeDefined();
      expect(t![1], p.topic).toBe(p.grade);
    }
  });

  it('pacotes: 1 resumo e 1 quiz de 8 questões cada, sem repetir id', () => {
    expect(rows.resources).toHaveLength(PACOTES.length * 2);
    expect(rows.questions).toHaveLength(PACOTES.length * 8);
    expect(rows.options).toHaveLength(PACOTES.length * 8 * 4);
    for (const list of [rows.topics, rows.resources, rows.questions, rows.options]) expect(new Set(list.map((r) => r.id)).size).toBe(list.length);
  });

  it('toda questão tem exatamente uma alternativa correta, quatro alternativas distintas e explicação', () => {
    for (const q of rows.questions) {
      const opts = rows.options.filter((o) => o.question_id === q.id);
      expect(opts, q.statement).toHaveLength(4);
      expect(opts.filter((o) => o.is_correct), q.statement).toHaveLength(1);
      expect(new Set(opts.map((o) => o.body)).size, q.statement).toBe(4);
      expect(q.explanation.length, q.statement).toBeGreaterThan(15);
    }
  });

  it('dificuldade equilibrada: 3 fáceis, 3 médias e 2 difíceis por quiz', () => {
    for (const p of PACOTES) {
      const count = (d: string) => p.questoes.filter((x) => x.d === d).length;
      expect([count('facil'), count('medio'), count('dificil')], p.topic).toEqual([3, 3, 2]);
    }
  });

  it('resumos trazem exemplo e erros comuns', () => {
    for (const p of PACOTES) {
      expect(p.resumo, p.topic).toMatch(/Erros comuns/);
      expect(p.resumo.length, p.topic).toBeGreaterThan(600);
    }
  });

  it('escola e global geram ids diferentes (não colidem)', () => {
    const school = buildStudySeed('11111111-1111-4111-8111-111111111111');
    expect(school.topics[0]!.id).not.toBe(rows.topics[0]!.id);
  });
});
