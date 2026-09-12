'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Bell, GraduationCap, Layers, LayoutDashboard, Library, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

/**
 * Shell da área do professor — construído do zero, de propósito.
 *
 * O usuário pediu explicitamente uma área NOVA e personalizada, separada do
 * painel admin: não é `AdminShell` com um item a mais. A navegação é bem
 * mais enxuta (4 destinos, sem sub-menus) porque o escopo de um professor
 * também é — matéria(s)+turma(s) atribuídas, nunca a escola inteira.
 */

const ITEMS = [
  { href: '/professor', label: 'Painel', Icon: LayoutDashboard, exact: true },
  { href: '/professor/turmas', label: 'Turmas', Icon: Layers },
  { href: '/professor/conteudo', label: 'Conteúdo', Icon: Library },
  { href: '/professor/avisos', label: 'Avisos', Icon: Bell },
  { href: '/professor/nexaai', label: 'NexaAI', Icon: Sparkles },
] as const;

function useActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  Icon,
  exact,
}: {
  href: Route;
  label: string;
  Icon: typeof Layers;
  exact?: boolean;
}) {
  const active = useActive(href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
        'h-11',
        active
          ? 'bg-brand-soft text-brand-text font-semibold'
          : 'text-muted hover:bg-surface-2 hover:text-text',
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
      {label}
    </Link>
  );
}

export function TeacherShell({
  children,
  scopeLabel,
  fullName,
  avatarUrl,
}: {
  children: React.ReactNode;
  scopeLabel: string;
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const initial = fullName?.trim()[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="no-print border-border bg-surface shrink-0 border-b lg:w-60 lg:border-r lg:border-b-0">
        <div className="lg:sticky lg:top-0">
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 lg:block">
            <Link href="/professor" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve, não precisa de otimização do next/image */}
              <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-8 shrink-0" />
              <span className="text-base font-semibold">
                Nexa Study <span className="text-muted font-normal">professor</span>
              </span>
            </Link>
            <span className="text-subtle truncate text-xs lg:mt-2 lg:block lg:px-0.5">
              {scopeLabel}
            </span>
          </div>

          <nav
            aria-label="Navegação do professor"
            className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible"
          >
            {ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
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
        <header className="no-print border-border bg-surface sticky top-0 z-30 flex items-center gap-3 border-b px-5 py-3">
          <Link
            href="/hoje"
            aria-label="Voltar ao app"
            className="text-muted hover:bg-surface-2 hover:text-text grid size-11 shrink-0 place-items-center rounded-md lg:hidden"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>

          <div className="min-w-0 flex-1" />

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
              <span className="text-subtle block text-xs">Professor</span>
            </span>
          </div>
        </header>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

/** Cabeçalho padrão de página do professor — mesmo padrão do `AdminHeader`. */
export function TeacherHeader({
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
