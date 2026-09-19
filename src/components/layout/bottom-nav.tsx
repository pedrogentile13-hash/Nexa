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
  Newspaper,
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
  { href: '/disciplinas', label: 'Matérias', Icon: BookOpen },
  { href: '/desempenho', label: 'Desempenho', Icon: TrendingUp },
] as const;

const MORE_ITEMS = [
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
  { href: '/simulados', label: 'Simulados', Icon: ClipboardCheck },
  { href: '/trilhas', label: 'Trilhas', Icon: RouteIcon },
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/nexa-ia', label: 'NexaAI', Icon: Sparkles },
  { href: '/metas', label: 'Metas', Icon: Target },
  { href: '/perfil', label: 'Perfil', Icon: User },
] as const;

const ADMIN_ITEM = { href: '/admin', label: 'Admin', Icon: Shield } as const;
const TEACHER_ITEM = { href: '/professor', label: 'Professor', Icon: Users2 } as const;
const COMMUNITY_ITEM = { href: '/comunidade', label: 'Comunidade', Icon: Newspaper } as const;
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
  { href: '/vestibular/erros', label: 'Erros', Icon: Target },
  { href: '/nexa-ia', label: 'NexaAI', Icon: Sparkles },
] as const;

/**
 * Cinco continua sendo o teto, então entrar é sempre alguém sair. Saíram
 * "Biblioteca" e "Revisões", que são destinos ocasionais; entraram "Plano" e
 * "Erros", que são as duas telas que alguém em preparação abre todo dia.
 */
const VESTIBULAR_MORE_ITEMS = [
  { href: '/vestibular/desempenho', label: 'Desempenho', Icon: TrendingUp },
  { href: '/revisoes', label: 'Revisões', Icon: RotateCcw },
  { href: '/estudar', label: 'Biblioteca', Icon: GraduationCap },
  { href: '/ranking', label: 'Ranking', Icon: Trophy },
  { href: '/perfil', label: 'Perfil', Icon: User },
] as const;

export function BottomNav({
  isAdmin = false,
  isTeacher = false,
  communityEnabled = false,
  vestibularEnabled = false,
  journey = 'school',
}: {
  isAdmin?: boolean;
  isTeacher?: boolean;
  communityEnabled?: boolean;
  vestibularEnabled?: boolean;
  journey?: Journey;
}) {
  const pathname = usePathname();
  // Mesma regra da `SideNav`: a jornada decide o menu padrão, a URL só manda
  // quando a pessoa entra na outra plataforma.
  const inVestibular =
    vestibularEnabled && resolveActivePlatform(pathname, journey) === 'vestibular';

  const fixedItems = inVestibular ? VESTIBULAR_FIXED_ITEMS : FIXED_ITEMS;
  const moreItems = inVestibular
    ? [SCHOOL_ITEM, ...(communityEnabled ? [COMMUNITY_ITEM] : []), ...VESTIBULAR_MORE_ITEMS]
    : [
        ...(communityEnabled ? [COMMUNITY_ITEM] : []),
        ...(vestibularEnabled ? [VESTIBULAR_ITEM] : []),
        ...MORE_ITEMS,
        ...(isAdmin ? [ADMIN_ITEM] : []),
        ...(isTeacher ? [TEACHER_ITEM] : []),
      ];
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
          {fixedItems.map(({ href, label, Icon }) => {
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
