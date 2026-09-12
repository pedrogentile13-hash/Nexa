'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminIdentity } from '@/features/admin/server/guard';
import type { ResourceKind } from '@/types/database.types';

/**
 * Busca da barra superior.
 *
 * Duas versões, não uma: o aluno só pode achar o que ele mesmo enxergaria na
 * Biblioteca (`v_resource_library` já filtra publicado + escola), e o admin
 * busca em três tabelas diferentes porque o placeholder da barra dele promete
 * isso — "conteúdos, usuários, escolas". Nenhuma virou uma função só porque
 * dividem a palavra "busca": o que cada uma pode ver é regido por regras
 * completamente diferentes (RLS de aluno vs. escopo de admin).
 */

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

export interface ContentSearchResult {
  type: 'content';
  id: string;
  title: string;
  kind: ResourceKind;
  subjectName: string;
}

export async function searchContent(query: string): Promise<ContentSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('v_resource_library')
    .select('id, title, kind, subject_name')
    .ilike('title', `%${trimmed}%`)
    .order('title')
    .limit(RESULT_LIMIT);

  return (data ?? []).map((r) => ({
    type: 'content' as const,
    id: r.id,
    title: r.title,
    kind: r.kind,
    subjectName: r.subject_name,
  }));
}

export interface PersonSearchResult {
  type: 'person';
  id: string;
  name: string;
  role: string;
  schoolName: string | null;
}

export interface SchoolSearchResult {
  type: 'school';
  id: string;
  name: string;
}

export type AdminSearchResult = ContentSearchResult | PersonSearchResult | SchoolSearchResult;

export async function searchAdmin(query: string): Promise<AdminSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const identity = await getAdminIdentity();
  if (!identity) return [];

  const supabase = await createClient();

  // school_admin só vê gente da própria escola — mesma régua de
  // `resolveSchoolId`: ele nunca escolhe o escopo, já nasce preso a ele. Sem
  // escola vinculada (não deveria acontecer), não vê ninguém — nunca cai
  // para "ver todo mundo" por falta de filtro.
  const peopleBase = supabase
    .from('profiles')
    .select('id, full_name, role, schools(name)')
    .ilike('full_name', `%${trimmed}%`)
    .order('full_name')
    .limit(RESULT_LIMIT);

  const peopleQuery = identity.isGlobal
    ? peopleBase
    : identity.schoolId
      ? peopleBase.eq('school_id', identity.schoolId)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; role: string; schools: unknown }[] });

  const [contentRes, peopleRes, schoolsRes] = await Promise.all([
    supabase
      .from('resources')
      .select('id, title, kind, subject_catalog(name)')
      .ilike('title', `%${trimmed}%`)
      .order('title')
      .limit(RESULT_LIMIT),
    peopleQuery,
    identity.isGlobal
      ? supabase.from('schools').select('id, name').ilike('name', `%${trimmed}%`).limit(RESULT_LIMIT)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const content: ContentSearchResult[] = (contentRes.data ?? []).map((r) => ({
    type: 'content' as const,
    id: r.id,
    title: r.title,
    kind: r.kind,
    subjectName: (r.subject_catalog as unknown as { name: string } | null)?.name ?? '',
  }));

  const people: PersonSearchResult[] = (peopleRes.data ?? []).map((p) => ({
    type: 'person' as const,
    id: p.id,
    name: p.full_name ?? 'Sem nome',
    role: p.role,
    schoolName: (p.schools as unknown as { name: string } | null)?.name ?? null,
  }));

  const schools: SchoolSearchResult[] = (schoolsRes.data ?? []).map((s) => ({
    type: 'school' as const,
    id: s.id,
    name: s.name,
  }));

  return [...content, ...people, ...schools];
}
