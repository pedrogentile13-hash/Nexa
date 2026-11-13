import { describe, expect, it } from 'vitest';
import { SERIES } from '@/lib/design/serie';
import { PACOTES_G2, PACOTES_G2_STUDY, PACOTES_G2_VESTIBULAR } from '../seed/grande2';
import { buildGrande2Seed } from './grande2-seed';

const CATALOGO = [
  'matematica',
  'lingua-portuguesa',
  'literatura',
  'ingles',
  'espanhol',
  'artes',
  'ciencias',
  'biologia',
  'fisica',
  'quimica',
  'historia',
  'geografia',
  'filosofia',
  'sociologia',
  'educacao-financeira',
  'pensamento-computacional',
];

describe('Grande criação 2', () => {
  it('traz mais de 100 quizzes e 100 simulados no Nexa Study, de várias matérias e todas as séries', () => {
    expect(PACOTES_G2_STUDY.filter((p) => p.kind === 'quiz').length).toBeGreaterThanOrEqual(100);
    expect(PACOTES_G2_STUDY.filter((p) => p.kind === 'simulado').length).toBeGreaterThanOrEqual(
      100,
    );
    expect(new Set(PACOTES_G2_STUDY.map((p) => p.subject)).size).toBeGreaterThanOrEqual(12);
    expect(new Set(PACOTES_G2_STUDY.map((p) => p.grade))).toEqual(
      new Set(SERIES.map((s) => s.value)),
    );
  });

  it('mais de 50 pacotes têm ao menos uma discursiva corrigida por IA', () => {
    expect(
      PACOTES_G2.filter((p) => p.questoes.some((q) => q.k === 'd')).length,
    ).toBeGreaterThanOrEqual(50);
  });

  it('traz mais de 30 simulados de vestibulares variados; ENEM só com objetivas', () => {
    expect(PACOTES_G2_VESTIBULAR.length).toBeGreaterThanOrEqual(30);
    expect(new Set(PACOTES_G2_VESTIBULAR.map((p) => p.banca)).size).toBe(6);
    for (const p of PACOTES_G2_VESTIBULAR) {
      expect(p.kind).toBe('simulado');
      expect(p.context).toBe('vestibular');
      if (p.banca === 'enem')
        expect(
          p.questoes.every((q) => q.k === 'o'),
          p.slug,
        ).toBe(true);
    }
  });

  it('cada pacote tem tamanho certo, alternativas distintas e matéria do catálogo', () => {
    const slugs = PACOTES_G2.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of PACOTES_G2) {
      expect(CATALOGO, p.slug).toContain(p.subject);
      expect(p.questoes.length, p.slug).toBeGreaterThanOrEqual(5);
      if (p.kind === 'simulado') expect(p.minutes, p.slug).toBeGreaterThan(0);
      for (const q of p.questoes) {
        expect(q.s.trim().length, p.slug).toBeGreaterThan(5);
        expect(q.s, p.slug).not.toMatch(/NaN|undefined|Infinity/);
        if (q.k === 'o') {
          const all = [q.ok, ...q.wrong];
          const esperado = p.banca === 'unicamp' || p.context === 'study' ? 4 : 5;
          expect(all.length, `${p.slug}: ${q.s}`).toBe(esperado);
          expect(new Set(all).size, `${p.slug}: ${q.s}`).toBe(all.length);
          expect(q.e.trim().length, p.slug).toBeGreaterThan(5);
        } else {
          expect(q.ref.trim().length, p.slug).toBeGreaterThan(20);
          expect(q.crit, p.slug).toMatch(/^• /);
        }
      }
    }
  });

  it('monta as linhas com ids fixos, uma alternativa certa por objetiva e a certa em posições variadas', () => {
    const a = buildGrande2Seed(null);
    const b = buildGrande2Seed(null);
    expect(a.resources.map((r) => r.id)).toEqual(b.resources.map((r) => r.id));
    expect(new Set(a.questions.map((q) => q.id)).size).toBe(a.questions.length);
    const certas = new Map<string, number>();
    for (const o of a.options)
      if (o.is_correct) certas.set(o.question_id, (certas.get(o.question_id) ?? 0) + 1);
    for (const q of a.questions.filter((x) => x.kind === 'objetiva'))
      expect(certas.get(q.id), q.statement).toBe(1);
    const posicoes = new Set(a.options.filter((o) => o.is_correct).map((o) => o.position));
    expect(posicoes.size).toBeGreaterThanOrEqual(4);
    const escola = buildGrande2Seed('00000000-0000-0000-0000-000000000001');
    expect(escola.resources[0]!.id).not.toBe(a.resources[0]!.id);
    expect(a.resources.every((r) => r.tags.includes('grande-criacao-2'))).toBe(true);
  });
});
