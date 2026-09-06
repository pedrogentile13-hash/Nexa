'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CalendarDays, GraduationCap, Sun, TrendingUp } from 'lucide-react';
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
                {/* Pastilha atrás do ícone, como no kit. Ela marca o item ativo
                    sem depender só da cor — quem não distingue azul de cinza
                    ainda enxerga a forma. */}
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
      </ul>
    </nav>
  );
}
