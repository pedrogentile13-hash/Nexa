import type { SupabaseClient } from '@supabase/supabase-js';
import { completeWithAI } from '@/lib/ai/provider';
import { aiMessage } from '@/features/nexa-ia/server/material-ingest';
import { ANSWER_KEY_PROMPT, applyAreas, missingNumbers, parseAnswerKeyText, parseAreaRanges, type KeyEntry } from '@/features/vestibular/lib/answer-sheet';
import type { Database } from '@/types/database.types';

export type KeyPreview = { ok: true; text: string; count: number; missing: number[]; first: number; last: number; source: 'texto do PDF' | 'IA' } | { ok: false; message: string };

/** Traduz o erro do banco: o mais comum é o SQL do cartão-resposta ou do gabarito por caderno ainda não ter sido rodado. */
export function dbProblem(error: { code?: string; message: string }): string {
  if (error.code === '42P01' || (/exam_answer_keys/i.test(error.message) && /does not exist|schema cache|could not find/i.test(error.message))) {
    return 'O banco ainda não tem a tabela de gabaritos. Rode o SQL do cartão-resposta (migration 20261109000600) no Supabase e tente de novo.';
  }
  if (error.code === '42703' || /variant/i.test(error.message)) {
    return 'O banco ainda não tem o gabarito por caderno. Rode o SQL 20261110000200_gabarito_por_caderno no Supabase e tente de novo.';
  }
  if (error.code === '42501') return 'Sem permissão para salvar. Entre com a conta de administrador geral.';
  return `Não consegui salvar: ${error.message}`;
}

const asText = (entries: KeyEntry[]) => entries.map((e) => `${e.number}-${e.annulled ? 'anulada' : e.correct}`).join(' ');

function preview(entries: KeyEntry[], source: 'texto do PDF' | 'IA'): KeyPreview {
  return { ok: true, text: asText(entries), count: entries.length, missing: missingNumbers(entries), first: entries[0]!.number, last: entries[entries.length - 1]!.number, source };
}

/** Lê o gabarito de um PDF/imagem já em memória: primeiro o texto do PDF (exato); se não houver texto, a IA lê a imagem. */
export async function readKey(data: Buffer, mime: string): Promise<KeyPreview> {
  try {
    const { extractPdf } = await import('./pdf');
    const pdf = await extractPdf(data);
    const entries = parseAnswerKeyText(pdf.text).entries;
    if (entries.length >= 20) return preview(entries, 'texto do PDF');
  } catch {
    // cai para a IA
  }

  const ai = await completeWithAI(
    [{ role: 'user', content: ANSWER_KEY_PROMPT, attachments: [{ mimeType: mime.includes('pdf') ? 'application/pdf' : mime, data: data.toString('base64') }] }],
    { maxTokens: 8192, temperature: 0, timeoutMs: 90_000, audience: 'staff' },
  );
  if (!ai.ok) return { ok: false, message: aiMessage(ai.reason) };
  const entries = parseAnswerKeyText(ai.text).entries;
  if (entries.length === 0) return { ok: false, message: 'Não consegui ler o gabarito do arquivo. Cole o gabarito à mão.' };
  return preview(entries, 'IA');
}

/** Salva (substitui) o gabarito de UM caderno da edição. Vale para o cadastro à mão e para o envio em massa. */
export async function persistAnswerKey(
  supabase: SupabaseClient<Database>,
  editionId: string,
  variant: string,
  text: string,
  areas: string,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const name = variant.trim();
  if (name.length > 60) return { ok: false, message: 'Nome do caderno grande demais (máximo 60 letras).' };
  if (text.length > 20_000) return { ok: false, message: 'Texto grande demais.' };

  let entries: KeyEntry[] = parseAnswerKeyText(text).entries;
  if (entries.length === 0) return { ok: false, message: 'Não encontrei nenhuma resposta. Use o formato "1-A 2-C 3-anulada".' };
  const missing = missingNumbers(entries);
  if (missing.length > 0) return { ok: false, message: `Faltam questões no gabarito: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? '…' : ''}.` };

  const ranges = parseAreaRanges(areas);
  if (ranges.length > 0) entries = applyAreas(entries, ranges);

  const removed = await supabase.from('exam_answer_keys').delete().eq('exam_edition_id', editionId).eq('variant', name);
  if (removed.error) return { ok: false, message: dbProblem(removed.error) };
  const { error } = await supabase.from('exam_answer_keys').insert(
    entries.map((e) => ({ exam_edition_id: editionId, variant: name, number: e.number, correct: e.correct, annulled: e.annulled, area: e.area ?? null })),
  );
  if (error) return { ok: false, message: dbProblem(error) };
  return { ok: true, message: `Gabarito${name ? ` do caderno ${name}` : ''} salvo: ${entries.length} questões (${entries[0]!.number} a ${entries[entries.length - 1]!.number})${ranges.length ? ` em ${ranges.length} áreas` : ''}.` };
}
