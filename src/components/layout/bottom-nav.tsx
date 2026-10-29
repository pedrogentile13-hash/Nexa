'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Home,
  Megaphone,
  Menu,
  MessageCircle,
  Newspaper,
  PenLine,
  Route as RouteIcon,
  RotateCcw,
  School,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveActivePlatform } from './platform-switcher';
import type { Journey } from '@/types/database.types';

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
] as const;

const STUDY_ITEMS = [
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/metas', label: 'Metas', Icon: Target },
  { href: '/desempenho', label: 'Desempenho', Icon: TrendingUp },
] as const;

const ACCOUNT_ITEMS = [
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
  { href: '/perfil', label: 'Perfil', Icon: User },
] as const;

const ADMIN_ITEM = { href: '/admin', label: 'Admin', Icon: Shield } as const;
const TEACHER_ITEM = { href: '/professor', label: 'Professor', Icon: Users2 } as const;
const COMMUNITY_ITEM = { href: '/comunidade', label: 'Comunidade', Icon: Newspaper } as const;
const CHAT_ITEM = { href: '/chat', label: 'Professores', Icon: MessageCircle } as const;
const ANNOUNCEMENTS_ITEM = { href: '/avisos', label: 'Avisos', Icon: Megaphone } as const;
const VESTIBULAR_ITEM = { href: '/vestibular', label: 'Vestibular', Icon: GraduationCap } as const;
const SCHOOL_ITEM = { href: '/hoje', label: 'Escola', Icon: School } as const;

/**
 * Dentro de `/vestibular/**` os cinco alvos fixos TROCAM (mesma decisão da
 * `SideNav`): cinco continua sendo o teto no celular, então somar não é
 * opção — quem está em preparação não precisa de "Matérias" e "Agenda" no
 * polegar, precisa de "Questões".
 */
const VESTIBULAR_FIXED_ITEMS = [
  { href: '/vestibular', label: 'Início', Icon: Home },
  { href: '/vestibular/plano', label: 'Plano', Icon: RouteIcon },
  { href: '/vestibular/questoes', label: 'Questões', Icon: ClipboardCheck },
] as const;

/**
 * Cinco continua sendo o teto, então entrar é sempre alguém sair. Saíram
 * "Biblioteca" e "Revisões", que são destinos ocasionais; entraram "Plano" e
 * "Erros", que são as duas telas que alguém em preparação abre todo dia.
 */
const VESTIBULAR_MORE_ITEMS = [
  { href: '/vestibular/redacao', label: 'Redação', Icon: PenLine },
  { href: '/vestibular/desempenho', label: 'Desempenho', Icon: TrendingUp },
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/estudar', label: 'Biblioteca', Icon: GraduationCap },
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
  { href: '/perfil', label: 'Perfil', Icon: User },
] as const;

type NavItem = { href: string; label: string; Icon: typeof Home };

export function BottomNav({
  isAdmin = false,
  isTeacher = false,
  communityEnabled = false,
  chatEnabled = false,
  announcementsEnabled = false,
  unreadAnnouncements = 0,
  vestibularEnabled = false,
  journey = 'school',
}: {
  isAdmin?: boolean;
  isTeacher?: boolean;
  communityEnabled?: boolean;
  /** O aluno tem professores ligados à turma dele (chat da escola). */
  chatEnabled?: boolean;
  /** O usuário pertence a uma escola (mural de avisos). */
  announcementsEnabled?: boolean;
  unreadAnnouncements?: number;
  vestibularEnabled?: boolean;
  journey?: Journey;
}) {
  const pathname = usePathname();
  // Mesma regra da `SideNav`: a jornada decide o menu padrão, a URL só manda
  // quando a pessoa entra na outra plataforma.
  const inVestibular =
    vestibularEnabled && resolveActivePlatform(pathname, journey) === 'vestibular';

  const fixedItems = inVestibular ? VESTIBULAR_FIXED_ITEMS : FIXED_ITEMS;
  const sections: { title: string; items: readonly NavItem[] }[] = inVestibular
    ? [
        {
          title: 'Vestibular',
          items: VESTIBULAR_MORE_ITEMS.filter(
            (i) =>
              i.href.startsWith('/vestibular') || i.href === '/revisoes' || i.href === '/estudar',
          ),
        },
        {
          title: 'Mais',
          items: [
            SCHOOL_ITEM,
            ...(communityEnabled ? [COMMUNITY_ITEM] : []),
            ...VESTIBULAR_MORE_ITEMS.filter((i) => i.href === '/ranking' || i.href === '/perfil'),
          ],
        },
      ]
    : [
        { title: 'Estudar', items: STUDY_ITEMS },
        {
          title: 'Escola e comunidade',
          items: [
            ...(announcementsEnabled ? [ANNOUNCEMENTS_ITEM] : []),
            ...(chatEnabled ? [CHAT_ITEM] : []),
            ...(communityEnabled ? [COMMUNITY_ITEM] : []),
            ...(vestibularEnabled ? [VESTIBULAR_ITEM] : []),
          ],
        },
        {
          title: 'Conta',
          items: [
            ...ACCOUNT_ITEMS,
            ...(isAdmin ? [ADMIN_ITEM] : []),
            ...(isTeacher ? [TEACHER_ITEM] : []),
          ],
        },
      ].filter((sec) => sec.items.length > 0);
  const moreItems = sections.flatMap((sec) => sec.items);
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = moreItems.some((item) => isActive(item.href));

  const renderItem = ({ href, label, Icon }: NavItem) => {
    const active = isActive(href);
    return (
      <li key={href} className="flex-1">
        <Link
          href={href as Route}
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
            className={cn('text-[10.5px] leading-none', active ? 'font-semibold' : 'font-medium')}
          >
            {label}
          </span>
        </Link>
      </li>
    );
  };

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
            <div className="max-h-[70dvh] space-y-4 overflow-y-auto pb-2">
              {sections.map((sec) => (
                <section key={sec.title}>
                  <h3 className="text-subtle mb-1.5 px-1 text-xs font-semibold tracking-wide uppercase">
                    {sec.title}
                  </h3>
                  <ul className="grid grid-cols-4 gap-2">
                    {sec.items.map(({ href, label, Icon }) => {
                      const active = isActive(href);
                      const badge = href === '/avisos' ? unreadAnnouncements : 0;
                      return (
                        <li key={href}>
                          <Link
                            href={href as Route}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              'flex h-[68px] flex-col items-center justify-center gap-1 rounded-2xl text-center transition-colors',
                              active
                                ? 'bg-brand-soft text-brand-text'
                                : 'bg-surface-2 text-muted hover:text-text',
                            )}
                          >
                            <span className="relative">
                              <Icon
                                className="size-5"
                                aria-hidden
                                strokeWidth={active ? 2.3 : 1.9}
                              />
                              {badge > 0 && (
                                <span className="bg-danger absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] leading-4 font-semibold text-white">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] leading-tight font-medium">{label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*
        Fundo SÓLIDO (`bg-surface`), não mais translúcido com blur.
        
        O translúcido era mais bonito por si só, mas tornava impossível o que
        esta barra precisa fazer no app instalado: encostar na barra de
        navegação do Android sem emenda. A cor daquela barra é nativa e fixa
        (gravada no APK); a de uma faixa com 85% de opacidade muda conforme o
        conteúdo que passa por baixo dela. As duas só casam se esta for uma
        cor só — então a linha de corte aparecia de novo a cada rolagem.

        A `border-t` continua: ela separa a navegação do CONTEÚDO, que é outra
        divisão, essa sim desejada.
      */}
      <nav
        aria-label="Navegação principal"
        className={cn(
          'border-border bg-surface fixed inset-x-0 bottom-0 z-40 border-t',
          'pb-safe md:hidden',
        )}
      >
        <ul className="mx-auto flex max-w-lg">
          {fixedItems.slice(0, 2).map(renderItem)}

          <li className="flex flex-1 justify-center">
            <Link
              href="/nexa-ia"
              aria-label="NexaAI: conversar e criar conteúdo"
              aria-current={isActive('/nexa-ia') ? 'page' : undefined}
              className="-mt-6 flex flex-col items-center gap-1"
            >
              <span className="bg-brand text-brand-fg ring-surface grid size-[58px] place-items-center rounded-full shadow-lg ring-4 transition-transform active:scale-95">
                <Sparkles className="size-7" aria-hidden strokeWidth={2} />
              </span>
              <span className="text-brand-text text-[10.5px] leading-none font-semibold">NexaAI</span>
            </Link>
          </li>

          {fixedItems.slice(2).map(renderItem)}

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
                <span className="relative">
                  <Menu className="size-[21px]" aria-hidden strokeWidth={moreActive ? 2.4 : 1.9} />
                  {unreadAnnouncements > 0 && (
                    <span
                      className="bg-danger absolute -top-0.5 -right-1 size-2.5 rounded-full"
                      aria-label="Há avisos novos"
                    />
                  )}
                </span>
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
