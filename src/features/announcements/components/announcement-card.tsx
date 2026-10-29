'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markAnnouncementRead } from '../server/actions';
import type { Announcement } from '../server/queries';

const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });

/**
 * Um aviso oficial. O botão "Li e entendi" é a confirmação que a escola vê —
 * por isso é explícito, e não automático ao rolar a tela: abrir sem ler não
 * pode contar como lido.
 */
export function AnnouncementCard({ a }: { a: Announcement }) {
  const [read, setRead] = useState(a.isRead);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setRead(true);
    startTransition(async () => {
      await markAnnouncementRead(a.id);
    });
  }

  return (
    <article
      className={cn(
        'border-border bg-surface rounded-2xl border p-4',
        !read && 'border-brand/50 ring-brand/15 ring-2',
      )}
    >
      <div className="flex items-start gap-2">
        {a.pinned && <Pin className="text-brand mt-0.5 size-4 shrink-0" aria-label="Fixado" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-snug font-semibold">{a.title}</h2>
          <p className="text-subtle mt-0.5 text-xs">
            {a.authorName} · {a.audienceLabel} · {fmt.format(new Date(a.createdAt))}
          </p>
        </div>
        {!read && <span className="bg-brand text-brand-fg shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">Novo</span>}
      </div>

      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>

      <div className="mt-3">
        {read ? (
          <p className="text-success flex items-center gap-1.5 text-sm font-medium">
            <Check className="size-4" aria-hidden /> Você confirmou a leitura
          </p>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            Li e entendi
          </button>
        )}
      </div>
    </article>
  );
}
