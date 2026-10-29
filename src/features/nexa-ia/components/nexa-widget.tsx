'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { History, Loader2, Paperclip, Plus, Send, Sparkles, X } from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { cn } from '@/lib/utils';
import { sendChat } from '../server/actions';
import { composerKeyAction, insertNewline } from '../lib/composer-keys';
import { widgetHistory, widgetOpenSession } from '../server/widget-actions';
import type { ChatMessage, ChatSessionSummary } from '../server/queries';

/**
 * Balão da NexaAI: o mascote flutuando em qualquer tela do app, que abre um
 * chat com histórico e aceita anexar PDF/imagem. Some na própria página da
 * NexaAI (que já é o chat inteiro) e dentro de simulados em andamento.
 */
export function NexaWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatSessionSummary[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // O botão central da barra inferior (celular) abre o mesmo chat.
  useEffect(() => {
    const openChat = () => {
      setView('chat');
      setOpen(true);
    };
    window.addEventListener('nexa:open-chat', openChat);
    return () => window.removeEventListener('nexa:open-chat', openChat);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, pending, open, view]);

  if (pathname.startsWith('/nexa-ia')) return null;
  // O balão fica em todas as telas (menos na NexaAI e dentro do simulado); o botão roxo da barra leva à página da NexaAI.
  const showBubble = !/^\/estudar\/[^/]+\/(simulado|quiz)/.test(pathname);

  function send() {
    if (pending || (!text.trim() && !file)) return;
    const fd = new FormData();
    fd.set('sessionId', sessionId);
    fd.set('content', text);
    if (file) fd.set('file', file);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: file ? `📎 ${file.name}\n${text}` : text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setText('');
    setFile(null);
    setError(null);
    startTransition(async () => {
      const r = await sendChat(fd);
      if (r.ok) {
        setSessionId(r.sessionId);
        setMessages((m) => [...m, r.assistant]);
      } else {
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        setText(optimistic.content);
        setError(r.message);
      }
    });
  }

  function showHistory() {
    setView('history');
    startTransition(async () => setHistory(await widgetHistory()));
  }

  function openSession(id: string) {
    startTransition(async () => {
      setMessages(await widgetOpenSession(id));
      setSessionId(id);
      setView('chat');
    });
  }

  function newChat() {
    setSessionId('');
    setMessages([]);
    setError(null);
    setView('chat');
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Chat da NexaAI"
          className="border-border bg-surface fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+8.5rem)] z-50 flex h-[min(34rem,calc(100dvh-11rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border shadow-2xl md:bottom-24"
        >
          <header className="bg-brand text-brand-fg flex items-center gap-2 px-4 py-3">
            <Sparkles className="size-4" aria-hidden />
            <p className="flex-1 text-sm font-semibold">NexaAI</p>
            <button
              type="button"
              onClick={newChat}
              aria-label="Nova conversa"
              className="grid size-8 place-items-center rounded-full hover:bg-white/15"
            >
              <Plus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={view === 'history' ? () => setView('chat') : showHistory}
              aria-label="Histórico"
              className="grid size-8 place-items-center rounded-full hover:bg-white/15"
            >
              <History className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="grid size-8 place-items-center rounded-full hover:bg-white/15"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          {view === 'history' ? (
            <div className="flex-1 overflow-y-auto p-2">
              {pending && history.length === 0 ? (
                <Loader2 className="text-muted mx-auto mt-6 size-5 animate-spin" aria-hidden />
              ) : history.length === 0 ? (
                <p className="text-muted p-4 text-center text-sm">Nenhuma conversa ainda.</p>
              ) : (
                <ul>
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => openSession(h.id)}
                        className="hover:bg-surface-2 w-full rounded-xl px-3 py-2.5 text-left"
                      >
                        <span className="block truncate text-sm font-medium">{h.title}</span>
                        <span className="text-muted block text-xs">
                          {new Date(h.updatedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.length === 0 && (
                <p className="text-muted px-2 pt-6 text-center text-sm">
                  Oi! Pergunte qualquer dúvida de estudo ou anexe um PDF/foto do caderno para eu
                  explicar.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm',
                      m.role === 'user'
                        ? 'bg-brand text-brand-fg whitespace-pre-wrap'
                        : 'bg-surface-2',
                    )}
                  >
                    {m.role === 'user' ? m.content : <Markdown source={m.content} />}
                  </div>
                </div>
              ))}
              {pending && (
                <Loader2 className="text-muted size-4 animate-spin" aria-label="Pensando" />
              )}
              <div ref={endRef} />
            </div>
          )}

          {view === 'chat' && (
            <div className="border-border border-t p-2.5">
              {error && <p className="text-danger px-1 pb-1.5 text-xs">{error}</p>}
              {file && (
                <p className="bg-brand-soft text-brand-text mb-1.5 flex items-center justify-between rounded-lg px-2.5 py-1 text-xs">
                  <span className="truncate">📎 {file.name}</span>
                  <button type="button" onClick={() => setFile(null)} aria-label="Remover anexo">
                    <X className="size-3.5" aria-hidden />
                  </button>
                </p>
              )}
              <div className="flex items-end gap-1.5">
                <label className="text-muted hover:text-text grid size-10 shrink-0 cursor-pointer place-items-center rounded-full">
                  <Paperclip className="size-5" aria-hidden />
                  <span className="sr-only">Anexar PDF ou imagem</span>
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    const action = composerKeyAction(
                      {
                        key: e.key,
                        metaKey: e.metaKey,
                        ctrlKey: e.ctrlKey,
                        shiftKey: e.shiftKey,
                        isComposing: e.nativeEvent.isComposing,
                      },
                      window.matchMedia('(pointer: coarse)').matches,
                    );
                    if (action === 'send') {
                      e.preventDefault();
                      send();
                    } else if (action === 'newline' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      insertNewline(e.currentTarget);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Pergunte à NexaAI…"
                  className="border-border bg-surface max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-2xl border px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={pending}
                  aria-label="Enviar"
                  className="bg-brand text-brand-fg grid size-10 shrink-0 place-items-center rounded-full disabled:opacity-50"
                >
                  <Send className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showBubble && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fechar a NexaAI' : 'Abrir a NexaAI'}
          aria-expanded={open}
          className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 size-12 rounded-full bg-surface shadow-lg ring-1 ring-border transition-transform hover:scale-105 active:scale-95 md:right-6 md:bottom-6 md:size-14"
        >
          <Image
            src="/brand/nexi.webp"
            alt=""
            width={56}
            height={56}
            className="size-full object-contain p-1"
          />
          <span
            aria-hidden
            className="bg-surface text-brand absolute -top-1 -right-1 grid size-6 place-items-center rounded-full shadow"
          >
            <Sparkles className="size-3.5" />
          </span>
        </button>
      )}
    </>
  );
}
