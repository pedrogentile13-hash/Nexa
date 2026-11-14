'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronDown, Loader2, Pin, Trash2 } from 'lucide-react';
import { deleteAnnouncement, getAnnouncementReaders, type Reader } from '@/features/announcements/server/actions';
import type { Announcement } from '@/features/announcements/server/queries';
import { cn } from '@/lib/utils';
import { Avatar } from './ui';

const when = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Recados publicados, com o placar de leitura e (aberto) quem ainda não leu. */
export function NoticeFeed({ notices }: { notices: Announcement[] }) {
  return (
    <ul className="space-y-3">
      {notices.map((n) => (
        <Notice key={n.id} n={n} />
      ))}
    </ul>
  );
}

function Notice({ n }: { n: Announcement }) {
  const [open, setOpen] = useState(false);
  const [readers, setReaders] = useState<Reader[] | null>(null);
  const [pending, start] = useTransition();
  const read = n.readCount ?? 0;
  const total = n.audienceSize ?? 0;
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;
  const unread = readers?.filter((r) => !r.readAt) ?? [];

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && readers === null) start(async () => setReaders(await getAnnouncementReaders(n.id)));
  }

  return (
    <li className="bg-surface-2 rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            {n.pinned && <Pin className="text-brand size-3.5" aria-label="Fixado" />}
            {n.title}
          </h3>
          <p className="text-muted text-xs">{n.className ? `Turma ${n.className}` : 'Toda a escola'} · {when.format(new Date(n.createdAt))}</p>
          <p className="mt-2 line-clamp-3 text-sm whitespace-pre-wrap">{n.body}</p>
        </div>
        <form
          action={deleteAnnouncement}
          onSubmit={(e) => {
            if (!window.confirm(`Apagar "${n.title}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={n.id} />
          <button type="submit" aria-label={`Apagar ${n.title}`} className="text-muted hover:text-danger grid size-9 place-items-center rounded-full">
            <Trash2 className="size-4" aria-hidden />
          </button>
        </form>
      </div>

      <button type="button" onClick={toggle} aria-expanded={open} className="mt-3 flex w-full items-center gap-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between text-xs"><span className="font-medium">{read} de {total} leram</span><span className="text-muted">{pct}%</span></span>
          <span className="bg-surface mt-1.5 block h-1.5 overflow-hidden rounded-full"><span className={cn('block h-full rounded-full', pct >= 80 ? 'bg-success' : 'bg-brand')} style={{ width: `${pct}%` }} /></span>
        </span>
        <ChevronDown className={cn('text-subtle size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="bg-surface mt-3 rounded-2xl p-3">
          {pending || readers === null ? (
            <p className="text-muted flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…</p>
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold">{unread.length === 0 ? 'Todos leram. 🎉' : `Ainda não leram (${unread.length})`}</p>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {readers.map((r) => (
                  <li key={r.userId} className="flex items-center gap-2.5 text-sm">
                    <Avatar name={r.fullName} className="size-7 text-[10px]" />
                    <span className={cn('min-w-0 flex-1 truncate', !r.readAt && 'font-medium')}>{r.fullName}{r.className ? <span className="text-subtle"> · {r.className}</span> : null}</span>
                    {r.readAt ? <Check className="text-success size-4" aria-label="leu" /> : <span className="text-warning text-xs">não leu</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  );
}
