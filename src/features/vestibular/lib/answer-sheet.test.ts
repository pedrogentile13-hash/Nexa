import { describe, expect, it } from 'vitest';
import { parseAreaRanges, answersToPayload, applyAreas, formatElapsed, groupByArea, missingNumbers, parseAiAnswers, parseAnswerKeyText } from './answer-sheet';

describe('parseAnswerKeyText', () => {
  it('lê vários formatos e ordena', () => {
    const r = parseAnswerKeyText('1-A 2 C 03) b\n4: D\n5 anulada\n6 X');
    expect(r.entries.map((e) => [e.number, e.correct, e.annulled])).toEqual([
      [1, 'A', false], [2, 'C', false], [3, 'B', false], [4, 'D', false], [5, null, true], [6, null, true],
    ]);
  });
  it('questão repetida vale a última e fora de faixa é ignorada', () => {
    const r = parseAnswerKeyText('1-A 1-B 999-C 0-D');
    expect(r.entries).toEqual([{ number: 1, correct: 'B', annulled: false }]);
  });
  it('não confunde número de página nem palavras', () => {
    expect(parseAnswerKeyText('Gabarito oficial 2025 página 3 de 4').entries).toEqual([]);
  });
});

describe('missingNumbers e applyAreas', () => {
  it('aponta os buracos', () => {
    const { entries } = parseAnswerKeyText('1-A 2-B 4-C');
    expect(missingNumbers(entries)).toEqual([3]);
    expect(missingNumbers([])).toEqual([]);
  });
  it('aplica áreas por faixa', () => {
    const { entries } = parseAnswerKeyText('1-A 2-B 3-C');
    const out = applyAreas(entries, [{ from: 1, to: 2, area: 'Linguagens' }, { from: 3, to: 3, area: 'Matemática' }]);
    expect(out.map((e) => e.area)).toEqual(['Linguagens', 'Linguagens', 'Matemática']);
  });
});

describe('parseAiAnswers', () => {
  it('lê o formato pedido, com cerca de código', () => {
    const r = parseAiAnswers('```json\n{"respostas":[{"numero":1,"resposta":"a"},{"numero":2,"resposta":null,"duvida":true},{"numero":3,"resposta":"Z"}]}\n```');
    expect(r?.answers).toEqual({ 1: 'A', 2: null, 3: null });
    expect(r?.doubtful).toEqual([2]);
  });
  it('lê objeto simples e lista', () => {
    expect(parseAiAnswers('{"1":"B","2":"c"}')?.answers).toEqual({ 1: 'B', 2: 'C' });
    expect(parseAiAnswers('[{"numero":5,"resposta":"E"}]')?.answers).toEqual({ 5: 'E' });
  });
  it('lixo ou vazio devolve null', () => {
    expect(parseAiAnswers('não consegui ler')).toBeNull();
    expect(parseAiAnswers('{"respostas":[]}')).toBeNull();
  });
  it('ignora número fora da prova', () => {
    expect(parseAiAnswers('{"500":"A","1":"B"}', 90)?.answers).toEqual({ 1: 'B' });
  });
});

describe('cartão', () => {
  it('agrupa por área mantendo a ordem', () => {
    const g = groupByArea([{ number: 1, area: 'L' }, { number: 2, area: 'L' }, { number: 3, area: 'M' }, { number: 4, area: 'L' }]);
    expect(g.map((x) => [x.area, x.items.length])).toEqual([['L', 2], ['M', 1], ['L', 1]]);
  });
  it('só envia o que foi marcado', () => {
    expect(answersToPayload({ 1: 'A', 2: null, 3: 'C' })).toEqual({ 1: 'A', 3: 'C' });
  });
  it('formata o tempo', () => {
    expect(formatElapsed(65)).toBe('01:05');
    expect(formatElapsed(3600 * 5 + 60 * 7)).toBe('5h 07min');
    expect(formatElapsed(-4)).toBe('00:00');
  });
});

describe('parseAreaRanges', () => {
  it('lê faixas separadas por vírgula ou linha', () => {
    expect(parseAreaRanges('1-45 Linguagens, 46-90 Ciências Humanas\n91 a 135 Natureza')).toEqual([
      { from: 1, to: 45, area: 'Linguagens' },
      { from: 46, to: 90, area: 'Ciências Humanas' },
      { from: 91, to: 135, area: 'Natureza' },
    ]);
  });
  it('ignora faixa quebrada', () => {
    expect(parseAreaRanges('50-10 X, abc, 1-500 Y')).toEqual([]);
  });
});
