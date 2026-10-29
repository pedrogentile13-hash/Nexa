'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Eye,
  GraduationCap,
  Home,
  Inbox,
  KeyRound,
  Layers,
  Library,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoMark } from '@/components/layout/school-brand';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { signOut } from '@/features/auth/server/actions';
import { STAFF_ROLE_LABEL, type NavEntry, type NavIcon, type StaffRole } from '../lib/access';
import { Avatar } from './ui';

const ICONS: Record<NavIcon, typeof Home> = {
  home: Home,
  classes: Layers,
  students: Users,
  megaphone: Megaphone,
  teachers: GraduationCap,
  plan: ClipboardList,
  chat: MessageCircle,
  inbox: Inbox,
  accounts: KeyRound,
  eye: Eye,
  library: Library,
};

function isActive(pathname: string, href: string): boolean {
  return href === '/escola' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Moldura do portal da equipe ("Nexa Escola"). Visual próprio: coluna lateral
 * colorida com a marca da escola no computador; no celular, uma barra de atalhos
 * embaixo e um menu "Mais". Nada aqui vem do painel admin.
 */
export function EscolaShell({
  nav,
  role,
  schoolName,
  fullName,
  avatarUrl,
  children,
}: {
  nav: NavEntry[];
  role: StaffRole;
  schoolName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const dock = nav.slice(0, 4);
  const rest = nav.slice(4);
  const restActive = rest.some((n) => isActive(pathname, n.href));
  const name = fullName ?? 'Você';

  return (
    <div className="bg-surface-2/60 min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Coluna lateral (computador) */}
      <aside
        className="sticky top-0 hidden h-dvh flex-col gap-6 p-5 text-white lg:flex"
        style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg, #fff)' }}
      >
        <div className="flex items-center gap-3">
          <CoMark className="size-11" />
          <div className="min-w-0">
            <p className="truncate text-base leading-tight font-semibold">{schoolName ?? 'Nexa Escola'}</p>
            <p className="text-xs opacity-80">{STAFF_ROLE_LABEL[role]}</p>
          </div>
        </div>

        <nav aria-label="Portal da escola" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((n) => {
            const Icon = ICONS[n.icon];
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href as Route}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-2xl px-4 text-sm transition-colors',
                  active ? 'bg-white/25 font-semibold' : 'font-medium opacity-90 hover:bg-white/15',
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
          <Avatar name={name} url={avatarUrl} className="size-9 bg-white/30 text-white" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100">
                <LogOut className="size-3" aria-hidden /> Sair
              </button>
            </form>
          </div>
          <NotificationBell />
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-10">
        {/* Topo (celular) */}
        <header className="pt-safe sticky top-0 z-30 flex items-center gap-3 px-4 py-3 text-white lg:hidden" style={{ background: 'var(--gradient-header)' }}>
          <CoMark className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-semibold">{schoolName ?? 'Nexa Escola'}</p>
            <p className="text-[11px] opacity-80">{STAFF_ROLE_LABEL[role]}</p>
          </div>
          <NotificationBell />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>

      {/* Barra de atalhos (celular) */}
      <nav aria-label="Atalhos" className="pb-safe bg-surface border-border fixed inset-x-0 bottom-0 z-40 border-t lg:hidden">
        <ul className="mx-auto flex max-w-lg">
          {dock.map((n) => {
            const Icon = ICONS[n.icon];
            const active = isActive(pathname, n.href);
            return (
              <li key={n.href} className="flex-1">
                <Link
                  href={n.href as Route}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[10.5px]', active ? 'text-brand-text font-semibold' : 'text-subtle font-medium')}
                >
                  <span className={cn('grid h-7 w-12 place-items-center rounded-full', active && 'bg-brand-soft')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {n.label}
                </Link>
              </li>
            );
          })}
          {rest.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMore(true)}
                className={cn('flex h-16 w-full flex-col items-center justify-center gap-1 text-[10.5px]', restActive ? 'text-brand-text font-semibold' : 'text-subtle font-medium')}
              >
                <span className={cn('grid h-7 w-12 place-items-center rounded-full', restActive && 'bg-brand-soft')}>
                  <Menu className="size-5" aria-hidden />
                </span>
                Mais
              </button>
            </li>
          )}
        </ul>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar" onClick={() => setMore(false)} className="absolute inset-0 bg-black/40" />
          <div role="dialog" aria-label="Mais opções" className="bg-surface pb-safe absolute inset-x-0 bottom-0 rounded-t-[28px] p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Mais</h2>
              <button type="button" onClick={() => setMore(false)} aria-label="Fechar" className="text-subtle grid size-9 place-items-center rounded-full">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {rest.map((n) => {
                const Icon = ICONS[n.icon];
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href as Route}
                      onClick={() => setMore(false)}
                      className={cn('flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-center text-xs font-medium', isActive(pathname, n.href) ? 'bg-brand-soft text-brand-text' : 'bg-surface-2 text-muted')}
                    >
                      <Icon className="size-5" aria-hidden />
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <form action={signOut} className="mt-4">
              <button type="submit" className="text-muted flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium">
                <LogOut className="size-4" aria-hidden /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
