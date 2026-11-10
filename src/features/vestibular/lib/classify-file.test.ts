import { describe, expect, it } from 'vitest';
import { buildLabel, hintsFromFilename, mergeClassification, parseClassification } from './classify-file';

describe('classificação de caderno pela capa', () => {
  it('monta o nome só com o que foi encontrado', () => {
    expect(buildLabel({ stage: '1º dia', notebook: '2', color: 'amarelo', kind: 'caderno' })).toBe('1º dia · Caderno 2 · Amarelo');
    expect(buildLabel({ stage: '2ª fase', kind: 'caderno' })).toBe('2ª fase');
    expect(buildLabel({ kind: 'gabarito' })).toBe('Gabarito');
    expect(buildLabel({ kind: 'caderno' })).toBe('Caderno de questões');
  });

  it('lê o JSON da IA (com cerca de código) e valida', () => {
    const r = parseClassification('```json\n{"vestibular":"ENEM","ano":2025,"tipo":"caderno","etapa":"1º dia","caderno":2,"cor":"AMARELO","confianca":"alta"}\n```');
    expect(r).toMatchObject({ exam: 'enem', year: 2025, kind: 'caderno', notebook: '2', color: 'amarelo', label: '1º dia · Caderno 2 · Amarelo', confidence: 'alta' });
  });

  it('descarta o que não confere: vestibular desconhecido, ano absurdo, cor inventada', () => {
    const r = parseClassification('{"vestibular":"vunesp2","ano":1850,"tipo":"gabarito","cor":"xyz","confianca":"talvez"}');
    expect(r).toMatchObject({ exam: null, year: null, kind: 'gabarito', color: null, confidence: 'baixa', label: 'Gabarito' });
  });

  it('resposta quebrada vira null (nunca um chute)', () => {
    expect(parseClassification('não sei')).toBeNull();
  });

  it('tira pistas do nome do arquivo', () => {
    expect(hintsFromFilename('2025_PV_impresso_D2_CD6.pdf')).toMatchObject({ year: 2025, kind: 'caderno', stage: '2º dia', notebook: '6' });
    expect(hintsFromFilename('2025_GB_impresso_D1_CD1.pdf')).toMatchObject({ kind: 'gabarito', stage: '1º dia', notebook: '1' });
    expect(hintsFromFilename('fuvest-2024-prova.pdf')).toMatchObject({ exam: 'fuvest', year: 2024 });
  });

  it('a capa manda; o nome do arquivo só preenche o que faltou', () => {
    const cover = parseClassification('{"vestibular":"enem","ano":2025,"tipo":"caderno","etapa":null,"caderno":null,"cor":"azul","confianca":"media"}');
    const m = mergeClassification(cover, '2025_PV_impresso_D1_CD1.pdf');
    expect(m).toMatchObject({ exam: 'enem', year: 2025, stage: '1º dia', notebook: '1', color: 'azul', label: '1º dia · Caderno 1 · Azul', confidence: 'media' });
    const only = mergeClassification(null, '2024_GB_D2_CD5.pdf');
    expect(only).toMatchObject({ year: 2024, kind: 'gabarito', stage: '2º dia', confidence: 'baixa' });
  });
});
