'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { requireContentManager } from '@/features/admin/server/guard';
import { buildPlanSummaryMessages, MAX_PLAN_CHARS } from '../lib/prompt';
import { stripCodeFence } from '@/features/admin/lib/ai-exam-prompt';

export type PlanState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'saved' };

const planSchema = z.object({
  title: z.string().trim().min(2, 'Dê um título ao planejamento.').max(160),
  content: z.string().trim().min(20, 'Escreva um pouco mais — a IA só usa o que estiver aqui.').max(MAX_PLAN_CHARS, `Máximo de ${MAX_PLAN_CHARS} caracteres. Divida em planejamentos menores.`),
});

export async function savePlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  await requireContentManager();
  const parsed = planSchema.safeParse({ title: formData.get('title'), content: formData.get('content') });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).maybeSingle();
  if (!profile?.school_id) return { status: 'error', message: 'Seu perfil não está ligado a uma escola.' };

  const { error } = await supabase.from('teacher_plans').insert({
    teacher_id: user.id,
    school_id: profile.school_id,
    title: parsed.data.title,
    content: parsed.data.content,
  });
  if (error) {
    return {
      status: 'error',
      message: error.code === '42P01' || error.code === 'PGRST205'
        ? 'Aplique o SQL do planejamento no Supabase antes de salvar.'
        : 'Não consegui salvar agora.',
    };
  }

  revalidatePath('/professor/planejamento');
  return { status: 'saved' };
}

export async function deletePlan(formData: FormData): Promise<void> {
  await requireContentManager();
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from('teacher_plans').delete().eq('id', id.data);
  revalidatePath('/professor/planejamento');
}

export type SummaryResult = { ok: true; markdown: string } | { ok: false; message: string };

/**
 * Resumo a partir do planejamento. NÃO grava nada: devolve o texto para o
 * professor revisar e editar; só vira rascunho quando ele manda salvar.
 */
export async function generatePlanSummary(planId: string): Promise<SummaryResult> {
  await requireContentManager();
  const id = z.string().uuid().safeParse(planId);
  if (!id.success) return { ok: false, message: 'Planejamento inválido.' };

  const supabase = await createClient();
  // A RLS garante que só o dono (ou a coordenação) lê este planejamento.
  const { data: plan } = await supabase.from('teacher_plans').select('title, content').eq('id', id.data).maybeSingle();
  if (!plan) return { ok: false, message: 'Não encontrei este planejamento.' };

  const result = await completeWithAI(buildPlanSummaryMessages(plan.title, plan.content), {
    maxTokens: 2048,
    temperature: 0.4,
    timeoutMs: 40_000,
  });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === 'missing_api_key'
          ? 'A IA não está configurada no servidor.'
          : result.reason === 'content_filter'
            ? 'O provedor recusou este conteúdo. Reescreva o trecho e tente de novo.'
            : 'A IA não respondeu agora — tente de novo em instantes.',
    };
  }
  return { ok: true, markdown: stripCodeFence(result.text) };
}
