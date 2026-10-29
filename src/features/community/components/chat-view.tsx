'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { deleteMessage, getMessages, sendMessage } from '../server/chat-actions';
import type { ChatMessage } from '../server/chat-queries';
import { ReportButton } from './report-button';

const POLL_INTERVAL_MS = 4000;

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Chat de grupo — sem Supabase Realtime (decisão da Fase 0): busca mensagem
 * nova a cada `POLL_INTERVAL_MS` enquanto esta tela está montada, parando o
 * intervalo ao desmontar. Não é instantâneo como Realtime seria, mas não
 * introduz uma peça de infraestrutura nova que o resto do projeto não usa.
 */
export function ChatView({ communityId, canModerate }: { communityId: string; canModerate: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    function poll() {
      getMessages(communityId).then((result) => {
        if (active) setMessages(result);
      });
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [communityId]);

  useEffect(() => {
    if (messages) bottomRef.current?.scrollIntoView({ block: 'end' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só rola quando a CONTAGEM muda (mensagem nova/apagada); reagir ao array inteiro rolaria a cada poll mesmo sem mudança
  }, [messages?.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setError(null);
    startTransition(async () => {
      const result = await sendMessage(communityId, content);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDraft('');
      getMessages(communityId).then(setMessages);
    });
  }

  function handleDelete(messageId: string) {
    startTransition(async () => {
      await deleteMessage(messageId);
      setMessages((prev) => (prev ?? []).filter((m) => m.id !== messageId));
    });
  }

  if (messages === null) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] flex-col">
      <div className="flex-1 space-y-2.5 overflow-y-auto pb-3">
        {messages.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">
            Nenhuma mensagem ainda — comece a conversa.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.isOwn ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'group max-w-[80%] rounded-2xl px-3.5 py-2',
                  message.isOwn ? 'bg-brand text-brand-fg rounded-br-sm' : 'bg-surface-2 text-text rounded-bl-sm',
                )}
              >
                {!message.isOwn && <p className="mb-0.5 text-xs font-semibold opacity-80">{message.authorName}</p>}
                <p className="text-sm leading-snug whitespace-pre-wrap">{message.content}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[10px] opacity-70">
                    {timeLabel(message.createdAt)}
                    {message.editedAt && ' · editada'}
                  </span>
                  {(message.isOwn || canModerate) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      disabled={pending}
                      aria-label="Apagar mensagem"
                      className="opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100"
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </button>
                  )}
                  {!message.isOwn && (
                    <ReportButton
                      targetType="message"
                      targetId={message.id}
                      className="opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-border flex items-center gap-2 border-t pt-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva uma mensagem…"
          maxLength={1000}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          aria-label="Enviar"
          className="bg-brand text-brand-fg hover:bg-brand-hover grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        </button>
      </form>
      {error && <p className="text-danger mt-1.5 text-xs">{error}</p>}
    </div>
  );
}
