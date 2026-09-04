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
      className={cn('pt-safe rounded-b-[20px] px-4 pt-3 pb-5', className)}
      style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
    >
      <div className="mx-auto w-full max-w-2xl lg:max-w-5xl">
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
 * A superfície translúcida acompanha o degradê em vez de brigar com ele: uma
 * pastilha sólida no meio da faixa vira um recorte, e recorte chama mais
 * atenção que o número que ele deveria destacar.
 */
export function HeaderStreak({ streak }: { streak: number }) {
  if (streak <= 0) return null;

  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-2 backdrop-blur-sm">
      <span className="text-lg leading-none font-semibold tabular-nums">{streak}</span>
      <span className="text-[11px] leading-tight opacity-90">
        dias
        <br />
        seguidos
      </span>
    </span>
  );
}
