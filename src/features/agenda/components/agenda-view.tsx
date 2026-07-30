'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, ListTodo, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import type { AgendaEvent, AgendaKind } from '../server/queries';

/**
 * Agenda: grade do mês + lista contínua.
 *
 * As duas visualizações leem a mesma lista de eventos. A grade responde "quando
 * é" de relance; a lista responde "o que é" sem exigir toque. Num celular as
 * duas juntas cabem numa rolagem curta, e é isso que a especificação pede com
 * "Mensal" e "Lista".
 */

const KIND_ICON: Record<AgendaKind, typeof FileText> = {
  assessment: FileText,
  task: ListTodo,
  study: Timer,
};

const KIND_LABEL: Record<AgendaKind, string> = {
  assessment: 'Avaliações',
  task: 'Tarefas',
  study: 'Estudos',
};

type Filter = 'all' | AgendaKind;

export function AgendaView({ events, today }: { events: AgendaEvent[]; today: string }) {
  const [monthCursor, setMonthCursor] = useState(() => today.slice(0, 7));
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.kind === filter)),
    [events, filter],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const event of visible) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [visible]);

  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  // A lista mostra de hoje em diante: o passado está na grade, e o aluno abre a
  // agenda para saber o que vem, não o que foi.
  const upcoming = useMemo(
    () => visible.filter((e) => e.date >= today).slice(0, 40),
    [visible, today],
  );

  return (
    <div className="space-y-4">
      {/* Filtros --------------------------------------------------------- */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(['all', 'assessment', 'task', 'study'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              filter === value
                ? 'border-brand bg-brand-soft text-brand-text'
                : 'border-border bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {value === 'all' ? 'Tudo' : KIND_LABEL[value]}
          </button>
        ))}
      </div>

      {/* Grade do mês ---------------------------------------------------- */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthCursor(shiftMonth(monthCursor, -1))}
              aria-label="Mês anterior"
              className="text-muted hover:bg-surface-2 grid size-11 place-items-center rounded-md"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <h2 className="text-sm font-semibold">{monthLabel(monthCursor)}</h2>
            <button
              type="button"
              onClick={() => setMonthCursor(shiftMonth(monthCursor, 1))}
              aria-label="Próximo mês"
              className="text-muted hover:bg-surface-2 grid size-11 place-items-center rounded-md"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>

          <div className="text-subtle mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((letter, index) => (
              <span key={`${letter}-${index}`}>{letter}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => {
              // Chave por posição nas células vazias: `Math.random()` daria uma
              // chave nova a cada render e remontaria a grade inteira sem motivo.
              if (!day) return <span key={`empty-${index}`} />;
              const dayEvents = byDate.get(day) ?? [];
              const isToday = day === today;

              return (
                <div
                  key={day}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-md text-xs',
                    isToday ? 'bg-brand text-brand-fg font-semibold' : 'text-muted',
                  )}
                >
                  <span className="tabular">{Number(day.slice(8, 10))}</span>
                  <span className="mt-0.5 flex h-1.5 gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        aria-hidden
                        style={subjectColorVars(event.subjectColor)}
                        className="size-1.5 rounded-full"
                      >
                        <span
                          className="block size-1.5 rounded-full"
                          style={{
                            backgroundColor: isToday ? 'var(--brand-fg)' : 'var(--subject-base)',
                          }}
                        />
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista ----------------------------------------------------------- */}
      {upcoming.length === 0 ? (
        <Card>
          <CardContent className="text-muted py-10 text-center text-sm">
            Nada marcado daqui para a frente.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupConsecutive(upcoming).map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="text-subtle mb-1.5 px-1 text-xs font-semibold tracking-wide uppercase">
                {dayLabel(date, today)}
              </h3>
              <Card>
                <CardContent className="py-1">
                  <ul className="divide-border divide-y">
                    {dayEvents.map((event) => {
                      const Icon = KIND_ICON[event.kind];
                      return (
                        <li
                          key={event.id}
                          style={subjectColorVars(event.subjectColor)}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <span
                            aria-hidden
                            className="grid size-7 shrink-0 place-items-center rounded-md"
                            style={{
                              backgroundColor: 'var(--subject-soft)',
                              color: 'var(--subject-on-soft)',
                            }}
                          >
                            <Icon className="size-3.5" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate text-sm font-medium',
                                event.isDone && event.kind === 'task' && 'text-subtle line-through',
                              )}
                            >
                              {event.categoryCode && (
                                <span className="text-subtle mr-1.5 text-xs font-semibold">
                                  {event.categoryCode}
                                </span>
                              )}
                              {event.title}
                            </p>
                            {event.subjectName && (
                              <p
                                className="truncate text-xs"
                                style={{ color: 'var(--subject-base)' }}
                              >
                                {event.subjectName}
                              </p>
                            )}
                          </div>

                          {event.score !== null && (
                            <span className="tabular shrink-0 text-sm font-semibold">
                              {event.score.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── datas ──── */

/** Células do mês, com `null` nos espaços antes do dia 1. */
function buildMonthGrid(month: string): (string | null)[] {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return [];

  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leading = first.getUTCDay();

  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${month}-${String(day).padStart(2, '0')}`);
  }
  return cells;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function dayLabel(date: string, today: string): string {
  if (date === today) return 'Hoje';
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function groupConsecutive(events: AgendaEvent[]): [string, AgendaEvent[]][] {
  const groups: [string, AgendaEvent[]][] = [];
  for (const event of events) {
    const last = groups[groups.length - 1];
    if (last && last[0] === event.date) last[1].push(event);
    else groups.push([event.date, [event]]);
  }
  return groups;
}
