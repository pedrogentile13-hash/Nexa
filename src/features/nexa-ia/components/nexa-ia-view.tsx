'use client';

import Image from 'next/image';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowUp, BookOpen, ChevronDown, ClipboardList, Loader2, Sparkles } from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { cn } from '@/lib/utils';
import { sendMessage, type SendMessageState } from '../server/actions';
import type { ChatMessage } from '../server/queries';
import { composerKeyAction, insertNewline } from '../lib/composer-keys';
import { DEFAULT_TUTOR_MODE, TUTOR_MODES, TUTOR_MODE_LABELS, type TutorMode } from '../tutor';

const INITIAL: SendMessageState = { status: 'idle' };

const QUICK_PROMPTS = [
  { icon: BookOpen, text: 'Explique um assunto que eu não entendi' },
  { icon: ClipboardList, text: 'Crie questões de treino sobre um tópico' },
  { icon: Sparkles, text: 'Resuma um conteúdo que eu já estudei' },
];

/**
 * Chat da NexaAI, no estilo de um assistente simples: conversa no meio, caixa
 * de mensagem arredondada embaixo (no meio da tela quando ainda não há conversa).
 * Enter envia no computador; Command/Ctrl/Shift+Enter pulam linha; no celular o
 * Enter pula linha e o envio é pelo botão.
 */
export function NexaIaView({ activeSessionId, messages }: { activeSessionId: string | null; messages: ChatMessage[] }) {
  const [state, formAction] = useActionState(sendMessage, INITIAL);
  const [mode, setMode] = useState<TutorMode>(DEFAULT_TUTOR_MODE);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (state.status === 'sent' && inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';
    }
  }, [state]);

  function grow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function fillPrompt(text: string) {
    if (!inputRef.current) return;
    inputRef.current.value = text;
    grow(inputRef.current);
    inputRef.current.focus();
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', empty && 'justify-center')}>
      {!empty && (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'user' ? (
                  <div className="bg-surface-2 max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  <div className="flex max-w-full gap-3">
                    <Image src="/brand/nexa-ai.webp" alt="" width={28} height={28} className="mt-0.5 size-7 shrink-0 object-contain" />
                    <div className="min-w-0 text-[15px] leading-relaxed">
                      <Markdown source={message.content} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {empty && (
        <div className="mb-6 flex flex-col items-center gap-3 px-4 text-center">
          <Image src="/brand/nexa-ai.webp" alt="" width={56} height={56} className="size-16 object-contain" />
          <h2 className="text-2xl font-semibold tracking-tight">Como posso ajudar?</h2>
        </div>
      )}

      <form ref={formRef} action={formAction} className="mx-auto w-full max-w-3xl px-4 pb-3">
        <input type="hidden" name="sessionId" value={activeSessionId ?? ''} />
        <input type="hidden" name="mode" value={mode} />
        {state.status === 'error' && (
          <p role="alert" className="text-danger mb-2 px-2 text-sm">
            {state.message}
          </p>
        )}
        <div className="border-border bg-surface flex items-end gap-2 rounded-[28px] border px-4 py-2.5 shadow-sm">
          <textarea
            ref={inputRef}
            name="content"
            rows={1}
            required
            maxLength={2000}
            placeholder="Pergunte à NexaAI"
            aria-label="Mensagem para a NexaAI"
            onInput={(e) => grow(e.currentTarget)}
            onKeyDown={(e) => {
              const isTouch = window.matchMedia('(pointer: coarse)').matches;
              const action = composerKeyAction(
                { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, isComposing: e.nativeEvent.isComposing },
                isTouch,
              );
              if (action === 'send') {
                e.preventDefault();
                if (e.currentTarget.value.trim()) formRef.current?.requestSubmit();
              } else if (action === 'newline' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                insertNewline(e.currentTarget);
              }
            }}
            className="placeholder:text-subtle max-h-[200px] min-h-7 min-w-0 flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed outline-none"
          />
          <label className="text-muted relative flex h-9 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium">
            <span className="sr-only">Modo do tutor</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as TutorMode)}
              className="hover:text-text cursor-pointer appearance-none bg-transparent pr-5 outline-none"
            >
              {TUTOR_MODES.map((m) => (
                <option key={m} value={m}>
                  {TUTOR_MODE_LABELS[m].label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute right-2 size-3.5" />
          </label>
          <SendButton />
        </div>

        {empty && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.text}
                type="button"
                onClick={() => fillPrompt(p.text)}
                className="border-border text-muted hover:bg-surface-2 hover:text-text flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors"
              >
                <p.icon className="text-brand size-4" aria-hidden />
                {p.text}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Enviar"
      className="bg-brand text-brand-fg grid size-9 shrink-0 place-items-center rounded-full transition-opacity disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-5" aria-hidden strokeWidth={2.4} />}
    </button>
  );
}
