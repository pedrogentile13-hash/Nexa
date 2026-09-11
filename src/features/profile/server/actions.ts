'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { NotificationSettings } from '@/types/database.types';

/**
 * Edição do perfil.
 *
 * O fuso não é mais editável aqui: era o único campo do formulário que dava
 * pra digitar errado (uma string livre tipo "America/Sao_Paulo"), e um erro
 * de digitação quebrava a sequência sozinha sem nenhum aviso claro do porquê.
 * A coluna `profiles.timezone` continua existindo — sequência e "hoje" ainda
 * dependem dela — só não é mais uma opção de personalização exposta ao aluno.
 */

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Diga seu nome.').max(80),
  gradeLevel: z.string().trim().max(40).nullable(),
  className: z.string().trim().max(20).nullable(),
  dailyStudyGoalMinutes: z
    .number()
    .int()
    .min(0, 'A meta não pode ser negativa.')
    .max(1440, 'Um dia tem 24 horas.'),
  weeklyStudyGoalMinutes: z.number().int().min(0).max(10080),
});

export type ProfileState =
  { status: 'idle' } | { status: 'saved' } | { status: 'error'; message: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    gradeLevel: formData.get('gradeLevel') || null,
    className: formData.get('className') || null,
    dailyStudyGoalMinutes: Number(formData.get('dailyStudyGoalMinutes')),
    weeklyStudyGoalMinutes: Number(formData.get('weeklyStudyGoalMinutes')),
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os dados.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Sessão expirada.' };

  const data = parsed.data;
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      grade_level: data.gradeLevel,
      class_name: data.className,
      daily_study_goal_minutes: data.dailyStudyGoalMinutes,
      weekly_study_goal_minutes: data.weeklyStudyGoalMinutes,
    })
    .eq('id', user.id);

  if (error) {
    return { status: 'error', message: 'Não consegui salvar as alterações.' };
  }

  // O nome aparece no cabeçalho de todas as telas; a meta muda o cálculo do
  // progresso diário. Revalidar só /perfil deixaria as duas coisas velhas.
  revalidatePath('/', 'layout');
  return { status: 'saved' };
}

/**
 * Foto de perfil.
 *
 * O upload em si acontece no cliente, direto pro Storage (mesmo motivo do
 * `MediaUpload` do admin: passar o arquivo por uma Server Action significa
 * carregar a imagem inteira na memória do servidor à toa). Esta função só
 * grava o CAMINHO depois que o arquivo já está no bucket — a RLS de
 * `avatars` é quem garante que o caminho pertence a quem está chamando.
 */
export async function updateAvatarPath(path: string | null): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  if (path !== null) {
    // O caminho tem que começar com o próprio uid — a mesma regra que a RLS
    // do bucket já aplica na escrita, checada de novo aqui pra nunca gravar
    // em `profiles` uma URL que aponta pro arquivo de outra pessoa.
    const parsed = z
      .string()
      .max(300)
      .refine((value) => value.startsWith(`${user.id}/`))
      .safeParse(path);
    if (!parsed.success) return { ok: false };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path ?? '');

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: path ? publicUrl : null })
    .eq('id', user.id);

  if (error) return { ok: false };

  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Preferências de notificação — sem envio real (push/e-mail) ainda, então
 * isto só grava a intenção. Cada chamada troca uma chave só (o toggle que o
 * aluno acabou de clicar), por isso recebe o objeto já mesclado em vez de
 * reconstruir tudo a partir de FormData.
 */
export async function updateNotificationSettings(
  settings: NotificationSettings,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from('profiles')
    .update({ notification_settings: settings })
    .eq('id', user.id);

  if (error) return { ok: false };

  revalidatePath('/perfil');
  return { ok: true };
}

/**
 * Vincular a própria conta a uma escola — self-service, sem depender de um
 * admin (antes, `school_id` só era gravado pelo painel `/admin/usuarios`).
 * `schools` é catálogo compartilhado: `schools_select_authenticated` já deixa
 * qualquer autenticado ler todas, e `profiles_update_own` já deixa qualquer
 * um escrever a própria `school_id` — não precisou de RPC nem policy nova,
 * só desta camada de busca/escrita.
 */
export interface SchoolOption {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  isVerified: boolean;
}

export async function searchSchools(query: string): Promise<SchoolOption[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, city, state, is_verified')
    .ilike('name', `%${trimmed}%`)
    .order('is_verified', { ascending: false })
    .order('name')
    .limit(8);

  if (error || !data) return [];
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    isVerified: s.is_verified,
  }));
}

export async function joinSchool(schoolId: string): Promise<{ ok: boolean; message?: string }> {
  const parsed = z.string().uuid().safeParse(schoolId);
  if (!parsed.success) return { ok: false, message: 'Escola inválida.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const { error } = await supabase
    .from('profiles')
    .update({ school_id: parsed.data })
    .eq('id', user.id);

  if (error) return { ok: false, message: 'Não consegui vincular essa escola.' };

  revalidatePath('/', 'layout');
  return { ok: true };
}

/**
 * Cadastra uma escola nova (catálogo compartilhado, `is_verified = false` —
 * mesma regra de `schools_insert_own`) e já vincula quem cadastrou. É o
 * caminho pra quando a busca não acha a escola do aluno.
 */
export async function createAndJoinSchool(
  name: string,
): Promise<{ ok: boolean; message?: string }> {
  const parsed = z.string().trim().min(2, 'Nome muito curto.').max(160).safeParse(name);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Nome inválido.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sessão expirada.' };

  const { data: school, error } = await supabase
    .from('schools')
    .insert({ name: parsed.data, created_by: user.id, is_verified: false })
    .select('id')
    .single();

  if (error || !school) return { ok: false, message: 'Não consegui cadastrar essa escola.' };

  const { error: linkError } = await supabase
    .from('profiles')
    .update({ school_id: school.id })
    .eq('id', user.id);

  if (linkError) return { ok: false, message: 'Escola cadastrada, mas não consegui vincular.' };

  revalidatePath('/', 'layout');
  return { ok: true };
}
