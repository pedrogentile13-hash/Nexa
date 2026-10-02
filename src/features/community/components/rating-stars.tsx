'use client';

import { useEffect, useState, useTransition } from 'react';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResourceRating, rateResource } from '../server/library-actions';
import type { ResourceRating } from '../server/library-actions';

/**
 * Avaliação de conteúdo da Biblioteca (Fase 6 — biblioteca comunitária).
 * Clicar numa estrela já envia — sem botão "salvar" separado, mesmo espírito
 * de "curtir" no feed: uma ação, sem confirmação extra. Busca a própria nota
 * ao montar (em vez de receber por prop) pra caber em qualquer leitor
 * client-side sem esse leitor precisar buscar e repassar o dado.
 */
export function RatingStars({ resourceId }: { resourceId: string }) {
  const [rating, setRating] = useState<ResourceRating | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getResourceRating(resourceId).then(setRating);
  }, [resourceId]);

  if (!rating) return null;

  const handleRate = (value: number) => {
    const alreadyRated = rating.myRating !== null;
    const nextAverage = alreadyRated
      ? rating.average
      : rating.average === null
        ? value
        : (rating.average * rating.ratingCount + value) / (rating.ratingCount + 1);
    const nextCount = alreadyRated ? rating.ratingCount : rating.ratingCount + 1;

    startTransition(async () => {
      await rateResource(resourceId, value);
      setRating({ average: nextAverage, ratingCount: nextCount, myRating: value });
    });
  };

  const displayValue = hovered ?? rating.myRating ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            aria-label={`Avaliar com ${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
            onMouseEnter={() => setHovered(value)}
            onClick={() => handleRate(value)}
            className="p-0.5 disabled:opacity-60"
          >
            <Star
              className={cn(
                'size-5 transition-colors',
                value <= displayValue ? 'fill-warning text-warning' : 'fill-none text-subtle',
              )}
            />
          </button>
        ))}
      </div>
      {pending ? (
        <Loader2 className="text-muted size-4 animate-spin" aria-hidden />
      ) : (
        <span className="text-muted text-xs">
          {rating.average !== null
            ? `${rating.average.toFixed(1)} · ${rating.ratingCount} ${rating.ratingCount === 1 ? 'avaliação' : 'avaliações'}`
            : 'Seja o primeiro a avaliar'}
        </span>
      )}
    </div>
  );
}
