'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Camera, CheckCircle2, Loader2, Send, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WhiteboardButton, useWhiteboardStore } from '@/components/whiteboard/whiteboard';
import { LETTERS, answersToPayload, formatElapsed, groupByArea, type AnswerMap, type Letter } from '../lib/answer-sheet';
import { readAnswerSheetPhoto, submitAnswerSheet } from '../server/answer-sheet-actions';

interface Question {
  number: number;
  area: string;
  annulled: boolean;
}

/**
 * Cartão-resposta digital. O aluno faz a prova no caderno oficial e marca aqui (ou envia a foto do cartão, que a IA lê).
 * A correção é feita no servidor com o gabarito oficial: o app nunca tem as respostas certas.
 */
export function AnswerSheet({ editionId, layout }: { editionId: string; layout: Question[] }) {
  const whiteboards = useWhiteboardStore();
  const router = useRouter();
  const storageKey = `nx_sheet_${editionId}`;
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [doubtful, setDoubtful] = useState<Set<number>>(new Set());
  const [usedPhoto, setUsedPhoto] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [busy, setBusy] = useState<'photo' | 'send' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rascunho local: não perder as marcações se a página recarregar.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as { a?: AnswerMap; t?: number } | null;
      if (saved?.a) setAnswers(saved.a);
      if (saved?.t) setElapsed(saved.t);
    } catch {
      // sem armazenamento: segue em branco
    }
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ a: answers, t: elapsed }));
    } catch {
      // ignora
    }
  }, [answers, elapsed, storageKey]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const groups = useMemo(() => groupByArea(layout), [layout]);
  const marked = Object.values(answers).filter(Boolean).length;

  function pick(number: number, letter: Letter) {
    setAnswers((prev) => ({ ...prev, [number]: prev[number] === letter ? null : letter }));
    setDoubtful((prev) => {
      if (!prev.has(number)) return prev;
      const next = new Set(prev);
      next.delete(number);
      return next;
    });
  }

  async function onPhoto(file: File | null) {
    if (!file) return;
    setBusy('photo');
    setMessage(null);
    const body = new FormData();
    body.set('editionId', editionId);
    body.set('photo', file);
    const r = await readAnswerSheetPhoto(body);
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
    if (!r.ok) return setMessage({ kind: 'error', text: r.message });
    setAnswers((prev) => ({ ...prev, ...r.answers }));
    setDoubtful(new Set(r.doubtful));
    setUsedPhoto(true);
    setMessage({
      kind: 'ok',
      text: `A IA leu ${r.read} respostas. Confira no cartão${r.doubtful.length ? ` (as ${r.doubtful.length} em amarelo ficaram com dúvida)` : ''} e corrija o que estiver errado antes de enviar.`,
    });
  }

  async function send() {
    const blanks = layout.length - marked;
    if (blanks > 0 && !window.confirm(`Você deixou ${blanks} questão(ões) em branco. Enviar mesmo assim?`)) return;
    setBusy('send');
    setMessage(null);
    setRunning(false);
    const r = await submitAnswerSheet({ editionId, answers: answersToPayload(answers), durationSeconds: elapsed, mode: usedPhoto ? 'foto' : 'digital' });
    if (!r.ok) {
      setBusy(null);
      setRunning(true);
      return setMessage({ kind: 'error', text: r.message });
    }
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignora
    }
    router.push(`/vestibular/provas/${editionId}/resultado/${r.attemptId}` as Route);
  }

  return (
    <div className="space-y-5 pb-28">
      {/* Foto do cartão */}
      <section className="border-border bg-surface rounded-2xl border p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Camera className="text-brand size-4" aria-hidden /> Marcou no cartão de papel?
        </h2>
        <p className="text-muted mt-1 text-xs">Tire uma foto reta e com boa luz. A IA lê as marcações e preenche o cartão abaixo; você confere antes de enviar.</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" id="sheet-photo" onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)} />
        <Button type="button" variant="secondary" className="mt-3" disabled={busy !== null} onClick={() => fileRef.current?.click()}>
          {busy === 'photo' ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />} Enviar foto do cartão
        </Button>
      </section>

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={cn('rounded-xl px-4 py-3 text-sm', message.kind === 'error' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success')}>
          {message.text}
        </p>
      )}

      {/* Cartão */}
      {groups.map((g) => (
        <section key={`${g.area}-${g.items[0]!.number}`} className="space-y-2">
          <h3 className="text-muted text-xs font-semibold tracking-wide uppercase">{g.area}</h3>
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-2xl border">
            {g.items.map((q) => (
              <li key={q.number} className={cn('flex items-center gap-2 px-3 py-2', doubtful.has(q.number) && 'bg-warning-soft')}>
                <span className="text-muted w-9 shrink-0 text-right text-sm font-semibold tabular-nums">{q.number}</span>
                <div role="radiogroup" aria-label={`Questão ${q.number}`} className="flex flex-1 justify-between gap-1.5">
                  {LETTERS.map((l) => {
                    const on = answers[q.number] === l;
                    return (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`Questão ${q.number}, alternativa ${l}`}
                        onClick={() => pick(q.number, l)}
                        className={cn('grid size-10 place-items-center rounded-full border text-sm font-semibold transition-colors', on ? 'border-brand bg-brand text-brand-fg' : 'border-border text-muted hover:bg-surface-2')}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
                {q.annulled && <span className="text-subtle w-14 shrink-0 text-[10px] leading-tight">anulada</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Barra fixa */}
      <div className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 backdrop-blur md:left-64" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button type="button" onClick={() => setRunning((v) => !v)} className="text-muted flex items-center gap-1.5 text-sm tabular-nums" aria-label={running ? 'Pausar cronômetro' : 'Retomar cronômetro'}>
            <Timer className="size-4" aria-hidden /> {formatElapsed(elapsed)}
          </button>
          <span className="text-muted flex-1 text-sm">
            <CheckCircle2 className="mr-1 inline size-4" aria-hidden />
            {marked}/{layout.length}
          </span>
          <WhiteboardButton boardKey="prova" label="Rascunho da prova" store={whiteboards} className="size-11 shadow-none" />
          <Button type="button" onClick={() => void send()} disabled={busy !== null || marked === 0}>
            {busy === 'send' ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Corrigir
          </Button>
        </div>
      </div>
    </div>
  );
}
