'use client';

import { useState, useTransition } from 'react';
import { Check, Clock, FileText, Heart, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { humanDuration } from '../lib/format';
import { saveProgress, toggleFavorite } from '../server/actions';
import { StudyTopBar } from './study-top-bar';
import { useContentTimeTracking } from '../hooks/use-content-time-tracking';
import type { ResourceDetail } from '../server/queries';

/**
 * Leitor de resumo em PDF.
 *
 * O visualizador é o do próprio navegador (`<iframe>` do arquivo), não um
 * pdf.js construído do zero: ampliar, navegar entre páginas e pesquisar termos
 * já vêm de graça na barra de ferramentas nativa — e são mais completos do que
 * a maioria dos leitores customizados que existem por aí.
 *
 * O preço dessa escolha é que o progresso não pode ser medido pela rolagem
 * (o conteúdo do iframe não é acessível ao JS da página, nem same-origin):
 * por isso aqui "progresso" é uma ação explícita — "Marcar como concluído" —
 * em vez do gradual que `ReaderView` faz para markdown.
 */
export function PdfReader({ resource }: { resource: ResourceDetail }) {
  useContentTimeTracking(resource.id);
  const [isFavorited, setIsFavorited] = useState(resource.isFavorited);
  const [isDone, setIsDone] = useState(Boolean(resource.completedAt));
  const [, startTransition] = useTransition();

  const readingTime = humanDuration(resource.durationSeconds);

  function onToggleFavorite() {
    const next = !isFavorited;
    setIsFavorited(next);
    startTransition(async () => {
      await toggleFavorite(resource.id, next);
    });
  }

  function onMarkDone() {
    setIsDone(true);
    startTransition(async () => {
      await saveProgress(resource.id, 100, null, true);
    });
  }

  return (
    <div style={subjectColorVars(resource.subjectColor)}>
      <StudyTopBar
        title={resource.subjectName}
        subtitle={resource.topicName}
        right={
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar'}
            className="text-muted hover:bg-surface-2 hover:text-text grid size-11 shrink-0 place-items-center rounded-full"
          >
            <Heart
              className={cn('size-5', isFavorited && 'fill-danger text-danger')}
              aria-hidden
            />
          </button>
        }
      />

      <div className="mx-auto max-w-3xl px-5 pt-1 pb-8">
        <h1 className="text-xl leading-tight font-semibold tracking-tight">{resource.title}</h1>
        {resource.description && (
          <p className="text-muted mt-1.5 text-sm leading-relaxed">{resource.description}</p>
        )}

        {/* Metadados do PDF: páginas, tempo de leitura, matéria, etiquetas —
            o mesmo recado que o card da biblioteca já dá, só que completo. */}
        <div className="text-muted mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {resource.pdfPageCount && (
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" aria-hidden />
              {resource.pdfPageCount} página{resource.pdfPageCount === 1 ? '' : 's'}
            </span>
          )}
          {readingTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              Leitura estimada: {readingTime}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: 'var(--subject-base)' }}
            />
            {resource.subjectName}
          </span>
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-1">
              <Tag className="size-3.5" aria-hidden />
              {tag}
            </span>
          ))}
        </div>

        {resource.mediaUrl ? (
          <div className="border-border bg-surface-2 mt-4 overflow-hidden rounded-2xl border">
            {/* O visualizador nativo do navegador cuida de zoom, navegação de
                página e busca (Ctrl+F) — nenhuma dessas três precisa de código
                aqui. `#toolbar=1` só garante a barra visível em quem a esconde
                por padrão. */}
            <iframe
              src={`${resource.mediaUrl}#toolbar=1`}
              title={resource.title}
              className="h-[75vh] w-full"
            />
          </div>
        ) : (
          <p className="text-muted mt-4 text-sm">Este PDF ainda não foi enviado.</p>
        )}

        <div className="mt-4">
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
      </div>
    </div>
  );
}
