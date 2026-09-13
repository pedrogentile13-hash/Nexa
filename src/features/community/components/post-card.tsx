'use client';

import { useState, useTransition } from 'react';
import { Bookmark, Heart, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SocialVisibility } from '@/types/database.types';
import { deleteComment, deletePost, getPostComments, toggleLike, toggleSave } from '../server/feed-actions';
import type { FeedPost, PostComment } from '../server/feed-queries';
import { CommentForm } from './comment-form';

const VISIBILITY_LABEL: Record<SocialVisibility, string> = {
  private: 'Só eu',
  friends: 'Amigos',
  school: 'Minha escola',
  public: 'Público',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold">
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

export function PostCard({ post, onRemoved }: { post: FeedPost; onRemoved: (postId: string) => void }) {
  const [liked, setLiked] = useState(post.viewerHasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.viewerHasSaved);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleToggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleLike(post.id, liked);
    });
  }

  function handleToggleSave() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      await toggleSave(post.id, saved);
    });
  }

  function handleDelete() {
    if (!window.confirm('Apagar este post?')) return;
    startTransition(async () => {
      await deletePost(post.id);
      onRemoved(post.id);
    });
  }

  function handleToggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      setLoadingComments(true);
      getPostComments(post.id).then((result) => {
        setComments(result);
        setLoadingComments(false);
      });
    }
  }

  function handleCommentAdded(comment: PostComment) {
    setComments((prev) => [...(prev ?? []), comment]);
    setCommentCount((c) => c + 1);
  }

  function handleCommentRemoved(commentId: string) {
    setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
    setCommentCount((c) => Math.max(0, c - 1));
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-2.5">
          <Avatar url={post.authorAvatarUrl} name={post.authorName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{post.authorName}</p>
            <p className="text-subtle flex items-center gap-1.5 text-xs">
              {timeAgo(post.createdAt)}
              <span aria-hidden>·</span>
              {VISIBILITY_LABEL[post.visibility]}
            </p>
          </div>
          {post.isOwn && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              aria-label="Apagar post"
              className="text-subtle hover:bg-surface-2 hover:text-danger grid size-8 shrink-0 place-items-center rounded-full"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={pending}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors',
              liked ? 'text-danger bg-danger-soft' : 'text-muted hover:bg-surface-2',
            )}
          >
            <Heart className={cn('size-4', liked && 'fill-current')} aria-hidden />
            {likeCount > 0 && likeCount}
          </button>
          <button
            type="button"
            onClick={handleToggleComments}
            className="text-muted hover:bg-surface-2 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium"
          >
            <MessageCircle className="size-4" aria-hidden />
            {commentCount > 0 && commentCount}
          </button>
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={pending}
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors',
              saved ? 'text-brand-text bg-brand-soft' : 'text-muted hover:bg-surface-2',
            )}
          >
            <Bookmark className={cn('size-4', saved && 'fill-current')} aria-hidden />
          </button>
        </div>

        {showComments && (
          <div className="border-border space-y-3 border-t pt-3">
            {loadingComments ? (
              <div className="flex justify-center py-3">
                <Loader2 className="text-muted size-4 animate-spin" aria-hidden />
              </div>
            ) : (
              <ul className="space-y-2.5">
                {(comments ?? []).map((comment) => (
                  <li key={comment.id} className="flex items-start gap-2">
                    <Avatar url={comment.authorAvatarUrl} name={comment.authorName} />
                    <div className="bg-surface-2 min-w-0 flex-1 rounded-2xl px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold">{comment.authorName}</p>
                        {comment.isOwn && (
                          <button
                            type="button"
                            onClick={() =>
                              startTransition(async () => {
                                await deleteComment(comment.id);
                                handleCommentRemoved(comment.id);
                              })
                            }
                            aria-label="Apagar comentário"
                            className="text-subtle hover:text-danger shrink-0"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                      <p className="text-sm leading-snug break-words">{comment.content}</p>
                    </div>
                  </li>
                ))}
                {(comments ?? []).length === 0 && (
                  <li className="text-subtle text-xs">Nenhum comentário ainda — seja o primeiro.</li>
                )}
              </ul>
            )}
            <CommentForm postId={post.id} onAdded={handleCommentAdded} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
