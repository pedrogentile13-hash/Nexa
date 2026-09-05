'use client';

import { useState, useTransition } from 'react';
import { Check, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import { reviewFlashcard } from '../server/actions';
import { Markdown } from './markdown';
import type { ResourceDetail } from '../server/queries';

/**
 * Imagem de estudo, em modo flashcard.
 *
 * A imagem sozinha é decoração: um mapa de biomas visto por dez segundos não
 * ensina nada. O verso com a explicação, e o par "sei / ainda não sei", é o que
 * transforma a figura em revisão — e é o que alimenta o que reaparece depois.
 */
export function ImageCard({ resource }: { resource: ResourceDetail }) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [, startTransition] = useTransition();

  const hasBack = Boolean(resource.body?.trim());

  function answer(knows: boolean) {
    setAnswered(knows);
    startTransition(async () => {
      await reviewFlashcard(resource.id, knows);
    });
  }

  return (
    <div style={subjectColorVars(resource.subjectColor)} className="pb-8">
      <StudyTopBar title={resource.subjectName} subtitle={resource.topicName} />

      <div className="mx-auto max-w-2xl px-5">
        <button
          type="button"
          onClick={() => hasBack && setFlipped((f) => !f)}
          disabled={!hasBack}
          aria-label={flipped ? 'Ver a imagem' : 'Ver a explicação'}
          className={cn(
            'border-border bg-surface block w-full overflow-hidden rounded-2xl border text-left',
            hasBack && 'cursor-pointer',
          )}
        >
          {flipped ? (
            <div className="min-h-[240px] p-6">
              <p className="text-subtle mb-3 text-xs font-semibold tracking-wide uppercase">
                Explicação
              </p>
              <div className="text-[15px] leading-relaxed">
                <Markdown source={resource.body ?? ''} />
              </div>
            </div>
          ) : resource.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resource.mediaUrl} alt={resource.title} className="w-full object-contain" />
          ) : (
            <div className="text-muted grid min-h-[240px] place-items-center p-6 text-sm">
              Este item ainda não tem imagem.
            </div>
          )}
        </button>

        {hasBack && (
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="text-muted hover:text-text mx-auto mt-3 flex h-11 items-center gap-1.5 text-sm font-medium"
          >
            <RotateCw className="size-4" aria-hidden />
            {flipped ? 'Ver a imagem' : 'Ver a explicação'}
          </button>
        )}

        <h1 className="mt-5 text-xl leading-tight font-semibold tracking-tight">
          {resource.title}
        </h1>
        {resource.description && (
          <p className="text-muted mt-1.5 text-sm leading-relaxed">{resource.description}</p>
        )}

        {hasBack && (
          <div className="mt-6">
            {answered === null ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => answer(false)}
                >
                  <X aria-hidden />
                  Ainda não sei
                </Button>
                <Button size="lg" className="flex-1" onClick={() => answer(true)}>
                  <Check aria-hidden />
                  Sei esta
                </Button>
              </div>
            ) : (
              <p
                className={cn(
                  'rounded-lg px-4 py-3 text-center text-sm',
                  answered ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted',
                )}
              >
                {answered
                  ? 'Anotado. Esta volta menos vezes.'
                  : 'Sem problema — esta volta mais vezes até firmar.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
