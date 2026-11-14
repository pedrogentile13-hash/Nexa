import { completeWithAI, type AIAttachment } from '@/lib/ai/provider';
import { classifyUpload, TRANSCRIBE_INSTRUCTION } from '../lib/material';

/** Leitura de arquivos do aluno (PDF, imagem, texto) — usada pela Biblioteca e pelo chat. */

export const MIN_TEXT = 20;

export function aiMessage(reason: string): string {
  switch (reason) {
    case 'missing_api_key':
      return 'A IA não está configurada no servidor. Avise um administrador.';
    case 'content_filter':
      return 'O conteúdo esbarrou no filtro da IA. Tente outro trecho.';
    case 'unsupported':
      return 'Ler imagens e PDFs escaneados precisa do Gemini, que está indisponível agora. Tente colar o texto.';
    default:
      return 'Não consegui agora — tente de novo em instantes.';
  }
}

/** Transcreve imagem ou PDF sem texto com o Gemini. */
async function transcribe(file: File): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  const attachment: AIAttachment = {
    mimeType: file.type,
    data: Buffer.from(await file.arrayBuffer()).toString('base64'),
  };
  const r = await completeWithAI(
    [{ role: 'user', content: TRANSCRIBE_INSTRUCTION, attachments: [attachment] }],
    { maxTokens: 8192, temperature: 0, timeoutMs: 60_000 },
  );
  return r.ok ? { ok: true, text: r.text.trim() } : { ok: false, message: aiMessage(r.reason) };
}

export async function readUploadedFile(file: File): Promise<{ ok: true; text: string; pages: number | null } | { ok: false; message: string }> {
  const kind = classifyUpload(file.type);
  if (kind === 'text') return { ok: true, text: (await file.text()).trim(), pages: null };

  if (kind === 'pdf') {
    try {
      const { extractPdf } = await import('@/features/admin/server/pdf');
      const pdf = await extractPdf(Buffer.from(await file.arrayBuffer()));
      if (pdf.text.length >= MIN_TEXT * 5) return { ok: true, text: pdf.text, pages: pdf.pageCount };
      // PDF escaneado (só imagem): a IA lê.
      const t = await transcribe(file);
      return t.ok ? { ok: true, text: t.text, pages: pdf.pageCount } : t;
    } catch {
      const t = await transcribe(file);
      return t.ok ? { ok: true, text: t.text, pages: null } : t;
    }
  }

  const t = await transcribe(file);
  return t.ok ? { ok: true, text: t.text, pages: null } : t;
}
