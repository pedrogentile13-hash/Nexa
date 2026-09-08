'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { BookOpen, ClipboardList, Loader2, MessageSquarePlus, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createChatSession, sendMessage, type SendMessageState } from '../server/actions';
import type { ChatMessage, ChatSessionSummary } from '../server/queries';

const INITIAL: SendMessageState = { status: 'idle' };

const QUICK_PROMPTS = [
  { icon: BookOpen, text: 'Explique um assunto que eu não entendi' },
  { icon: ClipboardList, text: 'Crie questões de treino sobre um tópico' },
  { icon: Sparkles, text: 'Resuma um conteúdo que eu já estudei' },
];

/**
 * Nexa IA — estrutura pronta, sem provedor de IA ligado.
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
  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <SessionsSidebar sessions={sessions} activeSessionId={activeSessionId} />
      <ChatPanel activeSessionId={activeSessionId} messages={messages} />
    </div>
  );
}

function SessionsSidebar({
  sessions,
  activeSessionId,
}: {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
}) {
  return (
    <aside className="mb-4 lg:mb-0">
      <form action={createChatSession}>
        <Button type="submit" variant="secondary" className="mb-3 w-full">
          <MessageSquarePlus aria-hidden />
          Nova conversa
        </Button>
      </form>

      {sessions.length > 0 && (
        <>
          <h2 className="text-muted mb-2 hidden text-xs font-semibold tracking-wide uppercase lg:block">
            Últimos chats
          </h2>
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {sessions.map((session) => (
              <li key={session.id} className="shrink-0 lg:shrink">
                <Link
                  href={`/nexa-ia?sessao=${session.id}`}
                  className={cn(
                    'block truncate rounded-lg px-3 py-2 text-sm transition-colors',
                    'max-w-[220px] lg:max-w-none',
                    session.id === activeSessionId
                      ? 'bg-brand-soft text-brand-text font-medium'
                      : 'bg-surface-2 text-muted hover:text-text lg:bg-transparent',
                  )}
                >
                  {session.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
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
              Pergunte sobre qualquer conteúdo — a Nexa IA ainda não tem um provedor conectado, mas
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
