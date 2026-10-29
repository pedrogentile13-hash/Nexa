'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildMonthGrid, monthLabel, shiftMonthKeepingDay } from '@/lib/date/month-grid';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { cn } from '@/lib/utils';

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Calendário do mês, em miniatura, para o topo de Hoje.
 *
 * É decorativo/informativo, não o planejamento em si — por isso os pontinhos
 * só existem para os dias dentro do horizonte que Hoje já buscou (14 dias):
 * navegar para outro mês mostra a grade sem pontos em vez de inventar dado
 * que a consulta de Hoje nunca trouxe. Quem quer editar a agenda vai pra
 * `/agenda`, que é quem tem o dado completo.
 */
export function MiniCalendar({
  today,
  dotsByDate,
}: {
  today: string;
  dotsByDate: Map<string, string[]>;
}) {
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const grid = buildMonthGrid(cursor);

  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{monthLabel(cursor)}</h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setCursor((c) => shiftMonthKeepingDay(`${c}-01`, -1).slice(0, 7))}
            className="text-muted hover:bg-surface-2 grid size-8 place-items-center rounded-full"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setCursor((c) => shiftMonthKeepingDay(`${c}-01`, 1).slice(0, 7))}
            className="text-muted hover:bg-surface-2 grid size-8 place-items-center rounded-full"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="text-subtle mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium">
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const dots = dotsByDate.get(day) ?? [];
          const isToday = day === today;

          return (
            <span
              key={day}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-lg text-[11px]',
                isToday ? 'bg-brand text-brand-fg font-semibold' : 'text-muted',
              )}
            >
              <span className="tabular">{Number(day.slice(8, 10))}</span>
              <span className="mt-0.5 flex h-1 gap-0.5">
                {dots.slice(0, 3).map((color, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={subjectColorVars(color)}
                    className="block size-1 rounded-full"
                  >
                    <span
                      className="block size-1 rounded-full"
                      style={{
                        backgroundColor: isToday ? 'var(--brand-fg)' : 'var(--subject-base)',
                      }}
                    />
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </div>

      <Link
        href="/agenda"
        className="text-brand-text mt-3 block text-center text-xs font-semibold"
      >
        Ver agenda completa
      </Link>
    </div>
  );
}
