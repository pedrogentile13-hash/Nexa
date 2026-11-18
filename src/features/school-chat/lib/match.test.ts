import { describe, expect, it } from 'vitest';
import { matchFaq, tokenize, type FaqEntry } from './match';

const base: FaqEntry[] = [
  { id: 'entrega', question: 'Quando é a entrega do trabalho de história?', keywords: 'prazo, data limite' },
  { id: 'prova', question: 'O que cai na prova bimestral?', keywords: 'conteúdo, matéria, assunto' },
  { id: 'recup', question: 'Como funciona a recuperação?', keywords: 'substitutiva, segunda chamada' },
  { id: 'material', question: 'Onde encontro o material da aula?', keywords: 'apostila, slides, pdf' },
  { id: 'grupo', question: 'O trabalho pode ser feito em grupo?', keywords: 'dupla, trio' },
];

const id = (q: string) => matchFaq(q, base)?.faqId ?? null;

describe('tokenize', () => {
  it('ignora acento, plural e palavras sem assunto', () => {
    expect(tokenize('Quando vai ser a ENTREGA das Avaliações?')).toEqual(['@entrega', '@prova']);
  });
});

describe('matchFaq — perguntas que alunos fazem de verdade', () => {
  it('encontra pela pergunta quase igual', () => {
    expect(id('quando é a entrega do trabalho?')).toBe('entrega');
  });

  it('encontra por sinônimos e jeito de falar do aluno', () => {
    expect(id('prof qual o prazo pra mandar a tarefa de história')).toBe('entrega');
    expect(id('o que vai cair na avaliação?')).toBe('prova');
    expect(id('perdi a prova, tem segunda chamada?')).toBe('recup');
    expect(id('cadê o pdf da aula?')).toBe('material');
    expect(id('pode fazer em dupla o trabalho?')).toBe('grupo');
  });

  it('usa as palavras-chave extras do professor', () => {
    expect(id('qual o assunto cobrado?')).toBe('prova');
  });

  it('NA DÚVIDA NÃO RESPONDE: pergunta fora da base vai para o professor', () => {
    expect(id('posso ir ao banheiro?')).toBeNull();
    expect(id('qual a nota do Pedro?')).toBeNull();
    expect(id('o professor é casado?')).toBeNull();
    expect(id('oi')).toBeNull();
    expect(id('')).toBeNull();
  });

  it('uma palavra solta de uma pergunta longa não basta', () => {
    expect(id('sobre o trabalho, eu estou doente e preciso de um laudo médico')).toBeNull();
  });

  it('com a base vazia, nunca responde', () => {
    expect(matchFaq('quando é a prova?', [])).toBeNull();
  });

  it('escolhe a entrada mais específica quando duas servem', () => {
    const entries: FaqEntry[] = [
      { id: 'geral', question: 'Como entrego trabalhos?' },
      { id: 'hist', question: 'Quando é a entrega do trabalho de história?' },
    ];
    expect(matchFaq('quando entrego o trabalho de história', entries)?.faqId).toBe('hist');
  });
});
