import { describe, expect, it } from 'vitest';
import { buildExplainMessages, MAX_PASSAGE_CHARS, parseExplainStyle, surroundingText } from './explain-prompt';

describe('surroundingText', () => {
  it('devolve a janela em volta do trecho', () => {
    const body = `${'a'.repeat(2000)}ALVO${'b'.repeat(2000)}`;
    const ctx = surroundingText(body, 'ALVO');
    expect(ctx).toContain('ALVO');
    expect(ctx.length).toBeLessThan(body.length);
  });

  it('se o trecho não está no texto, usa o começo do resumo', () => {
    expect(surroundingText('x'.repeat(5000), 'nada').length).toBe(1400);
  });
});

describe('buildExplainMessages', () => {
  const base = { title: 'Mitose', subjectName: 'Biologia', context: 'ctx', passage: 'prófase' };

  it('manda o trecho e o contexto, e muda a instrução conforme o estilo', () => {
    const normal = buildExplainMessages({ ...base, style: 'normal' });
    const simples = buildExplainMessages({ ...base, style: 'simples' });
    expect(normal[1]!.content).toContain('prófase');
    expect(normal[1]!.content).toContain('Mitose');
    expect(simples[0]!.content).toMatch(/analogia/);
    expect(normal[0]!.content).not.toMatch(/analogia/);
  });

  it('corta trechos gigantes', () => {
    const msgs = buildExplainMessages({ ...base, passage: 'z'.repeat(5000), style: 'normal' });
    expect((msgs[1]!.content.match(/z/g) ?? []).length).toBe(MAX_PASSAGE_CHARS);
  });
});

describe('parseExplainStyle', () => {
  it('cai em normal para valor desconhecido', () => {
    expect(parseExplainStyle('exemplo')).toBe('exemplo');
    expect(parseExplainStyle('x')).toBe('normal');
  });
});
