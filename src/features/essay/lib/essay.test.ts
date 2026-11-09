import { describe, expect, it } from 'vitest';
import { buildEssayMessages, countWords, LEVEL_DESCRIPTORS, markExcerpts, parseEssayFeedback, snapScore, weakestCompetency } from './essay';

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

describe('parseEssayFeedback · proposta de intervenção e alertas', () => {
  const withInter = (inter: Record<string, boolean>, c5 = 200) => ({
    ...good,
    competencias: good.competencias.map((c) => ({ ...c, nota: c.id === 5 ? c5 : 120 })),
    intervencao: inter,
  });

  it('a nota da C5 não passa do que os elementos presentes permitem', () => {
    // 3 elementos (agente, ação, finalidade) → teto 120, mesmo que a IA dê 200
    const f = parseEssayFeedback(
      JSON.stringify(withInter({ agente: true, acao: true, meio: false, finalidade: true, detalhamento: false })),
      essay,
    )!;
    expect(f.competencies[4]!.score).toBe(120);
    expect(f.intervention).toEqual({ agent: true, action: true, means: false, purpose: true, detail: false });
  });

  it('sem nenhum elemento a C5 vai a zero; com os 5 mantém a nota', () => {
    const none = parseEssayFeedback(JSON.stringify(withInter({ agente: false, acao: false, meio: false, finalidade: false, detalhamento: false })), essay)!;
    expect(none.competencies[4]!.score).toBe(0);
    const all = parseEssayFeedback(JSON.stringify(withInter({ agente: true, acao: true, meio: true, finalidade: true, detalhamento: true })), essay)!;
    expect(all.competencies[4]!.score).toBe(200);
  });

  it('sem o campo de intervenção (correção antiga) nada é alterado', () => {
    const f = parseEssayFeedback(JSON.stringify(good), essay)!;
    expect(f.competencies[4]!.score).toBe(120);
    expect(f.intervention).toBeUndefined();
  });

  it('repassa alertas e repertório', () => {
    const f = parseEssayFeedback(JSON.stringify({ ...good, alertas: ['Possível fuga ao tema'], repertorio: 'Cita a Constituição de 1988' }), essay)!;
    expect(f.alerts).toEqual(['Possível fuga ao tema']);
    expect(f.repertoire).toContain('Constituição');
  });
});

describe('buildEssayMessages · critérios', () => {
  it('leva a régua do INEP, os 5 elementos da proposta e o contexto do tema', () => {
    const [, user] = buildEssayMessages('Tema X', 'Texto do aluno com algumas palavras.', 'Contexto curto do tema.');
    expect(user!.content).toContain('agente (quem)');
    expect(user!.content).toContain('direitos humanos');
    expect(user!.content).toContain('Contexto curto do tema.');
  });

  it('sem contexto, não inclui o bloco', () => {
    const [, user] = buildEssayMessages('Tema X', 'Texto.', null);
    expect(user!.content).not.toContain('Contexto do tema');
  });
});

describe('markExcerpts', () => {
  const text = 'A desigualdade persiste no país. Muitos jovens não têm acesso à escola. Portanto, o governo deve agir.';

  it('marca o trecho no texto e numera na ordem em que aparece', () => {
    const r = markExcerpts(text, [{ excerpt: 'o governo deve agir' }, { excerpt: 'Muitos jovens não têm acesso' }]);
    expect(r.flagged.map((f) => f.flag)).toEqual([1, 2]);
    expect(r.flagged[0]!.excerpt).toBe('Muitos jovens não têm acesso');
    expect(r.segments.filter((s) => s.flag).map((s) => s.text)).toEqual(['Muitos jovens não têm acesso', 'o governo deve agir']);
    // juntando tudo volta o texto original
    expect(r.segments.map((s) => s.text).join('')).toBe(text);
  });

  it('ignora trecho que não existe e trecho sobreposto', () => {
    const r = markExcerpts(text, [{ excerpt: 'frase inventada pela IA' }, { excerpt: 'Muitos jovens não têm' }, { excerpt: 'jovens não têm acesso' }]);
    expect(r.flagged).toHaveLength(1);
    expect(r.segments.map((s) => s.text).join('')).toBe(text);
  });

  it('sem trechos devolve o texto inteiro', () => {
    expect(markExcerpts(text, []).segments).toEqual([{ text }]);
  });
});

describe('LEVEL_DESCRIPTORS', () => {
  it('tem um texto para cada competência em cada degrau', () => {
    for (const c of [1, 2, 3, 4, 5]) {
      for (const n of [0, 40, 80, 120, 160, 200]) {
        expect(LEVEL_DESCRIPTORS[c]?.[n], `C${c} nota ${n}`).toBeTruthy();
      }
    }
  });
});

describe('modelo adaptado para outras bancas', () => {
  it('o prompt dispensa a proposta de intervenção e cobra o gênero', () => {
    const [sys, user] = buildEssayMessages('Racismo escolar', 'Texto.', null, { model: 'outras', banca: 'UNICAMP', genre: 'depoimento sigiloso', note: 'Duas propostas' });
    expect(sys!.content).toContain('vestibulares brasileiros');
    expect(user!.content).toContain('Banca: UNICAMP');
    expect(user!.content).toContain('depoimento sigiloso');
    expect(user!.content).toContain('NÃO exige proposta de intervenção');
    expect(user!.content).not.toContain('"intervencao"');
    expect(user!.content).not.toContain('agente (quem)');
  });

  it('a C5 não é limitada pelos elementos da proposta e muda de nome', () => {
    const withInter = {
      ...good,
      competencias: good.competencias.map((c) => ({ ...c, nota: 200 })),
      intervencao: { agente: false, acao: false, meio: false, finalidade: false, detalhamento: false },
    };
    const f = parseEssayFeedback(JSON.stringify(withInter), essay, { model: 'outras' })!;
    expect(f.competencies[4]!.score).toBe(200);
    expect(f.competencies[4]!.name).toBe('Conclusão e posicionamento');
    expect(f.intervention).toBeUndefined();
    expect(f.model).toBe('outras');
  });

  it('no modelo ENEM nada muda', () => {
    const f = parseEssayFeedback(JSON.stringify(good), essay)!;
    expect(f.model).toBeUndefined();
    expect(f.competencies[4]!.name).toBe('Proposta de intervenção');
  });
});
