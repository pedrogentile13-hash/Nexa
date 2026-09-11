'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, BellOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getNotificationsData,
  markAllNotificationsRead,
  markNotificationRead,
} from '../server/actions';
import type { NotificationItem } from '../server/queries';

/**
 * Sino de notificações.
 *
 * Busca a própria lista (Server Action, não prop) de propósito: `AppHeader` é
 * renderizado por CADA página com props diferentes, e fazer toda página
 * buscar notificação pra repassar seria acoplar todo o app a este widget. O
 * preço é uma ida ao servidor a mais quando o cabeçalho monta — aceitável
 * para uma lista de no máximo 20 itens.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getNotificationsData()
      .then((data) => {
        if (!cancelled) {
          setItems(data.items);
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {
        // Sem isto, uma falha de rede/sessão deixava o dropdown preso em
        // "Carregando…" pra sempre — melhor cair pra "sem notificações" do
        // que travar.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function onOpenItem(item: NotificationItem) {
    setOpen(false);
    if (item.readAt) return;
    setItems((current) =>
      current.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    startTransition(async () => {
      await markNotificationRead(item.id);
    });
  }

  function onMarkAll() {
    setItems((current) =>
      current.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
        aria-expanded={open}
        className="text-muted hover:bg-surface-2 hover:text-text relative grid size-10 shrink-0 place-items-center rounded-full"
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="bg-danger absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-[var(--bg)]"
          />
        )}
      </button>

      {open && (
        <div className="border-border bg-surface absolute top-full right-0 z-50 mt-2 max-h-[28rem] w-80 overflow-y-auto rounded-lg border shadow-lg">
          <div className="border-border bg-surface sticky top-0 flex items-center justify-between border-b px-4 py-2.5">
            <h2 className="text-sm font-semibold">Notificações</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-brand-text flex items-center gap-1 text-xs font-medium hover:underline"
              >
                <Check className="size-3.5" aria-hidden />
                Marcar tudo como lida
              </button>
            )}
          </div>

          {!loaded ? (
            <div className="text-muted p-6 text-center text-sm">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <BellOff className="text-subtle size-6" aria-hidden />
              <p className="text-muted text-sm">Nenhuma notificação ainda.</p>
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {items.map((item) => {
                const body = (
                  <div className="flex items-start gap-2.5 px-4 py-3">
                    {!item.readAt && (
                      <span
                        className="bg-brand mt-1.5 size-1.5 shrink-0 rounded-full"
                        aria-hidden
                      />
                    )}
                    <div className={cn('min-w-0 flex-1', item.readAt && 'pl-3.5')}>
                      <p className={cn('text-sm leading-snug', !item.readAt && 'font-semibold')}>
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="text-muted mt-0.5 line-clamp-2 text-xs leading-snug">
                          {item.body}
                        </p>
                      )}
                      <p className="text-subtle mt-1 text-xs">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.link ? (
                      <Link
                        href={item.link as Route}
                        onClick={() => onOpenItem(item)}
                        className="hover:bg-surface-2 block"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenItem(item)}
                        className="hover:bg-surface-2 block w-full text-left"
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
