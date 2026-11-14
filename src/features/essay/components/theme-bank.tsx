'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, Cpu, Heart, Landmark, Leaf, Palette, PenLine, Search, Users, Briefcase } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { PopEmptyState } from '@/components/ui/empty-state';
import { AXIS_BRAND, examBrand } from '@/features/vestibular/lib/exam-brand';
import type { EssayThemeItem } from '../server/queries';

const INSPIRED = '__inspirado__';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const AXIS_ICON: Record<string, typeof BookOpen> = {
  educacao: BookOpen,
  'meio-ambiente': Leaf,
  saude: Heart,
  tecnologia: Cpu,
  trabalho: Briefcase,
  cidadania: Landmark,
  cultura: Palette,
  sociedade: Users,
};

/**
 * Banco de temas: filtros à esquerda (em cima no celular) e cartões com capa.
 * Cada cartão leva direto para "Nova redação" com o tema já escolhido.
 */
export function ThemeBank({ themes }: { themes: EssayThemeItem[] }) {
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [axis, setAxis] = useState('');
  const [year, setYear] = useState('');

  const sources = useMemo(() => {
    const names = [...new Set(themes.filter((t) => t.kind === 'real').map((t) => t.examName).filter((n): n is string => Boolean(n)))];
    const order = ['ENEM', 'FUVEST', 'UNICAMP', 'UNESP', 'ITA'];
    return names.sort((a, b) => (order.indexOf(a) + 100) % 100 - (order.indexOf(b) + 100) % 100 || a.localeCompare(b));
  }, [themes]);
  const hasInspired = themes.some((t) => t.kind === 'inspirado');
  const axes = useMemo(() => [...new Set(themes.map((t) => t.axis).filter((a): a is string => Boolean(a)))], [themes]);
  const years = useMemo(() => [...new Set(themes.map((t) => t.year).filter((y): y is number => y !== null))].sort((a, b) => b - a), [themes]);

  const visible = themes.filter(
    (t) =>
      (!source || (source === INSPIRED ? t.kind === 'inspirado' : t.kind === 'real' && t.examName === source)) &&
      (!axis || t.axis === axis) &&
      (!year || String(t.year) === year) &&
      (!q.trim() || norm(`${t.title} ${t.context ?? ''} ${t.genre ?? ''}`).includes(norm(q))),
  );

  if (themes.length === 0) {
    return (
      <PopEmptyState
        icon={<PenLine className="size-6 text-white" aria-hidden />}
        title="Os temas estão chegando"
        description="Enquanto isso, você pode corrigir uma redação com um tema livre."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
      <aside aria-label="Filtros" className="border-border bg-surface space-y-5 rounded-2xl border p-4 lg:sticky lg:top-24">
        <p className="text-sm font-extrabold tracking-wide uppercase">Filtrar temas</p>

        <label className="relative block">
          <span className="sr-only">Buscar tema</span>
          <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por palavra"
            className="border-border bg-bg text-text focus-visible:ring-brand h-11 w-full rounded-xl border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
          />
        </label>

        <fieldset>
          <legend className="text-muted mb-2 text-xs font-semibold uppercase">Banca</legend>
          <div className="flex flex-wrap gap-2">
            <Chip active={source === ''} onClick={() => setSource('')}>Todas</Chip>
            {sources.map((n) => (
              <Chip key={n} active={source === n} onClick={() => setSource(n)}>
                {n}
              </Chip>
            ))}
            {hasInspired && (
              <Chip active={source === INSPIRED} onClick={() => setSource(INSPIRED)}>
                Inspirados
              </Chip>
            )}
          </div>
        </fieldset>

        {axes.length > 0 && (source === '' || source === INSPIRED) && (
          <fieldset>
            <legend className="text-muted mb-2 text-xs font-semibold uppercase">Assunto</legend>
            <div className="flex flex-wrap gap-2">
              <Chip active={axis === ''} onClick={() => setAxis('')}>Todos</Chip>
              {axes.map((a) => (
                <Chip key={a} active={axis === a} onClick={() => setAxis(a)}>
                  {AXIS_BRAND[a]?.label ?? a}
                </Chip>
              ))}
            </div>
          </fieldset>
        )}

        {years.length > 0 && (
          <label className="block">
            <span className="text-muted mb-2 block text-xs font-semibold uppercase">Ano da prova</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border-border bg-bg text-text h-11 w-full rounded-xl border px-3 text-sm outline-none"
            >
              <option value="">Todos os anos</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        )}
      </aside>

      <section aria-label="Temas">
        <p className="text-muted mb-3 text-sm" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'tema' : 'temas'}
        </p>
        {visible.length === 0 ? (
          <p className="text-muted py-6 text-sm">Nada com esses filtros. Tente afrouxar um deles.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {visible.map((t) => (
              <li key={t.id}>
                <ThemeCard theme={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ThemeCover({ theme: t }: { theme: EssayThemeItem }) {
  if (t.kind === 'real') {
    const b = examBrand(t.examName);
    return (
      <div className="relative flex h-32 flex-col justify-end p-4" style={{ background: b.bg, color: b.fg }}>
        <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">
          {t.proposalNo ? `Tema oficial · Proposta ${t.proposalNo}` : 'Tema oficial'}
        </p>
        <p className="text-3xl leading-none font-black" style={{ color: b.accent }}>
          {b.short} <span className="tabular-nums">{t.year}</span>
        </p>
      </div>
    );
  }
  const brand = AXIS_BRAND[t.axis ?? ''] ?? { bg: '#6D28D9', fg: '#FFFFFF', label: 'Tema' };
  const Icon = AXIS_ICON[t.axis ?? ''] ?? PenLine;
  return (
    <div className="relative flex h-32 flex-col justify-end overflow-hidden p-4" style={{ background: brand.bg, color: brand.fg }}>
      <Icon className="absolute -top-2 -right-2 size-24 opacity-15" aria-hidden />
      <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">Tema inspirado</p>
      <p className="text-xl leading-tight font-extrabold">{brand.label}</p>
    </div>
  );
}

function ThemeCard({ theme: t }: { theme: EssayThemeItem }) {
  return (
    <article className="border-border bg-surface flex h-full flex-col overflow-hidden rounded-2xl border">
      <ThemeCover theme={t} />
      <div className="flex flex-1 flex-col p-4">
        <span className="bg-brand-soft text-brand-text mb-2 inline-flex h-6 w-fit items-center rounded-full px-2.5 text-xs font-semibold">
          {t.genre ?? 'Dissertativo-argumentativo'}
        </span>
        <h3 className="text-[0.95rem] leading-snug font-semibold">{t.title}</h3>
        {t.context && <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{t.context}</p>}
        {t.note && <p className="text-subtle mt-2 line-clamp-3 text-xs leading-relaxed">{t.note}</p>}
        <p className="text-muted mt-3 text-xs leading-relaxed">
          <b className="font-semibold">Modelo de correção:</b> {t.model === 'enem' ? 'ENEM' : 'ENEM adaptado'}.
        </p>
        <div className="mt-auto pt-4">
          <Link
            href={`/vestibular/redacao/nova?tema=${t.id}`}
            className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors"
          >
            Escrever redação
          </Link>
        </div>
      </div>
    </article>
  );
}
