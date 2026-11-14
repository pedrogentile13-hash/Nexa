'use client';

import { useActionState, useState, useTransition } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { MediaUpload } from './media-upload';
import { ExamFileBulk } from './exam-file-bulk';
import { addExamFile, deleteExamFile, testExamFile, toggleExamFile, type FileState, type TestResult } from '../server/exam-file-actions';

export interface FileItem {
  id: string;
  kind: string;
  label: string;
  url: string;
  published: boolean;
}
export interface EditionFiles {
  id: string;
  title: string;
  files: FileItem[];
}

const field = 'border-border bg-bg w-full rounded-xl border px-3 py-2 text-sm';

function TestButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<TestResult | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await testExamFile(id)))}
        className="border-border rounded-full border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
      >
        {pending ? <Loader2 className="inline size-3 animate-spin" aria-hidden /> : null} Testar
      </button>
      {result && (
        <span role="status" className={`flex max-w-xs items-start gap-1 text-xs ${result.ok ? 'text-success' : 'text-danger'}`}>
          {result.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
          {result.message}
        </span>
      )}
    </span>
  );
}

export function ExamFileManager({ editions }: { editions: EditionFiles[] }) {
  const [state, action, pending] = useActionState<FileState, FormData>(addExamFile, { status: 'idle' });
  return (
    <div className="space-y-6">
      <ExamFileBulk />
      <form action={action} className="border-border bg-surface space-y-3 rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Cadastrar caderno ou gabarito</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            Prova
            <select name="editionId" required className={field} defaultValue="">
              <option value="" disabled>
                Escolha…
              </option>
              {editions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Tipo
            <select name="kind" className={field} defaultValue="caderno">
              <option value="caderno">Caderno de questões</option>
              <option value="gabarito">Gabarito</option>
            </select>
          </label>
          <label className="text-sm">
            Nome
            <input name="label" required maxLength={160} placeholder="1º dia · Caderno 1" className={field} />
          </label>
        </div>
        <label className="block text-sm">
          Endereço do PDF (link direto, começa com https://)
          <input name="url" placeholder="https://download.inep.gov.br/…pdf" className={field} />
        </label>
        <p className="text-muted text-xs">
          Se o site oficial bloquear o Nexa ou o link não funcionar, baixe o PDF no seu celular/computador e envie aqui — ele passa a ser aberto direto do Nexa.
        </p>
        <MediaUpload name="path" accept="application/pdf" label="Ou envie o PDF" hint="até 500 MB" />
        {state.status !== 'idle' && (
          <p role="status" className={state.status === 'ok' ? 'text-success text-sm' : 'text-danger text-sm'}>
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Salvar arquivo
        </button>
      </form>

      {editions.map((e) => (
        <section key={e.id}>
          <h2 className="text-base font-semibold">
            {e.title} <span className="text-muted text-sm font-normal">({e.files.length})</span>
          </h2>
          {e.files.length === 0 ? (
            <p className="text-muted mt-1 text-sm">Nenhum arquivo cadastrado.</p>
          ) : (
            <ul className="mt-1 divide-y divide-[var(--color-border)] text-sm">
              {e.files.map((f) => (
                <li key={f.id} className="flex flex-wrap items-start gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {f.label} <span className="text-muted text-xs">· {f.kind}{f.published ? '' : ' · oculto'}</span>
                    </span>
                    <span className="text-muted block truncate text-xs">{f.url}</span>
                  </span>
                  <TestButton id={f.id} />
                  <form action={toggleExamFile}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="publish" value={f.published ? '0' : '1'} />
                    <button className="border-border rounded-full border px-3 py-1.5 text-xs font-semibold">{f.published ? 'Ocultar' : 'Mostrar'}</button>
                  </form>
                  <form action={deleteExamFile}>
                    <input type="hidden" name="id" value={f.id} />
                    <button className="text-danger rounded-full px-3 py-1.5 text-xs font-semibold">Excluir</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
