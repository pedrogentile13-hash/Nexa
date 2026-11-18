import { describe, expect, it } from 'vitest';
import { buildHintMessages, leaksAnswer } from './hint-prompt';

const q = {
  subjectName: 'Matemática',
  statement: 'Quanto é 2x + 3 = 11?',
  options: [{ body: 'x = 2' }, { body: 'x = 4' }, { body: 'x = 7' }],
  hasAttachments: false,
};

describe('buildHintMessages', () => {
  it('leva a questão e as alternativas com letra, e proíbe apontar a certa', () => {
    const [system, user] = buildHintMessages(q, 1);
    expect(user!.content).toContain('A) x = 2');
    expect(user!.content).toContain('B) x = 4');
    expect(system!.content).toMatch(/nunca diga qual alternativa/);
    expect(system!.content).toMatch(/não conhece o gabarito/);
  });

  it('o nível 2 é mais direto mas continua sem dar a alternativa', () => {
    const [, l1] = buildHintMessages(q, 1);
    const [, l2] = buildHintMessages(q, 2);
    expect(l1!.content).toMatch(/LEVE/);
    expect(l2!.content).toMatch(/MAIS DIRETA/);
    expect(l2!.content).toMatch(/SEM dizer qual alternativa/);
  });

  it('avisa a IA quando a questão tem figura que ela não vê', () => {
    const [, user] = buildHintMessages({ ...q, hasAttachments: true }, 1);
    expect(user!.content).toMatch(/NÃO vê/);
  });
});

describe('leaksAnswer', () => {
  it('pega respostas que apontam a alternativa', () => {
    for (const t of [
      'A resposta correta é a B.',
      'Marque a alternativa C.',
      'Portanto, a letra D é a certa.',
      'O gabarito é E',
      'assinale a letra A',
      'Alternativa correta: B',
    ]) {
      expect(leaksAnswer(t), t).toBe(true);
    }
  });

  it('deixa passar dicas legítimas', () => {
    for (const t of [
      'Pense em como isolar o x: o que você faz primeiro com o 3?',
      'Lembre que subtrair dos dois lados mantém a igualdade.',
      'A ideia é desfazer as operações na ordem inversa.',
      'Compare o sinal de cada termo antes de somar.',
    ]) {
      expect(leaksAnswer(t), t).toBe(false);
    }
  });
});
