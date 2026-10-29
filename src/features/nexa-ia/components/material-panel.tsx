'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { FileText, ImageIcon, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/features/study/components/markdown';
import {
  addStudyDocuments,
  askAboutDocument,
  createQuizFromDocument,
  createSummaryFromDocument,
  deleteStudyDocument,
  type AskState,
  type CreateFromDocState,
  type MaterialState,
} from '../server/material-actions';
import type { StudyDocumentSummary } from '../server/material-queries';

const IDLE_MATERIAL: MaterialState = { status: 'idle' };
const IDLE_ASK: AskState = { status: 'idle' };
const IDLE_CREATE: CreateFromDocState = { status: 'idle' };

function Submit({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

const fieldClass =
  'border-border bg-surface text-text w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-brand';

export function MaterialPanel({
  documents,
  subjects,
}: {
  documents: StudyDocumentSummary[];
  subjects: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(addStudyDocuments, IDLE_MATERIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => {
    if (state.status === 'ok') {
      formRef.current?.reset();
      setPicked([]);
    }
  }, [state]);
  const [open, setOpen] = useState<string | null>(documents[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="border-border bg-surface rounded-2xl border p-4">
        <h2 className="text-sm font-semibold">Leitor de estudos</h2>
        <p className="text-muted mt-1 text-xs">
          Envie um PDF, foto de caderno ou cole um texto. A NexaAI lê, responde dúvidas e cria resumo e simulado só com o que está no seu
          material. O que ela cria fica privado, na sua Biblioteca.
        </p>
        <form
          ref={formRef}
          action={action}
          className="mt-3 space-y-3"
        >
          <label className="border-border hover:border-brand flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-5 text-sm">
            <Upload className="size-4" aria-hidden />
            <span className="min-w-0 truncate">
              {picked.length > 0 ? `✓ ${picked.join(', ')}` : 'Toque para escolher PDF, imagem ou texto (até 3 arquivos, 6 MB cada)'}
            </span>
            <input
              type="file"
              name="files"
              multiple
              accept="application/pdf,image/png,image/jpeg,image/webp,image/heic,text/plain,text/markdown"
              className="sr-only"
              onChange={(e) => setPicked(Array.from(e.target.files ?? []).map((f) => f.name))}
            />
          </label>
          <input name="title" placeholder="Título (se for colar um texto)" maxLength={160} className={fieldClass} />
          <textarea name="text" rows={4} placeholder="…ou cole aqui o texto que quer estudar" className={fieldClass} />
          <Submit>Adicionar material</Submit>
          {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
          {state.status === 'ok' && <p className="text-success text-sm">{state.message}</p>}
        </form>
      </section>

      {documents.length === 0 ? (
        <p className="text-muted text-center text-sm">Nenhum material ainda.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((d) => (
            <DocumentCard key={d.id} doc={d} subjects={subjects} expanded={open === d.id} onToggle={() => setOpen(open === d.id ? null : d.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  subjects,
  expanded,
  onToggle,
}: {
  doc: StudyDocumentSummary;
  subjects: { id: string; name: string }[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = doc.sourceKind === 'image' ? ImageIcon : FileText;
  const [ask, askAction] = useActionState(askAboutDocument, IDLE_ASK);
  const [summary, summaryAction] = useActionState(createSummaryFromDocument, IDLE_CREATE);
  const [quiz, quizAction] = useActionState(createQuizFromDocument, IDLE_CREATE);

  return (
    <li className="border-border bg-surface rounded-2xl border">
      <div className="flex items-center gap-3 p-3.5">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{doc.title}</span>
            <span className="text-muted block text-xs">
              {doc.pages ? `${doc.pages} págs · ` : ''}
              {Math.max(1, Math.round(doc.chars / 1000))} mil caracteres
            </span>
          </span>
        </button>
        <form action={deleteStudyDocument}>
          <input type="hidden" name="id" value={doc.id} />
          <button type="submit" aria-label="Apagar material" className="text-muted hover:text-danger grid size-9 place-items-center rounded-full">
            <Trash2 className="size-4" aria-hidden />
          </button>
        </form>
      </div>

      {expanded && (
        <div className="border-border space-y-4 border-t p-3.5">
          <form action={askAction} className="space-y-2">
            <input type="hidden" name="documentId" value={doc.id} />
            <label className="text-xs font-semibold">Tire uma dúvida sobre este material</label>
            <div className="flex gap-2">
              <input name="question" placeholder="Ex.: o que é fotossíntese segundo o texto?" maxLength={600} className={fieldClass} />
              <Submit>
                <Sparkles className="size-4" aria-hidden />
                Perguntar
              </Submit>
            </div>
            {ask.status === 'error' && <p className="text-danger text-sm">{ask.message}</p>}
            {ask.status === 'ok' && (
              <div className="bg-brand-soft rounded-xl px-3.5 py-3 text-sm">
                <Markdown source={ask.answer} />
              </div>
            )}
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            <form action={summaryAction} className="border-border space-y-2 rounded-xl border p-3">
              <input type="hidden" name="documentId" value={doc.id} />
              <p className="text-xs font-semibold">Criar resumo</p>
              <SubjectSelect subjects={subjects} />
              <Submit className="w-full">Gerar resumo</Submit>
              {summary.status === 'error' && <p className="text-danger text-xs">{summary.message}</p>}
              {summary.status === 'ok' && <p className="text-success text-xs">Resumo salvo em &quot;Meus conteúdos&quot;.</p>}
            </form>

            <form action={quizAction} className="border-border space-y-2 rounded-xl border p-3">
              <input type="hidden" name="documentId" value={doc.id} />
              <p className="text-xs font-semibold">Criar simulado</p>
              <SubjectSelect subjects={subjects} />
              <div className="flex gap-2">
                <select name="count" defaultValue="5" className={fieldClass} aria-label="Número de questões">
                  {[3, 5, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} questões
                    </option>
                  ))}
                </select>
                <select name="difficulty" defaultValue="medio" className={fieldClass} aria-label="Dificuldade">
                  <option value="facil">Fácil</option>
                  <option value="medio">Média</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
              <Submit className="w-full">Gerar simulado</Submit>
              {quiz.status === 'error' && <p className="text-danger text-xs">{quiz.message}</p>}
              {quiz.status === 'ok' && <p className="text-success text-xs">Simulado salvo em &quot;Meus conteúdos&quot;.</p>}
            </form>
          </div>
        </div>
      )}
    </li>
  );
}

function SubjectSelect({ subjects }: { subjects: { id: string; name: string }[] }) {
  return (
    <select name="subjectCatalogId" required defaultValue="" className={fieldClass} aria-label="Matéria">
      <option value="" disabled>
        Matéria…
      </option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
