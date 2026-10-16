'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, GraduationCap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Journey } from '@/types/database.types';

/**
 * O seletor de plataforma, ancorado no logo.
 *
 * O Nexa virou dois produtos que dividem a mesma conta — Escolas e
 * Vestibular. Duas pílulas lado a lado (como era antes) davam o mesmo peso
 * visual às duas e ocupavam uma linha inteira da navegação pra uma troca que
 * a maioria das pessoas faz raramente ou nunca. Um menu no logo é o padrão
 * que todo mundo já conhece de app com mais de um produto: a marca diz onde
 * você está, e clicar nela mostra onde mais dá pra ir.
 *
 * O logo continua sendo um caminho pra casa — ele só deixa de ser um link
 * direto e passa a ser um menu cujo primeiro item é a casa atual.
 *
 * Quando só existe uma plataforma disponível (vestibular desligado), volta a
 * ser um `Link` puro: um menu de um item só é um clique cobrado por nada.
 */

export interface PlatformSwitcherProps {
  journey?: Journey;
  vestibularEnabled?: boolean;
  /** `full` mostra a marca escrita (sidebar); `mark` só o símbolo (celular). */
  variant?: 'full' | 'mark';
  className?: string;
}

const PLATFORMS = [
  {
    key: 'school' as const,
    name: 'Nexa Escolas',
    tagline: 'Matérias, lições, provas e notas',
    href: '/hoje' as const,
    wordmark: 'ESCOLAS',
    Icon: GraduationCap,
  },
  {
    key: 'vestibular' as const,
    name: 'Nexa Vestibular',
    tagline: 'Plano de estudo, questões e redação',
    href: '/vestibular' as const,
    wordmark: 'VESTIBULAR',
    Icon: Target,
  },
];

export function PlatformSwitcher({
  journey = 'school',
  vestibularEnabled = false,
  variant = 'full',
  className,
}: PlatformSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = resolveActivePlatform(pathname, journey);

  // Fecha ao clicar fora e no Esc. Sem isso, o menu fica aberto por trás de
  // uma navegação e reaparece na próxima tela.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const current = PLATFORMS.find((p) => p.key === active) ?? PLATFORMS[0]!;

  if (!vestibularEnabled) {
    return (
      <Link
        href="/hoje"
        aria-label="Nexa Study · início"
        className={cn('flex items-center gap-2.5', className)}
      >
        <Logo />
        {variant === 'full' && <Wordmark suffix="STUDY" />}
      </Link>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${current.name} — trocar de plataforma`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'hover:bg-surface-2 flex items-center gap-2.5 rounded-2xl transition-colors',
          variant === 'full' ? 'w-full p-1 pr-2' : 'p-0.5',
        )}
      >
        <Logo />
        {variant === 'full' && <Wordmark suffix={current.wordmark} />}
        {/*
          A seta só aparece na sidebar. No celular ela custava ~22px de uma
          linha que já disputa espaço com título, subtítulo, busca, sino e
          avatar — e foi ela que passou a cortar "Bom dia, Pedro" em "Bom dia,
          Pe...". O logo sozinho já é o alvo do menu (o `aria-label` do botão
          diz isso a quem usa leitor de tela), e no celular tocar na marca pra
          ver opções é gesto conhecido o bastante pra não precisar da dica.
        */}
        {variant === 'full' && (
          <ChevronDown
            className={cn(
              'text-subtle ml-auto size-4 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Plataformas do Nexa"
          className={cn(
            'border-border bg-surface absolute z-50 mt-2 w-[268px] rounded-[20px] border p-1.5 shadow-lg',
            variant === 'full' ? 'left-0' : 'left-0',
          )}
        >
          {PLATFORMS.map(({ key, name, tagline, href, Icon }) => {
            const isCurrent = key === active;
            return (
              <Link
                key={key}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl p-3 transition-colors',
                  isCurrent ? 'bg-brand-soft' : 'hover:bg-surface-2',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-xl',
                    isCurrent ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted',
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-semibold',
                      isCurrent && 'text-brand-text',
                    )}
                  >
                    {name}
                    {isCurrent && <Check className="size-3.5 shrink-0" aria-hidden />}
                  </span>
                  <span className="text-muted block text-xs leading-snug">{tagline}</span>
                </span>
              </Link>
            );
          })}

          {/*
            Só aparece pra quem ainda não adotou as duas. Visitar a outra
            plataforma pelo menu é livre; o que este aviso explica é que a
            visita não muda em que tela o app ABRE — isso mora no Perfil, e
            esconder essa diferença faria o menu parecer quebrado ("troquei e
            amanhã voltou ao normal").
          */}
          {journey !== 'both' && (
            <p className="text-subtle border-border mt-1 border-t px-3 py-2 text-xs leading-snug">
              Quer as duas sempre à mão? Dá pra mudar sua jornada no{' '}
              <Link href="/perfil" className="text-brand-text underline underline-offset-2">
                perfil
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Qual plataforma está em uso: a URL manda quando você está dentro de
 * `/vestibular`; fora dela, quem manda é a jornada escolhida na conta. É o
 * que faz um vestibulando ver a navegação de vestibular também em telas
 * compartilhadas como Revisões e Biblioteca.
 */
export function resolveActivePlatform(
  pathname: string,
  journey: Journey,
): 'school' | 'vestibular' {
  if (pathname.startsWith('/vestibular')) return 'vestibular';
  if (journey === 'vestibular') return 'vestibular';
  return 'school';
}

function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve, não precisa de otimização do next/image
    <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-9 shrink-0" />
  );
}

function Wordmark({ suffix }: { suffix: string }) {
  return (
    <span className="min-w-0 text-left leading-none">
      <span className="block text-base font-bold tracking-tight">NEXA</span>
      <span className="text-subtle block truncate text-[10px] font-semibold tracking-[0.2em]">
        {suffix}
      </span>
    </span>
  );
}
