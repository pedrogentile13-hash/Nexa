import { describe, expect, it } from 'vitest';
import { PACOTES_MISTOS, PACOTES_STUDY_MISTOS, PACOTES_VESTIBULAR_MISTOS } from '../seed/misto';
import { buildMixedSeed } from './mixed-seed';

const SUBJECTS = [
  'matematica',
  'fisica',
  'quimica',
  'biologia',
  'historia',
  'geografia',
  'lingua-portuguesa',
  'ciencias',
];

describe('pacotes mistos', () => {
  const study = PACOTES_STUDY_MISTOS.flatMap((p) => p.questoes);
  const vest = PACOTES_VESTIBULAR_MISTOS.flatMap((p) => p.questoes);

  it('o Nexa Study traz 7 matérias e mais de 200 questões, objetivas e discursivas', () => {
    expect(new Set(PACOTES_STUDY_MISTOS.map((p) => p.subject)).size).toBe(7);
    expect(study.length).toBeGreaterThanOrEqual(200);
    expect(study.some((q) => q.k === 'o')).toBe(true);
    expect(study.filter((q) => q.k === 'd').length).toBeGreaterThanOrEqual(40);
  });

  it('cada matéria tem um quiz e um simulado, ambos mistos', () => {
    for (const subject of new Set(PACOTES_STUDY_MISTOS.map((p) => p.subject))) {
      const mine = PACOTES_STUDY_MISTOS.filter((p) => p.subject === subject);
      expect(mine.map((p) => p.kind).sort(), subject).toEqual(['quiz', 'simulado']);
      for (const p of mine) {
        expect(
          p.questoes.some((q) => q.k === 'o'),
          p.slug,
        ).toBe(true);
        expect(
          p.questoes.some((q) => q.k === 'd'),
          p.slug,
        ).toBe(true);
      }
    }
  });

  it('a 2ª fase do vestibular é majoritariamente discursiva e só de Fuvest, Unicamp e Unesp (ENEM segue objetivo)', () => {
    expect(PACOTES_VESTIBULAR_MISTOS.length).toBeGreaterThanOrEqual(4);
    for (const p of PACOTES_VESTIBULAR_MISTOS) {
      expect(['fuvest', 'unicamp', 'unesp']).toContain(p.banca);
      expect(p.context).toBe('vestibular');
      expect(p.kind).toBe('simulado');
      expect(p.questoes.filter((q) => q.k === 'd').length).toBeGreaterThan(p.questoes.length / 2);
    }
    expect(vest.length).toBeGreaterThanOrEqual(40);
  });

  it('slugs únicos e matérias do catálogo', () => {
    const slugs = PACOTES_MISTOS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of PACOTES_MISTOS) expect(SUBJECTS, p.slug).toContain(p.subject);
  });

  it('toda objetiva tem 4 alternativas distintas e explicação; a certa é única', () => {
    for (const p of PACOTES_MISTOS) {
      p.questoes.forEach((q, i) => {
        const where = `${p.slug} #${i + 1}`;
        expect(q.s.trim().length, where).toBeGreaterThan(10);
        if (q.k === 'o') {
          expect(new Set(q.o.map((o) => o.trim())).size, where).toBe(4);
          expect(
            q.o.every((o) => o.trim().length > 0),
            where,
          ).toBe(true);
          expect(q.e.trim().length, where).toBeGreaterThan(10);
        }
      });
    }
  });

  it('toda discursiva tem resposta esperada (10+ caracteres) e critérios', () => {
    for (const p of PACOTES_MISTOS) {
      p.questoes.forEach((q, i) => {
        if (q.k !== 'd') return;
        const where = `${p.slug} #${i + 1}`;
        expect(q.ref.trim().length, where).toBeGreaterThanOrEqual(40);
        expect(q.crit.split('\n').length, where).toBeGreaterThanOrEqual(2);
      });
    }
  });
});

describe('buildMixedSeed', () => {
  const seed = buildMixedSeed(null);

  it('monta um recurso por pacote, com ids estáveis e sem duplicar', () => {
    expect(seed.resources).toHaveLength(PACOTES_MISTOS.length);
    expect(new Set(seed.resources.map((r) => r.id)).size).toBe(seed.resources.length);
    expect(buildMixedSeed(null).resources.map((r) => r.id)).toEqual(
      seed.resources.map((r) => r.id),
    );
    expect(buildMixedSeed('11111111-1111-1111-1111-111111111111').resources[0]!.id).not.toBe(
      seed.resources[0]!.id,
    );
  });

  it('só o simulado tem cronômetro, e a marca do pacote está em todos', () => {
    for (const r of seed.resources) {
      expect(r.tags).toContain('pacote-misto-v1');
      expect(r.time_limit_seconds === null, r.title).toBe(r.kind === 'quiz');
    }
  });

  it('discursiva guarda a resposta esperada e não tem alternativas; objetiva tem exatamente uma certa', () => {
    const byQuestion = new Map<string, typeof seed.options>();
    for (const o of seed.options)
      byQuestion.set(o.question_id, [...(byQuestion.get(o.question_id) ?? []), o]);
    for (const q of seed.questions) {
      const opts = byQuestion.get(q.id) ?? [];
      if (q.kind === 'discursiva') {
        expect(q.model_answer?.length).toBeGreaterThan(10);
        expect(opts).toHaveLength(0);
      } else {
        expect(q.model_answer).toBeNull();
        expect(opts).toHaveLength(4);
        expect(opts.filter((o) => o.is_correct)).toHaveLength(1);
      }
    }
    expect(new Set(seed.questions.map((q) => q.id)).size).toBe(seed.questions.length);
  });
});
