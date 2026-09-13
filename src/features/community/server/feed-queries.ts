import { createClient } from '@/lib/supabase/server';
import type { FeedPostRpcRow, PostCommentRpcRow, SocialVisibility } from '@/types/database.types';

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  visibility: SocialVisibility;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  isOwn: boolean;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

function mapPost(row: FeedPostRpcRow): FeedPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name ?? 'Sem nome',
    authorAvatarUrl: row.author_avatar_url,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    viewerHasLiked: row.viewer_has_liked,
    viewerHasSaved: row.viewer_has_saved,
    isOwn: row.is_own,
  };
}

/**
 * Feed do Nexa Community (Fase 2) — `list_feed`/`list_saved_posts` já
 * devolvem visibilidade resolvida, nome/avatar do autor e as contagens: nada
 * aqui precisa (nem consegue) ler `posts`/`profiles` diretamente.
 */
export async function listFeed(before?: string | null): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_feed', { p_limit: 20, p_before: before ?? null });
  if (error || !data) return [];
  return data.map(mapPost);
}

export async function listSavedPosts(before?: string | null): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_saved_posts', {
    p_limit: 20,
    p_before: before ?? null,
  });
  if (error || !data) return [];
  return data.map(mapPost);
}

export async function listPostComments(postId: string): Promise<PostComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_post_comments', { p_post_id: postId });
  if (error || !data) return [];
  return data.map((row: PostCommentRpcRow) => ({
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name ?? 'Sem nome',
    authorAvatarUrl: row.author_avatar_url,
    content: row.content,
    createdAt: row.created_at,
    isOwn: row.is_own,
  }));
}
