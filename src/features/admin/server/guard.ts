import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database.types';

/**
 * Porta do painel.
 *
 * A RLS já recusaria cada escrita individual de quem não é admin — ela é a
 * fronteira de segurança de verdade, e continua sendo. Esta guarda existe por
 * outro motivo: quem não é admin não deve nem VER o painel, com formulários que
 * falhariam um a um sem explicar por quê. Segurança em profundidade de um lado,
 * e uma tela honesta do outro.
 */

export interface AdminIdentity {
  userId: string;
  role: Extract<UserRole, 'admin' | 'school_admin'>;
  schoolId: string | null;
  schoolName: string | null;
  fullName: string | null;
  /** Admin global enxerga e edita todas as escolas; school_admin só a dele. */
  isGlobal: boolean;
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role, school_id, full_name, schools(name)')
    .eq('id', user.id)
    .maybeSingle();

  if (!data || (data.role !== 'admin' && data.role !== 'school_admin')) return null;

  const school = data.schools as unknown as { name: string } | null;

  return {
    userId: user.id,
    role: data.role,
    schoolId: data.school_id,
    schoolName: school?.name ?? null,
    fullName: data.full_name,
    isGlobal: data.role === 'admin',
  };
}

/** Versão que corta o render. Use em toda page e Server Action do painel. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) redirect('/hoje');
  return identity;
}

/**
 * A escola que uma escrita deve carregar.
 *
 * O school_admin não escolhe: tudo que ele cria nasce preso à escola dele.
 * Deixar o campo livre no formulário e confiar no que volta seria confiar em
 * input do cliente para decidir de quem é o conteúdo.
 */
export function resolveSchoolId(identity: AdminIdentity, requested: string | null): string | null {
  if (!identity.isGlobal) return identity.schoolId;
  return requested && requested !== 'global' ? requested : null;
}
