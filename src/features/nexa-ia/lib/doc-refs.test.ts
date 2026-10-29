import { describe, expect, it } from 'vitest';
import { docsContextBlock, findDocCodes } from './doc-refs';

describe('findDocCodes', () => {
  it('acha a sigla em várias grafias e normaliza', () => {
    expect(findDocCodes('crie um simulado com o B01')).toEqual(['B01']);
    expect(findDocCodes('resumo do b2 e do B 03, depois (B004)')).toEqual(['B02', 'B03', 'B04']);
  });

  it('não repete e limita a 3', () => {
    expect(findDocCodes('B1 B01 b1')).toEqual(['B01']);
    expect(findDocCodes('B1 B2 B3 B4 B5')).toEqual(['B01', 'B02', 'B03']);
  });

  it('não confunde palavras e números soltos', () => {
    expect(findDocCodes('Bom dia, tenho B12abc e web3 e abb1')).toEqual([]);
    expect(findDocCodes('letra B)')).toEqual([]);
    expect(findDocCodes('B00 e B0')).toEqual([]);
  });
});

describe('docsContextBlock', () => {
  it('vazio sem material; com material traz sigla, título e corta o excesso', () => {
    expect(docsContextBlock([])).toBe('');
    const block = docsContextBlock([{ code: 'B01', title: 'Biologia', content: 'x'.repeat(50_000) }]);
    expect(block).toContain('[B01] Biologia');
    expect(block.length).toBeLessThan(15_000);
  });
});
