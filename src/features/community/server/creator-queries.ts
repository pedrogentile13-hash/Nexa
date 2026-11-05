import { createClient } from '@/lib/supabase/server';
import { listCommunities } from './community-queries';
import type { ResourceKind, ResourceVisibility } from '@/types/database.types';

export interface CreatorSubjectOption {
  id: string;
  name: string;
}

export async function listCreatorSubjects(): Promise<CreatorSubjectOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subject_catalog')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order');
  return data ?? [];
}

export interface MyCreatorResource {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  subjectName: string;
  visibility: ResourceVisibility;
  communityId: string | null;
  communityName: string | null;
  questionCount: number;
  createdAt: string;
}

export async function listMyCreatorContent(): Promise<MyCreatorResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_my_ai_resources');
  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    description: r.description,
    subjectName: r.subject_name,
    visibility: r.visibility,
    communityId: r.community_id,
    communityName: r.community_name,
    questionCount: r.question_count,
    createdAt: r.created_at,
  }));
}

/** Comunidades que o aluno já é membro — só essas podem receber conteúdo com `visibility: 'community'`. */
export async function listMyCommunitiesForSharing(): Promise<{ id: string; name: string }[]> {
  const communities = await listCommunities();
  return communities.filter((c) => c.isMember).map((c) => ({ id: c.id, name: c.name }));
}
