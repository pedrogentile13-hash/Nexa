'use client';

import { useActionState, useRef, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { ChevronDown, Loader2, Megaphone, Pin, Send, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  deleteAnnouncement,
  getAnnouncementReaders,
  publishAnnouncement,
  type PublishState,
  type Reader,
} from '../server/actions';
import type { Announcement } from '../server/queries';

const INITIAL: PublishState = { status: 'idle' };
const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function Publish() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-brand-fg inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
      Publicar aviso
    </button>
  );
}

/**
 * Publicar e acompanhar avisos — para coordenação, direção e professores.
 *
 * O número que importa é "quantos leram": a linha mostra o placar e, aberta,
 * quem AINDA não leu (primeiro da lista), que é a lista que a coordenação usa
 * para cobrar.
 */
export function AnnouncementsManager({
  announcements,
  classes,
  canSchoolWide,
}: {
  announcements: Announcement[];
  classes: { id: string; name: string }[];
  canSchoolWide: boolean;
}) {
  const [state, action] = useActionState(publishAnnouncement, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'published') formRef.current?.reset();
  }, [state]);

  const mine = announcements.filter((a) => a.canManage);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="order-2 space-y-3 lg:order-1">
        {mine.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <Megaphone className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum aviso publicado</p>
            <p className="text-muted mt-1 text-sm">
              O aviso chega no sino de cada aluno e fica guardado — e você vê quem confirmou a leitura.
            </p>
          </div>
        ) : (
          mine.map((a) => <ManagedRow key={a.id} a={a} />)
        )}
      </div>

      <div className="order-1 lg:order-2">
        <form ref={formRef} action={action} className="border-border bg-surface space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Novo aviso</h2>

          <div>
            <Label htmlFor="mural-class">Para quem</Label>
            <select
              id="mural-class"
              name="classId"
              defaultValue={canSchoolWide ? '' : (classes[0]?.id ?? '')}
              required={!canSchoolWide}
              className="border-border bg-bg text-text focus-visible:ring-brand h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              {canSchoolWide && <option value="">Toda a escola</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Turma {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="mural-title">Título</Label>
            <Input id="mural-title" name="title" required maxLength={160} placeholder="Reunião de pais — sexta, 19h" />
          </div>

          <div>
            <Label htmlFor="mural-body">Aviso</Label>
            <textarea
              id="mural-body"
              name="body"
              required
              rows={6}
              maxLength={4000}
              placeholder="Escreva com clareza: o quê, quando e onde."
              className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-md border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>

          <div>
            <Label htmlFor="mural-event">É um evento? Data (aparece na agenda dos alunos)</Label>
            <Input id="mural-event" name="eventDate" type="date" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mural-days">Some depois de (dias)</Label>
              <Input id="mural-days" name="days" type="number" min={1} max={365} inputMode="numeric" placeholder="sem prazo" />
            </div>
            <label className="text-muted flex items-end gap-2 pb-3 text-sm">
              <input type="checkbox" name="pinned" className="size-4" />
              Fixar no topo
            </label>
          </div>

          {state.status === 'error' && (
            <p role="alert" className="text-danger text-sm">
              {state.message}
            </p>
          )}
          {state.status === 'published' && (
            <p className="text-success text-sm">
              Publicado. {state.notified} {state.notified === 1 ? 'pessoa foi avisada' : 'pessoas foram avisadas'}.
            </p>
          )}

          <Publish />
        </form>
      </div>
    </div>
  );
}

function ManagedRow({ a }: { a: Announcement }) {
  const [open, setOpen] = useState(false);
  const [readers, setReaders] = useState<Reader[] | null>(null);
  const [pending, startTransition] = useTransition();

  const read = a.readCount ?? 0;
  const total = a.audienceSize ?? 0;
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && readers === null) {
      startTransition(async () => setReaders(await getAnnouncementReaders(a.id)));
    }
  }

  const unread = readers?.filter((r) => !r.readAt) ?? [];

  return (
    <article className="border-border bg-surface rounded-lg border">
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            {a.pinned && <Pin className="text-brand size-3.5" aria-label="Fixado" />}
            {a.title}
          </h3>
          <p className="text-subtle text-xs">
            {a.audienceLabel} · {fmt.format(new Date(a.createdAt))}
          </p>
          <p className="text-muted mt-1.5 line-clamp-2 text-sm whitespace-pre-wrap">{a.body}</p>
        </div>
        <form action={deleteAnnouncement}>
          <input type="hidden" name="id" value={a.id} />
          <button
            type="submit"
            aria-label={`Apagar ${a.title}`}
            className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 place-items-center rounded-md"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="border-border hover:bg-surface-2 flex w-full items-center gap-3 border-t px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {read} de {total} confirmaram
            </span>
            <span className="text-muted text-xs">{pct}%</span>
          </div>
          <div className="bg-surface-2 mt-1.5 h-1.5 overflow-hidden rounded-full">
            <div className={cn('h-full rounded-full', pct >= 80 ? 'bg-success' : 'bg-brand')} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ChevronDown className={cn('text-subtle size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="border-border border-t px-4 py-3">
          {pending || readers === null ? (
            <p className="text-muted flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold">
                {unread.length === 0 ? 'Todos confirmaram. 🎉' : `Ainda não confirmaram (${unread.length})`}
              </p>
              <ul className="space-y-1">
                {readers.map((r) => (
                  <li key={r.userId} className="flex items-center justify-between gap-2 text-sm">
                    <span className={cn(!r.readAt && 'font-medium')}>
                      {r.fullName}
                      {r.className ? <span className="text-subtle"> · {r.className}</span> : null}
                    </span>
                    <span className={cn('text-xs', r.readAt ? 'text-success' : 'text-warning')}>
                      {r.readAt ? `leu ${fmt.format(new Date(r.readAt))}` : 'não leu'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </article>
  );
}
