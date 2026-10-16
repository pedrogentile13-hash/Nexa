'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { LEGAL_DOCUMENT_VERSION, needsGuardianConsent } from '../lib/versions';

/**
 * Escritas de privacidade.
 *
 * A regra de quem precisa de responsável é checada AQUI e não só na tela: um
 * formulário sabe o que mostrar, não o que é permitido gravar. Alguém
 * chamando a action direto não pode registrar consentimento próprio para uma
 * conta de menor de idade.
 */

export type ConsentState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok' };

const consentSchema = z
  .object({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
    guardianName: z.string().trim().max(120).optional().or(z.literal('')),
    guardianEmail: z.string().trim().email('E-mail do responsável inválido.').optional().or(z.literal('')),
    guardianRelationship: z.string().trim().max(40).optional().or(z.literal('')),
    accepted: z.literal('on', { message: 'É preciso concordar para continuar.' }),
  })
  .refine(
    (data) => !needsGuardianConsent(data.birthDate) || (data.guardianName && data.guardianEmail),
    {
      message: 'Para menores de 18 anos, precisamos do nome e do e-mail do responsável.',
      path: ['guardianName'],
    },
  );

export async function saveConsent(_prev: ConsentState, formData: FormData): Promise<ConsentState> {
  const parsed = consentSchema.safeParse({
    birthDate: formData.get('birthDate'),
    guardianName: formData.get('guardianName') ?? '',
    guardianEmail: formData.get('guardianEmail') ?? '',
    guardianRelationship: formData.get('guardianRelationship') ?? '',
    accepted: formData.get('accepted'),
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ birth_date: data.birthDate })
    .eq('id', user.id);

  if (profileError) {
    return { status: 'error', message: 'Não consegui salvar agora — tente de novo em instantes.' };
  }

  const minor = needsGuardianConsent(data.birthDate);
  const { error } = await supabase.rpc('record_consent', {
    p_kind: minor ? 'guardian' : 'self',
    p_document_version: LEGAL_DOCUMENT_VERSION,
    p_guardian_name: minor ? (data.guardianName || null) : null,
    p_guardian_email: minor ? (data.guardianEmail || null) : null,
    p_guardian_relationship: minor ? (data.guardianRelationship || null) : null,
  });

  if (error) {
    return { status: 'error', message: 'Não consegui registrar o consentimento — tente de novo.' };
  }

  revalidatePath('/perfil');
  return { status: 'ok' };
}

/** Art. 18: acesso. Devolve o JSON para a tela oferecer como download. */
export async function exportMyData(): Promise<
  { status: 'ok'; json: string } | { status: 'error'; message: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('export_my_data');

  if (error || !data) {
    return { status: 'error', message: 'Não consegui montar seus dados agora — tente de novo.' };
  }

  return { status: 'ok', json: JSON.stringify(data, null, 2) };
}

/**
 * Art. 18: eliminação. Irreversível — apaga a conta e tudo que depende dela.
 *
 * Desloga ANTES de redirecionar: o usuário acabou de deixar de existir, e um
 * cookie de sessão apontando para um id apagado faria a próxima navegação
 * cair num estado que nenhuma tela sabe renderizar.
 */
export async function deleteMyAccount(): Promise<{ status: 'error'; message: string } | never> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_my_account');

  if (error) {
    return {
      status: 'error',
      message: 'Não consegui excluir a conta agora. Se o problema continuar, fale com a gente.',
    };
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
