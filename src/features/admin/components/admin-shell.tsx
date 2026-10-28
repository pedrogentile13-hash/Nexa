'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Flag,
  GraduationCap,
  Megaphone,
  Layers,
  LayoutDashboard,
  Library,
  School,
  Bot,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { activeSection, sectionsFor, tabMatches, type IconKey } from '../lib/sections';
import type { AdminScope } from '../lib/scope';
import { CoMark } from '@/components/layout/school-brand';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { SearchBar } from '@/features/search/components/search-bar';
import { searchAdmin } from '@/features/search/server/actions';

/**
 * Shell do painel.
 *
 * Ao contrário do app do aluno, aqui o desktop é o formato principal: cadastrar
 * um simulado de 20 questões no celular é possível e ninguém faz. A navegação
 * é lateral em tela larga e vira uma faixa rolável no topo em tela estreita —
 * o suficiente para conferir e publicar do celular, não para escrever.
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

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: Route;
  label: string;
  Icon: typeof School;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-11 items-center gap-2.5 rounded-md px-3 text-sm whitespace-nowrap transition-colors',
        active
          ? 'bg-brand-soft text-brand-text font-semibold'
          : 'text-muted hover:bg-surface-2 hover:text-text font-medium',
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
      {label}
    </Link>
  );
}

/** Abas da seção atual (Turmas ↔ Professores, Mural ↔ Eventos…). Só aparece com 2+ abas. */
function SectionTabs({ scope }: { scope: AdminScope }) {
  const pathname = usePathname();
  const section = activeSection(sectionsFor(scope), pathname);
  if (!section || section.tabs.length < 2) return null;

  return (
    <nav aria-label={section.label} className="no-print border-border bg-surface flex gap-1 overflow-x-auto border-b px-5">
      {section.tabs.map((t) => {
        const active = tabMatches(t.href, pathname);
        return (
          <Link
            key={t.href}
            href={t.href as Route}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-11 shrink-0 items-center px-3 text-sm whitespace-nowrap',
              active ? 'text-brand-text font-semibold' : 'text-muted hover:text-text font-medium',
            )}
          >
            {t.label}
            {active && <span aria-hidden className="bg-brand absolute inset-x-2 bottom-0 h-0.5 rounded-full" />}
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
  const initial = fullName?.trim()?.[0]?.toUpperCase() ?? '?';
  const pathname = usePathname();
  const sections = sectionsFor(scope);
  const current = activeSection(sections, pathname);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="no-print border-border bg-surface shrink-0 border-b lg:w-60 lg:border-r lg:border-b-0">
        <div className="lg:sticky lg:top-0">
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 lg:block">
            <Link href="/admin" className="flex items-center gap-2.5">
              <CoMark className="size-8" />
              <span className="text-base font-semibold">
                Nexa Study <span className="text-muted font-normal">admin</span>
              </span>
            </Link>
            {/* Um school_admin precisa ver, sempre, de qual acervo ele está
                cuidando — senão publica para a escola errada sem perceber. */}
            <span className="text-subtle truncate text-xs lg:mt-2 lg:block lg:px-0.5">
              {scopeLabel}
            </span>
          </div>

          <nav
            aria-label="Navegação do painel"
            className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible"
          >
            {sections.map((section) => (
              <NavLink
                key={section.key}
                href={section.href as Route}
                label={section.label}
                Icon={ICONS[section.icon]}
                active={current?.key === section.key}
              />
            ))}
          </nav>

          <div className="border-border hidden border-t p-3 lg:block">
            <Link
              href="/hoje"
              className="text-muted hover:bg-surface-2 hover:text-text flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium"
            >
              <GraduationCap className="size-[18px]" aria-hidden />
              Voltar ao app
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Barra superior: busca de conteúdo/pessoas/escolas + sino +
            identidade de quem está logado. Fica aqui, uma vez só no shell, em
            vez de em cada AdminHeader — assim toda tela do painel ganha as
            três coisas de graça, sem repetir prop em cada página. */}
        <header className="no-print border-border bg-surface sticky top-0 z-30 flex items-center gap-3 border-b px-5 py-3">
          {/* No celular a barra lateral não fica visível (é uma faixa de
              navegação, não um menu fixo), e o "Voltar ao app" de lá some
              junto — sem isto, quem entra no painel pelo celular fica preso
              nele, sem nenhum jeito de voltar pro app do aluno. */}
          <Link
            href="/hoje"
            aria-label="Voltar ao app"
            className="text-muted hover:bg-surface-2 hover:text-text grid size-11 shrink-0 place-items-center rounded-md lg:hidden"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>

          <div className="min-w-0 flex-1">
            <SearchBar
              placeholder="Buscar conteúdos, usuários, escolas…"
              search={searchAdmin}
              contentOnlyAdminHref
            />
          </div>

          <NotificationBell />

          <div className="flex shrink-0 items-center gap-2.5 pl-1">
            <span className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-semibold">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold">{fullName ?? 'Você'}</span>
              <span className="text-subtle block text-xs">{roleLabel}</span>
            </span>
          </div>
        </header>

        <SectionTabs scope={scope} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

/** Cabeçalho padrão de página do painel. */
export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="border-border flex flex-wrap items-end justify-between gap-3 border-b px-5 py-5">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted mt-1 text-sm">{description}</p>}
      </div>
      {action}
    </header>
  );
}
