'use client';

import { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { StudyTopBar } from './study-top-bar';
import { clockTime } from '../lib/format';
import { saveProgress } from '../server/actions';
import type { ResourceDetail } from '../server/queries';

/**
 * Player de áudio e vídeo.
 *
 * Um elemento `<audio>`/`<video>` nativo, controlado por fora. Foi tentador
 * embutir um player pronto; nenhum deles respeita os tokens de tema, e todos
 * pesam mais que o áudio de um episódio curto.
 *
 * O ponto onde parou é salvo com atraso, não a cada segundo: o aluno ouve 20
 * minutos, e 1.200 escritas por episódio seria trocar bateria e banda por uma
 * precisão que ninguém percebe.
 */

const SPEEDS = [1, 1.25, 1.5, 2] as const;
const SKIP_SECONDS = 15;

export function MediaPlayer({ resource }: { resource: ResourceDetail }) {
  const isVideo = resource.kind === 'video';
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(resource.positionSeconds);
  const [duration, setDuration] = useState(resource.durationSeconds ?? 0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  const [persist] = useDebouncedCallback((seconds: number, total: number) => {
    const percent = total > 0 ? Math.min(100, (seconds / total) * 100) : 0;
    void saveProgress(resource.id, percent, Math.round(seconds), percent >= 95);
  }, 4000);

  // Retoma exatamente onde parou. Sem isso, "continuar de onde parou" levaria
  // ao início do episódio, que é o mesmo que não retomar.
  useEffect(() => {
    const media = mediaRef.current;
    if (media && resource.positionSeconds > 0) media.currentTime = resource.positionSeconds;
  }, [resource.positionSeconds]);

  function toggle() {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) void media.play();
    else media.pause();
  }

  function skip(delta: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.duration || 0, media.currentTime + delta));
  }

  function seekTo(seconds: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = seconds;
    if (media.paused) void media.play();
  }

  function changeSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1;
    setSpeed(next);
    if (mediaRef.current) mediaRef.current.playbackRate = next;
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  const mediaProps = {
    ref: mediaRef as never,
    src: resource.mediaUrl ?? undefined,
    preload: 'metadata' as const,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onLoadedMetadata: (event: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(event.currentTarget.duration || resource.durationSeconds || 0),
    onTimeUpdate: (event: React.SyntheticEvent<HTMLMediaElement>) => {
      const seconds = event.currentTarget.currentTime;
      setCurrent(seconds);
      persist(seconds, event.currentTarget.duration || duration);
    },
  };

  return (
    <div style={subjectColorVars(resource.subjectColor)} className="pb-8">
      <StudyTopBar title={resource.subjectName} subtitle={resource.topicName} />

      <div className="mx-auto max-w-2xl px-5">
        {isVideo ? (
          <div className="overflow-hidden rounded-xl bg-black">
            <video {...mediaProps} controls playsInline className="aspect-video w-full" />
          </div>
        ) : (
          <>
            <div
              className="grid aspect-square max-h-72 w-full place-items-center rounded-2xl"
              style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
            >
              {resource.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resource.thumbnailUrl}
                  alt=""
                  className="size-full rounded-2xl object-cover"
                />
              ) : (
                <Headphones className="size-16" aria-hidden />
              )}
            </div>
            <audio {...mediaProps} className="sr-only" />
          </>
        )}

        <h1 className="mt-5 text-xl leading-tight font-semibold tracking-tight">
          {resource.title}
        </h1>
        {resource.subtitle && <p className="text-muted mt-1 text-sm">{resource.subtitle}</p>}

        {!isVideo && (
          <>
            <div className="mt-6">
              <div
                role="slider"
                tabIndex={0}
                aria-label="Posição do áudio"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(current)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') skip(SKIP_SECONDS);
                  if (event.key === 'ArrowLeft') skip(-SKIP_SECONDS);
                }}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const ratio = (event.clientX - rect.left) / rect.width;
                  seekTo(ratio * duration);
                }}
                className="bg-surface-2 h-2 cursor-pointer rounded-full"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: 'var(--subject-base)' }}
                />
              </div>
              <div className="text-muted mt-1.5 flex justify-between text-xs tabular-nums">
                <span>{clockTime(current)}</span>
                <span>-{clockTime(Math.max(0, duration - current))}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => skip(-SKIP_SECONDS)}
                aria-label={`Voltar ${SKIP_SECONDS} segundos`}
                className="text-muted hover:text-text grid size-12 place-items-center rounded-full"
              >
                <RotateCcw className="size-6" aria-hidden />
              </button>

              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'Pausar' : 'Tocar'}
                className="text-brand-fg grid size-16 place-items-center rounded-full"
                style={{ backgroundColor: 'var(--subject-base)' }}
              >
                {playing ? (
                  <Pause className="size-7 fill-current" aria-hidden />
                ) : (
                  <Play className="ml-0.5 size-7 fill-current" aria-hidden />
                )}
              </button>

              <button
                type="button"
                onClick={() => skip(SKIP_SECONDS)}
                aria-label={`Avançar ${SKIP_SECONDS} segundos`}
                className="text-muted hover:text-text grid size-12 place-items-center rounded-full"
              >
                <RotateCw className="size-6" aria-hidden />
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={changeSpeed}
                className="bg-surface-2 text-muted hover:text-text h-11 rounded-full px-4 text-sm font-semibold tabular-nums"
              >
                {speed}x
              </button>
            </div>
          </>
        )}

        {resource.chapters.length > 0 && (
          <section className="mt-8">
            <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Neste episódio
            </h2>
            <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
              {resource.chapters.map((chapter) => {
                const active =
                  current >= chapter.startsAtSeconds &&
                  current <
                    (resource.chapters.find((c) => c.startsAtSeconds > chapter.startsAtSeconds)
                      ?.startsAtSeconds ?? Infinity);
                return (
                  <li key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => seekTo(chapter.startsAtSeconds)}
                      className={cn(
                        'hover:bg-surface-2 flex h-12 w-full items-center gap-3 px-4 text-left text-sm transition-colors',
                        active && 'font-semibold',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{chapter.label}</span>
                      <span className="text-subtle shrink-0 text-xs tabular-nums">
                        {clockTime(chapter.startsAtSeconds)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {resource.description && (
          <p className="text-muted mt-6 text-sm leading-relaxed">{resource.description}</p>
        )}

        {!resource.mediaUrl && (
          <p className="text-danger mt-6 text-sm">
            Este item ainda não tem arquivo nem link. Avise a escola.
          </p>
        )}
      </div>
    </div>
  );
}
