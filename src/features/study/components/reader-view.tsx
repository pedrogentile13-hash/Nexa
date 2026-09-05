'use client';

import { useEffect, useRef, useState } from 'react';
import { Highlighter, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { StudyTopBar } from './study-top-bar';
import { addHighlight, removeHighlight, saveProgress } from '../server/actions';
import { Markdown } from './markdown';
import type { ResourceDetail } from '../server/queries';

/**
 * Leitor de resumo.
 *
 * O progresso é medido pela ROLAGEM, não por um botão "concluí". Um botão mede
 * intenção; a rolagem mede leitura, e é ela que faz "continuar de onde parou"
 * cair no lugar certo quando o aluno volta no dia seguinte.
 *
 * O tamanho da fonte é ajustável e persistido no aparelho: um resumo de sete
 * minutos lido no ônibus não tem o mesmo tamanho confortável de um lido na mesa.
 */

const SIZES = ['text-[15px]', 'text-base', 'text-lg', 'text-xl'] as const;
const STORAGE_KEY = 'nexa:reader-size';

export function ReaderView({ resource }: { resource: ResourceDetail }) {
  const [sizeIndex, setSizeIndex] = useState(1);
  const [percent, setPercent] = useState(resource.progressPercent);
  const [selection, setSelection] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  const [persist] = useDebouncedCallback((value: number) => {
    void saveProgress(resource.id, value, null, value >= 95);
  }, 1200);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setSizeIndex(Math.min(SIZES.length - 1, Math.max(0, Number(stored))));
    } catch {
      // Navegador com armazenamento bloqueado: o padrão serve.
    }
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

      <article
        ref={articleRef}
        onMouseUp={() => setSelection(window.getSelection()?.toString().trim() || null)}
        onTouchEnd={() => setSelection(window.getSelection()?.toString().trim() || null)}
        className="mx-auto max-w-2xl px-5 pt-4 pb-24"
      >
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{resource.title}</h1>
        {resource.description && (
          <p className="text-muted mt-2 text-sm leading-relaxed">{resource.description}</p>
        )}

        <div className={cn('mt-6 leading-relaxed', SIZES[sizeIndex])}>
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
      </article>

      {/* Ação de marcar aparece só quando há seleção — barra fixa com um botão
          que quase nunca serve é barra roubando espaço de leitura. */}
      {selection && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <button
            type="button"
            onClick={() => {
              void addHighlight(resource.id, selection);
              setSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="bg-brand text-brand-fg mx-auto flex h-12 max-w-sm items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-lg"
          >
            <Highlighter className="size-4" aria-hidden />
            Marcar trecho
          </button>
        </div>
      )}
    </div>
  );
}
