import { describe, expect, it } from 'vitest';
import { buildEssayMessages, countWords, parseEssayFeedback, snapScore, weakestCompetency } from './essay';

const essay =
  'A desigualdade social no Brasil persiste. Muitos jovens não têm acesso à educação de qualidade. Portanto, o governo deve agir.';

const good = {
  competencias: [1, 2, 3, 4, 5].map((id) => ({ id, nota: 120, comentario: `c${id}` })),
  pontosFortes: ['tese clara'],
  melhorias: ['detalhar a proposta'],
  trechos: [{ trecho: 'Muitos jovens não têm acesso à educação de qualidade', problema: 'generalização', sugestao: 'cite dados' }],
  reescrita: 'Parágrafo reescrito.',
};

describe('snapScore', () => {
  it('arredonda para o degrau de 40 e limita a 0–200', () => {
    expect(snapScore(130)).toBe(120);
    expect(snapScore(150)).toBe(160);
    expect(snapScore(999)).toBe(200);
    expect(snapScore(-20)).toBe(0);
    expect(snapScore(Number.NaN)).toBe(0);
  });
});

describe('parseEssayFeedback', () => {
  it('lê um JSON bom, soma o total e nomeia as competências', () => {
    const f = parseEssayFeedback(JSON.stringify(good), essay)!;
    expect(f.total).toBe(600);
    expect(f.competencies[4]!.name).toBe('Proposta de intervenção');
    expect(f.excerpts).toHaveLength(1);
  });

  it('aceita o JSON dentro de cerca ``` e notas como texto', () => {
    const raw = '```json\n' + JSON.stringify({ ...good, competencias: good.competencias.map((c) => ({ ...c, nota: '160' })) }) + '\n```';
    expect(parseEssayFeedback(raw, essay)!.total).toBe(800);
  });

  it('corrige nota fora do degrau', () => {
    const odd = { ...good, competencias: good.competencias.map((c) => ({ ...c, nota: 130 })) };
    expect(parseEssayFeedback(JSON.stringify(odd), essay)!.competencies.every((c) => c.score === 120)).toBe(true);
  });

  it('DESCARTA trecho que o aluno não escreveu (IA inventando citação)', () => {
    const fake = { ...good, trechos: [{ trecho: 'O capitalismo selvagem destrói tudo', problema: 'x', sugestao: 'y' }] };
    expect(parseEssayFeedback(JSON.stringify(fake), essay)!.excerpts).toEqual([]);
  });

  it('reconhece o trecho mesmo com acento/caixa/espaço diferentes', () => {
    const f = { ...good, trechos: [{ trecho: 'MUITOS  jovens nao tem acesso', problema: 'x', sugestao: '' }] };
    expect(parseEssayFeedback(JSON.stringify(f), essay)!.excerpts).toHaveLength(1);
  });

  it('resposta quebrada ou incompleta vira null, nunca uma nota inventada', () => {
    expect(parseEssayFeedback('não consegui', essay)).toBeNull();
    expect(parseEssayFeedback(JSON.stringify({ ...good, competencias: good.competencias.slice(0, 3) }), essay)).toBeNull();
    expect(parseEssayFeedback(JSON.stringify({ ...good, competencias: [1, 1, 2, 3, 4].map((id) => ({ id, nota: 80, comentario: '' })) }), essay)).toBeNull();
  });
});

describe('prompt e utilidades', () => {
  it('o prompt leva tema, texto e proíbe citar o que não existe', () => {
    const [system, user] = buildEssayMessages('Desigualdade', essay);
    expect(user!.content).toContain('Desigualdade');
    expect(user!.content).toContain(essay);
    expect(system!.content).toMatch(/existir literalmente/);
  });

  it('conta palavras', () => {
    expect(countWords('  um  dois\ntrês ')).toBe(3);
    expect(countWords('')).toBe(0);
  });

  it('acha a competência mais fraca ao longo das redações', () => {
    const w = weakestCompetency([{ scores: [160, 160, 120, 160, 80] }, { scores: [160, 120, 120, 160, 40] }]);
    expect(w).toEqual({ id: 5, name: 'Proposta de intervenção', average: 60 });
    expect(weakestCompetency([])).toBeNull();
  });
});
