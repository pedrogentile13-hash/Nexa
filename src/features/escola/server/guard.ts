import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canOpen, staffRoleOf, type StaffRole } from '../lib/access';

export interface StaffIdentity {
  userId: string;
  role: StaffRole;
  schoolId: string | null;
  schoolName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Quem está logado e é da equipe da escola (professor, coordenação, direção) ou admin geral. */
export const getStaffIdentity = cache(async (): Promise<StaffIdentity | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role, school_title, school_id, full_name, avatar_url, schools(name)')
    .eq('id', user.id)
    .maybeSingle();
  if (!data) return null;

  const role = staffRoleOf({ role: data.role, school_title: (data as { school_title?: string | null }).school_title });
  if (!role) return null;

  const school = data.schools as unknown as { name: string } | null;
  return {
    userId: user.id,
    role,
    schoolId: data.school_id,
    schoolName: school?.name ?? null,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
  };
});

/** Porta de toda página do portal: aluno vai para o app dele; função sem permissão volta ao início. */
export async function requireStaff(pathname?: string): Promise<StaffIdentity> {
  const identity = await getStaffIdentity();
  if (!identity) redirect('/hoje');
  if (pathname && !canOpen(identity.role, pathname)) redirect('/escola');
  return identity;
}
