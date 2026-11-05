import { describe, expect, it } from 'vitest';
import { estimateReadingSeconds } from './pdf';

/**
 * `extractPdf` em si (a chamada a `pdf-parse`) foi verificada manualmente
 * contra PDFs reais — ver o comentário em `pdf.ts` sobre por que não há
 * teste automatizado para essa parte. O que é lógica nossa, e testável de
 * verdade, é a conversão de contagem de palavras em tempo de leitura.
 */
describe('estimateReadingSeconds', () => {
  it('usa 200 palavras por minuto como referência', () => {
    expect(estimateReadingSeconds(200)).toBe(60);
    expect(estimateReadingSeconds(400)).toBe(120);
  });

  it('nunca fica abaixo de 60 segundos, mesmo para textos curtos', () => {
    expect(estimateReadingSeconds(0)).toBe(60);
    expect(estimateReadingSeconds(8)).toBe(60);
  });

  it('arredonda para o segundo mais próximo', () => {
    expect(estimateReadingSeconds(250)).toBe(75);
  });
});
