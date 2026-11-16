'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RESOURCE_KIND_ICON as ICONS } from '@/lib/design/resource-kind';
import { humanDuration, KIND_META } from '../lib/format';
import type { ColegioItem, ColegioView } from '../lib/colegio';

/**
 * Biblioteca do colégio: ano → matéria → prova. Cada prova é um "azulejo" de cor própria (como as capas de caderno da
 * Biblioteca do Vestibular); tocar nele abre a lista de resumos, quizzes e simulados daquela prova.
 */
export function ColegioLibrary({ data }: { data: ColegioView }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);

  function setYear(year: number) {
    const next = new URLSearchParams(params.toString());
    next.set('origem', 'colegio');
    next.set('ano', String(year));
    router.push(`/estudar?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-6 text-white md:px-8 md:py-7"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 60%, #7C3AED 100%)' }}
      >
        <GraduationCap
          aria-hidden
          className="pointer-events-none absolute -top-4 -right-4 size-32 text-white/10"
        />
        <p className="relative text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
          {data.label}
        </p>
        <h2 className="relative mt-2 max-w-xl text-2xl leading-tight font-black md:text-3xl">
          Tudo o que cai nas suas provas, em um só lugar.
        </h2>
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-white/75">
          Escolha o ano, a matéria e a prova. Cada bloco reúne resumos e simulados feitos para ela.
        </p>
      </section>

      <div role="tablist" aria-label="Ano" className="flex gap-2">
        {data.years.map((y) => (
          <button
            key={y}
            type="button"
            role="tab"
            aria-selected={data.year === y}
            onClick={() => setYear(y)}
            className={cn(
              'h-10 rounded-full border px-5 text-sm font-semibold tabular-nums transition-colors',
              data.year === y
                ? 'border-transparent bg-[#4C1D95] text-white'
                : 'border-border bg-surface text-muted hover:bg-surface-2',
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {data.subjects.length === 0 ? (
        <p className="border-border bg-surface text-muted rounded-2xl border p-6 text-sm">
          Ainda não há provas de {data.year} por aqui. Quando a escola publicar, os blocos aparecem
          nesta tela.
        </p>
      ) : (
        data.subjects.map((subject) => (
          <section key={subject.name} aria-label={subject.name} className="space-y-3">
            <header className="flex items-center gap-3">
              <span
                className="h-8 w-1.5 rounded-full"
                style={{ backgroundColor: subject.color }}
                aria-hidden
              />
              <h3 className="text-lg leading-none font-black tracking-tight">{subject.name}</h3>
            </header>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {subject.tiles.map((tile) => {
                const key = `${subject.name}|${tile.block.code}`;
                const isOpen = open === key;
                const resumos = tile.items.filter((i) => i.kind === 'resumo').length;
                const simulados = tile.items.filter(
                  (i) => i.kind === 'simulado' || i.kind === 'quiz',
                ).length;
                return (
                  <li key={key} className="min-w-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : key)}
                      className={cn(
                        'group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-2xl p-3.5 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none',
                        isOpen && 'ring-2 ring-amber-300',
                      )}
                      style={{
                        background: `linear-gradient(160deg, ${tile.block.from} 0%, ${tile.block.to} 100%)`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-15"
                        style={{
                          backgroundImage:
                            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                          backgroundSize: '22px 22px',
                        }}
                      />
                      <span className="relative text-[0.65rem] font-semibold tracking-[0.18em] text-white/70 uppercase">
                        {data.year} · {subject.name === 'Todas as matérias' ? 'Geral' : 'Prova'}
                      </span>
                      <span className="relative">
                        <span className="block text-4xl leading-none font-black tracking-tight">
                          {tile.block.title}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-white/80">
                          {tile.block.subtitle}
                        </span>
                      </span>
                      <span className="relative flex items-center justify-between text-[0.7rem] font-medium text-white/85">
                        <span className="tabular-nums">
                          {[
                            simulados > 0
                              ? `${simulados} ${simulados === 1 ? 'simulado' : 'simulados'}`
                              : null,
                            resumos > 0
                              ? `${resumos} ${resumos === 1 ? 'resumo' : 'resumos'}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {subject.tiles.map((tile) => {
              const key = `${subject.name}|${tile.block.code}`;
              if (open !== key) return null;
              return (
                <div key={key} className="border-border bg-surface rounded-2xl border p-3">
                  <p className="text-muted px-1 pb-2 text-xs font-semibold tracking-wide uppercase">
                    {tile.block.title} · {subject.name}
                  </p>
                  <ul className="grid gap-2 md:grid-cols-2">
                    {tile.items.map((item) => (
                      <li key={item.id} className="min-w-0">
                        <ItemRow item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}

function ItemRow({ item }: { item: ColegioItem }) {
  const Icon = ICONS[item.kind];
  const duration = humanDuration(item.durationSeconds);
  return (
    <Link
      href={`/estudar/${item.id}`}
      className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-md"
        style={{ backgroundColor: `${item.subjectColor}22`, color: item.subjectColor }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{item.title}</span>
        <span className="text-muted block truncate text-xs">
          {[
            KIND_META[item.kind].label,
            item.questionCount > 0 ? `${item.questionCount} questões` : null,
            duration,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      {item.progressPercent > 0 && (
        <span className="text-subtle shrink-0 text-xs font-semibold tabular-nums">
          {Math.round(item.progressPercent)}%
        </span>
      )}
    </Link>
  );
}
