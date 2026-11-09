'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, FileSearch, Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AREA_PRESETS } from '@/features/vestibular/lib/answer-sheet';
import { deleteAnswerKey, previewAnswerKey, saveAnswerKey } from '../server/answer-key-actions';

export interface KeyEdition {
  id: string;
  label: string;
  hasGabaritoFile: boolean;
  total: number;
}

/** Cadastro do gabarito oficial por edição: lê do PDF (texto ou IA), confere e salva. */
export function AnswerKeyManager({ editions }: { editions: KeyEdition[] }) {
  return (
    <ul className="space-y-3">
      {editions.map((e) => (
        <li key={e.id}>
          <EditionKey edition={e} />
        </li>
      ))}
    </ul>
  );
}

function EditionKey({ edition }: { edition: KeyEdition }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [areas, setAreas] = useState('');
  const [note, setNote] = useState<{ kind: 'ok' | 'error' | 'info'; message: string } | null>(null);
  const [pending, start] = useTransition();

  function read() {
    setNote(null);
    start(async () => {
      const r = await previewAnswerKey(edition.id);
      if (!r.ok) return setNote({ kind: 'error', message: r.message });
      setText(r.text);
      setNote({
        kind: r.missing.length ? 'error' : 'info',
        message: `Li ${r.count} respostas (${r.source}).${r.missing.length ? ` Faltam: ${r.missing.slice(0, 12).join(', ')}.` : ' Confira e salve.'}`,
      });
    });
  }

  function save() {
    setNote(null);
    start(async () => {
      const r = await saveAnswerKey(edition.id, text, areas);
      setNote({ kind: r.ok ? 'ok' : 'error', message: r.message });
    });
  }

  function remove() {
    if (!window.confirm('Apagar o gabarito desta edição? Os resultados já enviados ficam guardados.')) return;
    start(async () => {
      const r = await deleteAnswerKey(edition.id);
      setNote({ kind: r.ok ? 'ok' : 'error', message: r.message });
    });
  }

  return (
    <section className="border-border bg-surface rounded-2xl border p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left" aria-expanded={open}>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{edition.label}</span>
          <span className="text-muted block text-xs">
            {edition.total > 0 ? `Gabarito cadastrado: ${edition.total} questões` : edition.hasGabaritoFile ? 'Sem gabarito digital (há PDF do gabarito)' : 'Sem gabarito e sem PDF'}
          </span>
        </span>
        {edition.total > 0 ? <CheckCircle2 className="text-success size-5" aria-hidden /> : <AlertTriangle className="text-subtle size-5" aria-hidden />}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={read} disabled={pending || !edition.hasGabaritoFile}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <FileSearch aria-hidden />} Ler do PDF do gabarito
            </Button>
            {edition.total > 0 && (
              <Button type="button" variant="ghost" onClick={remove} disabled={pending}>
                <Trash2 aria-hidden /> Apagar gabarito
              </Button>
            )}
          </div>

          <label className="block">
            <span className="text-muted mb-1 block text-xs font-semibold">Respostas (ex.: 1-A 2-C 3-anulada)</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="border-border bg-surface-2 w-full rounded-xl border p-3 font-mono text-xs" placeholder="1-A 2-C 3-B ..." />
          </label>

          <label className="block">
            <span className="text-muted mb-1 block text-xs font-semibold">Áreas por faixa de questões (opcional)</span>
            <input value={areas} onChange={(e) => setAreas(e.target.value)} className="border-border bg-surface-2 h-11 w-full rounded-xl border px-3 text-sm" placeholder="1-45 Linguagens, 46-90 Ciências Humanas" />
          </label>
          <div className="flex flex-wrap gap-2">
            {AREA_PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => setAreas(p.text)} className="bg-surface-2 text-muted hover:text-text rounded-full px-3 py-1.5 text-xs font-semibold">
                {p.label}
              </button>
            ))}
          </div>

          <Button type="button" onClick={save} disabled={pending || !text.trim()}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Salvar gabarito
          </Button>

          {note && (
            <p role={note.kind === 'error' ? 'alert' : 'status'} className={note.kind === 'error' ? 'text-danger' : note.kind === 'ok' ? 'text-success' : 'text-muted'}>
              {note.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
