'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowUp, BookOpen, ChevronDown, ClipboardList, Sparkles } from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { cn } from '@/lib/utils';
import { sendChat } from '../server/actions';
import type { ChatMessage } from '../server/queries';
import { composerKeyAction, insertNewline } from '../lib/composer-keys';
import { DEFAULT_TUTOR_MODE, TUTOR_MODES, TUTOR_MODE_LABELS, type TutorMode } from '../tutor';

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
export function NexaIaView({
  activeSessionId,
  messages: initialMessages,
}: {
  activeSessionId: string | null;
  messages: ChatMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [sessionId, setSessionId] = useState(activeSessionId ?? '');
  const [mode, setMode] = useState<TutorMode>(DEFAULT_TUTOR_MODE);
  const [error, setError] = useState<string | null>(null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const empty = messages.length === 0 && !pending;

  // Outra conversa escolhida na barra lateral: troca o conteúdo. Se o id novo é o da
  // conversa que acabamos de criar aqui, não mexe (o estado local já está certo).
  useEffect(() => {
    if ((activeSessionId ?? '') !== sessionId) {
      setSessionId(activeSessionId ?? '');
      setMessages(initialMessages);
      setTypingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, pending]);

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

  function submit() {
    const el = inputRef.current;
    const content = el?.value.trim() ?? '';
    if (!el || !content || pending) return;

    // A pergunta aparece AGORA; a caixa esvazia; a resposta chega depois.
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    el.value = '';
    el.style.height = 'auto';
    setError(null);

    startTransition(async () => {
      const r = await sendChat({ sessionId, content, mode });
      if (!r.ok) {
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        el.value = content;
        grow(el);
        setError(r.message);
        return;
      }
      setSessionId(r.sessionId);
      setTypingId(r.assistant.id);
      setMessages((m) => [...m, r.assistant]);
      // Conversa nova: leva o endereço para ela e atualiza a lista "Recentes".
      if (r.isNewSession) router.replace(`/nexa-ia?sessao=${r.sessionId}`, { scroll: false });
      else router.refresh();
    });
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', empty && 'justify-center')}>
      {!empty && (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'user' ? (
                  <div className="bg-surface-2 max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  <div className="flex max-w-full gap-3">
                    <Image
                      src="/brand/nexa-ai.webp"
                      alt=""
                      width={28}
                      height={28}
                      className="mt-0.5 size-7 shrink-0 object-contain"
                    />
                    <div className="min-w-0 text-[15px] leading-relaxed">
                      {message.id === typingId ? (
                        <Typewriter
                          text={message.content}
                          onTick={() => bottomRef.current?.scrollIntoView({ block: 'end' })}
                        />
                      ) : (
                        <Markdown source={message.content} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="flex gap-3" role="status" aria-label="A NexaAI está pensando">
                <Image
                  src="/brand/nexa-ai.webp"
                  alt=""
                  width={28}
                  height={28}
                  className="mt-0.5 size-7 shrink-0 object-contain"
                />
                <div className="flex items-center gap-1 py-3" aria-hidden>
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="bg-subtle size-2 animate-bounce rounded-full"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {empty && (
        <div className="mb-6 flex flex-col items-center gap-3 px-4 text-center">
          <Image
            src="/brand/nexa-ai.webp"
            alt=""
            width={56}
            height={56}
            className="size-16 object-contain"
          />
          <h2 className="text-2xl font-semibold tracking-tight">Como posso ajudar?</h2>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl px-4 pb-3">
        {error && (
          <p role="alert" className="text-danger mb-2 px-2 text-sm">
            {error}
          </p>
        )}
        <div className="border-border bg-surface flex items-end gap-2 rounded-[28px] border px-4 py-2.5 shadow-sm">
          <textarea
            ref={inputRef}
            rows={1}
            maxLength={2000}
            placeholder="Pergunte à NexaAI"
            aria-label="Mensagem para a NexaAI"
            onInput={(e) => grow(e.currentTarget)}
            onKeyDown={(e) => {
              const isTouch = window.matchMedia('(pointer: coarse)').matches;
              const action = composerKeyAction(
                {
                  key: e.key,
                  metaKey: e.metaKey,
                  ctrlKey: e.ctrlKey,
                  shiftKey: e.shiftKey,
                  isComposing: e.nativeEvent.isComposing,
                },
                isTouch,
              );
              if (action === 'send') {
                e.preventDefault();
                submit();
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
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            aria-label="Enviar"
            className="bg-brand text-brand-fg grid size-9 shrink-0 place-items-center rounded-full transition-opacity disabled:opacity-50"
          >
            <ArrowUp className="size-5" aria-hidden strokeWidth={2.4} />
          </button>
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
      </div>
    </div>
  );
}

/** A resposta aparece aos poucos (por palavras), como num assistente de verdade. Textos longos entram inteiros. */
function Typewriter({ text, onTick }: { text: string; onTick: () => void }) {
  const words = text.split(/(\s+)/);
  const [count, setCount] = useState(text.length > 1800 ? words.length : 0);

  useEffect(() => {
    if (count >= words.length) return;
    const step = Math.max(2, Math.ceil(words.length / 90));
    const id = window.setTimeout(() => {
      setCount((c) => Math.min(words.length, c + step));
      onTick();
    }, 18);
    return () => window.clearTimeout(id);
  }, [count, words.length, onTick]);

  return <Markdown source={words.slice(0, count).join('')} />;
}
