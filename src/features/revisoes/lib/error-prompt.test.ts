import { describe, expect, it } from 'vitest';
import { buildErrorExplanationMessages, parseCause } from './error-prompt';

const ctx = {
  subjectName: 'Matemática',
  topicName: 'Equações do 2º grau',
  statement: 'Quais as raízes de x² − 5x + 6 = 0?',
  chosen: '1 e 6',
  correct: '2 e 3',
  explanation: 'Soma 5 e produto 6.',
};

describe('buildErrorExplanationMessages', () => {
  it('leva questão, resposta marcada, certa e a explicação, e pede a causa', () => {
    const [system, user] = buildErrorExplanationMessages(ctx);
    expect(user!.content).toContain('x² − 5x + 6');
    expect(user!.content).toContain('1 e 6');
    expect(user!.content).toContain('2 e 3');
    expect(user!.content).toContain('Soma 5 e produto 6.');
    expect(user!.content).toMatch(/conceito.*distração.*interpretação/s);
    expect(system!.content).toMatch(/não da pessoa/);
  });

  it('funciona sem explicação oficial nem resposta registrada', () => {
    const [, user] = buildErrorExplanationMessages({ ...ctx, explanation: null, chosen: null });
    expect(user!.content).not.toMatch(/Explicação oficial/);
    expect(user!.content).toMatch(/não registrado/);
  });
});

describe('parseCause', () => {
  it('lê a causa em negrito, com e sem acento', () => {
    expect(parseCause('**Causa provável:** conceito. Você...')).toBe('conceito');
    expect(parseCause('**Causa provável:** distração — sabia')).toBe('distração');
    expect(parseCause('**Causa provável:** interpretacao')).toBe('interpretação');
  });
  it('devolve null quando não reconhece', () => {
    expect(parseCause('Sem formato')).toBeNull();
    expect(parseCause('**Causa provável:** azar')).toBeNull();
  });
});
