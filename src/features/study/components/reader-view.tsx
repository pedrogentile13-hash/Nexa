'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Check, Highlighter, Loader2, Minus, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { StudyTopBar } from './study-top-bar';
import { RatingStars } from '@/features/community/components/rating-stars';
import { addHighlight, explainPassage, removeHighlight, saveProgress } from '../server/actions';
import { Markdown } from './markdown';
import { useContentTimeTracking } from '../hooks/use-content-time-tracking';
import type { ResourceDetail } from '../server/queries';

/**
 * Leitor de resumo.
 *
 * O progresso é medido pela ROLAGEM por padrão — é ela que faz "continuar de
 * onde parou" cair no lugar certo quando o aluno volta no dia seguinte. Mas a
 * rolagem pode não chegar a 95% (resumo curto que cabe na tela, aluno que lê
 * fora do app e só quer registrar), e desde que essa nota passou a valer 30%
 * da matéria, depender só da rolagem deixa de ser opcional — por isso o botão
 * explícito "Marcar como concluído" abaixo, mesmo padrão do leitor de PDF.
 *
 * O tamanho da fonte é ajustável e persistido no aparelho: um resumo de sete
 * minutos lido no ônibus não tem o mesmo tamanho confortável de um lido na mesa.
 */

const SIZES = ['text-[15px]', 'text-base', 'text-lg', 'text-xl'] as const;
const STORAGE_KEY = 'nexa:reader-size';
const PICKED_CLASSES = ['bg-brand-soft', 'rounded-md', 'ring-2', 'ring-brand'];

export function ReaderView({ resource }: { resource: ResourceDetail }) {
  useContentTimeTracking(resource.id);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [percent, setPercent] = useState(resource.progressPercent);
  const [selection, setSelection] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(Boolean(resource.completedAt));
  const [explain, setExplain] = useState<{
    passage: string;
    text: string | null;
    error: string | null;
    loading: boolean;
  } | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const pickedRef = useRef<HTMLElement | null>(null);
  // Modo "toque no trecho": evita a seleção nativa do Android, cujo menu
  // (Copiar / Pesquisar no Google) cobre o texto e disputa com a nossa barra.
  const [pickMode, setPickMode] = useState(false);
  const [, startTransition] = useTransition();

  const [persist] = useDebouncedCallback((value: number) => {
    if (value >= 95) setIsDone(true);
    void saveProgress(resource.id, value, null, value >= 95);
  }, 1200);

  function clearPicked() {
    pickedRef.current?.classList.remove(...PICKED_CLASSES);
    pickedRef.current = null;
  }

  function closeExplain() {
    clearPicked();
    setExplain(null);
  }

  function onBodyClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!pickMode) return;
    const block = (event.target as HTMLElement).closest<HTMLElement>('p, li, h1, h2, h3, h4, blockquote, pre');
    const text = block?.textContent?.trim() ?? '';
    if (!block || text.length < 3 || !bodyRef.current?.contains(block)) return;
    clearPicked();
    block.classList.add(...PICKED_CLASSES);
    pickedRef.current = block;
    setPickMode(false);
    askAI(text, 'normal');
  }

  function askAI(passage: string, style: 'normal' | 'simples' | 'exemplo') {
    setExplain({ passage, text: null, error: null, loading: true });
    startTransition(async () => {
      const result = await explainPassage(resource.id, passage, style);
      setExplain({
        passage,
        text: result.ok ? result.text : null,
        error: result.ok ? null : result.message,
        loading: false,
      });
    });
  }

  function onMarkDone() {
    setIsDone(true);
    setPercent(100);
    startTransition(async () => {
      await saveProgress(resource.id, 100, null, true);
    });
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSizeIndex(Math.min(SIZES.length - 1, Math.max(0, Number(stored))));
    } catch {
      // Navegador com armazenamento bloqueado: o padrão serve.
    }
  }, []);

  // `selectionchange` e não mouseup/touchend: no celular a seleção por toque
  // longo só se fecha DEPOIS do touchend (o usuário ainda arrasta as alças), e
  // ler a seleção naquele instante devolvia vazio — o botão nunca aparecia.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onSelectionChange() {
      clearTimeout(timer);
      // Espera a seleção assentar (alças ainda sendo arrastadas disparam vários eventos).
      timer = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        const inside =
          sel && sel.rangeCount > 0 && articleRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer);
        setSelection(text.length >= 3 && inside ? text : null);
      }, 250);
    }
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const total = el.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setPercent(100);
        persist(100);
        return;
      }
      const scrolled = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
      setPercent((current) => {
        // O progresso não anda para trás: rolar de volta para reler não pode
        // desfazer o que já foi lido.
        const next = Math.max(current, Math.round(scrolled));
        if (next !== current) persist(next);
        return next;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [persist]);

  function changeSize(delta: number) {
    setSizeIndex((current) => {
      const next = Math.min(SIZES.length - 1, Math.max(0, current + delta));
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Sem persistência, mas o ajuste vale para esta leitura.
      }
      return next;
    });
  }

  return (
    <div style={subjectColorVars(resource.subjectColor)}>
      <StudyTopBar
        title={resource.subjectName}
        subtitle={resource.subtitle ?? resource.topicName}
        right={
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => changeSize(-1)}
              disabled={sizeIndex === 0}
              aria-label="Diminuir a letra"
              className="text-muted hover:bg-surface-2 grid size-11 place-items-center rounded-full disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => changeSize(1)}
              disabled={sizeIndex === SIZES.length - 1}
              aria-label="Aumentar a letra"
              className="text-muted hover:bg-surface-2 grid size-11 place-items-center rounded-full disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        }
      />

      {/* Barra de leitura: dá noção de quanto falta sem ocupar linha própria. */}
      <div className="bg-surface-2 sticky top-[calc(env(safe-area-inset-top)+56px)] z-20 h-1">
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${percent}%`, backgroundColor: 'var(--subject-base)' }}
        />
      </div>

      {pickMode && (
        <div className="bg-brand text-brand-fg sticky top-[calc(env(safe-area-inset-top)+60px)] z-30 flex items-center gap-2 px-4 py-2.5 text-sm font-medium shadow-md">
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">Toque no parágrafo que você não entendeu</span>
          <button
            type="button"
            onClick={() => setPickMode(false)}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
          >
            Cancelar
          </button>
        </div>
      )}

      <article
        ref={articleRef}
        className="mx-auto max-w-2xl px-5 pt-4 pb-24"
      >
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{resource.title}</h1>
        {resource.description && (
          <p className="text-muted mt-2 text-sm leading-relaxed">{resource.description}</p>
        )}
        <div className="mt-3">
          <RatingStars resourceId={resource.id} />
        </div>

        {!explain && !pickMode && (
          <button
            type="button"
            onClick={() => setPickMode(true)}
            className="bg-brand-soft text-brand-text mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          >
            <Sparkles className="size-4" aria-hidden />
            Não entendeu algo? Peça para a IA explicar
          </button>
        )}

        <div
          ref={bodyRef}
          onClick={onBodyClick}
          className={cn(
            'mt-6 leading-relaxed',
            SIZES[sizeIndex],
            pickMode && 'cursor-pointer select-none [&_li]:rounded-md [&_li]:py-0.5 [&_p]:rounded-md',
          )}
        >
          <Markdown source={resource.body ?? ''} />
        </div>

        {resource.highlights.length > 0 && (
          <section className="border-border mt-10 border-t pt-5">
            <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Suas marcações · {resource.highlights.length}
            </h2>
            <ul className="space-y-2">
              {resource.highlights.map((highlight) => (
                <li
                  key={highlight.id}
                  className="bg-surface-2 flex items-start gap-2 rounded-md px-3 py-2"
                >
                  <p className="min-w-0 flex-1 text-sm leading-relaxed">{highlight.quote}</p>
                  <form action={removeHighlight}>
                    <input type="hidden" name="id" value={highlight.id} />
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <button
                      type="submit"
                      aria-label="Remover marcação"
                      className="text-muted hover:text-danger grid size-11 place-items-center rounded-md"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          {isDone ? (
            <p className="bg-success-soft text-success flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium">
              <Check className="size-4" aria-hidden />
              Concluído
            </p>
          ) : (
            <Button size="lg" className="w-full" onClick={onMarkDone}>
              <Check aria-hidden />
              Marcar como concluído
            </Button>
          )}
        </div>
      </article>

      {/* Ação de marcar aparece só quando há seleção — barra fixa com um botão
          que quase nunca serve é barra roubando espaço de leitura.

          `bottom-[...]` no celular, não `bottom-0`: mesmo motivo do rodapé
          do quiz — a barra de navegação inferior também é `fixed bottom-0`
          e, renderizada depois, pintava por cima deste botão. */}
      {selection && !explain && (
        <div className="pb-safe fixed inset-x-0 bottom-[calc(4.25rem_+_env(safe-area-inset-bottom))] z-40 px-4 pb-4 md:bottom-0">
          <div className="mx-auto flex max-w-sm gap-2">
            <button
              type="button"
              onClick={() => {
                askAI(selection, 'normal');
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="bg-brand text-brand-fg flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg"
            >
              <Sparkles className="size-4" aria-hidden />
              Explicar com IA
            </button>
            <button
              type="button"
              onClick={() => {
                void addHighlight(resource.id, selection);
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              aria-label="Marcar trecho"
              className="bg-surface text-text border-border grid h-12 w-12 shrink-0 place-items-center rounded-full border shadow-lg"
            >
              <Highlighter className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {explain && (
        <div className="pb-safe fixed inset-x-0 bottom-[calc(4.25rem_+_env(safe-area-inset-bottom))] z-40 px-3 pb-3 md:bottom-0">
          <section
            aria-live="polite"
            className="border-border bg-surface mx-auto max-w-2xl rounded-2xl border p-4 shadow-xl"
          >
            <div className="flex items-start gap-2">
              <span className="bg-brand-soft text-brand-text grid size-7 shrink-0 place-items-center rounded-full">
                <Sparkles className="size-3.5" aria-hidden />
              </span>
              <p className="text-muted min-w-0 flex-1 truncate pt-1 text-xs italic">“{explain.passage}”</p>
              <button
                type="button"
                onClick={closeExplain}
                aria-label="Fechar explicação"
                className="text-muted hover:bg-surface-2 grid size-9 shrink-0 place-items-center rounded-full"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="mt-2 max-h-[40vh] overflow-y-auto text-sm leading-relaxed">
              {explain.loading ? (
                <p className="text-muted flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Pensando…
                </p>
              ) : explain.error ? (
                <p role="alert" className="text-danger">{explain.error}</p>
              ) : (
                <Markdown source={explain.text ?? ''} />
              )}
            </div>

            {!explain.loading && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => askAI(explain.passage, 'simples')}
                  className="border-border hover:bg-surface-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                >
                  Ainda não entendi
                </button>
                <button
                  type="button"
                  onClick={() => askAI(explain.passage, 'exemplo')}
                  className="border-border hover:bg-surface-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                >
                  Dar um exemplo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void addHighlight(resource.id, explain.passage);
                    closeExplain();
                  }}
                  className="border-border hover:bg-surface-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                >
                  Marcar trecho
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
