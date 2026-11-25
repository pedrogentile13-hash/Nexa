'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countByStatus, groupMastery, STATUS_ORDER, type MasteryRow, type MasteryStatus } from '../lib/mastery-view';

const LABEL: Record<MasteryStatus, string> = { revisar: 'Revisar', desenvolvimento: 'Em evolução', dominado: 'Dominado' };
const DOT: Record<MasteryStatus, string> = { revisar: 'bg-danger', desenvolvimento: 'bg-warning', dominado: 'bg-success' };
const TEXT: Record<MasteryStatus, string> = { revisar: 'text-danger', desenvolvimento: 'text-warning', dominado: 'text-success' };

const PREVIEW = 5;

/**
 * Domínio por assunto (agrupado por matéria, cada matéria recolhida) ou por
 * habilidade (lista plana). Um filtro de situação e "ver mais" evitam a lista
 * interminável: a tela abre mostrando só o que pede atenção.
 */
export function MasteryPanel({ rows, grouped }: { rows: MasteryRow[]; grouped: boolean }) {
  const [filter, setFilter] = useState<MasteryStatus | 'todos'>('revisar');
  const counts = useMemo(() => countByStatus(rows), [rows]);

  // Abre no filtro que tem algo; se não há nada a revisar, mostra tudo.
  const active = filter !== 'todos' && counts[filter] === 0 ? 'todos' : filter;
  const visible = active === 'todos' ? rows : rows.filter((r) => r.status === active);

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Filtrar por situação" className="bg-surface-2 grid grid-cols-4 gap-1 rounded-2xl p-1">
        {(['todos', ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active === s}
            onClick={() => setFilter(s)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-xs font-medium transition-colors',
              active === s ? 'bg-surface text-brand-text shadow-sm' : 'text-muted',
            )}
          >
            <span className={cn('tabular text-base leading-none font-semibold', s !== 'todos' && active === s && TEXT[s])}>
              {s === 'todos' ? rows.length : counts[s]}
            </span>
            <span className="truncate">{s === 'todos' ? 'Todos' : LABEL[s]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted py-4 text-center text-sm">Nada nesta situação.</p>
      ) : grouped ? (
        <GroupedList rows={visible} />
      ) : (
        <FlatList rows={visible} />
      )}
    </div>
  );
}

function RowItem({ row }: { row: MasteryRow }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', DOT[row.status])} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
      <span className="text-muted shrink-0 text-xs tabular-nums">
        {row.correct}/{row.total} · {row.percent}%
      </span>
    </li>
  );
}

function FlatList({ rows }: { rows: MasteryRow[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, PREVIEW);
  return (
    <>
      <ul className="divide-border divide-y">{shown.map((r) => <RowItem key={r.name} row={r} />)}</ul>
      {rows.length > PREVIEW && <MoreButton open={all} total={rows.length} onClick={() => setAll((v) => !v)} />}
    </>
  );
}

function GroupedList({ rows }: { rows: MasteryRow[] }) {
  const groups = useMemo(() => groupMastery(rows), [rows]);
  const [openName, setOpenName] = useState<string | null>(groups[0]?.name ?? null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  return (
    <ul className="space-y-2">
      {groups.map((g) => {
        const open = openName === g.name;
        const showAll = expanded.has(g.name);
        const shown = showAll ? g.rows : g.rows.slice(0, PREVIEW);
        return (
          <li key={g.name} className="border-border overflow-hidden rounded-xl border">
            <button
              type="button"
              onClick={() => setOpenName(open ? null : g.name)}
              aria-expanded={open}
              className="hover:bg-surface-2 flex w-full items-center gap-3 px-3.5 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{g.name}</span>
                <span className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                  {STATUS_ORDER.map((s) =>
                    g.counts[s] > 0 ? <span key={s} className={cn('h-full', DOT[s])} style={{ flexGrow: g.counts[s] }} /> : null,
                  )}
                </span>
              </span>
              <span className="text-muted shrink-0 text-xs tabular-nums">
                {g.rows.length} {g.rows.length === 1 ? 'assunto' : 'assuntos'}
              </span>
              <ChevronDown className={cn('text-subtle size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
            </button>
            {open && (
              <div className="border-border border-t px-3.5 pb-2">
                <ul className="divide-border divide-y">{shown.map((r) => <RowItem key={r.name} row={r} />)}</ul>
                {g.rows.length > PREVIEW && (
                  <MoreButton
                    open={showAll}
                    total={g.rows.length}
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(g.name)) next.delete(g.name);
                        else next.add(g.name);
                        return next;
                      })
                    }
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MoreButton({ open, total, onClick }: { open: boolean; total: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-brand-text mt-1 h-10 w-full text-sm font-semibold">
      {open ? 'Mostrar menos' : `Ver todos (${total})`}
    </button>
  );
}
