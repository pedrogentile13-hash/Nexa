import { createClient } from '@/lib/supabase/server';
import type {
  CommunityDetailRpcRow,
  CommunityListRpcRow,
  CommunityMemberRole,
  CommunityMemberRpcRow,
  CommunityVisibility,
} from '@/types/database.types';

export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: CommunityVisibility;
  memberCount: number;
  isMember: boolean;
  myRole: CommunityMemberRole | null;
}

export interface CommunityDetail extends CommunitySummary {
  rules: string | null;
}

export interface CommunityMember {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: CommunityMemberRole;
  joinedAt: string;
}

function mapSummary(row: CommunityListRpcRow): CommunitySummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    visibility: row.visibility,
    memberCount: row.member_count,
    isMember: row.is_member,
    myRole: row.my_role,
  };
}

export async function listCommunities(query?: string): Promise<CommunitySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_communities', { p_query: query ?? null });
  if (error || !data) return [];
  return data.map(mapSummary);
}

export async function getCommunity(communityId: string): Promise<CommunityDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_community', { p_community_id: communityId });
  const row = (data as CommunityDetailRpcRow[] | null)?.[0];
  if (error || !row) return null;
  return { ...mapSummary(row), rules: row.rules };
}

export async function listCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_community_members', {
    p_community_id: communityId,
  });
  if (error || !data) return [];
  return data.map((row: CommunityMemberRpcRow) => ({
    userId: row.user_id,
    fullName: row.full_name ?? 'Sem nome',
    avatarUrl: row.avatar_url,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

export interface SchoolRankingEntry {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  xp: number;
}

export interface SuggestedPerson {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  className: string | null;
}

export interface CommunitySidebarData {
  featuredCommunities: CommunitySummary[];
  schoolRanking: SchoolRankingEntry[];
  suggestedPeople: SuggestedPerson[];
}

/**
 * Dados da sidebar direita de /comunidade (destaques, ranking, sugestões).
 * As três chamadas são independentes — nenhuma depende do resultado da
 * outra — e cada RPC já filtra visibilidade/escola sozinha (mesmo padrão de
 * `security definer` do resto da Community), então basta disparar em
 * paralelo e falhar bonito (lista vazia) se alguma der erro.
 */
export async function getCommunitySidebarData(): Promise<CommunitySidebarData> {
  const supabase = await createClient();
  const [communitiesRes, rankingRes, suggestedRes] = await Promise.all([
    supabase.rpc('list_communities', { p_query: null }),
    supabase.rpc('school_ranking', { p_scope: 'escola', p_class_id: null, p_period: 'geral' }),
    supabase.rpc('suggested_people', { p_limit: 5 }),
  ]);

  const featuredCommunities = ((communitiesRes.data as CommunityListRpcRow[] | null) ?? [])
    .map(mapSummary)
    .filter((c) => !c.isMember)
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 4);

  const schoolRanking = ((rankingRes.data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null; xp: number }[])
    .slice(0, 5)
    .map((row) => ({
      userId: row.user_id,
      fullName: row.full_name ?? 'Sem nome',
      avatarUrl: row.avatar_url,
      xp: row.xp,
    }));

  const suggestedPeople = ((suggestedRes.data ?? []) as { user_id: string; full_name: string | null; avatar_url: string | null; class_name: string | null }[]).map(
    (row) => ({
      userId: row.user_id,
      fullName: row.full_name ?? 'Sem nome',
      avatarUrl: row.avatar_url,
      className: row.class_name,
    }),
  );

  return { featuredCommunities, schoolRanking, suggestedPeople };
}
