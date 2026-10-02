import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { ConsentKind } from '@/types/database.types';

/**
 * Leituras de privacidade.
 *
 * Todas toleram a migração do LGPD ainda não ter rodado: publicar o código
 * antes de aplicar o SQL é uma janela que sempre existe, e já derrubou este
 * app uma vez. Sem a tabela, a resposta é "não há consentimento registrado",
 * que é verdade — e nenhuma tela quebra por isso.
 */

export interface ConsentRecord {
  id: string;
  kind: ConsentKind;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianRelationship: string | null;
  documentVersion: string;
  acceptedAt: string;
}

export async function getMyConsent(): Promise<ConsentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('my_consent');
  const row = data?.[0];
  if (error || !row) return null;

  return {
    id: row.id,
    kind: row.kind,
    guardianName: row.guardian_name,
    guardianEmail: row.guardian_email,
    guardianRelationship: row.guardian_relationship,
    documentVersion: row.document_version,
    acceptedAt: row.accepted_at,
  };
}

/** `null` quando a coluna ainda não existe no banco — tratado como desconhecido. */
export async function getMyBirthDate(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('birth_date')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return null;
  return data?.birth_date ?? null;
}
