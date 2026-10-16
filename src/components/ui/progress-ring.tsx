import { cn } from '@/lib/utils';

/**
 * Anel de progresso.
 *
 * O kit usa anel — e não barra — onde o número importa mais que a proporção:
 * "28 de 45 min" é lido no centro, e o arco é o contexto ao redor. Uma barra
 * empurraria o número para o lado e inverteria essa hierarquia.
 *
 * SVG e não `conic-gradient`: o arco precisa de ponta arredondada e de animação
 * suave, e as duas coisas o gradiente cônico não faz.
 *
 * `role="img"` com um rótulo que já traz o valor por extenso — um leitor de
 * tela não deve ter que juntar "28" e "45" de dois nós separados.
 */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  className,
  children,
}: {
  /** 0–100. Fora da faixa é limitado, não estourado. */
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-brand transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        {children}
      </div>
    </div>
  );
}
