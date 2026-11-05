'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Loader2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuestionAssets } from './question-assets';
import { saveEssayDraft, submitEssay, type EssayDraft } from '../server/actions';
import type { StudyWritingTask } from '../server/queries';
import type { ExamAsset } from '@/types/simulado';

/**
 * Produção de texto: tema, textos motivadores (mesmo sistema de recursos das
 * questões), orientações e um editor com autosave.
 *
 * Não corrige nada aqui — a nota é manual, depois da entrega (seção 16/20 do
 * pedido). O editor trava assim que `submitEssay` confirma: reabrir e mudar
 * o texto depois de entregue não é "revisão", é uma segunda tentativa que a
 * prova não deveria permitir.
 */
export function WritingTaskRunner({
  attemptId,
  task,
  draft,
  assets,
  onDone,
}: {
  attemptId: string;
  task: StudyWritingTask;
  draft: EssayDraft | undefined;
  assets: ExamAsset[];
  onDone: () => void;
}) {
  const [content, setContent] = useState(draft?.content ?? '');
  const [wordCount, setWordCount] = useState(draft?.wordCount ?? 0);
  const [submitted, setSubmitted] = useState(draft?.isSubmitted ?? false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (submitted) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const words = await saveEssayDraft(attemptId, task.id, content);
        if (words !== null) {
          setWordCount(words);
          setSavedAt(Date.now());
        }
      });
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reagenda quando o TEXTO muda, não a cada render
  }, [content, submitted]);

  function handleSubmit() {
    startTransition(async () => {
      const ok = await submitEssay(attemptId, task.id);
      if (ok) setSubmitted(true);
    });
  }

  const belowMin = task.minWords !== null && wordCount < task.minWords;
  const aboveMax = task.maxWords !== null && wordCount > task.maxWords;
  const range =
    task.minWords !== null || task.maxWords !== null
      ? ` · ${task.minWords ?? 0}${task.maxWords ? `–${task.maxWords}` : '+'} palavras`
      : '';

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-5 pb-32">
      <div>
        <p className="text-brand-text flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <PenLine className="size-3.5" aria-hidden />
          Produção de texto
        </p>
        <h1 className="mt-1 text-lg font-semibold">{task.title}</h1>
        {task.theme && <p className="text-muted mt-1 text-sm">Tema: {task.theme}</p>}
        {task.genre && <p className="text-subtle text-xs">Gênero: {task.genre.replace(/_/g, ' ')}</p>}
      </div>

      <QuestionAssets refs={task.resourceRefs} assets={assets} />

      <div className="border-border bg-surface rounded-lg border p-4">
        <p className="text-sm leading-relaxed">{task.prompt}</p>
      </div>

      {task.instructions.length > 0 && (
        <div className="border-border bg-surface rounded-lg border p-4">
          <p className="text-sm font-semibold">Orientações</p>
          <ul className="text-muted mt-2 list-disc space-y-1 pl-5 text-sm">
            {task.instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className={cn('font-medium', belowMin || aboveMax ? 'text-warning' : 'text-muted')}>
            {wordCount} palavra{wordCount === 1 ? '' : 's'}
            {range}
          </span>
          <span className="text-subtle" role="status">
            {submitted ? 'Entregue' : pending ? 'Salvando…' : savedAt ? 'Rascunho salvo' : ''}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => !submitted && setContent(e.target.value)}
          readOnly={submitted}
          rows={16}
          aria-label="Editor da redação"
          placeholder="Escreva sua redação aqui..."
          className={cn(
            'border-border bg-surface focus:border-brand w-full resize-y rounded-lg border p-4 text-sm leading-relaxed focus:outline-none',
            submitted && 'bg-surface-2 text-muted',
          )}
        />
      </div>

      {!submitted ? (
        <div className="pb-safe border-border bg-bg/90 fixed inset-x-0 bottom-[calc(4.25rem_+_env(safe-area-inset-bottom))] z-40 border-t px-5 py-3 backdrop-blur-lg md:bottom-0">
          <div className="mx-auto max-w-2xl">
            <Button size="lg" className="w-full" onClick={handleSubmit} disabled={pending || !content.trim()}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Entregar redação
            </Button>
          </div>
        </div>
      ) : (
        <Button size="lg" className="w-full" onClick={onDone}>
          Continuar
        </Button>
      )}
    </div>
  );
}
