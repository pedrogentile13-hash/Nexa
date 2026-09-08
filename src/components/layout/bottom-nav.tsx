'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Home,
  Menu,
  Route as RouteIcon,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navegação principal do celular.
 *
 * CINCO alvos fixos, e cinco continua sendo o teto (em 390px, um sexto deixa
 * cada um com 65px, estreito demais pro polegar de quem anda enquanto usa).
 * A Nexa Study cresceu pra 10 seções, então o que não cabe no rodapé vai para
 * "Mais" — uma folha que sobe de baixo, não uma segunda barra escondida.
 *
 * Perfil e Admin também moram só em "Mais": nenhum dos dois tinha lugar
 * nenhum no celular antes disso — o avatar do `AppHeader` some em telas que
 * usam um cabeçalho próprio (o degradê de Hoje, por exemplo), e o item Admin
 * só existia na sidebar de desktop.
 *
 * Some no desktop — lá a mesma navegação vira sidebar (`SideNav`).
 */

const FIXED_ITEMS = [
  { href: '/hoje', label: 'Início', Icon: Home },
  { href: '/estudar', label: 'Biblioteca', Icon: GraduationCap },
  { href: '/agenda', label: 'Agenda', Icon: CalendarDays },
  { href: '/disciplinas', label: 'Matérias', Icon: BookOpen },
  { href: '/desempenho', label: 'Desempenho', Icon: TrendingUp },
] as const;

const MORE_ITEMS = [
  { href: '/simulados', label: 'Simulados', Icon: ClipboardCheck },
  { href: '/trilhas', label: 'Trilhas', Icon: RouteIcon },
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/nexa-ia', label: 'Nexa IA', Icon: Sparkles },
  { href: '/metas', label: 'Metas', Icon: Target },
  { href: '/perfil', label: 'Perfil', Icon: User },
] as const;

const ADMIN_ITEM = { href: '/admin', label: 'Admin', Icon: Shield } as const;

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const moreItems = isAdmin ? [...MORE_ITEMS, ADMIN_ITEM] : MORE_ITEMS;
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = moreItems.some((item) => isActive(item.href));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Mais opções de navegação"
            className="border-border bg-surface pb-safe absolute inset-x-0 bottom-0 rounded-t-[24px] border-t p-4 shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Mais</h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setMoreOpen(false)}
                className="text-subtle hover:bg-surface-2 grid size-9 place-items-center rounded-full"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {moreItems.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors',
                        active
                          ? 'border-brand/30 bg-brand-soft text-brand-text'
                          : 'border-border text-muted hover:bg-surface-2',
                      )}
                    >
                      <Icon className="size-5" aria-hidden strokeWidth={active ? 2.3 : 1.9} />
                      <span className="text-xs leading-tight font-medium">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <nav
        aria-label="Navegação principal"
        className={cn(
          'border-border bg-surface/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg',
          'pb-safe md:hidden',
        )}
      >
        <ul className="mx-auto flex max-w-lg">
          {FIXED_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-1 transition-colors',
                    active ? 'text-brand-text' : 'text-subtle hover:text-muted',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      active ? 'bg-brand-soft' : 'bg-transparent',
                    )}
                  >
                    <Icon className="size-[21px]" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
                  </span>
                  <span
                    className={cn(
                      'text-[10.5px] leading-none',
                      active ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}

          <li className="flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex h-16 w-full flex-col items-center justify-center gap-1 transition-colors',
                moreActive ? 'text-brand-text' : 'text-subtle hover:text-muted',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid h-7 w-12 place-items-center rounded-full transition-colors',
                  moreActive ? 'bg-brand-soft' : 'bg-transparent',
                )}
              >
                <Menu className="size-[21px]" aria-hidden strokeWidth={moreActive ? 2.4 : 1.9} />
              </span>
              <span
                className={cn(
                  'text-[10.5px] leading-none',
                  moreActive ? 'font-semibold' : 'font-medium',
                )}
              >
                Mais
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
