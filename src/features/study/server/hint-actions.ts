'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { buildHintMessages, HINT_XP_COST, leaksAnswer, MAX_HINT_LEVEL } from '../lib/hint-prompt';

export type HintResult = { ok: true; hint: string; xpCost: number } | { ok: false; message: string };

const schema = z.object({
  resourceId: z.string().uuid(),
  questionId: z.string().uuid(),
  level: z.coerce.number().int().min(1).max(MAX_HINT_LEVEL),
});

/**
 * Dica de IA para UMA questão do simulado.
 *
 * Relê a questão no servidor pela mesma porta do aluno (`quiz_questions`, sem
 * gabarito) — o cliente manda só ids, nunca o texto, então não dá para usar
 * isto como chat livre nem para a IA receber o gabarito. O professor pode
 * desligar a ajuda num simulado com `settings.allowHints = false`.
 */
export async function getQuestionHint(resourceId: string, questionId: string, level: number): Promise<HintResult> {
  const parsed = schema.safeParse({ resourceId, questionId, level });
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  // A RLS decide se este aluno enxerga o simulado.
  const { data: resource } = await supabase.from('resources').select('id, settings').eq('id', parsed.data.resourceId).maybeSingle();
  if (!resource) return { ok: false, message: 'Simulado indisponível.' };
  if ((resource.settings as { allowHints?: boolean } | null)?.allowHints === false) {
    return { ok: false, message: 'O professor desligou as dicas neste simulado.' };
  }

  const { data: questions } = await supabase.rpc('quiz_questions', { p_resource_id: parsed.data.resourceId });
  const q = questions?.find((x) => x.question_id === parsed.data.questionId);
  if (!q) return { ok: false, message: 'Não encontrei esta questão.' };

  const quota = await checkAiQuota(supabase, 'hint');
  if (!quota.ok) return { ok: false, message: quota.message };

  const result = await completeWithAI(
    buildHintMessages(
      {
        subjectName: q.subject_name,
        statement: q.statement,
        options: [...q.options].sort((a, b) => a.position - b.position).map((o) => ({ body: o.body })),
        hasAttachments: (q.resource_refs?.length ?? 0) > 0,
      },
      parsed.data.level as 1 | 2,
    ),
    { maxTokens: 300, temperature: 0.4, timeoutMs: 15_000 },
  );

  if (!result.ok) return { ok: false, message: 'A dica não ficou pronta agora — tente de novo em instantes.' };
  // A IA não conhece o gabarito, mas se apontou uma alternativa mesmo assim, não mostramos.
  if (leaksAnswer(result.text)) {
    return { ok: false, message: 'Não consegui dar uma dica boa para esta questão. Tente reler o enunciado com calma.' };
  }
  // A dica entregue custa XP (só se a pessoa tiver; o XP nunca fica negativo).
  const hintLevel = parsed.data.level as 1 | 2;
  const xpCost = HINT_XP_COST[hintLevel];
  await supabase.rpc('award_xp_self', {
    p_amount: -xpCost,
    p_reason: `Dica de IA (nível ${hintLevel})`,
    p_source_type: 'system',
    p_source_id: parsed.data.questionId,
  });
  return { ok: true, hint: result.text.trim(), xpCost };
}
