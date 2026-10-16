import { PDFParse } from 'pdf-parse';

/**
 * Extração de PDF, síncrona no upload (ADR-039).
 *
 * Sem fila, sem worker: o admin espera a resposta do próprio envio. É viável
 * porque o material típico aqui é um resumo/apostila de algumas dezenas de
 * páginas, não um livro inteiro — se isso mudar, revisitar para assíncrono.
 *
 * `pdf-parse` v2 (não v1): a v1 embarca um pdf.js de 2017 que rejeita PDF
 * válido gerado por ferramentas atuais ("bad XRef entry" num PDF do
 * ReportLab, por exemplo). A v2 é reescrita sobre `pdfjs-dist` atual e é
 * anunciada para rodar em Vercel/Netlify/Cloudflare — exatamente este caso.
 * Verificado manualmente contra dois PDFs reais (um deles com 1000+ páginas
 * de conteúdo variado); não há teste automatizado para a chamada em si porque
 * o "worker" que a biblioteca simula via `postMessage` esbarra na clonagem
 * estruturada do runner do Vitest ("Cannot transfer object of unsupported
 * type") — um problema do ambiente de teste, não do código em produção, onde
 * a Server Action roda num processo Node comum. `estimateReadingSeconds`,
 * que é lógica nossa, tem teste de verdade em `pdf.test.ts`.
 */

export interface PdfExtraction {
  pageCount: number;
  text: string;
  /** Estimativa de leitura, em segundos. */
  readingSeconds: number;
}

const WORDS_PER_MINUTE = 200;

/** 200 palavras/min é a referência comum para leitura silenciosa de texto
 * técnico em português. Piso de 60s: ninguém lê "8 palavras" em 2 segundos. */
export function estimateReadingSeconds(wordCount: number): number {
  return Math.max(60, Math.round((wordCount / WORDS_PER_MINUTE) * 60));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export async function extractPdf(buffer: Buffer): Promise<PdfExtraction> {
  const parser = new PDFParse({ data: buffer });
  try {
    const [info, textResult] = await Promise.all([parser.getInfo(), parser.getText()]);
    const text = textResult.text.trim();

    return {
      pageCount: info.total,
      text,
      readingSeconds: estimateReadingSeconds(countWords(text)),
    };
  } finally {
    await parser.destroy();
  }
}
