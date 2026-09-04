'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CalendarDays, Flame, GraduationCap, Sun, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navegação principal.
 *
 * CINCO itens, e cinco é o teto. Dashboard e Desempenho respondiam a mesma
 * pergunta ("como estou?") e viraram um; Estudar entrou porque responde uma
 * pergunta que nenhuma outra tela respondia ("com o que eu estudo isso?").
 *
 * Daqui para frente, todo formato novo — podcast, vídeo, o que vier — entra
 * DENTRO de Estudar, nunca na barra: em 390px, seis alvos deixam cada um com
 * 65px, estreito demais para o polegar de quem anda enquanto usa. Perfil vive
 * no avatar do cabeçalho, que é onde todo mundo já procura.
 *
 * Some no desktop — lá a mesma navegação vira sidebar.
 */

const ITEMS = [
  { href: '/hoje', label: 'Hoje', Icon: Sun },
  { href: '/agenda', label: 'Agenda', Icon: CalendarDays },
  { href: '/estudar', label: 'Estudar', Icon: GraduationCap },
  { href: '/disciplinas', label: 'Matérias', Icon: BookOpen },
  { href: '/desempenho', label: 'Desempenho', Icon: TrendingUp },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'border-border bg-surface/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg',
        'pb-safe md:hidden',
      )}
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
                <Icon
                  className={cn('size-[22px] transition-transform', active && 'scale-110')}
                  aria-hidden
                  strokeWidth={active ? 2.4 : 1.9}
                />
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
      </ul>
    </nav>
  );
}

/**
 * A mesma navegação em coluna, para telas largas.
 *
 * Carrega também o perfil e a sequência, que no celular vivem no cabeçalho.
 * No desktop o cabeçalho de cada tela é só título — repetir avatar e sequência
 * em toda página seria a mesma informação seis vezes na mesma sessão.
 */
export function SideNav({
  streak,
  name,
  avatarUrl,
}: {
  streak?: number;
  name?: string | null;
  avatarUrl?: string | null;
} = {}) {
  const pathname = usePathname();
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;

  return (
    <nav
      aria-label="Navegação principal"
      className="border-border bg-surface hidden w-56 shrink-0 border-r md:block"
    >
      <div className="sticky top-0 flex h-dvh flex-col gap-1 p-3">
        <Link href="/hoje" className="mb-4 flex items-center gap-2.5 px-2 py-2">
          <span
            aria-hidden
            className="bg-brand text-brand-fg grid size-8 place-items-center rounded-lg text-sm font-bold"
          >
            N
          </span>
          <span className="text-base font-semibold">Nexa</span>
        </Link>

        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-brand-soft text-brand-text font-semibold'
                  : 'text-muted hover:bg-surface-2 hover:text-text font-medium',
              )}
            >
              <Icon className="size-[18px]" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </Link>
          );
        })}

        <div className="mt-auto">
          {typeof streak === 'number' && streak > 0 && (
            <p className="bg-warning-soft text-warning mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold tabular-nums">
              <Flame className="size-4 shrink-0" aria-hidden />
              {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </p>
          )}

          <Link
            href="/perfil"
            aria-current={pathname === '/perfil' ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
              pathname === '/perfil'
                ? 'bg-brand-soft text-brand-text font-semibold'
                : 'text-muted hover:bg-surface-2 hover:text-text font-medium',
            )}
          >
            <span
              aria-hidden
              className="border-border bg-surface-2 grid size-[18px] shrink-0 place-items-center overflow-hidden rounded-full border"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : initial ? (
                <span className="text-[9px] font-semibold">{initial}</span>
              ) : (
                <User className="size-3" />
              )}
            </span>
            {name?.trim().split(/\s+/)[0] ?? 'Perfil'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
