'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { draftSummary, saveSummary, type DraftState, type SaveState } from '../server/content-actions';

const field = 'border-border bg-surface-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-brand';
const ISave: SaveState = { status: 'idle' };
const IDraft: DraftState<{ markdown: string }> = { status: 'idle' };

export function SummaryForm({
  subjects,
  initial,
}: {
  subjects: { id: string; name: string }[];
  initial?: { id: string; subjectId: string; title: string; body: string; published: boolean };
}) {
  const [saved, save, saving] = useActionState(saveSummary, ISave);
  const [draft, ask, drafting] = useActionState(draftSummary, IDraft);
  const [body, setBody] = useState(initial?.body ?? '');
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? '');

  useEffect(() => {
    if (draft.status === 'ok') setBody(draft.markdown);
  }, [draft]);

  return (
    <div className="space-y-5">
      {/* A IA escreve o rascunho; quem decide o que fica é o professor. */}
      <form action={ask} className="bg-brand-soft flex flex-col gap-2 rounded-3xl p-4 sm:flex-row sm:items-center">
        <input type="hidden" name="subjectId" value={subjectId} />
        <label className="sr-only" htmlFor="topic">Tema para a IA</label>
        <input id="topic" name="topic" maxLength={160} placeholder="Peça à IA um rascunho: tema do resumo (ex.: Revolução Francesa)" className="border-border bg-surface h-11 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none" />
        <button type="submit" disabled={drafting || !subjectId} className="bg-brand text-brand-fg inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-50">
          {drafting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Escrever com a IA
        </button>
        {draft.status === 'error' && <p role="alert" className="text-danger text-sm sm:basis-full">{draft.message}</p>}
        {!subjectId && <p className="text-brand-text text-xs sm:basis-full">Escolha a matéria abaixo primeiro.</p>}
      </form>

      <form action={save} className="space-y-3">
        {initial && <input type="hidden" name="id" value={initial.id} />}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <select name="subjectId" required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Matéria" className={field}>
            <option value="" disabled>Matéria…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input name="title" required maxLength={200} defaultValue={initial?.title} placeholder="Título do resumo" className={field} />
        </div>
        <textarea name="body" required rows={16} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'Escreva o resumo. Dá para usar # títulos, **negrito** e listas com -.'} className={`${field} font-mono`} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-muted flex items-center gap-2 text-sm">
            <input type="checkbox" name="publish" defaultChecked={initial?.published} className="size-4" />
            Publicar para os alunos (avisa quem cursa a matéria)
          </label>
          <button type="submit" disabled={saving} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Salvar
          </button>
        </div>
        {saved.status === 'error' && <p role="alert" className="text-danger text-sm">{saved.message}</p>}
        {saved.status === 'saved' && (
          <p className="text-success text-sm">
            Salvo. <Link href="/escola/conteudo" className="font-semibold underline">Voltar à lista</Link>
          </p>
        )}
      </form>
    </div>
  );
}
