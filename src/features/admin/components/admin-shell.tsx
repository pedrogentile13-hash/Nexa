'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { BarChart3, Bot, Flag, GraduationCap, Layers, LayoutDashboard, Library, Megaphone, Menu, School, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StaffChat } from '@/features/staff-ia/components/staff-chat';
import { activeSection, sectionsFor, tabMatches, type IconKey } from '../lib/sections';
import type { AdminScope } from '../lib/scope';
import { CoMark } from '@/components/layout/school-brand';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { SearchBar } from '@/features/search/components/search-bar';
import { searchAdmin } from '@/features/search/server/actions';
import { Avatar } from '@/features/escola/components/ui';

/**
 * Shell do painel — mesmo visual do portal da escola: coluna lateral colorida no
 * computador, barra de atalhos no celular, abas em pílulas e cartões grandes e
 * arredondados. O desktop segue sendo o formato principal (cadastrar prova no
 * celular é possível, ninguém faz), mas tudo se adapta.
 */

const ICONS: Record<IconKey, typeof School> = {
  layout: LayoutDashboard,
  library: Library,
  layers: Layers,
  school: School,
  megaphone: Megaphone,
  flag: Flag,
  bot: Bot,
  chart: BarChart3,
  settings: Settings,
};

/** Abas da seção atual (Turmas ↔ Professores, Mural ↔ Eventos…). Só aparece com 2+ abas. */
function SectionTabs({ scope }: { scope: AdminScope }) {
  const pathname = usePathname();
  const section = activeSection(sectionsFor(scope), pathname);
  if (!section || section.tabs.length < 2) return null;

  return (
    <nav aria-label={section.label} className="no-print flex gap-2 overflow-x-auto px-5 pt-5 md:px-8">
      {section.tabs.map((t) => {
        const active = tabMatches(t.href, pathname);
        return (
          <Link
            key={t.href}
            href={t.href as Route}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              active ? 'bg-brand text-brand-fg shadow-sm' : 'bg-surface text-muted border-border hover:text-text border',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  scope,
  scopeLabel,
  fullName,
  avatarUrl,
  roleLabel,
}: {
  children: React.ReactNode;
  scope: AdminScope;
  scopeLabel: string;
  fullName: string | null;
  avatarUrl: string | null;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const sections = sectionsFor(scope);
  const current = activeSection(sections, pathname);
  const [more, setMore] = useState(false);
  const dock = sections.slice(0, 4);
  const rest = sections.slice(4);
  const name = fullName ?? 'Você';
  const back = scope === 'school' ? { href: '/escola', label: 'Portal da escola' } : { href: '/hoje', label: 'Voltar ao app' };

  return (
    <div className="bg-surface-2/60 min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="no-print sticky top-0 hidden h-dvh flex-col gap-6 p-5 text-white lg:flex" style={{ background: 'var(--gradient-header)' }}>
        <Link href="/admin" className="flex items-center gap-3">
          <CoMark className="size-11" />
          <span className="min-w-0">
            <span className="block text-base leading-tight font-semibold">Nexa Study</span>
            <span className="block text-xs opacity-80">Painel · {roleLabel}</span>
          </span>
        </Link>

        <nav aria-label="Navegação do painel" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {sections.map((section) => {
            const Icon = ICONS[section.icon];
            const active = current?.key === section.key;
            return (
              <Link
                key={section.key}
                href={section.href as Route}
                aria-current={active ? 'page' : undefined}
                className={cn('flex h-11 items-center gap-3 rounded-2xl px-4 text-sm transition-colors', active ? 'bg-white/25 font-semibold' : 'font-medium opacity-90 hover:bg-white/15')}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                <span className="truncate">{section.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2">
          <Link href={back.href as Route} className="flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium opacity-90 hover:bg-white/15">
            <GraduationCap className="size-[18px]" aria-hidden /> {back.label}
          </Link>
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
            <Avatar name={name} url={avatarUrl} className="size-9 bg-white/30 text-white" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs opacity-80">{scopeLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-10">
        {/* Topo (celular) */}
        <header className="pt-safe no-print sticky top-0 z-30 flex items-center gap-3 px-4 py-3 text-white lg:hidden" style={{ background: 'var(--gradient-header)' }}>
          <CoMark className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-semibold">Nexa Study</p>
            <p className="truncate text-[11px] opacity-80">{scopeLabel}</p>
          </div>
          <NotificationBell />
        </header>

        {/* Busca e sino */}
        <div className="no-print flex items-center gap-3 px-5 pt-5 md:px-8 md:pt-8">
          <div className="min-w-0 flex-1">
            <SearchBar placeholder="Buscar conteúdos, usuários, escolas…" search={searchAdmin} contentOnlyAdminHref />
          </div>
          <div className="hidden lg:block">
            <NotificationBell />
          </div>
        </div>

        <SectionTabs scope={scope} />
        <main className="min-w-0 md:[&>div]:px-8">{children}</main>
        <StaffChat />
      </div>

      {/* Atalhos (celular) */}
      <nav aria-label="Atalhos" className="pb-safe no-print bg-surface border-border fixed inset-x-0 bottom-0 z-40 border-t lg:hidden">
        <ul className="mx-auto flex max-w-lg">
          {dock.map((section) => {
            const Icon = ICONS[section.icon];
            const active = current?.key === section.key;
            return (
              <li key={section.key} className="flex-1">
                <Link href={section.href as Route} aria-current={active ? 'page' : undefined} className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[10.5px]', active ? 'text-brand-text font-semibold' : 'text-subtle font-medium')}>
                  <span className={cn('grid h-7 w-12 place-items-center rounded-full', active && 'bg-brand-soft')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="max-w-full truncate px-1">{section.label.split(' ')[0]}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button type="button" onClick={() => setMore(true)} className="text-subtle flex h-16 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium">
              <span className="grid h-7 w-12 place-items-center rounded-full"><Menu className="size-5" aria-hidden /></span>
              Mais
            </button>
          </li>
        </ul>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar" onClick={() => setMore(false)} className="absolute inset-0 bg-black/40" />
          <div role="dialog" aria-label="Mais opções" className="bg-surface pb-safe absolute inset-x-0 bottom-0 rounded-t-[28px] p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Mais</h2>
              <button type="button" onClick={() => setMore(false)} aria-label="Fechar" className="text-subtle grid size-9 place-items-center rounded-full"><X className="size-5" aria-hidden /></button>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {rest.map((section) => {
                const Icon = ICONS[section.icon];
                return (
                  <li key={section.key}>
                    <Link href={section.href as Route} onClick={() => setMore(false)} className={cn('flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-center text-xs font-medium', current?.key === section.key ? 'bg-brand-soft text-brand-text' : 'bg-surface-2 text-muted')}>
                      <Icon className="size-5" aria-hidden />
                      {section.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href={back.href as Route} className="bg-surface-2 text-muted flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-center text-xs font-medium">
                  <GraduationCap className="size-5" aria-hidden />
                  {back.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/** Cabeçalho padrão de página do painel. */
export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 px-5 pt-6 pb-1 md:px-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-muted mt-1 max-w-2xl text-sm md:text-base">{description}</p>}
      </div>
      {action}
    </header>
  );
}
