import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Grava tempo de consumo de conteúdo (`/estudar/[id]`, sem cronômetro manual).
 *
 * Route Handler, não Server Action: o flush ao esconder a aba usa
 * `navigator.sendBeacon`, que não carrega o header `Next-Action` que uma
 * Server Action exige — um endpoint HTTP comum é o único jeito de servir os
 * dois caminhos (fetch periódico e sendBeacon) com a mesma função.
 *
 * Cada chamada grava uma linha de `study_sessions` JÁ FECHADA (`ended_at`
 * preenchido aqui mesmo) — nunca uma sessão aberta, então nunca disputa
 * `study_sessions_one_running_uq` com o cronômetro manual da tela Hoje.
 */

const bodySchema = z.object({
  resourceId: z.string().uuid(),
  seconds: z.coerce.number().int().min(1).max(1800),
});

function isSameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  // Nem todo navegador manda `Sec-Fetch-Site` (Safari mais antigo) — nesse
  // caso não bloqueia, só não reforça; a RLS de `study_sessions` já limita o
  // estrago a uma linha, no máximo 30 minutos, na própria conta de quem
  // estiver autenticado com o cookie usado na requisição.
  if (!site) return true;
  return site === 'same-origin' || site === 'none';
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: resource } = await supabase
    .from('resources')
    .select('subject_catalog_id')
    .eq('id', parsed.data.resourceId)
    .maybeSingle();
  if (!resource) return NextResponse.json({ ok: false }, { status: 404 });

  // Resolve a matéria DO ALUNO a partir da matéria do CATÁLOGO do recurso —
  // nunca aceita `subject_id` vindo do corpo da requisição. Pode não haver
  // nenhuma (conteúdo de uma matéria que ele não cursa); `null` é uma
  // resposta válida, igual ao cronômetro manual sem matéria escolhida.
  const { data: subjectRow } = await supabase
    .from('subjects')
    .select('id')
    .eq('catalog_id', resource.subject_catalog_id)
    .is('archived_at', null)
    .maybeSingle();

  const { data: todayValue } = await supabase.rpc('user_local_date', { p_user_id: user.id });
  const now = new Date();

  // `seconds` vem do cliente e não tem como confiar nele sozinho — nada
  // impede alguém de chamar este endpoint direto (fora do hook de leitura)
  // repetidas vezes com `seconds: 1800`, e cada chamada cria uma
  // `study_sessions` nova (`id` novo), então a deduplicação normal de
  // `award_xp` (por `source_id`) nunca vê duas chamadas como a mesma. A
  // defesa real é temporal: nunca aceitar mais segundos do que o relógio do
  // SERVIDOR viu passar desde o último registro de leitura deste aluno —
  // mesmo princípio de `stopStudySession`, que recalcula a duração a partir
  // de `started_at` em vez de confiar no cliente.
  const { data: lastSession } = await supabase
    .from('study_sessions')
    .select('ended_at')
    .eq('user_id', user.id)
    .eq('source', 'content')
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const maxAllowedSeconds = lastSession?.ended_at
    ? Math.max(0, Math.floor((now.getTime() - Date.parse(lastSession.ended_at)) / 1000))
    : parsed.data.seconds;
  const seconds = Math.min(parsed.data.seconds, maxAllowedSeconds, 1800);

  // Sem tempo real disponível pra creditar (chamada repetida rápido demais) —
  // não vale nem gravar uma linha de 0s.
  if (seconds < 1) {
    return NextResponse.json({ ok: true });
  }

  const startedAt = new Date(now.getTime() - seconds * 1000);

  const { data: inserted, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      subject_id: subjectRow?.id ?? null,
      started_at: startedAt.toISOString(),
      ended_at: now.toISOString(),
      duration_seconds: seconds,
      local_date: todayValue as string,
      source: 'content',
    })
    .select('id')
    .single();

  if (error || !inserted) return NextResponse.json({ ok: false }, { status: 500 });

  if (seconds >= 60) {
    await Promise.all([
      supabase.rpc('touch_streak', { p_user_id: user.id }),
      supabase.rpc('award_xp', {
        p_amount: Math.min(50, Math.round(seconds / 60)),
        p_reason: 'Conteúdo estudado',
        p_source_type: 'study_session',
        p_source_id: inserted.id,
        p_user_id: user.id,
      }),
    ]);
    revalidatePath('/ranking');
  }

  return NextResponse.json({ ok: true });
}
