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
  Newspaper,
  Route as RouteIcon,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformSwitcher, resolveActivePlatform } from './platform-switcher';
import type { Journey } from '@/types/database.types';

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
  { href: '/nexa-ia', label: 'NexaAI', Icon: Sparkles },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: '/estudar', label: 'Biblioteca', Icon: GraduationCap },
  { href: '/metas', label: 'Metas', Icon: Target },
  { href: '/desempenho', label: 'Desempenho', Icon: TrendingUp },
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
];

/** Só aparece para quem tem `role` admin/school_admin — ver `(app)/layout.tsx`. */
const ADMIN_ITEM: NavItem = { href: '/admin', label: 'Admin', Icon: Shield };
/** Só aparece para quem tem `role` teacher_admin — ver `(app)/layout.tsx`. */
const TEACHER_ITEM: NavItem = { href: '/professor', label: 'Professor', Icon: Users2 };
/** Só aparece com a feature flag `community_enabled` ligada — ver `(app)/layout.tsx`. */
const COMMUNITY_ITEM: NavItem = { href: '/comunidade', label: 'Comunidade', Icon: Newspaper };

/**
 * Nexa Vestibular — o menu TROCA dentro de `/vestibular/**` em vez de somar
 * mais itens ao menu da escola. São dois ambientes do mesmo app (item #3 do
 * plano do Vestibular): quem está estudando pra prova não quer "Matérias" e
 * "Bimestre" competindo com "Questões" na mesma coluna. O que é do núcleo
 * (Comunidade, Ranking, NexaAI, Perfil) segue disponível nos dois.
 */
const VESTIBULAR_PRIMARY_ITEMS: NavItem[] = [
  { href: '/vestibular', label: 'Início', Icon: Home },
  { href: '/vestibular/plano', label: 'Plano de estudo', Icon: RouteIcon },
  { href: '/vestibular/questoes', label: 'Questões', Icon: ClipboardCheck },
  { href: '/vestibular/erros', label: 'Central de erros', Icon: Target },
  { href: '/vestibular/desempenho', label: 'Desempenho', Icon: TrendingUp },
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/nexa-ia', label: 'NexaAI', Icon: Sparkles },
];

const VESTIBULAR_SECONDARY_ITEMS: NavItem[] = [
  { href: '/estudar', label: 'Biblioteca', Icon: GraduationCap },
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
];

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
  isTeacher,
  communityEnabled,
  vestibularEnabled,
  journey = 'school',
}: {
  name?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  isTeacher?: boolean;
  communityEnabled?: boolean;
  vestibularEnabled?: boolean;
  journey?: Journey;
} = {}) {
  const pathname = usePathname();
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;
  const firstName = name?.trim()?.split(/\s+/)[0] ?? null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // A jornada decide o menu padrão; a URL só manda quando você entra na
  // outra plataforma. É o que faz um vestibulando ver a navegação dele
  // também em Revisões e Biblioteca, que são telas compartilhadas.
  const inVestibular =
    Boolean(vestibularEnabled) && resolveActivePlatform(pathname, journey) === 'vestibular';

  const primaryItems = inVestibular
    ? [...VESTIBULAR_PRIMARY_ITEMS, ...(communityEnabled ? [COMMUNITY_ITEM] : [])]
    : [...PRIMARY_ITEMS, ...(communityEnabled ? [COMMUNITY_ITEM] : [])];
  const secondaryItems = inVestibular
    ? VESTIBULAR_SECONDARY_ITEMS
    : [
        ...SECONDARY_ITEMS,
        ...(isAdmin ? [ADMIN_ITEM] : []),
        ...(isTeacher ? [TEACHER_ITEM] : []),
      ];

  return (
    <nav
      aria-label="Navegação principal"
      className="border-border bg-surface hidden w-64 shrink-0 flex-col border-r md:flex"
    >
      <div className="sticky top-0 flex h-dvh flex-col gap-0.5 overflow-y-auto p-3">
        <PlatformSwitcher
          journey={journey}
          vestibularEnabled={vestibularEnabled}
          variant="full"
          className="mb-3"
        />

        <div className="space-y-0.5">
          {primaryItems.map((item) => (
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
