'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dailySourceId } from '@/lib/daily-source-id';
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

    // Aparecer conta como presença. `source_id` é derivado de (rotina, dia):
    // marcar/desmarcar várias vezes no MESMO dia sempre cai no mesmo id (não
    // vira uma máquina de XP), mas cada dia novo tem um id diferente — usar
    // o id fixo da própria rotina aqui bloquearia a dedup de `award_xp` em
    // TODOS os dias seguintes ao primeiro, pra sempre (era o bug: o XP do
    // checklist só pagava uma vez na vida de cada item).
    await Promise.all([
      supabase.rpc('touch_streak', { p_user_id: user.id }),
      supabase.rpc('award_xp', {
        p_amount: 5,
        p_reason: 'Item do checklist concluído',
        p_source_type: 'routine',
        p_source_id: dailySourceId('routine', parsed.data, today),
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
  revalidatePath('/ranking');
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
  revalidatePath('/ranking');
}

const startSessionSchema = z.object({
  subjectId: z.string().uuid().nullable(),
});

export interface StartStudySessionResult {
  ok: boolean;
  /** true quando já existe um cronômetro rodando (índice único no banco). */
  alreadyRunning?: boolean;
}

/** Começa o cronômetro. O índice único no banco garante um por aluno. */
export async function startStudySession(
  subjectId: string | null,
): Promise<StartStudySessionResult> {
  const parsed = startSessionSchema.safeParse({ subjectId });
  if (!parsed.success) return { ok: false };

  const { supabase, user } = await requireUser();
  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: user.id });

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    subject_id: parsed.data.subjectId,
    started_at: new Date().toISOString(),
    local_date: todayValue as string,
    duration_seconds: 0,
    source: 'timer',
  });

  if (error) {
    // 23505 é o índice único de "um cronômetro rodando por vez" — outra aba
    // ou dispositivo já tem um aberto. Sem checar isso, a segunda tentativa
    // falhava calada e a tela só parecia não ter feito nada.
    return { ok: false, alreadyRunning: error.code === '23505' };
  }

  revalidatePath('/hoje');
  return { ok: true };
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
  revalidatePath('/ranking');
}
