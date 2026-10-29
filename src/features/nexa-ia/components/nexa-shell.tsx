'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { BookOpenText, Check, FolderHeart, Menu, MessageSquare, Pencil, SquarePen, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteChatSession, renameChatSession } from '../server/actions';
import type { ChatSessionSummary } from '../server/queries';

export type NexaTab = 'conversar' | 'material' | 'conteudos';

const NAV: { tab: NexaTab; label: string; href: string; Icon: typeof MessageSquare }[] = [
  { tab: 'conversar', label: 'Conversar', href: '/nexa-ia', Icon: MessageSquare },
  { tab: 'material', label: 'Material de estudo', href: '/nexa-ia?aba=material', Icon: BookOpenText },
  { tab: 'conteudos', label: 'Meus conteúdos', href: '/nexa-ia?aba=conteudos', Icon: FolderHeart },
];

/**
 * Moldura da NexaAI: barra lateral FIXA (só a lista de conversas rola dentro
 * dela) e a área de trabalho ao lado. No celular a barra vira uma gaveta aberta
 * pelo botão de menu. A altura é a da tela inteira menos a barra de navegação do
 * app, então nada aqui rola junto com a página.
 */
export function NexaShell({
  sessions,
  activeSessionId,
  tab,
  children,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  tab: NexaTab;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-bg flex h-[calc(100dvh-4.25rem-env(safe-area-inset-bottom))] overflow-hidden md:-mb-8 md:h-dvh">
      {open && <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      <aside
        className={cn(
          'border-border bg-surface z-50 flex w-72 shrink-0 flex-col border-r transition-transform',
          'fixed inset-y-0 left-0 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar sessions={sessions} activeSessionId={activeSessionId} tab={tab} onNavigate={() => setOpen(false)} />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="pt-safe border-border flex items-center gap-2 border-b px-3 py-2 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu da NexaAI" className="text-muted hover:bg-surface-2 grid size-10 place-items-center rounded-full">
            <Menu className="size-5" aria-hidden />
          </button>
          <p className="text-sm font-semibold">{NAV.find((n) => n.tab === tab)?.label}</p>
          <Link href="/nexa-ia" aria-label="Nova conversa" className="text-muted hover:bg-surface-2 ml-auto grid size-10 place-items-center rounded-full">
            <SquarePen className="size-5" aria-hidden />
          </Link>
        </header>
        {children}
      </section>
    </div>
  );
}

function Sidebar({
  sessions,
  activeSessionId,
  tab,
  onNavigate,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  tab: NexaTab;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function commitRename(id: string) {
    const title = editValue.trim();
    setEditingId(null);
    if (!title) return;
    startTransition(async () => {
      await renameChatSession(id, title);
    });
  }

  function handleDelete(s: ChatSessionSummary) {
    if (!window.confirm(`Excluir a conversa "${s.title}"? Isso não pode ser desfeito.`)) return;
    startTransition(async () => {
      await deleteChatSession(s.id);
      if (s.id === activeSessionId) router.push('/nexa-ia');
    });
  }

  return (
    <>
      <div className="pt-safe flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-lg font-semibold tracking-tight">NexaAI</p>
        <button type="button" onClick={onNavigate} aria-label="Fechar" className="text-muted hover:bg-surface-2 grid size-9 place-items-center rounded-full lg:hidden">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <nav aria-label="Seções da NexaAI" className="space-y-0.5 px-2">
        <Link
          href="/nexa-ia"
          onClick={onNavigate}
          className="hover:bg-surface-2 flex h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium"
        >
          <SquarePen className="size-[18px]" aria-hidden />
          Novo chat
        </Link>
        {NAV.map(({ tab: t, label, href, Icon }) => (
          <Link
            key={t}
            href={href as '/nexa-ia'}
            onClick={onNavigate}
            aria-current={t === tab ? 'page' : undefined}
            className={cn(
              'flex h-11 items-center gap-2.5 rounded-xl px-3 text-sm transition-colors',
              t === tab ? 'bg-surface-2 text-text font-semibold' : 'text-muted hover:bg-surface-2 hover:text-text font-medium',
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <h2 className="text-subtle px-5 pb-1.5 text-xs font-semibold">Recentes</h2>
        <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {sessions.length === 0 && <li className="text-subtle px-3 py-2 text-sm">Nenhuma conversa ainda.</li>}
          {sessions.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <div className="bg-surface-2 flex items-center gap-1 rounded-xl px-2 py-1.5">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(s.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    maxLength={120}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  <button type="button" onClick={() => commitRename(s.id)} aria-label="Salvar nome" className="text-success">
                    <Check className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} aria-label="Cancelar" className="text-subtle">
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <div className={cn('group/item flex items-center rounded-xl', s.id === activeSessionId && tab === 'conversar' ? 'bg-surface-2' : 'hover:bg-surface-2')}>
                  <Link
                    href={`/nexa-ia?sessao=${s.id}`}
                    onClick={onNavigate}
                    className="min-w-0 flex-1 truncate px-3 py-2.5 text-sm"
                  >
                    {s.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditValue(s.title);
                    }}
                    aria-label={`Renomear "${s.title}"`}
                    className="text-subtle hover:text-text shrink-0 rounded-full p-1.5 lg:opacity-0 lg:group-hover/item:opacity-100"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    aria-label={`Excluir "${s.title}"`}
                    className="text-subtle hover:text-danger mr-1 shrink-0 rounded-full p-1.5 lg:opacity-0 lg:group-hover/item:opacity-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
