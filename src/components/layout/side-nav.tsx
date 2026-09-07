'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Home,
  Route as RouteIcon,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Coluna de navegação do desktop.
 *
 * Larga (não mais um trilho de ícones): a nova identidade Nexa Study tem 10
 * destinos, e ícone-sozinho-embaixo não escala pra isso — o rótulo ao lado do
 * ícone é o que deixa uma lista de 10 itens legível de relance. O agrupamento
 * em dois blocos (loop de estudo · métricas/biblioteca) segue a prévia visual
 * que o produto recebeu, não é estético: separa "o que eu faço" de "o que eu
 * consulto".
 *
 * O avatar fica na base, junto do cartão de incentivo — perfil não é um
 * destino do loop principal.
 */

interface NavItem {
  href: Route;
  label: string;
  Icon: typeof Home;
}

const PRIMARY_ITEMS: NavItem[] = [
  { href: '/hoje', label: 'Início', Icon: Home },
  { href: '/disciplinas', label: 'Matérias', Icon: BookOpen },
  { href: '/simulados', label: 'Simulados', Icon: ClipboardCheck },
  { href: '/trilhas', label: 'Trilhas', Icon: RouteIcon },
  { href: '/agenda', label: 'Agenda', Icon: CalendarDays },
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/nexa-ia', label: 'Nexa IA', Icon: Sparkles },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: '/estudar', label: 'Biblioteca', Icon: GraduationCap },
  { href: '/metas', label: 'Metas', Icon: Target },
  { href: '/desempenho', label: 'Desempenho', Icon: TrendingUp },
];

function NavLink({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
        active
          ? 'text-brand-fg font-semibold shadow-sm'
          : 'text-muted hover:bg-surface-2 hover:text-text font-medium',
      )}
      style={active ? { background: 'var(--gradient-header)' } : undefined}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden strokeWidth={active ? 2.3 : 1.9} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SideNav({
  name,
  avatarUrl,
}: {
  name?: string | null;
  avatarUrl?: string | null;
} = {}) {
  const pathname = usePathname();
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;
  const firstName = name?.trim()?.split(/\s+/)[0] ?? null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Navegação principal"
      className="border-border bg-surface hidden w-64 shrink-0 flex-col border-r md:flex"
    >
      <div className="sticky top-0 flex h-dvh flex-col gap-1 overflow-y-auto p-4">
        {/* Logo — placeholder até o arquivo de marca (SVG) chegar; a estrutura
            (ícone + wordmark de duas linhas) já é a definitiva. */}
        <Link href="/hoje" aria-label="Nexa Study · início" className="mb-5 flex items-center gap-2.5 px-1">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-xl text-base font-bold text-white"
            style={{ background: 'var(--gradient-header)' }}
          >
            N
          </span>
          <span className="leading-none">
            <span className="block text-base font-bold tracking-tight">NEXA</span>
            <span className="text-subtle block text-[10px] font-semibold tracking-[0.2em]">
              STUDY
            </span>
          </span>
        </Link>

        <div className="space-y-0.5">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="border-border my-3 border-t" />

        <div className="space-y-0.5">
          {SECONDARY_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        {/* Cartão de incentivo — fecha a coluna com identidade, como a prévia
            visual mostra em todas as telas. */}
        <div
          className="mt-4 rounded-2xl p-4 text-white"
          style={{ background: 'var(--gradient-header)' }}
        >
          <p className="text-sm leading-snug font-semibold">Seu estudo, mais longe.</p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">
            Disciplina hoje, resultados amanhã.
          </p>
        </div>

        <Link
          href="/perfil"
          aria-current={isActive('/perfil') ? 'page' : undefined}
          className={cn(
            'mt-3 flex items-center gap-2.5 rounded-xl p-2 transition-colors',
            isActive('/perfil') ? 'bg-brand-soft' : 'hover:bg-surface-2',
          )}
        >
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center overflow-hidden rounded-full',
              avatarUrl ? '' : 'bg-brand text-brand-fg',
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : initial ? (
              <span className="text-sm font-semibold">{initial}</span>
            ) : (
              <User className="size-4.5" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{firstName ?? 'Perfil'}</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
