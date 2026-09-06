import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Cabeçalho em degradê da V2 do kit.
 *
 * Não é enfeite: ele marca o topo da tela como "identidade", separando-o do
 * conteúdo cinza que vem abaixo, e é o que dá ao app cara de app em vez de
 * documento. Existe como componente — e não como classe copiada — porque
 * aparece em quatro telas, e quatro cópias divergem no primeiro ajuste.
 *
 * O par de cores vive em `--gradient-header`, validado para que texto branco
 * passe em 4,5:1 ao longo de toda a extensão da faixa, não só na ponta escura.
 */
export function GradientHeader({
  title,
  subtitle,
  right,
  className,
  children,
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn('pt-safe rounded-b-[20px] px-4 pt-3 pb-5 md:px-6 lg:px-8', className)}
      style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
    >
      {/* O contêiner interno repete EXATAMENTE o de `PageMain`. Foi a divergência
          entre os dois que deixou o cabeçalho desalinhado do conteúdo no
          desktop: o título começava num lugar e os cartões em outro. */}
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {subtitle && <p className="text-sm opacity-85">{subtitle}</p>}
            <h1 className="truncate text-2xl leading-tight font-semibold tracking-tight">
              {title}
            </h1>
          </div>
          {right}
        </div>
        {children}
      </div>
    </header>
  );
}

/**
 * Contador de sequência sobre o degradê.
 *
 * Âmbar, como no kit, e não branco translúcido: a sequência é a única coisa no
 * cabeçalho que muda por mérito do aluno, e o contraste quente é o que a
 * separa do azul institucional atrás dela. O fundo é semi-opaco para o número
 * não perder legibilidade sobre a parte clara do degradê.
 */
export function HeaderStreak({ streak }: { streak: number }) {
  if (streak <= 0) return null;

  return (
    <span
      className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(251, 191, 36, 0.22)' }}
    >
      <Flame className="size-4 shrink-0" style={{ color: '#fbbf24' }} aria-hidden />
      <span className="text-lg leading-none font-semibold tabular-nums">{streak}</span>
      {/* Quebra em duas linhas no celular, onde a faixa é curta; numa só a
          partir do tablet, como o guia de desktop mostra. */}
      <span className="text-[11px] leading-tight opacity-90 md:hidden">
        dias
        <br />
        seguidos
      </span>
      <span className="hidden text-sm opacity-90 md:inline">dias seguidos</span>
    </span>
  );
}
