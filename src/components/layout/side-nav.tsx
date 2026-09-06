'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { BookOpen, CalendarDays, GraduationCap, Sun, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Coluna de navegação do desktop.
 *
 * Estreita e vertical, como o guia de desktop especifica: ícone com rótulo
 * pequeno embaixo, item ativo num cartão azul-claro. A largura curta é
 * deliberada — no desktop o espaço horizontal é o recurso escasso do CONTEÚDO,
 * não da navegação, e cinco destinos não precisam de 224px para caber.
 *
 * O avatar fica na base, longe dos destinos: perfil não é um lugar para onde se
 * vai o tempo todo, e colocá-lo na mesma fileira dos outros o faria disputar
 * atenção com eles em toda tela.
 */

const ITEMS: { href: Route; label: string; Icon: typeof Sun }[] = [
  { href: '/hoje', label: 'Hoje', Icon: Sun },
  { href: '/agenda', label: 'Agenda', Icon: CalendarDays },
  { href: '/estudar', label: 'Estudar', Icon: GraduationCap },
  { href: '/disciplinas', label: 'Matérias', Icon: BookOpen },
  { href: '/desempenho', label: 'Desemp.', Icon: TrendingUp },
];

export function SideNav({
  name,
  avatarUrl,
}: {
  name?: string | null;
  avatarUrl?: string | null;
} = {}) {
  const pathname = usePathname();
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;
  const profileActive = pathname === '/perfil';

  return (
    <nav
      aria-label="Navegação principal"
      className="border-border bg-surface hidden w-[88px] shrink-0 border-r md:block"
    >
      <div className="sticky top-0 flex h-dvh flex-col items-center gap-1 py-4">
        <Link
          href="/hoje"
          aria-label="Nexa · início"
          className="bg-brand text-brand-fg mb-4 grid size-11 shrink-0 place-items-center rounded-2xl"
        >
          <GraduationCap className="size-5" aria-hidden />
        </Link>

        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex w-[68px] flex-col items-center gap-1 rounded-2xl py-2.5 transition-colors',
                active
                  ? 'bg-brand-soft text-brand-text font-semibold'
                  : 'text-subtle hover:bg-surface-2 hover:text-muted font-medium',
              )}
            >
              <Icon className="size-[22px]" aria-hidden strokeWidth={active ? 2.4 : 1.9} />
              <span className="text-[11px] leading-none">{label}</span>
            </Link>
          );
        })}

        <Link
          href="/perfil"
          aria-current={profileActive ? 'page' : undefined}
          aria-label={name ? `Perfil de ${name}` : 'Abrir perfil'}
          className={cn(
            'mt-auto grid size-11 shrink-0 place-items-center overflow-hidden rounded-full transition-colors',
            profileActive ? 'ring-brand ring-2' : '',
            avatarUrl ? '' : 'bg-brand text-brand-fg',
          )}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : initial ? (
            <span className="text-sm font-semibold">{initial}</span>
          ) : (
            <User className="size-5" aria-hidden />
          )}
        </Link>
      </div>
    </nav>
  );
}
