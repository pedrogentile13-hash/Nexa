import { createClient } from '@/lib/supabase/server';

/**
 * Turmas cadastradas por admin geral/da escola.
 *
 * Um módulo pequeno e compartilhado (não dentro de `admin/` nem de
 * `profile/`) porque três telas diferentes precisam da mesma leitura: o
 * seletor de turma no Perfil do aluno, os chips de turma no Ranking, e o
 * formulário de atribuição de professor no admin.
 */

export interface ClassOption {
  id: string;
  name: string;
}

export async function listSchoolClasses(schoolId: string): Promise<ClassOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name');

  return data ?? [];
}
