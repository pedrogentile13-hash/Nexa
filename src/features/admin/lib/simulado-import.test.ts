import { describe, expect, it } from 'vitest';
import { parseSimuladoCode } from './simulado-import';

const VALID = JSON.stringify({
  simulation: {
    code: 'NEXA-SIM-MAT-001',
    title: 'Simulado de Matemática',
    description: 'Equações e funções',
    subject: 'Matemática',
    difficulty: 'medium',
    questions: [
      {
        id: 1,
        statement: 'Qual é o resultado da equação 2x + 4 = 10?',
        alternatives: { A: '2', B: '3', C: '4', D: '5' },
        correctAlternative: 'B',
        topic: 'Equações de primeiro grau',
        difficulty: 'easy',
      },
      {
        id: 2,
        statement: 'Quanto é 5 + 5?',
        alternatives: { A: '9', B: '10', C: '11' },
        correctAlternative: 'B',
      },
    ],
  },
});

describe('parseSimuladoCode', () => {
  it('aceita um simulado bem formado', () => {
    const result = parseSimuladoCode(VALID);

    expect(result.ok).toBe(true);
    expect(result.simulationCode).toBe('NEXA-SIM-MAT-001');
    expect(result.counts).toEqual({
      questions: 2,
      statements: 2,
      alternatives: 7,
      answerKeys: 2,
      errors: 0,
    });
    expect(result.questions[0]?.difficulty).toBe('facil'); // 'easy' normalizado
    expect(result.questions[1]?.difficulty).toBe('medio'); // sem difficulty própria, cai no default
  });

  it('recusa JSON malformado com mensagem específica', () => {
    const result = parseSimuladoCode('{ isto não fecha');
    expect(result.ok).toBe(false);
    expect(result.parseError).toMatch(/JSON válido/);
  });

  it('recusa texto vazio', () => {
    const result = parseSimuladoCode('   ');
    expect(result.ok).toBe(false);
    expect(result.parseError).toMatch(/Cole o código/);
  });

  it('exige o objeto simulation na raiz', () => {
    const result = parseSimuladoCode(JSON.stringify({ questions: [] }));
    expect(result.ok).toBe(false);
    expect(result.parseError).toMatch(/simulation/);
  });

  it('exige pelo menos uma questão', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: { questions: [] } }));
    expect(result.ok).toBe(false);
    expect(result.parseError).toMatch(/pelo menos uma questão/);
  });

  it('aponta enunciado faltando', () => {
    const result = parseSimuladoCode(
      JSON.stringify({
        simulation: {
          questions: [{ id: 1, alternatives: { A: 'x', B: 'y' }, correctAlternative: 'A' }],
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.questions[0]?.errors).toContain('falta o enunciado.');
  });

  it('exige pelo menos 2 alternativas preenchidas', () => {
    const result = parseSimuladoCode(
      JSON.stringify({
        simulation: {
          questions: [
            { id: 1, statement: 'Pergunta', alternatives: { A: 'única' }, correctAlternative: 'A' },
          ],
        },
      }),
    );
    expect(result.questions[0]?.errors.some((e) => e.includes('2 alternativas'))).toBe(true);
  });

  it('recusa alternativa correta que não existe entre as opções', () => {
    const result = parseSimuladoCode(
      JSON.stringify({
        simulation: {
          questions: [
            {
              id: 7,
              statement: 'Pergunta',
              alternatives: { A: '1', B: '2', C: '3', D: '4' },
              correctAlternative: 'E',
            },
          ],
        },
      }),
    );
    const error = result.questions[0]?.errors.find((e) => e.includes('correta informada'));
    expect(error).toContain('"E"');
    expect(error).toContain('A, B, C, D');
  });

  it('marca todas as questões que compartilham um id duplicado', () => {
    const result = parseSimuladoCode(
      JSON.stringify({
        simulation: {
          questions: [
            { id: 1, statement: 'Um', alternatives: { A: '1', B: '2' }, correctAlternative: 'A' },
            { id: 1, statement: 'Dois', alternatives: { A: '1', B: '2' }, correctAlternative: 'B' },
          ],
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.questions[0]?.errors.some((e) => e.includes('repetido'))).toBe(true);
    expect(result.questions[1]?.errors.some((e) => e.includes('repetido'))).toBe(true);
  });

  it('contagem de erros não impede a prévia de listar as questões boas junto', () => {
    const result = parseSimuladoCode(
      JSON.stringify({
        simulation: {
          questions: [
            { id: 1, statement: 'Boa', alternatives: { A: '1', B: '2' }, correctAlternative: 'A' },
            { id: 2, statement: '', alternatives: { A: '1', B: '2' }, correctAlternative: 'A' },
          ],
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.counts.questions).toBe(2);
    expect(result.counts.errors).toBe(1);
    expect(result.questions).toHaveLength(2);
  });

  it('sem schemaVersion, mesmo com campos novos, continua no caminho legado', () => {
    const result = parseSimuladoCode(
      JSON.stringify({
        simulation: {
          questions: [{ id: 1, statement: 'x', alternatives: { A: '1', B: '2' }, correctAlternative: 'A' }],
        },
      }),
    );
    expect(result.schemaVersion).toBe('1.0');
    expect(result.assets).toEqual([]);
  });
});

// `JSON.parse(JSON.stringify(...))` em vez do literal puro: o objeto é
// mutado em formas deliberadamente inválidas nos testes abaixo (3
// alternativas, referência quebrada etc.) — tipar isso estritamente exigiria
// um `as any` em cada teste. `JSON.parse` já devolve `any` por natureza.
const V2_BASE = JSON.parse(
  JSON.stringify({
    schemaVersion: '2.0',
    code: 'ANGLO-9ANO-001',
  title: 'Simulado Anglo — 9º ano',
  grade: 9,
  examStyle: 'anglo',
  mode: 'exam',
  settings: { shuffleQuestions: false, showTimer: true, timeLimitMinutes: 150 },
  resources: [
    { id: 'TXT01', type: 'text', title: 'Texto I', content: 'Texto-base das questões 1 a 2.', presentation: 'collapsible' },
    { id: 'IMG01', type: 'image', title: 'Mapa', src: '/mapa.png', alt: 'Mapa político' },
    {
      id: 'GRAPH01',
      type: 'chart',
      chart: { kind: 'bar', labels: ['A', 'B'], datasets: [{ label: 'Pop', data: [10, 20] }] },
    },
    { id: 'TABLE01', type: 'table', headers: ['País', 'Pop'], rows: [['Brasil', '200M']] },
  ],
  sections: [{ id: 'PORT', title: 'Língua Portuguesa', subject: 'Português', type: 'objective', questionIds: ['Q1', 'Q2'] }],
  questions: [
    {
      id: 'Q1',
      groupId: 'G1',
      subject: 'Português',
      book: 3,
      module: 27,
      topic: 'Tipos textuais',
      subtopic: 'Argumentação',
      difficulty: 'anglo',
      statement: 'Considerando o Texto I e o mapa, assinale a alternativa correta.',
      resourceRefs: ['TXT01', 'IMG01'],
      alternatives: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
      correctAlternative: 'C',
      explanation: 'A alternativa C interpreta corretamente.',
      skills: ['interpretação'],
      estimatedTimeSeconds: 120,
    },
    {
      id: 'Q2',
      groupId: 'G1',
      statement: 'Segunda questão do grupo, com base no gráfico e na tabela.',
      resourceRefs: ['GRAPH01', 'TABLE01'],
      alternatives: { A: 'a', B: 'b', C: 'c', D: 'd' },
      correctAlternative: 'B',
    },
  ],
  writingTasks: [
    {
      id: 'R1',
      title: 'Produção de Texto',
      genre: 'artigo_de_opiniao',
      theme: 'Tema de exemplo',
      prompt: 'Com base nos textos motivadores, produza um artigo de opinião.',
      resourceRefs: ['TXT01', 'GRAPH01'],
      instructions: ['Respeite o gênero solicitado.'],
      minWords: 180,
      maxWords: 450,
      evaluationCriteria: [{ id: 'C1', name: 'Adequação ao tema', maxScore: 2 }],
    },
  ],
  }),
);

describe('parseSimuladoCode — v2', () => {
  it('aceita o exemplo completo Anglo (schemaVersion 2.0)', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    expect(result.ok).toBe(true);
    expect(result.schemaVersion).toBe('2.0');
    expect(result.assets).toHaveLength(4);
    expect(result.sections).toHaveLength(1);
    expect(result.writingTasks).toHaveLength(1);
    expect(result.settings.timeLimitMinutes).toBe(150);
    expect(result.mode).toBe('exam');
    expect(result.grade).toBe(9);
  });

  it('questão A-D (4 alternativas) é válida', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const q2 = result.questions.find((q) => q.sourceId === 'Q2');
    expect(q2?.errors).toEqual([]);
    expect(q2?.options).toHaveLength(4);
  });

  it('questão A-E (5 alternativas) é válida e não obrigatória', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const q1 = result.questions.find((q) => q.sourceId === 'Q1');
    expect(q1?.errors).toEqual([]);
    expect(q1?.options).toHaveLength(5);
    expect(q1?.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('recusa questão com só 3 alternativas', () => {
    const sim = structuredClone(V2_BASE);
    sim.questions = [{ ...sim.questions[0], alternatives: { A: 'a', B: 'b', C: 'c' } }];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.questions[0]?.errors.some((e) => e.includes('4 ou 5 alternativas'))).toBe(true);
  });

  it('recusa questão com 6 alternativas', () => {
    const sim = structuredClone(V2_BASE);
    sim.questions = [
      { ...sim.questions[0], alternatives: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e', F: 'f' } },
    ];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.questions[0]?.errors.some((e) => e.includes('4 ou 5 alternativas') || e.includes('letras A a E'))).toBe(true);
  });

  it('texto-base compartilhado: duas questões referenciam o MESMO asset, sem duplicar conteúdo', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const txt = result.assets.find((a) => a.id === 'TXT01');
    expect(txt).toBeDefined();
    expect(result.questions[0]?.resourceRefs).toContain('TXT01');
  });

  it('texto-base é do tipo collapsible por padrão', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const txt = result.assets.find((a) => a.id === 'TXT01');
    expect(txt?.type === 'text' && txt.presentation).toBe('collapsible');
  });

  it('imagem exige alt (acessibilidade)', () => {
    const sim = structuredClone(V2_BASE);
    sim.resources = [{ id: 'IMG02', type: 'image', src: '/x.png' }];
    sim.questions[0].resourceRefs = [];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.simulationErrors.some((e) => e.includes('alt'))).toBe(true);
  });

  it('gráfico estruturado (bar/line/pie) é aceito como dado, não como imagem', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const graph = result.assets.find((a) => a.id === 'GRAPH01');
    expect(graph?.type).toBe('chart');
    expect(graph?.type === 'chart' && graph.chart.kind).toBe('bar');
  });

  it('tabela estruturada com headers e rows', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const table = result.assets.find((a) => a.id === 'TABLE01');
    expect(table?.type).toBe('table');
    expect(table?.type === 'table' && table.headers).toEqual(['País', 'Pop']);
  });

  it('questão com múltiplos recursos (texto + imagem)', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    expect(result.questions[0]?.resourceRefs).toEqual(['TXT01', 'IMG01']);
  });

  it('seção agrupa questões por matéria, na ordem da prova', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    expect(result.sections[0]).toMatchObject({ id: 'PORT', subject: 'Português', questionIds: ['Q1', 'Q2'] });
  });

  it('redação: gênero, tema, critérios de avaliação', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    const task = result.writingTasks[0];
    expect(task?.genre).toBe('artigo_de_opiniao');
    expect(task?.minWords).toBe(180);
    expect(task?.maxWords).toBe(450);
    expect(task?.evaluationCriteria).toEqual([{ id: 'C1', name: 'Adequação ao tema', maxScore: 2 }]);
  });

  it('textos motivadores da redação usam o mesmo sistema de resources', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    expect(result.writingTasks[0]?.resourceRefs).toEqual(['TXT01', 'GRAPH01']);
  });

  it('dificuldade "anglo" é aceita e distinta de "dificil"', () => {
    const result = parseSimuladoCode(JSON.stringify({ simulation: V2_BASE }));
    expect(result.questions.find((q) => q.sourceId === 'Q1')?.difficulty).toBe('anglo');
  });

  it('validação de referência quebrada: resourceRefs apontando para asset inexistente', () => {
    const sim = structuredClone(V2_BASE);
    sim.questions[0].resourceRefs = ['NAO-EXISTE'];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.ok).toBe(false);
    expect(result.simulationErrors.some((e) => e.includes('NAO-EXISTE'))).toBe(true);
  });

  it('validação de referência quebrada: section.questionIds apontando para questão inexistente', () => {
    const sim = structuredClone(V2_BASE);
    sim.sections = [{ id: 'X', title: 'X', type: 'objective', questionIds: ['QNAO'] }];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.ok).toBe(false);
    expect(result.simulationErrors.some((e) => e.includes('QNAO'))).toBe(true);
  });

  it('validação de referência quebrada: writingTaskIds apontando para redação inexistente', () => {
    const sim = structuredClone(V2_BASE);
    sim.sections = [{ id: 'RED', title: 'Redação', type: 'writing', writingTaskIds: ['RNAO'] }];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.ok).toBe(false);
    expect(result.simulationErrors.some((e) => e.includes('RNAO'))).toBe(true);
  });

  it('correctAlternative fora do conjunto de chaves gera mensagem clara', () => {
    const sim = structuredClone(V2_BASE);
    sim.questions[1].correctAlternative = 'E';
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    const q2 = result.questions.find((q) => q.sourceId === 'Q2');
    expect(q2?.errors.some((e) => e.includes('"E"') && e.includes('A, B, C, D'))).toBe(true);
  });

  it('prova só de redação (sem questões objetivas) é válida', () => {
    const sim = structuredClone(V2_BASE);
    sim.questions = [];
    sim.sections = [];
    const result = parseSimuladoCode(JSON.stringify({ simulation: sim }));
    expect(result.ok).toBe(true);
    expect(result.writingTasks).toHaveLength(1);
  });
});
