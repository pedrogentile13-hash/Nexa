'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { composerKeyAction, insertNewline } from '@/features/nexa-ia/lib/composer-keys';
import { cn } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Monte um plano de aula de 50 minutos sobre…',
  'Escreva um comunicado curto para os responsáveis sobre…',
  'Crie 5 questões de múltipla escolha sobre…',
  'Como acompanho os alunos que estão com baixo desempenho?',
];

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

/**
 * NexaAI dos painéis (portal da escola e admin): balão flutuante que abre um chat.
 * A conversa vive só na tela — nada é guardado. A IA tem a trava de escopo da equipe.
 */
export function StaffChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [streamText, setStreamText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, streamText.length, sending, open]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('nexa:open-staff-chat', openChat);
    return () => window.removeEventListener('nexa:open-staff-chat', openChat);
  }, []);

  function send(content = text) {
    const value = content.trim();
    if (!value || sending) return;
    const next: Msg[] = [...messages, { role: 'user', content: value }];
    setMessages(next);
    setText('');
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
        setText(value);
        setError(r.message);
      }
    })();
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="NexaAI do painel"
          className="border-border bg-surface fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+9.5rem)] z-50 flex h-[min(36rem,calc(100dvh-12rem))] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border shadow-2xl md:bottom-24"
        >
          <header className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'var(--gradient-header)' }}>
            <Sparkles className="size-4" aria-hidden />
            <p className="flex-1 text-sm font-semibold">NexaAI do painel</p>
            {messages.length > 0 && (
              <button type="button" onClick={() => { setMessages([]); setError(null); }} aria-label="Nova conversa" className="grid size-8 place-items-center rounded-full hover:bg-white/15">
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="grid size-8 place-items-center rounded-full hover:bg-white/15">
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="px-1 pt-3">
                <p className="text-muted text-center text-sm">Planejamento, materiais, simulados, comunicados e turmas. Sobre o que vamos falar?</p>
                <ul className="mt-4 space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => setText(s)} className="border-border hover:bg-surface-2 w-full rounded-2xl border px-3.5 py-2.5 text-left text-sm">
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

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-border flex items-end gap-2 border-t p-2.5"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
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
              className="border-border bg-bg text-text focus-visible:ring-brand max-h-32 min-h-11 flex-1 resize-none rounded-3xl border px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
            <button type="submit" disabled={sending || !text.trim()} aria-label="Enviar" className="bg-brand text-brand-fg grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50">
              <Send className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Fechar NexaAI' : 'Abrir NexaAI do painel'}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 grid size-14 place-items-center rounded-full text-white shadow-lg md:right-6 md:bottom-6"
        style={{ background: 'var(--gradient-header)' }}
      >
        <Sparkles className="size-6" aria-hidden />
      </button>
    </>
  );
}
