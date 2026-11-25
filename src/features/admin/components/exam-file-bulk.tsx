'use client';

import { useRef, useState, useTransition } from 'react';
import { CheckCircle2, FileUp, Loader2, Sparkles, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { EXAM_NAMES, EXAM_SLUGS, variantFromLabel, type ExamSlug } from '@/features/vestibular/lib/classify-file';
import { classifyUploadedFile, readUploadedKey, registerClassifiedFiles } from '../server/exam-file-bulk-actions';

type Status = 'uploading' | 'reading' | 'ready' | 'error' | 'saved';

interface Row {
  id: string;
  name: string;
  status: Status;
  path: string;
  exam: ExamSlug | '';
  year: string;
  kind: 'caderno' | 'gabarito';
  label: string;
  confidence: 'alta' | 'media' | 'baixa' | null;
  note: string | null;
  /** Só gabarito: caderno (dia + cor), respostas lidas e áreas. */
  variant: string;
  answers: string;
  areas: string;
  keyNote: string | null;
}

const MAX_FILES = 40;
const MAX_MB = 50;
const CONCURRENCY = 3;
const field = 'border-border bg-bg h-10 rounded-lg border px-2 text-sm';

const STATUS_TEXT: Record<Status, string> = { uploading: 'Enviando…', reading: 'Lendo a capa…', ready: 'Confira', error: 'Erro', saved: 'Cadastrado' };

/**
 * Envio em massa: o administrador solta vários PDFs (cadernos e gabaritos) de uma vez. Cada um sobe para o Nexa, a IA lê a
 * capa e preenche vestibular, ano, tipo, dia/fase, caderno e cor. Nada é cadastrado antes da conferência.
 */
export function ExamFileBulk() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const patch = (id: string, p: Partial<Row>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));

  async function handle(file: File, id: string) {
    const supabase = createClient();
    const path = `provas/${new Date().getFullYear()}/${crypto.randomUUID()}.pdf`;
    const { error } = await supabase.storage.from('nexa-content').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: 'application/pdf' });
    if (error) {
      patch(id, { status: 'error', note: /policy|denied|unauthorized/i.test(error.message) ? 'O Storage recusou o envio (permissão de administrador).' : error.message });
      return;
    }
    patch(id, { status: 'reading', path });
    try {
      const r = await classifyUploadedFile(path, file.name);
      if (!r.ok) return patch(id, { status: 'error', note: r.message });
      const c = r.classification;
      patch(id, { status: 'ready', exam: c.exam ?? '', year: c.year ? String(c.year) : '', kind: c.kind, label: c.label, confidence: c.confidence, note: r.note, variant: variantFromLabel(c.label) });
      if (c.kind === 'gabarito') await readKey(id, path);
    } catch {
      patch(id, { status: 'error', note: 'Não consegui ler a capa agora. Tente de novo.' });
    }
  }

  async function readKey(id: string, path: string) {
    patch(id, { keyNote: 'Lendo as respostas…' });
    try {
      const k = await readUploadedKey(path);
      if (!k.ok) return patch(id, { keyNote: k.message, answers: '' });
      patch(id, {
        answers: k.text,
        areas: k.areas,
        keyNote: `${k.count} respostas lidas (questões ${k.first} a ${k.last}, ${k.source}).${k.missing.length ? ` Faltam: ${k.missing.slice(0, 10).join(', ')}.` : ''}`,
      });
    } catch {
      patch(id, { keyNote: 'Não consegui ler as respostas agora.', answers: '' });
    }
  }

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setMessage(null);
    const files = [...list].filter((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf');
    const skipped = list.length - files.length;
    const tooBig = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const ok = files.filter((f) => f.size <= MAX_MB * 1024 * 1024).slice(0, MAX_FILES);
    if (skipped || tooBig.length || files.length > MAX_FILES) {
      setMessage(`${skipped ? `${skipped} arquivo(s) não são PDF. ` : ''}${tooBig.length ? `${tooBig.length} passam de ${MAX_MB} MB. ` : ''}${files.length > MAX_FILES ? `Máximo de ${MAX_FILES} por vez. ` : ''}Os demais foram enviados.`);
    }
    const created: { row: Row; file: File }[] = ok.map((file) => ({
      file,
      row: { id: crypto.randomUUID(), name: file.name, status: 'uploading', path: '', exam: '', year: '', kind: 'caderno', label: '', confidence: null, note: null, variant: '', answers: '', areas: '', keyNote: null },
    }));
    setRows((all) => [...all, ...created.map((c) => c.row)]);
    setBusy(true);
    const queue = [...created];
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) await handle(next.file, next.row.id);
      }),
    );
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  const ready = rows.filter((r) => r.status === 'ready');
  const incomplete = (r: Row) => !r.exam || !/^\d{4}$/.test(r.year) || r.label.trim().length < 2;

  function saveAll() {
    setMessage(null);
    const items = ready
      .filter((r) => !incomplete(r))
      .map((r) => ({ path: r.path, exam: r.exam, year: Number(r.year), kind: r.kind, label: r.label.trim(), ...(r.kind === 'gabarito' ? { variant: r.variant.trim(), answers: r.answers, areas: r.areas } : {}) }));
    if (items.length === 0) return setMessage('Complete a prova, o ano e o nome dos arquivos marcados.');
    startSave(async () => {
      const results = await registerClassifiedFiles(items);
      setRows((all) => all.map((r) => {
        const res = results.find((x) => x.path === r.path);
        return res ? (res.ok ? { ...r, status: 'saved', note: res.message } : { ...r, note: res.message }) : r;
      }));
      const okCount = results.filter((r) => r.ok).length;
      setMessage(`${okCount} de ${items.length} arquivos cadastrados.${okCount < items.length ? ' Veja a observação nos que falharam.' : ''}`);
    });
  }

  return (
    <section className="border-border bg-surface space-y-3 rounded-2xl border p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Sparkles className="text-brand size-5" aria-hidden /> Enviar vários de uma vez (a IA classifica)
      </h2>
      <p className="text-muted text-xs">
        Escolha vários PDFs de cadernos e gabaritos. A IA lê a capa e preenche a prova, o ano, o dia/fase, o caderno e a cor. Você confere e cadastra tudo com um toque.
      </p>
      <input ref={input} type="file" multiple accept="application/pdf" className="sr-only" id="bulk-exam-files" onChange={(e) => void onPick(e.target.files)} />
      <Button type="button" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />} Escolher PDFs
      </Button>

      {rows.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((r) => (
            <li key={r.id} className="space-y-2 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                <span className={`flex items-center gap-1 text-xs font-semibold ${r.status === 'error' ? 'text-danger' : r.status === 'saved' ? 'text-success' : 'text-muted'}`}>
                  {r.status === 'uploading' || r.status === 'reading' ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : r.status === 'saved' ? <CheckCircle2 className="size-3.5" aria-hidden /> : r.status === 'error' ? <XCircle className="size-3.5" aria-hidden /> : null}
                  {STATUS_TEXT[r.status]}
                </span>
              </div>
              {(r.status === 'ready' || r.status === 'saved') && (
                <div className="grid gap-2 sm:grid-cols-[8rem_5rem_9rem_1fr]">
                  <select aria-label="Prova" value={r.exam} disabled={r.status === 'saved'} onChange={(e) => patch(r.id, { exam: e.target.value as ExamSlug | '' })} className={field}>
                    <option value="">Prova?</option>
                    {EXAM_SLUGS.map((s) => (
                      <option key={s} value={s}>
                        {EXAM_NAMES[s]}
                      </option>
                    ))}
                  </select>
                  <input aria-label="Ano" inputMode="numeric" maxLength={4} placeholder="Ano" value={r.year} disabled={r.status === 'saved'} onChange={(e) => patch(r.id, { year: e.target.value.replace(/\D/g, '') })} className={field} />
                  <select aria-label="Tipo" value={r.kind} disabled={r.status === 'saved'} onChange={(e) => patch(r.id, { kind: e.target.value as 'caderno' | 'gabarito' })} className={field}>
                    <option value="caderno">Caderno</option>
                    <option value="gabarito">Gabarito</option>
                  </select>
                  <input aria-label="Nome" maxLength={160} value={r.label} disabled={r.status === 'saved'} onChange={(e) => patch(r.id, { label: e.target.value })} className={field} />
                </div>
              )}
              {r.kind === 'gabarito' && (r.status === 'ready' || r.status === 'saved') && (
                <div className="space-y-1.5">
                  <label className="block text-xs">
                    <span className="text-muted font-semibold">Caderno (dia + cor) deste gabarito — é o que liga ao caderno de questões</span>
                    <input value={r.variant} disabled={r.status === 'saved'} maxLength={60} onChange={(e) => patch(r.id, { variant: e.target.value })} placeholder="1º dia · Azul" className={`${field} mt-1 w-full`} />
                  </label>
                  {r.keyNote && <p className={`text-xs ${r.answers ? 'text-muted' : 'text-danger'}`}>{r.keyNote}</p>}
                  {!r.answers && r.status === 'ready' && (
                    <button type="button" onClick={() => void readKey(r.id, r.path)} className="border-border rounded-full border px-3 py-1.5 text-xs font-semibold">
                      Ler as respostas de novo
                    </button>
                  )}
                </div>
              )}
              {r.confidence === 'baixa' && r.status === 'ready' && <p className="text-warning text-xs">Confiança baixa: confira com atenção.</p>}
              {r.note && <p className={`text-xs ${r.status === 'error' ? 'text-danger' : 'text-muted'}`}>{r.note}</p>}
            </li>
          ))}
        </ul>
      )}

      {ready.length > 0 && (
        <Button type="button" onClick={saveAll} disabled={saving || busy}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />} Cadastrar {ready.length} {ready.length === 1 ? 'arquivo' : 'arquivos'}
        </Button>
      )}
      {message && (
        <p role="status" className="text-muted text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
