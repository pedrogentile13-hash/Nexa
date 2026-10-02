'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Brain, Route as RouteIcon, Sparkles } from 'lucide-react';
import { PopEmptyState } from '@/components/ui/empty-state';
import { ProgressRing } from '@/components/ui/progress-ring';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { TRACK_CATEGORIES, trackCategoryLabel } from '@/lib/design/track-category';
import type { TrackCategory } from '@/types/database.types';
import type { TrilhaListItem, TrilhasOverview } from '../server/queries';

type CategoryFilter = 'todas' | TrackCategory;

const TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  ...TRACK_CATEGORIES,
];

export function TrilhasView({ overview }: { overview: TrilhasOverview }) {
  const [category, setCategory] = useState<CategoryFilter>('todas');

  const continueTrack = overview.tracks.find((t) => t.id === overview.continueTrackId);
  const recommended = overview.recommendedTrackIds
    .map((id) => overview.tracks.find((t) => t.id === id))
    .filter((t): t is TrilhaListItem => Boolean(t));
  // A ordem que o admin já dá às trilhas (sort_order) é o único sinal de
  // destaque real que existe — sem inventar popularidade que não é medida.
  const featured = overview.tracks.slice(0, 3);

  const filtered = useMemo(
    () => (category === 'todas' ? overview.tracks : overview.tracks.filter((t) => t.category === category)),
    [overview.tracks, category],
  );

  const overallPercent =
    overview.totalLessons === 0 ? 0 : Math.round((overview.totalDone / overview.totalLessons) * 100);

  return (
    <div className="space-y-6">
      <section className="border-border bg-surface flex items-center gap-4 rounded-2xl border p-4">
        <ProgressRing value={overallPercent} label={`Progresso geral em trilhas: ${overallPercent}%`} size={72}>
          <span className="tabular text-sm font-semibold">{overallPercent}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Progresso geral</p>
          <p className="text-muted text-xs">
            {overview.totalDone} de {overview.totalLessons}{' '}
            {overview.totalLessons === 1 ? 'lição concluída' : 'lições concluídas'} em{' '}
            {overview.tracks.length} {overview.tracks.length === 1 ? 'trilha' : 'trilhas'}
          </p>
        </div>
      </section>

      {continueTrack && (
        <TrackSection
          icon={<RouteIcon className="size-4" aria-hidden />}
          title="Continue de onde parou"
          tracks={[continueTrack]}
        />
      )}

      {recommended.length > 0 && (
        <TrackSection
          icon={<Brain className="size-4" aria-hidden />}
          title="Recomendadas para você"
          tracks={recommended}
        />
      )}

      {featured.length > 0 && (
        <TrackSection
          icon={<Sparkles className="size-4" aria-hidden />}
          title="Em destaque"
          tracks={featured}
        />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold">Todas as trilhas</h2>
        <UnderlineTabs label="Categoria" value={category} onChange={setCategory} className="mb-4" options={TABS} />

        {filtered.length === 0 ? (
          <PopEmptyState
            size="sm"
            icon={<RouteIcon className="size-5 text-white" />}
            title="Nenhuma trilha nesta categoria"
            description="Volte mais tarde ou veja outra categoria."
          />
        ) : (
          <TrackGrid tracks={filtered} />
        )}
      </section>
    </div>
  );
}

function TrackSection({
  icon,
  title,
  tracks,
}: {
  icon: React.ReactNode;
  title: string;
  tracks: TrilhaListItem[];
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      <TrackGrid tracks={tracks} />
    </section>
  );
}

function TrackGrid({ tracks }: { tracks: TrilhaListItem[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tracks.map((track) => {
        const percent = track.total === 0 ? 0 : Math.round((track.done / track.total) * 100);
        return (
          <li key={track.id}>
            <Link
              href={`/trilhas/${track.id}`}
              className="border-border bg-surface hover:bg-surface-2 flex h-full flex-col gap-3 rounded-2xl border p-4 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{
                    ...subjectColorVars(track.subjectColor),
                    background: 'var(--subject-soft)',
                    color: 'var(--subject-on-soft)',
                  }}
                >
                  <RouteIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{track.title}</p>
                  <p className="text-muted truncate text-xs">
                    {track.subjectName} · {trackCategoryLabel(track.category)}
                  </p>
                </div>
              </div>

              {track.total > 0 && (
                <div>
                  <div className="bg-surface-2 h-2 rounded-full">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{ width: `${percent}%`, backgroundColor: 'var(--subject-base)' }}
                    />
                  </div>
                  <p className="text-muted mt-1.5 text-xs">
                    {track.done}/{track.total} lições
                  </p>
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
