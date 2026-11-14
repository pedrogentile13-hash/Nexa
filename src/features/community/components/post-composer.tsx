'use client';

import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SocialVisibility } from '@/types/database.types';
import { createPost, type CreatePostState } from '../server/feed-actions';
import { createCommunityPost } from '../server/community-actions';

const INITIAL: CreatePostState = { status: 'idle' };

const VISIBILITY_OPTIONS: { value: SocialVisibility; label: string }[] = [
  { value: 'school', label: 'Minha escola' },
  { value: 'friends', label: 'Amigos' },
  { value: 'public', label: 'Público' },
  { value: 'private', label: 'Só eu' },
];

/**
 * Composer do feed — texto simples por enquanto (sem imagem, ver corte na
 * migração). Quando `communityId` é passado, publica na comunidade (sem
 * seletor de visibilidade — lá quem vê o post é definido por quem pode ver
 * a comunidade, não pelas 4 opções pessoais).
 */
export function PostComposer({
  communityId,
  onPosted,
}: {
  communityId?: string;
  onPosted?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: CreatePostState, formData: FormData) => {
    const result = communityId
      ? await createCommunityPost(communityId, formData).then((r) =>
          r.ok ? ({ status: 'ok' } as const) : ({ status: 'error', message: r.message } as const),
        )
      : await createPost(prev, formData);
    if (result.status === 'ok') {
      formRef.current?.reset();
      onPosted?.();
    }
    return result;
  }, INITIAL);

  return (
    <Card>
      <CardContent className="p-4">
        <form ref={formRef} action={formAction} className="space-y-3">
          <textarea
            name="content"
            required
            maxLength={2000}
            rows={3}
            placeholder="Compartilhe algo com a sua turma…"
            className={cn(
              'border-border bg-surface text-text w-full rounded-md border px-3 py-2.5 text-base',
              'placeholder:text-subtle transition-colors outline-none',
              'focus-visible:border-brand focus-visible:ring-brand/25 focus-visible:ring-2',
              'sm:text-sm',
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {communityId ? (
              <span />
            ) : (
              <select
                name="visibility"
                defaultValue="school"
                className={cn(
                  'border-border bg-surface text-text h-10 rounded-md border px-2.5 text-sm',
                  'focus-visible:border-brand focus-visible:ring-brand/25 outline-none focus-visible:ring-2',
                )}
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            <SubmitButton />
          </div>
          {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
      Publicar
    </Button>
  );
}
