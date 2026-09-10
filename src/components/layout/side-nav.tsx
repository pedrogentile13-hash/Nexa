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
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
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
 * Espaçamento deliberadamente apertado (sem cartão de incentivo, sem folga
 * extra entre itens): com até 11 destinos + avatar, a coluna precisa caber
 * inteira sem rolar em janelas comuns — `overflow-y-auto` continua como rede
 * de segurança só para telas realmente baixas, não como plano principal.
 *
 * O avatar fica na base — perfil não é um destino do loop principal.
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
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
];

/** Só aparece para quem tem `role` admin/school_admin — ver `(app)/layout.tsx`. */
const ADMIN_ITEM: NavItem = { href: '/admin', label: 'Admin', Icon: Shield };

function NavLink({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
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
  isAdmin,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
} = {}) {
  const pathname = usePathname();
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;
  const firstName = name?.trim()?.split(/\s+/)[0] ?? null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const secondaryItems = isAdmin ? [...SECONDARY_ITEMS, ADMIN_ITEM] : SECONDARY_ITEMS;

  return (
    <nav
      aria-label="Navegação principal"
      className="border-border bg-surface hidden w-64 shrink-0 flex-col border-r md:flex"
    >
      <div className="sticky top-0 flex h-dvh flex-col gap-0.5 overflow-y-auto p-3">
        <Link href="/hoje" aria-label="Nexa Study · início" className="mb-3 flex items-center gap-2.5 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve, não precisa de otimização do next/image */}
          <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-9 shrink-0" />
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

        <div className="border-border my-2 border-t" />

        <div className="space-y-0.5">
          {secondaryItems.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="flex-1" />

        <Link
          href="/perfil"
          aria-current={isActive('/perfil') ? 'page' : undefined}
          className={cn(
            'mt-2 flex items-center gap-2.5 rounded-xl p-2 transition-colors',
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
