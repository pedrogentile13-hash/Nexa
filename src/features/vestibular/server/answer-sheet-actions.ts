'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { aiMessage } from '@/features/nexa-ia/server/material-ingest';
import { getPlanInfo } from '@/features/billing/server/entitlements';
import { answersToPayload, answerSheetPrompt, parseAiAnswers, type AnswerMap, type Letter } from '../lib/answer-sheet';
import { getSheetLayout } from './answer-sheet';

export type SubmitResult = { ok: true; attemptId: string } | { ok: false; message: string };

const submitSchema = z.object({
  editionId: z.string().uuid(),
  answers: z.record(z.string().regex(/^\d{1,3}$/), z.enum(['A', 'B', 'C', 'D', 'E'])),
  durationSeconds: z.number().int().min(0).max(172_800).nullable(),
  mode: z.enum(['digital', 'foto']),
});

/** Corrige no banco com o gabarito oficial e guarda a tentativa. */
export async function submitAnswerSheet(input: {
  editionId: string;
  answers: Record<string, string>;
  durationSeconds: number | null;
  mode: 'digital' | 'foto';
}): Promise<SubmitResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Respostas inválidas. Confira o cartão e tente de novo.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Entre para enviar suas respostas.' };

  const { data, error } = await supabase.rpc('submit_exam_attempt', {
    p_edition_id: parsed.data.editionId,
    p_answers: parsed.data.answers,
    p_duration_seconds: parsed.data.durationSeconds,
    p_mode: parsed.data.mode,
  });
  const row = data?.[0];
  if (error || !row) {
    return { ok: false, message: error?.message?.includes('gabarito') ? 'O gabarito desta prova ainda não foi cadastrado.' : 'Não consegui corrigir agora. Tente de novo.' };
  }
  return { ok: true, attemptId: row.attempt_id };
}

export type PhotoResult =
  | { ok: true; answers: AnswerMap; doubtful: number[]; read: number }
  | { ok: false; message: string };

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * A IA olha a foto do cartão-resposta e devolve o que está marcado. NÃO corrige: o aluno confere a leitura no cartão
 * (a IA pode errar, principalmente em foto torta ou com pouca luz) e só então envia para a correção.
 */
export async function readAnswerSheetPhoto(formData: FormData): Promise<PhotoResult> {
  const editionId = z.string().uuid().safeParse(formData.get('editionId'));
  const file = formData.get('photo');
  if (!editionId.success || !(file instanceof File)) return { ok: false, message: 'Envie uma foto do cartão.' };
  if (!PHOTO_TYPES.includes(file.type)) return { ok: false, message: 'Use uma foto JPG, PNG ou WebP.' };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, message: 'A foto é grande demais (máximo 6 MB).' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Entre para continuar.' };

  const layout = await getSheetLayout(editionId.data);
  if (layout.length === 0) return { ok: false, message: 'O gabarito desta prova ainda não foi cadastrado.' };

  const { limits } = await getPlanInfo();
  const quota = await checkAiQuota(supabase, 'answer_sheet', limits.aiMultiplier);
  if (!quota.ok) return { ok: false, message: quota.message };

  const result = await completeWithAI(
    [{ role: 'user', content: answerSheetPrompt(layout.length), attachments: [{ mimeType: file.type, data: Buffer.from(await file.arrayBuffer()).toString('base64') }] }],
    { maxTokens: 6000, temperature: 0, timeoutMs: 60_000 },
  );
  if (!result.ok) return { ok: false, message: aiMessage(result.reason) };

  const parsed = parseAiAnswers(result.text, layout.length);
  if (!parsed) return { ok: false, message: 'Não consegui ler as marcações nessa foto. Tente com mais luz e o cartão reto, ou marque no app.' };

  const valid = new Set(layout.map((q) => q.number));
  const answers: AnswerMap = {};
  for (const [n, l] of Object.entries(parsed.answers)) if (valid.has(Number(n))) answers[Number(n)] = l as Letter | null;
  return { ok: true, answers, doubtful: parsed.doubtful.filter((n) => valid.has(n)), read: Object.keys(answersToPayload(answers)).length };
}

export async function deleteMyAttempt(attemptId: string): Promise<{ ok: boolean }> {
  if (!z.string().uuid().safeParse(attemptId).success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from('exam_attempts').delete().eq('id', attemptId);
  return { ok: !error };
}
