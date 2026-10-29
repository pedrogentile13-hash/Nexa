import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { streamWithAI } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { getStaffIdentity } from '@/features/escola/server/guard';
import { STAFF_ROLE_LABEL } from '@/features/escola/lib/access';

/** Chat de IA dos painéis da equipe (portal /escola e /admin). Sem histórico no banco: a conversa vive na tela. */

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(16),
});

const SYSTEM = (who: string) => `Você é a NexaAI do painel, assistente de quem trabalha na escola dentro do Nexa Study (${who}).
Responda em português do Brasil, direto e prático, como um colega de coordenação pedagógica. Seja conciso: a pessoa está entre uma tarefa e outra.
Ajude a planejar aulas, escrever resumos e questões, montar simulados, redigir comunicados para alunos e famílias, organizar turmas e interpretar o desempenho dos alunos, e a usar o painel.
Você NÃO tem acesso aos dados dos alunos nesta conversa: se pedirem números ou nomes, explique em qual tela do painel encontrar. Não invente dados.
Formate em Markdown simples (### títulos, **negrito**, listas com "-"), emojis com moderação.`;

export type StaffChatResult = { ok: true; text: string } | { ok: false; message: string };

export async function runStaffChat(body: unknown, onDelta: (text: string) => void): Promise<StaffChatResult> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, message: 'Revise a mensagem.' };

  const staff = await getStaffIdentity();
  if (!staff) return { ok: false, message: 'Sessão expirada.' };

  const supabase = await createClient();
  const quota = await checkAiQuota(supabase, 'staff_ia');
  if (!quota.ok) return { ok: false, message: quota.message };

  const who = `${STAFF_ROLE_LABEL[staff.role]}${staff.schoolName ? ` · ${staff.schoolName}` : ''}`;
  const result = await streamWithAI(
    [{ role: 'system', content: SYSTEM(who) }, ...parsed.data.messages],
    { maxTokens: 1200, temperature: 0.5, timeoutMs: 40_000, audience: 'staff' },
    onDelta,
  );
  if (result.ok) return { ok: true, text: result.text };
  if (result.reason === 'missing_api_key') return { ok: false, message: 'A NexaAI ainda não está conectada a um provedor de IA.' };
  return { ok: false, message: 'Não consegui responder agora. Tente de novo em instantes.' };
}
