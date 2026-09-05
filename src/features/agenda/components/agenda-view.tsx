'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, ListTodo, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import type { AgendaEvent, AgendaKind } from '../server/queries';

/**
 * Agenda: grade do mês, semana ou lista — e o dia escolhido logo abaixo.
 *
 * A grade responde "quando é" de relance; a lista do dia responde "o que é" sem
 * exigir navegação. Tocar num dia troca a lista de baixo, e é por isso que a
 * grade não é decoração: ela é o controle da tela.
 *
 * O dia SELECIONADO é azul preenchido; o dia de hoje, quando não é o
 * selecionado, fica com um anel. São duas informações diferentes e precisam ser
 * distinguíveis — senão, ao navegar para outro mês, o aluno perde a referência
 * de onde está no calendário.
 */

const KIND_ICON: Record<AgendaKind, typeof ClipboardList> = {
  assessment: ClipboardList,
  task: ListTodo,
  study: Timer,
};

const KIND_LABEL: Record<AgendaKind, string> = {
  assessment: 'Prova',
  task: 'Tarefa',
  study: 'Estudo',
};

type ViewMode = 'mes' | 'semana' | 'lista';

export function AgendaView({ events, today }: { events: AgendaEvent[]; today: string }) {
  const [mode, setMode] = useState<ViewMode>('mes');
  const [selected, setSelected] = useState(today);
  const monthCursor = selected.slice(0, 7);

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const event of events) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [events]);

  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const weekDays = useMemo(() => buildWeek(selected), [selected]);

  const dayEvents = byDate.get(selected) ?? [];

  // A lista corrida mostra de hoje em diante: o passado está na grade, e o
  // aluno abre a agenda para saber o que vem, não o que foi.
  const upcoming = useMemo(
    () => events.filter((e) => e.date >= today).slice(0, 60),
    [events, today],
  );

  const grid = mode === 'semana' ? weekDays : monthDays;

  return (
    <div className="space-y-4">
      {/* Cabeçalho do mês, com as setas — no kit ele É o título da tela. */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{monthLabel(monthCursor)}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setSelected(shiftMonthKeepingDay(selected, -1))}
            aria-label="Mês anterior"
            className="text-muted hover:bg-surface-2 hover:text-text grid size-11 place-items-center rounded-full"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSelected(shiftMonthKeepingDay(selected, 1))}
            aria-label="Próximo mês"
            className="text-muted hover:bg-surface-2 hover:text-text grid size-11 place-items-center rounded-full"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <Segmented
        label="Como ver a agenda"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'mes', label: 'Mês' },
          { value: 'semana', label: 'Semana' },
          { value: 'lista', label: 'Lista' },
        ]}
      />

      {mode === 'lista' ? (
        <ContinuousList events={upcoming} today={today} />
      ) : (
        <>
          <Card>
            <CardContent className="p-3">
              <div className="text-subtle mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((letter, index) => (
                  <span key={`${letter}-${index}`}>{letter}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {grid.map((day, index) => {
                  // Chave por posição nas células vazias: `Math.random()` daria
                  // uma chave nova a cada render e remontaria a grade inteira.
                  if (!day) return <span key={`empty-${index}`} />;

                  const dots = byDate.get(day) ?? [];
                  const isSelected = day === selected;
                  const isToday = day === today;
                  const outside = day.slice(0, 7) !== monthCursor;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-pressed={isSelected}
                      aria-label={`${Number(day.slice(8, 10))} de ${monthLabel(day.slice(0, 7))}${
                        dots.length ? `, ${dots.length} item${dots.length === 1 ? '' : 's'}` : ''
                      }`}
                      className={cn(
                        'flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-xs transition-colors',
                        isSelected
                          ? 'bg-brand text-brand-fg font-semibold'
                          : isToday
                            ? 'ring-brand text-text font-semibold ring-2'
                            : outside
                              ? 'text-subtle'
                              : 'text-muted hover:bg-surface-2',
                      )}
                    >
                      <span className="tabular">{Number(day.slice(8, 10))}</span>
                      <span className="mt-0.5 flex h-1.5 gap-0.5">
                        {dots.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            aria-hidden
                            style={subjectColorVars(event.subjectColor)}
                            className="block size-1.5 rounded-full"
                          >
                            <span
                              className="block size-1.5 rounded-full"
                              style={{
                                backgroundColor: isSelected
                                  ? 'var(--brand-fg)'
                                  : 'var(--subject-base)',
                              }}
                            />
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <section aria-live="polite">
            <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
              <h2 className="text-base font-semibold">{dayLabel(selected, today)}</h2>
              <span className="bg-brand-soft text-brand-text shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {dayEvents.length === 0 ? (
              <Card>
                <CardContent className="text-muted py-8 text-center text-sm">
                  Nada marcado para este dia.
                </CardContent>
              </Card>
            ) : (
              <ul className="grid gap-2 lg:grid-cols-2">
                {dayEvents.map((event) => (
                  <li key={event.id} className="min-w-0">
                    <EventCard event={event} today={today} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Legend />
        </>
      )}
    </div>
  );
}

/** Cartão de evento do kit: faixa da matéria, tile do tipo, data em destaque. */
function EventCard({ event, today }: { event: AgendaEvent; today: string }) {
  const Icon = KIND_ICON[event.kind];
  const urgent = event.date <= today && !event.isDone;

  return (
    <article
      style={subjectColorVars(event.subjectColor)}
      className="border-border bg-surface relative overflow-hidden rounded-[20px] border"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: 'var(--subject-base)' }}
      />
      <div className="flex items-start gap-3 py-3.5 pr-4 pl-5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
        >
          <Icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'text-sm leading-snug font-semibold',
              event.isDone && event.kind === 'task' && 'text-subtle line-through',
            )}
          >
            {event.categoryCode && (
              <span className="text-subtle mr-1.5 text-xs font-semibold">{event.categoryCode}</span>
            )}
            {event.title}
          </h3>

          <p className="text-muted mt-0.5 text-xs leading-relaxed">
            {KIND_LABEL[event.kind]}
            {event.subjectName && ` · ${event.subjectName}`}
          </p>

          <p className={cn('mt-1 text-xs font-medium', urgent ? 'text-warning' : 'text-subtle')}>
            {dayLabel(event.date, today)}
          </p>
        </div>

        {event.score !== null && (
          <span className="tabular shrink-0 text-lg font-semibold">
            {event.score.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          </span>
        )}
      </div>
    </article>
  );
}

/** Modo lista: tudo daqui para a frente, agrupado por dia. */
function ContinuousList({ events, today }: { events: AgendaEvent[]; today: string }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted py-10 text-center text-sm">
          Nada marcado daqui para a frente.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupConsecutive(events).map(([date, dayEvents]) => (
        <section key={date}>
          <h2 className="text-subtle mb-1.5 px-1 text-xs font-semibold tracking-wide uppercase">
            {dayLabel(date, today)}
          </h2>
          <ul className="grid gap-2 lg:grid-cols-2">
            {dayEvents.map((event) => (
              <li key={event.id} className="min-w-0">
                <EventCard event={event} today={today} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** A legenda diz o que a cor e o ícone significam, uma vez, no rodapé. */
function Legend() {
  return (
    <ul className="text-subtle flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs">
      <li className="flex items-center gap-1.5">
        <ClipboardList className="size-3.5" aria-hidden />
        Prova
      </li>
      <li className="flex items-center gap-1.5">
        <ListTodo className="size-3.5" aria-hidden />
        Tarefa
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="border-border-strong size-2.5 rounded-full border" />
        Cor = matéria
      </li>
    </ul>
  );
}

/* -------------------------------------------------------------- datas ---- */

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function monthLabel(cursor: string): string {
  const [year, month] = cursor.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/**
 * Avança o mês preservando o dia sempre que ele existir no mês de destino.
 *
 * 31 de janeiro + 1 mês vira 28 de fevereiro, não 3 de março: o aluno pediu
 * "próximo mês", e cair em março quebraria a navegação de forma invisível.
 */
function shiftMonthKeepingDay(iso: string, delta: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(year as number, (month as number) - 1 + delta, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const safeDay = Math.min(day as number, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

/** Grade do mês com as sobras das semanas de borda preenchidas. */
function buildMonthGrid(cursor: string): (string | null)[] {
  const [year, month] = cursor.split('-').map(Number);
  const first = new Date(Date.UTC(year as number, (month as number) - 1, 1));
  const daysInMonth = new Date(Date.UTC(year as number, month as number, 0)).getUTCDate();

  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return cells;
}

/** Semana do domingo ao sábado que contém a data. */
function buildWeek(iso: string): string[] {
  const date = new Date(`${iso}T00:00:00Z`);
  const sunday = new Date(date);
  sunday.setUTCDate(date.getUTCDate() - date.getUTCDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sunday);
    day.setUTCDate(sunday.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function dayLabel(iso: string, today: string): string {
  const days = Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
  );

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';

  const date = new Date(`${iso}T00:00:00Z`);
  const weekday = WEEKDAYS[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()]?.toLowerCase();
  return `${weekday}, ${date.getUTCDate()} de ${month}`;
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
