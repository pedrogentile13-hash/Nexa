'use client';

import { useRef, useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, FileSearch, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AREA_PRESETS } from '@/features/vestibular/lib/answer-sheet';
import { deleteAnswerKey, previewAnswerKey, previewAnswerKeyUpload, saveAnswerKey } from '../server/answer-key-actions';

export interface KeyEdition {
  id: string;
  label: string;
  /** Arquivos de gabarito já cadastrados na edição (para ler daqui). */
  gabaritoFiles: { id: string; label: string }[];
  /** Cadernos (cores) que já têm gabarito digital. `name` vazio = gabarito único. */
  variants: { name: string; total: number }[];
}

const SUGGESTIONS = ['Azul', 'Amarelo', 'Branco', 'Rosa', 'Verde', 'Cinza'];

/** Cadastro do gabarito oficial por edição E por caderno (cor): lê de um PDF (do site ou enviado), confere e salva. */
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
  const [variant, setVariant] = useState('');
  const [fileId, setFileId] = useState(edition.gabaritoFiles[0]?.id ?? '');
  const [text, setText] = useState('');
  const [areas, setAreas] = useState('');
  const [note, setNote] = useState<{ kind: 'ok' | 'error' | 'info'; message: string } | null>(null);
  const [pending, start] = useTransition();
  const upload = useRef<HTMLInputElement>(null);

  const done = edition.variants.length;
  const listId = `cadernos-${edition.id}`;

  function applyPreview(r: Awaited<ReturnType<typeof previewAnswerKey>>) {
    if (!r.ok) return setNote({ kind: 'error', message: r.message });
    setText(r.text);
    setNote({
      kind: r.missing.length ? 'error' : 'info',
      message: `Li ${r.count} respostas (${r.source}).${r.missing.length ? ` Faltam: ${r.missing.slice(0, 12).join(', ')}.` : ' Confira, diga qual é o caderno e salve.'}`,
    });
  }

  function pickFile(id: string) {
    setFileId(id);
    // O nome do arquivo costuma trazer a cor ("1º dia · Caderno 2 · Amarelo"): já sugere como nome do caderno.
    const label = edition.gabaritoFiles.find((f) => f.id === id)?.label ?? '';
    if (label && !variant) setVariant(label);
  }

  function read() {
    setNote(null);
    start(async () => applyPreview(await previewAnswerKey(edition.id, fileId || undefined)));
  }

  function readUpload(file: File | undefined) {
    if (!file) return;
    setNote(null);
    const body = new FormData();
    body.set('file', file);
    start(async () => {
      applyPreview(await previewAnswerKeyUpload(body));
      if (upload.current) upload.current.value = '';
    });
  }

  function save() {
    setNote(null);
    start(async () => {
      const r = await saveAnswerKey(edition.id, variant, text, areas);
      setNote({ kind: r.ok ? 'ok' : 'error', message: r.message });
    });
  }

  function remove(name: string) {
    if (!window.confirm(`Apagar o gabarito${name ? ` do caderno ${name}` : ''}? Os resultados já enviados ficam guardados.`)) return;
    start(async () => {
      const r = await deleteAnswerKey(edition.id, name);
      setNote({ kind: r.ok ? 'ok' : 'error', message: r.message });
    });
  }

  return (
    <section className="border-border bg-surface rounded-2xl border p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left" aria-expanded={open}>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{edition.label}</span>
          <span className="text-muted block text-xs">
            {done > 0 ? `${done} ${done === 1 ? 'gabarito cadastrado' : 'cadernos com gabarito'}` : edition.gabaritoFiles.length > 0 ? 'Sem gabarito digital (há PDF do gabarito)' : 'Sem gabarito e sem PDF'}
          </span>
        </span>
        {done > 0 ? <CheckCircle2 className="text-success size-5" aria-hidden /> : <AlertTriangle className="text-subtle size-5" aria-hidden />}
      </button>

      {open && (
        <div className="mt-4 space-y-4 text-sm">
          {done > 0 && (
            <ul className="divide-y divide-[var(--color-border)]">
              {edition.variants.map((v) => (
                <li key={v.name || 'unico'} className="flex items-center gap-3 py-2">
                  <button type="button" className="min-w-0 flex-1 text-left font-medium" onClick={() => setVariant(v.name)} title="Editar este caderno">
                    {v.name || 'Gabarito único'} <span className="text-muted text-xs font-normal">· {v.total} questões</span>
                  </button>
                  <Button type="button" variant="ghost" onClick={() => remove(v.name)} disabled={pending} aria-label={`Apagar ${v.name || 'gabarito único'}`}>
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <label className="block">
            <span className="text-muted mb-1 block text-xs font-semibold">Caderno (cor) deste gabarito — deixe vazio se a prova tem um gabarito só</span>
            <input
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              list={listId}
              maxLength={60}
              placeholder="Ex.: 1º dia · Azul"
              className="border-border bg-surface-2 h-11 w-full rounded-xl border px-3 text-sm"
            />
            <datalist id={listId}>
              {[...edition.gabaritoFiles.map((f) => f.label), ...SUGGESTIONS].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <div className="border-border space-y-2 rounded-xl border p-3">
            <p className="text-muted text-xs font-semibold">De onde ler as respostas</p>
            {edition.gabaritoFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <select value={fileId} onChange={(e) => pickFile(e.target.value)} aria-label="Arquivo de gabarito cadastrado" className="border-border bg-surface-2 h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm">
                  {edition.gabaritoFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={read} disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : <FileSearch aria-hidden />} Ler do site
                </Button>
              </div>
            )}
            <input ref={upload} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" id={`up-${edition.id}`} onChange={(e) => readUpload(e.target.files?.[0])} />
            <Button type="button" variant="secondary" onClick={() => upload.current?.click()} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />} Enviar PDF do gabarito
            </Button>
            <p className="text-subtle text-xs">Se o site oficial não abrir, baixe o PDF do gabarito do caderno e envie aqui: o Nexa lê as respostas do arquivo.</p>
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
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Salvar gabarito{variant.trim() ? ` do caderno ${variant.trim()}` : ''}
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
