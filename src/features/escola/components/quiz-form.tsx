'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { draftQuiz, saveQuiz, type DraftQuestion, type DraftState, type SaveState } from '../server/content-actions';

const field = 'border-border bg-surface-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-brand';
const ISave: SaveState = { status: 'idle' };
const IDraft: DraftState<{ title: string; questions: DraftQuestion[] }> = { status: 'idle' };

/** Simulado por IA: gera, a pessoa revisa cada questão (texto, alternativas, resposta certa) e só então salva. */
export function QuizForm({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [draft, ask, drafting] = useActionState(draftQuiz, IDraft);
  const [saved, save, saving] = useActionState(saveQuiz, ISave);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  useEffect(() => {
    if (draft.status === 'ok') {
      setQuestions(draft.questions);
      setTitle(draft.title);
    }
  }, [draft]);

  const patch = (i: number, fn: (q: DraftQuestion) => DraftQuestion) => setQuestions((qs) => qs.map((q, j) => (j === i ? fn(q) : q)));

  return (
    <div className="space-y-6">
      <form action={ask} className="bg-brand-soft grid gap-2 rounded-3xl p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_110px_130px_auto]">
        <select name="subjectId" required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Matéria" className="border-border bg-surface h-11 rounded-full border px-4 text-sm">
          <option value="" disabled>Matéria…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input name="topic" required maxLength={160} placeholder="Tema (ex.: Equação do 2º grau)" className="border-border bg-surface h-11 rounded-full border px-4 text-sm" />
        <select name="count" defaultValue="5" aria-label="Questões" className="border-border bg-surface h-11 rounded-full border px-4 text-sm">
          {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} questões</option>)}
        </select>
        <select name="difficulty" defaultValue="medio" aria-label="Dificuldade" className="border-border bg-surface h-11 rounded-full border px-4 text-sm">
          <option value="facil">Fácil</option>
          <option value="medio">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        <button type="submit" disabled={drafting} className="bg-brand text-brand-fg inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
          {drafting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />} Gerar
        </button>
        {draft.status === 'error' && <p role="alert" className="text-danger text-sm sm:col-span-full">{draft.message}</p>}
      </form>

      {questions.length > 0 && (
        <form action={save} className="space-y-4">
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="questions" value={JSON.stringify(questions)} />
          <input name="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título" className={cn(field, 'text-base font-semibold')} />

          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={i} className="bg-surface-2 rounded-3xl p-4">
                <div className="mb-2 flex items-start gap-2">
                  <span className="bg-brand text-brand-fg grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold">{i + 1}</span>
                  <textarea value={q.statement} onChange={(e) => patch(i, (x) => ({ ...x, statement: e.target.value }))} rows={2} aria-label={`Enunciado da questão ${i + 1}`} className={cn(field, 'bg-surface')} />
                  <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} aria-label={`Remover a questão ${i + 1}`} className="text-muted hover:text-danger grid size-9 shrink-0 place-items-center">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <ul className="space-y-1.5 pl-9">
                  {q.options.map((o) => (
                    <li key={o.key} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correctKey === o.key} onChange={() => patch(i, (x) => ({ ...x, correctKey: o.key }))} aria-label={`Alternativa ${o.key} é a correta`} className="size-4 shrink-0" />
                      <span className="text-muted w-5 shrink-0 text-xs font-semibold">{o.key}</span>
                      <input value={o.text} onChange={(e) => patch(i, (x) => ({ ...x, options: x.options.map((p) => (p.key === o.key ? { ...p, text: e.target.value } : p)) }))} aria-label={`Texto da alternativa ${o.key}`} className="border-border bg-surface h-10 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none" />
                    </li>
                  ))}
                </ul>
                {q.explanation && <p className="text-muted mt-2 pl-9 text-xs">Explicação: {q.explanation}</p>}
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <select name="kind" defaultValue="quiz" aria-label="Formato" className="border-border bg-surface-2 h-10 rounded-full border px-3 text-sm">
                <option value="quiz">Quiz (corrige na hora)</option>
                <option value="simulado">Simulado (corrige no fim)</option>
              </select>
              <input type="hidden" name="difficulty" value="medio" />
              <label className="text-muted flex items-center gap-2"><input type="checkbox" name="publish" className="size-4" /> Publicar</label>
            </div>
            <button type="submit" disabled={saving} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Salvar simulado
            </button>
          </div>
          {saved.status === 'error' && <p role="alert" className="text-danger text-sm">{saved.message}</p>}
          {saved.status === 'saved' && <p className="text-success text-sm">Salvo. <Link href="/escola/conteudo" className="font-semibold underline">Voltar à lista</Link></p>}
        </form>
      )}
    </div>
  );
}
