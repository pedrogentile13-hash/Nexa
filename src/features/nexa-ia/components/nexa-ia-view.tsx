'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  BookOpen,
  Check,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  createChatSession,
  deleteChatSession,
  renameChatSession,
  sendMessage,
  type SendMessageState,
} from '../server/actions';
import type { ChatMessage, ChatSessionSummary } from '../server/queries';

const SIDEBAR_COLLAPSED_KEY = 'nexaai:sidebar-collapsed';

const INITIAL: SendMessageState = { status: 'idle' };

const QUICK_PROMPTS = [
  { icon: BookOpen, text: 'Explique um assunto que eu não entendi' },
  { icon: ClipboardList, text: 'Crie questões de treino sobre um tópico' },
  { icon: Sparkles, text: 'Resuma um conteúdo que eu já estudei' },
];

/**
 * NexaAI — estrutura pronta, sem provedor de IA ligado.
 *
 * Sessões e mensagens são reais e persistem; só a resposta é fixa (ver
 * `sendMessage`/`replyTo` no server). O layout já é o definitivo — trocar
 * `replyTo` por uma chamada de LLM de verdade não muda nada aqui.
 */
export function NexaIaView({
  sessions,
  activeSessionId,
  messages,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  messages: ChatMessage[];
}) {
  // Só lido depois de montar — o valor real mora no navegador de cada um, e
  // usá-lo já no primeiro render divergiria do HTML gerado no servidor.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
    } catch {
      // Aba anônima/site data bloqueado — segue expandido, comportamento de sempre.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // Preferência não persiste, mas o toggle desta sessão continua funcionando.
      }
      return next;
    });
  }

  return (
    <div
      className={cn(
        'lg:grid lg:items-start lg:gap-6',
        collapsed ? 'lg:grid-cols-[56px_minmax(0,1fr)]' : 'lg:grid-cols-[260px_minmax(0,1fr)]',
      )}
    >
      <SessionsSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <ChatPanel activeSessionId={activeSessionId} messages={messages} />
    </div>
  );
}

function SessionsSidebar({
  sessions,
  activeSessionId,
  collapsed,
  onToggleCollapsed,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function startRename(session: ChatSessionSummary) {
    setEditingId(session.id);
    setEditValue(session.title);
  }

  function commitRename(sessionId: string) {
    const title = editValue.trim();
    setEditingId(null);
    if (!title) return;
    startTransition(async () => {
      await renameChatSession(sessionId, title);
    });
  }

  function handleDelete(session: ChatSessionSummary) {
    if (!window.confirm(`Excluir a conversa "${session.title}"? Isso não pode ser desfeito.`)) return;
    startTransition(async () => {
      await deleteChatSession(session.id);
      if (session.id === activeSessionId) router.push('/nexa-ia');
    });
  }

  return (
    <aside className="mb-4 lg:mb-0">
      {/* Recolhida (só desktop — no celular a lista sempre aparece, é uma
          fila horizontal compacta, não ocupa espaço vertical de sobra). */}
      {collapsed && (
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expandir lista de conversas"
            title="Expandir lista de conversas"
            className="text-muted hover:bg-surface-2 hover:text-text grid size-10 place-items-center rounded-full"
          >
            <ChevronsRight className="size-4" aria-hidden />
          </button>
          <form action={createChatSession}>
            <button
              type="submit"
              aria-label="Nova conversa"
              title="Nova conversa"
              className="bg-surface-2 hover:bg-border-strong/30 text-text grid size-10 place-items-center rounded-full"
            >
              <MessageSquarePlus className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      )}

      <div className={collapsed ? 'lg:hidden' : ''}>
        <div className="mb-3 flex items-center gap-2">
          <form action={createChatSession} className="min-w-0 flex-1">
            <Button type="submit" variant="secondary" className="w-full">
              <MessageSquarePlus aria-hidden />
              Nova conversa
            </Button>
          </form>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Reduzir a barra de conversas"
            title="Reduzir a barra"
            className="text-muted hover:bg-surface-2 hover:text-text hidden shrink-0 rounded-full p-2 lg:grid lg:place-items-center"
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </button>
        </div>

        {sessions.length > 0 && (
          <>
            <h2 className="text-muted mb-2 hidden text-xs font-semibold tracking-wide uppercase lg:block">
              Últimos chats
            </h2>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {sessions.map((session) => (
                <li key={session.id} className="shrink-0 lg:shrink">
                  {editingId === session.id ? (
                    <div className="bg-surface-2 flex items-center gap-1 rounded-lg px-2 py-1">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(session.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        maxLength={120}
                        className="text-text min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => commitRename(session.id)}
                        aria-label="Salvar nome"
                        className="text-success shrink-0"
                      >
                        <Check className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancelar"
                        className="text-subtle shrink-0"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'group/item flex items-center gap-0.5 rounded-lg',
                        session.id === activeSessionId
                          ? 'bg-brand-soft'
                          : 'bg-surface-2 lg:bg-transparent lg:hover:bg-surface-2',
                      )}
                    >
                      <Link
                        href={`/nexa-ia?sessao=${session.id}`}
                        className={cn(
                          'block min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm transition-colors',
                          'max-w-[220px] lg:max-w-none',
                          session.id === activeSessionId
                            ? 'text-brand-text font-medium'
                            : 'text-muted hover:text-text',
                        )}
                      >
                        {session.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => startRename(session)}
                        aria-label={`Renomear "${session.title}"`}
                        className="text-subtle hover:bg-border-strong/20 hover:text-text hidden shrink-0 rounded-full p-1.5 lg:block lg:opacity-0 lg:group-hover/item:opacity-100"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(session)}
                        aria-label={`Excluir "${session.title}"`}
                        className="text-subtle hover:bg-danger-soft hover:text-danger mr-0.5 hidden shrink-0 rounded-full p-1.5 lg:block lg:opacity-0 lg:group-hover/item:opacity-100"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}

function ChatPanel({
  activeSessionId,
  messages,
}: {
  activeSessionId: string | null;
  messages: ChatMessage[];
}) {
  const [state, formAction] = useActionState(sendMessage, INITIAL);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (state.status === 'sent' && inputRef.current) inputRef.current.value = '';
  }, [state]);

  function fillPrompt(text: string) {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-3 pb-4">
        {messages.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border p-6 text-center">
            <span className="bg-brand-soft text-brand-text mx-auto grid size-12 place-items-center rounded-full">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <h2 className="mt-3 text-base font-semibold">Como posso ajudar?</h2>
            <p className="text-muted mt-1 text-sm">
              Pergunte sobre qualquer conteúdo — a NexaAI ainda não tem um provedor conectado, mas
              sua conversa já fica salva no histórico.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => fillPrompt(prompt.text)}
                  className="border-border bg-bg hover:bg-surface-2 flex flex-col items-center gap-2 rounded-xl border p-3 text-left transition-colors"
                >
                  <prompt.icon className="text-brand size-5" aria-hidden />
                  <span className="text-xs leading-snug">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <p
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'bg-brand text-brand-fg rounded-br-sm'
                    : 'bg-surface-2 text-text rounded-bl-sm',
                )}
              >
                {message.content}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form action={formAction} className="border-border bg-bg/90 sticky bottom-0 border-t pt-3 pb-safe">
        <input type="hidden" name="sessionId" value={activeSessionId ?? ''} />
        {state.status === 'error' && (
          <p role="alert" className="text-danger mb-2 text-sm">
            {state.message}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            name="content"
            placeholder="Pergunte alguma coisa…"
            autoComplete="off"
            required
            maxLength={2000}
          />
          <SendButton />
        </div>
      </form>
    </div>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
      <span className="sr-only">Enviar</span>
    </Button>
  );
}
