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
});
