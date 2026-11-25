import { createClient } from '@/lib/supabase/server';

export interface SchoolAccount {
  id: string;
  fullName: string | null;
  login: string;
  role: 'student' | 'teacher_admin' | 'school_coordinator' | 'school_director';
  className: string | null;
  schoolName: string | null;
}

/**
 * Contas criadas pela escola (as que têm login). A RLS já limita a coordenação
 * à própria escola. Antes do SQL rodar a coluna não existe e o PostgREST
 * responde erro (sem lançar) — a tela abre vazia em vez de quebrar.
 */
export async function listSchoolAccounts(): Promise<SchoolAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, school_login, role, school_title, classes(name), schools(name)')
    .not('school_login', 'is', null)
    .order('full_name')
    .limit(500);
  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string;
    full_name: string | null;
    school_login: string;
    role: string;
    school_title?: string | null;
    classes: { name: string } | null;
    schools: { name: string } | null;
  }>).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    login: p.school_login,
    role:
      p.role === 'school_admin'
        ? p.school_title === 'coordenacao' ? 'school_coordinator' : 'school_director'
        : p.role === 'teacher_admin' ? 'teacher_admin' : 'student',
    className: p.classes?.name ?? null,
    schoolName: p.schools?.name ?? null,
  }));
}
