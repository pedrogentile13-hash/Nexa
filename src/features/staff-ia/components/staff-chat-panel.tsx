'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { composerKeyAction, insertNewline } from '@/features/nexa-ia/lib/composer-keys';
import { cn } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

async function streamStaff(messages: Msg[], onDelta: (x: string) => void): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  let response: Response;
  try {
    response = await fetch('/api/staff-ia/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
  } catch {
    return { ok: false, message: 'Sem conexão. Tente de novo.' };
  }
  if (!response.ok || !response.body) return { ok: false, message: 'Não consegui responder agora. Tente de novo.' };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let end: { ok: true; text: string } | { ok: false; message: string } | null = null;
  const handle = (line: string) => {
    if (!line.trim()) return;
    try {
      const e = JSON.parse(line) as { t: string; x?: string; text?: string; message?: string };
      if (e.t === 'delta' && e.x) onDelta(e.x);
      else if (e.t === 'done') end = { ok: true, text: e.text ?? '' };
      else if (e.t === 'error') end = { ok: false, message: e.message ?? 'Erro.' };
    } catch {
      // linha quebrada: ignora
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(handle);
  }
  handle(buffer);
  return end ?? { ok: false, message: 'A resposta foi interrompida. Tente de novo.' };
}

export interface StaffChatApi {
  clear: () => void;
  hasMessages: boolean;
}

/**
 * A conversa em si (mensagens + caixa de texto), usada no balão e na página da IA.
 * O texto da caixa é de quem usa (`value`/`onChange`), para os atalhos poderem preenchê-la.
 * A conversa vive só na tela — nada é guardado.
 */
export function StaffChatPanel({
  value,
  onChange,
  suggestions,
  intro,
  onState,
  clearSignal = 0,
  className,
}: {
  value: string;
  onChange: (text: string) => void;
  suggestions: string[];
  intro: string;
  onState?: (hasMessages: boolean) => void;
  /** Muda para zerar a conversa. */
  clearSignal?: number;
  className?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streamText, setStreamText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, streamText.length, sending]);

  useEffect(() => {
    onState?.(messages.length > 0);
  }, [messages.length, onState]);

  useEffect(() => {
    if (clearSignal > 0) {
      setMessages([]);
      setError(null);
    }
  }, [clearSignal]);

  // Atalho que preenche a caixa: leva o cursor ao fim para a pessoa completar o "…".
  useEffect(() => {
    if (value && document.activeElement !== inputRef.current && messages.length === 0) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando o texto vem de fora
  }, [value === '' ? 0 : 1]);

  function send() {
    const text = value.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    onChange('');
    setError(null);
    setSending(true);
    setStreamText('');
    void (async () => {
      const r = await streamStaff(next.slice(-12), (x) => setStreamText((t) => t + x));
      setSending(false);
      setStreamText('');
      if (r.ok) setMessages((m) => [...m, { role: 'assistant', content: r.text }]);
      else {
        setMessages(messages);
        onChange(text);
        setError(r.message);
      }
    })();
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="px-1 pt-3">
            <p className="text-muted text-center text-sm">{intro}</p>
            <ul className="mt-4 space-y-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => onChange(s)} className="border-border hover:bg-surface-2 w-full rounded-2xl border px-3.5 py-2.5 text-left text-sm">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm', m.role === 'user' ? 'bg-brand text-brand-fg whitespace-pre-wrap' : 'bg-surface-2')}>
              {m.role === 'user' ? m.content : <Markdown source={m.content} />}
            </div>
          </div>
        ))}
        {sending && streamText && (
          <div className="flex justify-start">
            <div className="bg-surface-2 max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm">
              <Markdown source={streamText} />
            </div>
          </div>
        )}
        {sending && !streamText && <Loader2 className="text-muted size-4 animate-spin" aria-label="Pensando" />}
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-border flex items-end gap-2 border-t p-2.5">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            const action = composerKeyAction(e.nativeEvent, isTouch);
            if (action === 'send') { e.preventDefault(); send(); }
            else if (action === 'newline') { e.preventDefault(); insertNewline(e.currentTarget); }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Pergunte à NexaAI…"
          aria-label="Mensagem"
          className="border-border bg-bg text-text focus-visible:ring-brand max-h-40 min-h-11 flex-1 resize-none rounded-3xl border px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <button type="submit" disabled={sending || !value.trim()} aria-label="Enviar" className="bg-brand text-brand-fg grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50">
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
