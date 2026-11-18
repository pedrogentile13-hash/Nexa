import { describe, expect, it } from 'vitest';
import { PACOTES_G2 } from '../seed/grande2';
import { RESUMOS_G3, TRILHAS } from '../seed/grande3';
import { buildGrande3Seed } from './grande3-seed';

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

describe('Grande criação 3 (resumos e trilhas)', () => {
  it('traz mais de 100 resumos, sem slug ou título repetido, em matérias do catálogo', () => {
    expect(RESUMOS_G3.length).toBeGreaterThanOrEqual(100);
    const slugs = RESUMOS_G3.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const titulos = RESUMOS_G3.map((r) => r.title);
    expect(new Set(titulos).size).toBe(titulos.length);
    for (const r of RESUMOS_G3) {
      expect(CATALOGO, r.slug).toContain(r.subject);
      expect(r.body.length, r.slug).toBeGreaterThan(250);
      expect(r.body, r.slug).toMatch(/^(##|>) /m);
      expect(r.body, r.slug).not.toMatch(/undefined|NaN|\$\{/);
    }
  });

  it('cobre o Nexa Study e a Biblioteca do Vestibular, com planos de estudo', () => {
    expect(RESUMOS_G3.filter((r) => r.context === 'school').length).toBeGreaterThanOrEqual(90);
    expect(RESUMOS_G3.filter((r) => r.context === 'vestibular').length).toBeGreaterThanOrEqual(10);
    expect(RESUMOS_G3.filter((r) => r.slug.startsWith('g3-plano-')).length).toBeGreaterThanOrEqual(
      5,
    );
  });

  it('traz mais de 20 trilhas e todo item citado existe (resumo desta criação ou pacote da Grande criação 2)', () => {
    expect(TRILHAS.length).toBeGreaterThanOrEqual(20);
    const existentes = new Set([
      ...RESUMOS_G3.map((r) => r.slug),
      ...PACOTES_G2.map((p) => p.slug),
    ]);
    const slugsTrilha = TRILHAS.map((t) => t.slug);
    expect(new Set(slugsTrilha).size).toBe(slugsTrilha.length);
    for (const t of TRILHAS) {
      expect(CATALOGO, t.slug).toContain(t.subject);
      expect(t.secoes.length, t.slug).toBeGreaterThan(0);
      for (const s of t.secoes)
        for (const l of s.licoes) {
          expect(l.itens.length, `${t.slug}: ${l.titulo}`).toBeGreaterThan(0);
          expect(new Set(l.itens).size, `${t.slug}: ${l.titulo}`).toBe(l.itens.length);
          for (const item of l.itens) expect(existentes.has(item), `${t.slug}: ${item}`).toBe(true);
        }
    }
  });

  it('monta linhas com ids fixos, lições encadeadas e uma posição por item', () => {
    const a = buildGrande3Seed(null);
    const b = buildGrande3Seed(null);
    expect(a.tracks.map((t) => t.id)).toEqual(b.tracks.map((t) => t.id));
    expect(new Set(a.resources.map((r) => r.id)).size).toBe(a.resources.length);
    expect(new Set(a.lessons.map((l) => l.id)).size).toBe(a.lessons.length);
    const porTrilha = new Map<string, number>();
    for (const s of a.sections) porTrilha.set(s.track_id, (porTrilha.get(s.track_id) ?? 0) + 1);
    expect(porTrilha.size).toBe(a.tracks.length);
    // Cada trilha tem exatamente uma lição sem pré-requisito (a primeira).
    const secaoTrilha = new Map(a.sections.map((s) => [s.id, s.track_id]));
    const livres = new Map<string, number>();
    for (const l of a.lessons)
      if (!l.unlock_after_lesson_id)
        livres.set(
          secaoTrilha.get(l.section_id)!,
          (livres.get(secaoTrilha.get(l.section_id)!) ?? 0) + 1,
        );
    for (const t of a.tracks) expect(livres.get(t.id), t.title).toBe(1);
    const pares = a.lessonResources.map((x) => `${x.lesson_id}/${x.position}`);
    expect(new Set(pares).size).toBe(pares.length);
    expect(a.resources.every((r) => r.tags.includes('grande-criacao-3'))).toBe(true);
  });
});
