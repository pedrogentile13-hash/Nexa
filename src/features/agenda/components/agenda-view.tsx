'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  CalendarPlus,
  CalendarSync,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  ListTodo,
  Plus,
  Timer,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PopEmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/segmented';
import { cn } from '@/lib/utils';
import { buildMonthGrid, monthLabel, shiftMonthKeepingDay } from '@/lib/date/month-grid';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { createAgendaTask } from '../server/actions';
import type { AgendaEvent } from '../server/queries';

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
 *
 * No desktop, "Próximos eventos" fica numa coluna fixa ao lado do calendário —
 * não é preciso trocar de aba pra ver os dois. No celular não há espaço para
 * duas colunas, então o modo "Lista" continua cobrindo essa necessidade.
 */

function eventIcon(event: AgendaEvent): typeof ClipboardList {
  if (event.kind === 'study') return Timer;
  return event.taskKind === 'prova' ? ClipboardList : ListTodo;
}

function eventLabel(event: AgendaEvent): string {
  if (event.kind === 'study') return 'Estudo';
  return event.taskKind === 'prova' ? 'Prova' : 'Tarefa';
}

type ViewMode = 'mes' | 'semana' | 'lista';

export function AgendaView({ events, today }: { events: AgendaEvent[]; today: string }) {
  const [mode, setMode] = useState<ViewMode>('mes');
  const [selected, setSelected] = useState(today);
  const [showAdd, setShowAdd] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const monthCursor = selected.slice(0, 7);

  // A lista de matérias que realmente aparecem na agenda — filtrar por uma
  // matéria sem nenhum evento não ajudaria ninguém.
  const subjectOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    for (const event of events) {
      if (!event.subjectId || !event.subjectName) continue;
      if (!map.has(event.subjectId)) {
        map.set(event.subjectId, { id: event.subjectId, name: event.subjectName, color: event.subjectColor });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [events]);

  const filteredEvents = useMemo(
    () => (subjectFilter ? events.filter((e) => e.subjectId === subjectFilter) : events),
    [events, subjectFilter],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const event of filteredEvents) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [filteredEvents]);

  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const weekDays = useMemo(() => buildWeek(selected), [selected]);

  const dayEvents = byDate.get(selected) ?? [];

  // A lista corrida mostra de hoje em diante: o passado está na grade, e o
  // aluno abre a agenda para saber o que vem, não o que foi.
  const upcoming = useMemo(
    () => filteredEvents.filter((e) => e.date >= today).slice(0, 60),
    [filteredEvents, today],
  );

  const grid = mode === 'semana' ? weekDays : monthDays;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
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
            <Button
              variant="pop"
              size="sm"
              className="ml-1"
              onClick={() => setShowAdd((v) => !v)}
              aria-expanded={showAdd}
            >
              <Plus aria-hidden />
              <span className="hidden sm:inline">Adicionar compromisso</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        </div>

        {showAdd && (
          <QuickAddTask
            defaultDate={selected}
            onDone={() => setShowAdd(false)}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {subjectOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Chip active={subjectFilter === null} onClick={() => setSubjectFilter(null)}>
              Todas
            </Chip>
            {subjectOptions.map((subject) => (
              <Chip
                key={subject.id}
                active={subjectFilter === subject.id}
                onClick={() => setSubjectFilter(subject.id)}
                style={subjectColorVars(subject.color)}
              >
                <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: 'var(--subject-base)' }} />
                {subject.name}
              </Chip>
            ))}
          </div>
        )}

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
          <ContinuousList events={upcoming} today={today} onAdd={() => setShowAdd(true)} />
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
                <PopEmptyState
                  size="sm"
                  icon={<CalendarPlus className="size-5 text-white" />}
                  title="Nada marcado para este dia."
                  description="Que tal planejar uma sessão de estudo ou lançar um compromisso?"
                  action={
                    !showAdd && (
                      <Button variant="pop" size="sm" onClick={() => setShowAdd(true)}>
                        <Plus aria-hidden />
                        Planejar algo
                      </Button>
                    )
                  }
                />
              ) : (
                <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-1">
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

      {/* Próximos eventos — só no desktop; no celular o modo "Lista" já cobre
          a mesma necessidade, e duas listas iguais empilhadas seriam ruído. */}
      <aside className="hidden space-y-4 lg:sticky lg:top-4 lg:block">
        <Card>
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {upcoming.length === 0 ? (
              <p className="text-muted p-2 text-sm">Nada por aqui pelos próximos dias.</p>
            ) : (
              <ul className="divide-border divide-y">
                {upcoming.slice(0, 10).map((event) => {
                  const Icon = eventIcon(event);
                  return (
                    <li
                      key={event.id}
                      style={subjectColorVars(event.subjectColor)}
                      className="flex items-center gap-3 px-2 py-2.5"
                    >
                      <span
                        aria-hidden
                        className="grid size-8 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="text-muted truncate text-xs">
                          {dayLabel(event.date, today)}
                          {event.subjectName && ` · ${event.subjectName}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Integração de calendário externo — fora de escopo desta rodada
            (exige credencial OAuth do Google/Microsoft que só o dono do
            projeto pode gerar). O cartão fica visível, com o botão
            desabilitado, em vez de sumir e parecer que a ideia foi
            esquecida. */}
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span
              aria-hidden
              className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl"
            >
              <CalendarSync className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Sincronize sua agenda</p>
              <p className="text-muted mt-0.5 text-xs leading-relaxed">
                Conecte com o Google Agenda e não perca seus compromissos.
              </p>
              <Button variant="secondary" size="sm" className="mt-2.5" disabled>
                Em breve
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

/**
 * "Adicionar compromisso" — um formulário de duas perguntas, não uma tela nova.
 *
 * Não existe tabela de evento (ver `server/actions.ts`): isto grava uma linha
 * simples em `tasks`, a mesma tabela que já alimenta o checklist do Hoje.
 * Chamado direto (sem `<form action>`) porque duas perguntas não justificam a
 * cerimônia de `useActionState` — o mesmo padrão de `StudyTimer`.
 */
function QuickAddTask({
  defaultDate,
  onDone,
  onCancel,
}: {
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) {
      setError('Dê um nome ao compromisso.');
      return;
    }
    startTransition(async () => {
      const result = await createAgendaTask(title, dueDate);
      if (result.ok) onDone();
      else setError(result.message ?? 'Não consegui salvar.');
    });
  }

  return (
    <div className="border-border bg-surface space-y-3 rounded-[20px] border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <Label htmlFor="quick-add-title">O que é o compromisso?</Label>
            <Input
              id="quick-add-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Ex.: Levar atestado"
              maxLength={120}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </div>
          <div>
            <Label htmlFor="quick-add-date">Quando</Label>
            <Input
              id="quick-add-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="text-subtle hover:text-text hover:bg-surface-2 grid size-11 shrink-0 place-items-center rounded-full"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <Button variant="pop" size="sm" className="w-full" onClick={submit} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
        {isPending ? 'Salvando…' : 'Salvar compromisso'}
      </Button>
    </div>
  );
}

/** Cartão de evento do kit: faixa da matéria, tile do tipo, data em destaque. */
function EventCard({ event, today }: { event: AgendaEvent; today: string }) {
  const Icon = eventIcon(event);
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
            {event.title}
          </h3>

          <p className="text-muted mt-0.5 text-xs leading-relaxed">
            {eventLabel(event)}
            {event.subjectName && ` · ${event.subjectName}`}
          </p>

          <p className={cn('mt-1 text-xs font-medium', urgent ? 'text-warning' : 'text-subtle')}>
            {dayLabel(event.date, today)}
          </p>
        </div>
      </div>
    </article>
  );
}

/** Modo lista: tudo daqui para a frente, agrupado por dia. */
function ContinuousList({
  events,
  today,
  onAdd,
}: {
  events: AgendaEvent[];
  today: string;
  onAdd: () => void;
}) {
  if (events.length === 0) {
    return (
      <PopEmptyState
        icon={<CalendarX className="text-white" />}
        title="Sua agenda está livre!"
        description="Que tal organizar sua próxima sessão de estudos ou lançar um compromisso?"
        action={
          <Button variant="pop" onClick={onAdd}>
            <Plus aria-hidden />
            Planejar meu estudo
          </Button>
        }
      />
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
