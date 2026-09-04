import Link from 'next/link';
import { Check, ChevronRight, Circle, Lock, Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import type { TrackView as TrackData } from '../server/queries';

/**
 * Trilha da matéria.
 *
 * Cinco estados de nó, e cada um precisa ser distinguível SEM depender da cor —
 * o ícone carrega o estado, a cor só reforça. Um aluno com daltonismo lendo a
 * trilha no ônibus é o caso normal, não a exceção.
 *
 *   dominado    ★  três conclusões seguidas sem erro
 *   concluído   ✓  passou
 *   em andamento ▶ começou e não terminou
 *   disponível  ○  pode começar
 *   bloqueado   🔒 falta a lição anterior
 *
 * A lição bloqueada continua legível: esconder o que vem à frente transforma a
 * trilha numa caixa fechada, e saber o que vem é metade da motivação.
 */

const STATE_META = {
  mastered: { Icon: Star, label: 'Dominado', tone: 'success' },
  done: { Icon: Check, label: 'Concluído', tone: 'success' },
  in_progress: { Icon: Play, label: 'Em andamento', tone: 'brand' },
  available: { Icon: Circle, label: 'Disponível', tone: 'neutral' },
  locked: { Icon: Lock, label: 'Bloqueado', tone: 'muted' },
} as const;

export function TrackView({ track }: { track: TrackData }) {
  const totals = track.sections.reduce(
    (acc, section) => ({ done: acc.done + section.done, total: acc.total + section.total }),
    { done: 0, total: 0 },
  );

  const nextLesson = track.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.state === 'available' || l.state === 'in_progress');

  return (
    <div style={subjectColorVars(track.subjectColor)} className="pb-8">
      <StudyTopBar title={track.title} subtitle={track.subjectName} />

      <div className="mx-auto max-w-2xl px-5">
        <header className="mb-6">
          <p className="text-muted text-sm">
            {totals.total === 0
              ? 'Esta trilha ainda não tem lições.'
              : `Lição ${Math.min(totals.done + 1, totals.total)} de ${totals.total}`}
          </p>
          {track.description && (
            <p className="text-muted mt-1 text-sm leading-relaxed">{track.description}</p>
          )}

          {totals.total > 0 && (
            <div className="bg-surface-2 mt-3 h-2 rounded-full">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${(totals.done / totals.total) * 100}%`,
                  backgroundColor: 'var(--subject-base)',
                }}
              />
            </div>
          )}
        </header>

        {track.sections.map((section) => (
          <section key={section.id} className="mb-6">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold">{section.title}</h2>
              <span className="text-subtle shrink-0 text-xs tabular-nums">
                {section.done}/{section.total}
              </span>
            </div>

            <ol className="relative space-y-2">
              {/* A linha vertical é o que faz "trilha" parecer trilha e não
                  lista. Fica atrás dos nós e não recebe toque. */}
              <span aria-hidden className="bg-border absolute top-6 bottom-6 left-[22px] w-px" />

              {section.lessons.map((lesson) => {
                const meta = STATE_META[lesson.state];
                const locked = lesson.state === 'locked';

                const body = (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        'relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2',
                        meta.tone === 'success' && 'border-success bg-success text-white',
                        meta.tone === 'brand' && 'border-brand bg-brand text-brand-fg',
                        meta.tone === 'neutral' && 'border-border-strong bg-surface text-muted',
                        meta.tone === 'muted' && 'border-border bg-surface-2 text-subtle',
                      )}
                    >
                      <meta.Icon
                        className={cn(
                          'size-5',
                          lesson.state === 'available' && 'size-3 fill-current',
                        )}
                        strokeWidth={lesson.state === 'done' || lesson.state === 'mastered' ? 3 : 2}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm font-semibold',
                          locked && 'text-muted',
                        )}
                      >
                        {lesson.title}
                      </span>
                      <span className="text-muted block truncate text-xs">
                        {[
                          meta.label,
                          lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : null,
                          lesson.resourceCount > 0
                            ? `${lesson.resourceCount} ${lesson.resourceCount === 1 ? 'material' : 'materiais'}`
                            : null,
                          lesson.state === 'locked' ? 'conclua a anterior antes' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>

                    {!locked && (
                      <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
                    )}
                  </>
                );

                return (
                  <li key={lesson.id}>
                    {locked ? (
                      <div
                        aria-disabled
                        className="border-border bg-surface/60 flex items-center gap-3 rounded-lg border p-3"
                      >
                        {body}
                      </div>
                    ) : (
                      <Link
                        href={`/estudar/licao/${lesson.id}`}
                        className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                      >
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        {nextLesson && (
          <div className="pb-safe border-border bg-bg/90 sticky bottom-0 border-t py-3 backdrop-blur-lg">
            <Link
              href={`/estudar/licao/${nextLesson.id}`}
              className="bg-brand text-brand-fg flex h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold"
            >
              {nextLesson.state === 'in_progress' ? 'Continuar' : 'Começar'} · {nextLesson.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
