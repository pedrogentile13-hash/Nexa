'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { completeWithAI } from '@/lib/ai/provider';
import { checkPlanQuota, refundPlanQuota } from '@/features/billing/server/quota';
import {
  answerProblem,
  buildGradingMessages,
  MAX_ANSWER_CHARS,
  parseGrade,
} from '../lib/discursive';

/**
 * Questões discursivas: guardar o texto do aluno e pedir a correção por IA.
 *
 * Quem decide a nota é o servidor, nunca o navegador: o texto é relido do banco (o cliente só manda ids), a resposta
 * esperada é lida com a chave de serviço (o aluno não a vê antes de encerrar) e a nota é gravada por uma função que
 * só o servidor pode chamar. Corrige UMA vez por resposta.
 */

export type SaveDiscursiveResult = { ok: true } | { ok: false; message: string };

export interface DiscursiveGrade {
  score: number;
  feedback: string;
  /** Só vem na correção feita agora (não fica guardado). */
  hits?: string[];
  missing?: string[];
}

export type GradeDiscursiveResult =
  { ok: true; grade: DiscursiveGrade; remaining: number | null } | { ok: false; message: string };

const ids = z.object({ attemptId: z.string().uuid(), questionId: z.string().uuid() });

/** Guarda (ou atualiza) o texto da resposta. Não gasta moedas e não corrige. */
export async function saveDiscursiveAnswer(
  attemptId: string,
  questionId: string,
  text: string,
  timeSpentSeconds = 0,
): Promise<SaveDiscursiveResult> {
  const parsed = ids.safeParse({ attemptId, questionId });
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' };
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, message: 'Escreva a resposta antes de salvar.' };
  if (trimmed.length > MAX_ANSWER_CHARS)
    return { ok: false, message: `A resposta passou de ${MAX_ANSWER_CHARS} caracteres.` };

  const supabase = await createClient();
  const { error } = await supabase.rpc('save_discursive_answer', {
    p_attempt_id: parsed.data.attemptId,
    p_question_id: parsed.data.questionId,
    p_text: trimmed,
    p_time_spent_seconds: Math.max(0, Math.round(timeSpentSeconds)),
  });
  if (error) {
    if (/corrigida/i.test(error.message))
      return { ok: false, message: 'Esta resposta já foi corrigida e não pode mais ser alterada.' };
    if (/tempo esgotado/i.test(error.message))
      return { ok: false, message: 'O tempo do simulado acabou.' };
    // Função ainda não existe no banco (SQL das discursivas não rodou).
    if (/save_discursive_answer|schema cache|does not exist/i.test(error.message)) {
      return {
        ok: false,
        message: 'As questões discursivas ainda não foram ativadas neste ambiente.',
      };
    }
    return { ok: false, message: 'Não consegui salvar agora. Tente de novo.' };
  }
  return { ok: true };
}

/** Pede a correção por IA de uma resposta já salva. Custa Nexa Coins; se a IA falha, as moedas voltam. */
export async function gradeDiscursiveAnswer(
  attemptId: string,
  questionId: string,
): Promise<GradeDiscursiveResult> {
  const parsed = ids.safeParse({ attemptId, questionId });
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada. Entre de novo.' };

  // O texto e a correção já feita vêm da porta do próprio aluno (RLS/ownership no banco).
  const { data: state } = await supabase.rpc('quiz_attempt_state', {
    p_attempt_id: parsed.data.attemptId,
  });
  const mine = state?.find((row) => row.question_id === parsed.data.questionId);
  if (!mine?.answer_text?.trim())
    return { ok: false, message: 'Escreva e salve a resposta antes de pedir a correção.' };
  if (mine.ai_score !== null && mine.ai_feedback) {
    // Já corrigida: devolve a mesma correção, sem gastar moedas de novo.
    return {
      ok: true,
      grade: { score: Number(mine.ai_score), feedback: mine.ai_feedback },
      remaining: null,
    };
  }
  const problem = answerProblem(mine.answer_text);
  if (problem) return { ok: false, message: problem };

  const admin = createAdminClient();
  if (!admin)
    return {
      ok: false,
      message: 'A correção por IA não está disponível agora. Fale com o suporte.',
    };

  const { data: rows, error: ctxError } = await admin.rpc('discursive_grading_context', {
    p_attempt_id: parsed.data.attemptId,
    p_question_id: parsed.data.questionId,
  });
  const ctx = rows?.[0];
  if (ctxError || !ctx) return { ok: false, message: 'Não encontrei esta questão.' };
  // A chave de serviço ignora a RLS: a posse da tentativa é conferida aqui.
  if (ctx.user_id !== user.id) return { ok: false, message: 'Esta tentativa não é sua.' };
  if (ctx.graded_at) return { ok: false, message: 'Esta resposta já foi corrigida.' };
  if (!ctx.model_answer?.trim())
    return { ok: false, message: 'Esta questão ainda não tem resposta esperada cadastrada.' };

  const quota = await checkPlanQuota(supabase, 'discursive');
  if (!quota.ok) return { ok: false, message: quota.message };

  const result = await completeWithAI(
    buildGradingMessages({
      subjectName: ctx.subject_name,
      topicName: ctx.topic_name,
      statement: ctx.statement,
      modelAnswer: ctx.model_answer,
      rubric: ctx.rubric,
      answer: mine.answer_text,
    }),
    { maxTokens: 700, temperature: 0.2, timeoutMs: 30_000 },
  );

  const grade = result.ok ? parseGrade(result.text) : null;
  if (!grade) {
    await refundPlanQuota(supabase, 'discursive', quota);
    return {
      ok: false,
      message:
        'A correção não ficou pronta agora — suas moedas foram devolvidas. Tente de novo em instantes.',
    };
  }

  const { data: saved, error: saveError } = await admin.rpc('record_discursive_grade', {
    p_attempt_id: parsed.data.attemptId,
    p_question_id: parsed.data.questionId,
    p_score: grade.score,
    p_feedback: grade.feedback,
  });
  if (saveError || !saved) {
    await refundPlanQuota(supabase, 'discursive', quota);
    return {
      ok: false,
      message: 'Não consegui guardar a correção. Suas moedas foram devolvidas; tente de novo.',
    };
  }

  return {
    ok: true,
    grade: {
      score: grade.score,
      feedback: grade.feedback,
      hits: grade.hits,
      missing: grade.missing,
    },
    remaining: quota.remaining,
  };
}
