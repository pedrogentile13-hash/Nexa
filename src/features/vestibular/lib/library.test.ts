import { describe, expect, it } from 'vitest';
import { bancaOf, buildLibrary, filterLibrary, groupIntoShelves, subjectsOf } from './library';
import type { VestibularResource } from '../server/queries';

const res = (o: Partial<VestibularResource>): VestibularResource => ({
  id: 'r1', kind: 'simulado', title: 'ENEM · Matemática', description: null, subjectName: 'Matemática', subjectColor: 'blue', examName: 'ENEM',
  editionYear: null, difficulty: 'medio', questionCount: 10, timeLimitSeconds: 3600, myBestPercent: null, ...o,
});

describe('biblioteca do vestibular', () => {
  const items = buildLibrary(
    [res({}), res({ id: 'r2', title: 'Fuvest · Humanas', examName: 'FUVEST', subjectName: 'Português' }), res({ id: 'r3', kind: 'resumo', title: 'Resumo de Funções', examName: null, subjectName: 'Matemática', timeLimitSeconds: null })],
    [{ id: 'e1', year: 2024, examName: 'ENEM', coverUrl: null }, { id: 'e2', year: 2023, examName: 'ENEM', coverUrl: null }],
    { e1: 3 },
  );

  it('junta simulados, resumos e só os cadernos que têm arquivo', () => {
    expect(items).toHaveLength(4);
    expect(items.find((i) => i.key === 'e-e1')).toMatchObject({ type: 'prova', href: '/vestibular/provas/e1', official: true });
    expect(items.find((i) => i.key === 'e-e2')).toBeUndefined();
    expect(items.find((i) => i.key === 'r-r1')).toMatchObject({ type: 'simulado', minutes: 60, href: '/estudar/r1', official: false });
    expect(items.find((i) => i.key === 'r-r3')?.banca).toBe('GERAL');
  });

  it('duas prateleiras por banca: simulados primeiro, provas anteriores depois (simulado nunca fica escondido)', () => {
    const shelves = groupIntoShelves(items);
    expect(shelves.map((s) => `${s.banca}/${s.group}`)).toEqual(['ENEM/nexa', 'ENEM/oficial', 'FUVEST/nexa', 'GERAL/nexa']);
    expect(shelves[0]!.title).toBe('Simulados e treino');
    expect(shelves[1]!.items[0]!.key).toBe('e-e1'); // mais novo (2024) primeiro
  });

  it('filtra por tipo, matéria e busca sem diferenciar acento', () => {
    expect(filterLibrary(items, { type: 'simulado', subject: 'todas', search: '' })).toHaveLength(2);
    expect(filterLibrary(items, { type: 'todos', subject: 'Português', search: '' })).toHaveLength(1);
    expect(filterLibrary(items, { type: 'todos', subject: 'todas', search: 'matematica' }).length).toBeGreaterThan(0);
    expect(filterLibrary(items, { type: 'todos', subject: 'todas', search: 'xyz' })).toHaveLength(0);
  });

  it('lista as matérias e normaliza a banca', () => {
    expect(subjectsOf(items)).toEqual(['Matemática', 'Português']);
    expect(bancaOf(null)).toBe('GERAL');
    expect(bancaOf(' enem ')).toBe('ENEM');
  });
});
