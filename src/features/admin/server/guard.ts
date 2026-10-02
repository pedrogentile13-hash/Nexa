import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database.types';
import { getTeacherAssignments, getTeacherIdentity } from '@/features/teacher/server/guard';

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
  avatarUrl: string | null;
  /** Admin global enxerga e edita todas as escolas; school_admin só a dele. */
  isGlobal: boolean;
}

/**
 * `cache()` dedupe: `/admin/layout.tsx` e a página que ele envolve (ex.
 * `/admin/page.tsx`) cada um chamava `requireAdmin()` de forma independente —
 * dois `getUser()` (rede) + duas leituras de `profiles` idênticas por
 * navegação. `cache()` funde chamadas repetidas dentro do mesmo request.
 */
export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role, school_id, full_name, avatar_url, schools(name)')
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
    avatarUrl: data.avatar_url,
    isGlobal: data.role === 'admin',
  };
});

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
 * input do cliente para decidir de quem é o conteúdo. Aceita qualquer
 * identidade com essa forma — `AdminIdentity` e `ContentIdentity` (abaixo)
 * servem igual, sem precisar de duas versões da mesma função.
 */
export function resolveSchoolId(
  identity: { isGlobal: boolean; schoolId: string | null },
  requested: string | null,
): string | null {
  if (!identity.isGlobal) return identity.schoolId;
  return requested && requested !== 'global' ? requested : null;
}

/**
 * Portão de CONTEÚDO — admin geral, school_admin ou professor, um formato só.
 *
 * As ações de conteúdo (`saveResource`, `importSimulado`, `saveQuestion`...)
 * já eram seguras por dentro (a RLS do banco autoriza os três papéis desde
 * a migração do professor); a única coisa que faltava era a camada de
 * aplicação parar de barrar `teacher_admin` na porta com `requireAdmin()`.
 * `allowedSubjectCatalogIds` é como cada ação decide se pode escrever numa
 * matéria específica — `'all'` pra admin/school_admin (sem recorte de
 * matéria), a lista de matérias atribuídas pro professor.
 */
export interface ContentIdentity {
  kind: 'admin' | 'teacher';
  userId: string;
  schoolId: string | null;
  isGlobal: boolean;
  allowedSubjectCatalogIds: string[] | 'all';
  basePath: '/admin/conteudo' | '/professor/conteudo';
}

export async function requireContentManager(): Promise<ContentIdentity> {
  const admin = await getAdminIdentity();
  if (admin) {
    return {
      kind: 'admin',
      userId: admin.userId,
      schoolId: admin.schoolId,
      isGlobal: admin.isGlobal,
      allowedSubjectCatalogIds: 'all',
      basePath: '/admin/conteudo',
    };
  }

  const teacher = await getTeacherIdentity();
  if (teacher) {
    const assignments = await getTeacherAssignments(teacher.userId);
    return {
      kind: 'teacher',
      userId: teacher.userId,
      schoolId: teacher.schoolId,
      isGlobal: false,
      allowedSubjectCatalogIds: [...new Set(assignments.map((a) => a.subjectCatalogId))],
      basePath: '/professor/conteudo',
    };
  }

  redirect('/hoje');
}

/** Recusa em português quando a matéria do recurso não é uma das do professor. */
export function assertSubjectAllowed(
  identity: ContentIdentity,
  subjectCatalogId: string,
): string | null {
  if (identity.allowedSubjectCatalogIds === 'all') return null;
  return identity.allowedSubjectCatalogIds.includes(subjectCatalogId)
    ? null
    : 'Você só pode gerenciar conteúdo das matérias atribuídas a você.';
}
