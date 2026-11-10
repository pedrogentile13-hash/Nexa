'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useMemo, useState } from 'react';
import { ArrowUpRight, BookMarked, Clock, FileText, Layers, Search, Target, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { examBrand } from '../lib/exam-brand';
import { TYPE_LABEL, filterLibrary, groupIntoShelves, subjectsOf, type LibraryItem, type LibraryType } from '../lib/library';
import { ExamCover } from './exam-cover';

const TYPES: { value: LibraryType | 'todos'; label: string; Icon: typeof Layers }[] = [
  { value: 'todos', label: 'Tudo', Icon: Layers },
  { value: 'simulado', label: 'Simulados', Icon: Timer },
  { value: 'prova', label: 'Cadernos oficiais', Icon: FileText },
  { value: 'quiz', label: 'Quizzes', Icon: Target },
  { value: 'resumo', label: 'Resumos', Icon: BookMarked },
];

/**
 * Biblioteca do Vestibular: uma estante por banca, com identidade própria (faixa escura, capas de caderno e
 * prateleiras que rolam de lado). É outra coisa que a Biblioteca do Nexa Study, que é por matéria e série.
 */
export function VestibularLibrary({ items, coverByBanca }: { items: LibraryItem[]; coverByBanca: Record<string, string | null> }) {
  const [type, setType] = useState<LibraryType | 'todos'>('todos');
  const [subject, setSubject] = useState('todas');
  const [search, setSearch] = useState('');

  const subjects = useMemo(() => subjectsOf(items), [items]);
  const visible = useMemo(() => filterLibrary(items, { type, subject, search }), [items, type, subject, search]);
  const shelves = useMemo(() => groupIntoShelves(visible), [visible]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: items.length };
    for (const i of items) c[i.type] = (c[i.type] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Faixa de entrada */}
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-6 text-white md:px-8 md:py-8"
        style={{ background: 'linear-gradient(135deg, #0B1B3F 0%, #14306B 55%, #1E4FA0 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'linear-gradient(to bottom right, #000, transparent 70%)' }}
        />
        <p className="relative text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">Biblioteca do Vestibular</p>
        <h2 className="relative mt-2 max-w-xl text-2xl leading-tight font-black md:text-3xl">Tudo o que cai na prova, numa estante só.</h2>
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-white/75">
          Simulados no estilo de cada banca, cadernos oficiais com gabarito, quizzes e resumos. Escolha a banca e comece.
        </p>
        <label className="relative mt-5 flex max-w-md items-center gap-2 rounded-full bg-white/10 px-4 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-amber-300">
          <Search className="size-4 shrink-0 text-white/70" aria-hidden />
          <span className="sr-only">Buscar na biblioteca</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar: ENEM, matemática, 2024…"
            className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
        </label>
      </section>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Tipo de material" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TYPES.filter((t) => t.value === 'todos' || (counts[t.value] ?? 0) > 0).map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={type === t.value}
              onClick={() => setType(t.value)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
                type === t.value ? 'border-transparent bg-[#14306B] text-white' : 'border-border bg-surface text-muted hover:bg-surface-2',
              )}
            >
              <t.Icon className="size-4" aria-hidden />
              {t.label}
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', type === t.value ? 'bg-white/20' : 'bg-surface-2')}>{counts[t.value] ?? 0}</span>
            </button>
          ))}
        </div>
        {subjects.length > 0 && (
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="Matéria"
            className="border-border bg-surface text-text h-10 rounded-xl border px-3 text-sm outline-none md:w-56"
          >
            <option value="todas">Todas as matérias</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Estantes */}
      {items.length === 0 ? (
        <p className="border-border bg-surface text-muted rounded-2xl border p-6 text-sm">
          A estante ainda está vazia. Assim que os simulados e os cadernos forem publicados, eles aparecem aqui.
        </p>
      ) : shelves.length === 0 ? (
        <p className="text-muted py-6 text-sm">Nada com esses filtros. Tente afrouxar um deles.</p>
      ) : (
        shelves.map((shelf) => {
          const brand = examBrand(shelf.banca === 'GERAL' ? null : shelf.banca);
          return (
            <section key={shelf.banca} aria-label={`Estante ${shelf.banca}`} className="space-y-3">
              <header className="flex items-center gap-3">
                <span className="h-9 w-1.5 rounded-full" style={{ background: shelf.banca === 'GERAL' ? '#6D28D9' : brand.bg }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg leading-none font-black tracking-tight">{shelf.banca === 'GERAL' ? 'Para qualquer vestibular' : brand.short}</h3>
                  <p className="text-muted mt-1 text-xs">
                    {shelf.items.length} {shelf.items.length === 1 ? 'material' : 'materiais'}
                  </p>
                </div>
              </header>
              <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
                {shelf.items.map((i) => (
                  <li key={i.key} className="w-40 shrink-0 snap-start sm:w-44">
                    <BookCard item={i} coverUrl={coverByBanca[i.banca] ?? null} />
                  </li>
                ))}
              </ul>
              <div className="h-1.5 rounded-full opacity-90" style={{ background: shelf.banca === 'GERAL' ? '#6D28D9' : brand.bg }} aria-hidden />
            </section>
          );
        })
      )}
    </div>
  );
}

function BookCard({ item: i, coverUrl }: { item: LibraryItem; coverUrl: string | null }) {
  return (
    <Link href={i.href as Route} className="group block focus-visible:outline-none">
      <div className="relative transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
        <ExamCover examName={i.banca === 'GERAL' ? 'Geral' : i.banca} year={i.year} label={i.type === 'prova' ? 'Caderno e gabarito' : TYPE_LABEL[i.type]} coverUrl={i.type === 'prova' ? coverUrl : null} />
        {i.bestPercent !== null && (
          <span className={cn('absolute top-2 right-2 rounded-full px-2 py-0.5 text-[0.7rem] font-bold tabular-nums shadow', i.bestPercent >= 60 ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-black')}>
            {i.bestPercent}%
          </span>
        )}
        <span className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-white/90 text-black opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
      <h4 className="mt-2 line-clamp-2 text-sm leading-snug font-semibold">{i.title}</h4>
      <p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
        {i.questionCount > 0 && <span>{i.questionCount} questões</span>}
        {i.minutes && (
          <span className="inline-flex items-center gap-0.5">
            <Clock className="size-3" aria-hidden />
            {i.minutes} min
          </span>
        )}
        {i.type === 'prova' && <span>Caderno oficial</span>}
        {!i.official && i.type !== 'resumo' && <span>No estilo da banca</span>}
      </p>
    </Link>
  );
}
