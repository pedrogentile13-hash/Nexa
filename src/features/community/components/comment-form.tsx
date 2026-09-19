'use client';

import { useRef, useState, useTransition } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createComment } from '../server/feed-actions';
import type { PostComment } from '../server/feed-queries';

export function CommentForm({
  postId,
  onAdded,
}: {
  postId: string;
  onAdded: (comment: PostComment) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = String(formData.get('content') ?? '').trim();
    if (!content) return;

    setError(null);
    startTransition(async () => {
      const result = await createComment(postId, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      // Servidor não devolve o comentário criado (só `{ok:true}`) — o próprio
      // texto enviado já é suficiente pra atualizar a lista na hora, sem
      // esperar `revalidatePath` recarregar a página inteira.
      onAdded({
        id: crypto.randomUUID(),
        authorId: '',
        authorName: 'Você',
        authorAvatarUrl: null,
        content,
        createdAt: new Date().toISOString(),
        isOwn: true,
      });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input name="content" placeholder="Escreva um comentário…" maxLength={500} autoComplete="off" />
      <button
        type="submit"
        disabled={pending}
        aria-label="Comentar"
        className="text-brand-text hover:bg-brand-soft grid size-10 shrink-0 place-items-center rounded-full disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
      </button>
      {error && <p className="text-danger text-xs">{error}</p>}
    </form>
  );
}
