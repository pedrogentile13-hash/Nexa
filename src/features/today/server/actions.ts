'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Ações da tela Hoje.
 *
 * Toda escrita passa por aqui, e não pelo SDK no cliente, porque marcar um item
 * não é só um UPDATE: concede XP, atualiza a sequência e invalida cache. Fazer
 * isso do cliente significaria reimplementar as três coisas em cada tela.
 *
 * O feedback instantâneo que a especificação pede vem do `useOptimistic` na
 * outra ponta — a linha se marca no mesmo frame, a ação confirma depois.
 */

const idSchema = z.string().uuid();

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada.');
  return { supabase, user };
}

/** Marca ou desmarca um item do checklist diário. */
export async function toggleRoutine(routineId: string, done: boolean): Promise<void> {
  const parsed = idSchema.safeParse(routineId);
  if (!parsed.success) return;

  const { supabase, user } = await requireUser();

  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: user.id });
  const today = todayValue as string;

  if (done) {
    await supabase
      .from('routine_completions')
      .upsert(
        { user_id: user.id, routine_id: parsed.data, local_date: today, count: 1 },
        { onConflict: 'routine_id,local_date' },
      );

    // Aparecer conta como presença. XP é idempotente por (fonte, motivo), então
    // marcar e desmarcar várias vezes não vira uma máquina de XP.
    await Promise.all([
      supabase.rpc('touch_streak', { p_user_id: user.id }),
      supabase.rpc('award_xp', {
        p_amount: 5,
        p_reason: 'Item do checklist concluído',
        p_source_type: 'routine',
        p_source_id: parsed.data,
        p_user_id: user.id,
      }),
    ]);
  } else {
    await supabase
      .from('routine_completions')
      .delete()
      .eq('routine_id', parsed.data)
      .eq('local_date', today);
  }

  revalidatePath('/hoje');
}

/** Conclui ou reabre uma tarefa. */
export async function toggleTask(taskId: string, done: boolean): Promise<void> {
  const parsed = idSchema.safeParse(taskId);
  if (!parsed.success) return;

  const { supabase, user } = await requireUser();

  await supabase
    .from('tasks')
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq('id', parsed.data);

  if (done) {
    await Promise.all([
      supabase.rpc('touch_streak', { p_user_id: user.id }),
      supabase.rpc('award_xp', {
        p_amount: 10,
        p_reason: 'Tarefa concluída',
        p_source_type: 'task',
        p_source_id: parsed.data,
        p_user_id: user.id,
      }),
    ]);
  }

  revalidatePath('/hoje');
  revalidatePath('/agenda');
}

const startSessionSchema = z.object({
  subjectId: z.string().uuid().nullable(),
});

/** Começa o cronômetro. O índice único no banco garante um por aluno. */
export async function startStudySession(subjectId: string | null): Promise<void> {
  const parsed = startSessionSchema.safeParse({ subjectId });
  if (!parsed.success) return;

  const { supabase, user } = await requireUser();
  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: user.id });

  await supabase.from('study_sessions').insert({
    user_id: user.id,
    subject_id: parsed.data.subjectId,
    started_at: new Date().toISOString(),
    local_date: todayValue as string,
    duration_seconds: 0,
    source: 'timer',
  });

  revalidatePath('/hoje');
}

/**
 * Encerra o cronômetro.
 *
 * A duração é recalculada a partir de `started_at` no servidor, e não recebida
 * do cliente: uma aba deixada aberta a noite inteira registraria oito horas de
 * estudo que não aconteceram, e o teto de 24h do banco rejeitaria a linha.
 */
export async function stopStudySession(sessionId: string): Promise<void> {
  const parsed = idSchema.safeParse(sessionId);
  if (!parsed.success) return;

  const { supabase } = await requireUser();

  const { data: session } = await supabase
    .from('study_sessions')
    .select('started_at')
    .eq('id', parsed.data)
    .maybeSingle();

  if (!session) return;

  const startedAt = Date.parse(session.started_at);
  const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  // Acima de 6h é quase certamente uma aba esquecida, não uma sessão real.
  const duration = Math.min(elapsed, 6 * 60 * 60);

  await supabase
    .from('study_sessions')
    .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
    .eq('id', parsed.data);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && duration >= 60) {
    await Promise.all([
      supabase.rpc('touch_streak', { p_user_id: user.id }),
      supabase.rpc('award_xp', {
        p_amount: Math.min(50, Math.round(duration / 60)),
        p_reason: 'Sessão de estudo',
        p_source_type: 'study_session',
        p_source_id: parsed.data,
        p_user_id: user.id,
      }),
    ]);
  }

  revalidatePath('/hoje');
}
